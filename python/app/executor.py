"""Ejecución acotada del código escrito en la consola del navegador.

No es un REPL general: solo se permite importar ``MyCobot`` de ``pymycobot`` y
``sleep`` de ``time``, además de un conjunto reducido de métodos del robot. El
``exec`` corre con ``__builtins__`` vacío, stdout capturado y un timeout POSIX.
"""

from __future__ import annotations

import ast
import builtins
import contextlib
import io
import signal
import threading
import time as time_module
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from types import FrameType
from typing import Any

from app.robot import JointAngles, MotionEvent, PauseEvent, Robot, RobotCommandError, TrackedRobot

MAX_CODE_LENGTH = 4000
ALLOWED_IMPORTS: dict[str, frozenset[str]] = {
    "pymycobot": frozenset({"MyCobot"}),
    "time": frozenset({"sleep"}),
}
ALLOWED_FUNCTIONS = frozenset({"MyCobot", "print", "sleep"})
ALLOWED_METHODS = frozenset(
    {"send_angles", "send_angle", "get_angles", "power_on", "power_off", "stop"}
)
MAX_SLEEP_SECONDS = 10.0
MAX_TOTAL_SLEEP_SECONDS = 30.0


class ConsoleExecutionError(ValueError):
    """El código usa una construcción no permitida por la consola."""


@dataclass(frozen=True, slots=True)
class ExecutionResult:
    """Resultado serializable que consume el Route Handler de Next.js."""

    output: str
    angles: JointAngles | None
    speed: float
    error: str | None
    events: list[MotionEvent]


class _Validator(ast.NodeVisitor):
    """Acepta únicamente imports, asignaciones simples y llamadas permitidas."""

    def visit_Module(self, node: ast.Module) -> None:
        for statement in node.body:
            self.visit(statement)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        module = node.module or ""
        allowed = ALLOWED_IMPORTS.get(module)
        if node.level != 0 or allowed is None:
            raise ConsoleExecutionError(
                "Imports permitidos: from pymycobot import MyCobot | from time import sleep"
            )
        for alias in node.names:
            if alias.name not in allowed or alias.asname not in (None, alias.name):
                raise ConsoleExecutionError(
                    f"Solo se puede importar {', '.join(sorted(allowed))} de {module}"
                )

    def visit_Assign(self, node: ast.Assign) -> None:
        if len(node.targets) != 1 or not isinstance(node.targets[0], ast.Name):
            raise ConsoleExecutionError("Solo se permiten asignaciones simples: nombre = valor")
        self.visit(node.value)

    def visit_Expr(self, node: ast.Expr) -> None:
        self.visit(node.value)

    def visit_Pass(self, node: ast.Pass) -> None:
        return

    def visit_Constant(self, node: ast.Constant) -> None:
        if isinstance(node.value, (str, int, float, bool, type(None))):
            return
        raise ConsoleExecutionError(f"Constante no permitida: {type(node.value).__name__}")

    def visit_Name(self, node: ast.Name) -> None:
        return

    def visit_List(self, node: ast.List) -> None:
        for element in node.elts:
            self.visit(element)

    def visit_Tuple(self, node: ast.Tuple) -> None:
        for element in node.elts:
            self.visit(element)

    def visit_UnaryOp(self, node: ast.UnaryOp) -> None:
        if not isinstance(node.op, (ast.USub, ast.UAdd)):
            raise ConsoleExecutionError("Solo se permiten los signos + y -")
        self.visit(node.operand)

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if node.attr not in ALLOWED_METHODS:
            raise ConsoleExecutionError(f"Método no permitido: {node.attr}")
        self.visit(node.value)

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        if isinstance(func, ast.Name):
            if func.id not in ALLOWED_FUNCTIONS:
                raise ConsoleExecutionError(f"Función no permitida: {func.id}")
        elif isinstance(func, ast.Attribute):
            if func.attr not in ALLOWED_METHODS:
                raise ConsoleExecutionError(f"Método no permitido: {func.attr}")
            self.visit(func.value)
        else:
            raise ConsoleExecutionError("Solo se pueden llamar funciones y métodos permitidos")

        for argument in node.args:
            self.visit(argument)
        for keyword in node.keywords:
            if keyword.arg is None:
                raise ConsoleExecutionError("No se permiten argumentos **kwargs")
            self.visit(keyword.value)

    def generic_visit(self, node: ast.AST) -> None:
        raise ConsoleExecutionError(f"Construcción no permitida: {type(node).__name__}")


class _ImportStripper(ast.NodeTransformer):
    """Quita el import decorativo: ``MyCobot`` ya está inyectado en el namespace."""

    def visit_ImportFrom(self, node: ast.ImportFrom) -> ast.stmt:
        return ast.Pass()


@contextmanager
def _timeout(seconds: float) -> Iterator[None]:
    """Interrumpe una orden lenta usando SIGALRM en sistemas POSIX.

    Fuera del hilo principal (por ejemplo, en el pool de FastAPI) no se puede
    instalar la señal; en ese caso pymycobot aplica su propio timeout de puerto.
    """
    if not hasattr(signal, "SIGALRM") or threading.current_thread() is not threading.main_thread():
        yield
        return

    def handler(signum: int, frame: FrameType | None) -> None:
        raise TimeoutError(f"La orden tardó más de {seconds:g} s")

    previous = signal.signal(signal.SIGALRM, handler)
    signal.setitimer(signal.ITIMER_REAL, seconds)
    try:
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0.0)
        signal.signal(signal.SIGALRM, previous)


def _namespace(robot: TrackedRobot) -> dict[str, Any]:
    total_sleep = 0.0

    def create_robot(*args: object, **kwargs: object) -> TrackedRobot:
        """MyCobot(...) apunta al robot configurado; los argumentos se ignoran."""
        return robot

    def guarded_sleep(seconds: object) -> None:
        """Pausa con límites para no bloquear el servicio ni el visor."""
        nonlocal total_sleep
        if isinstance(seconds, bool) or not isinstance(seconds, (int, float)):
            raise RobotCommandError("sleep espera un número de segundos")
        value = float(seconds)
        if not 0 <= value <= MAX_SLEEP_SECONDS:
            raise RobotCommandError(
                f"Pausa fuera de rango: {value:g} s (máximo {MAX_SLEEP_SECONDS:g} s)"
            )
        total_sleep += value
        if total_sleep > MAX_TOTAL_SLEEP_SECONDS:
            raise RobotCommandError(
                f"Pausa total fuera de rango: {total_sleep:g} s (máximo {MAX_TOTAL_SLEEP_SECONDS:g} s)"
            )
        robot.events.append(PauseEvent(seconds=value))
        time_module.sleep(value)

    return {
        "__builtins__": {},
        "MyCobot": create_robot,
        "mc": robot,
        "print": builtins.print,
        "sleep": guarded_sleep,
    }


def execute_code(source: str, robot: Robot, timeout: float = 5.0) -> ExecutionResult:
    """Valida, ejecuta y captura una orden de la consola.

    Args:
        source: Código enviado por el navegador.
        robot: Adaptador real o simulado.
        timeout: Segundos máximos de ejecución.

    Returns:
        Salida, última posición conocida y eventual error, siempre serializable.
    """
    if not source.strip():
        return ExecutionResult(
            output="", angles=None, speed=60.0, error="El código está vacío", events=[]
        )
    if len(source) > MAX_CODE_LENGTH:
        return ExecutionResult(
            output="",
            angles=None,
            speed=60.0,
            error=f"El código supera {MAX_CODE_LENGTH} caracteres",
            events=[],
        )

    try:
        tree = ast.parse(source, mode="exec")
    except SyntaxError as exc:
        return ExecutionResult(
            output="", angles=None, speed=60.0, error=f"SyntaxError: {exc.msg}", events=[]
        )

    try:
        _Validator().visit(tree)
    except ConsoleExecutionError as exc:
        return ExecutionResult(output="", angles=None, speed=60.0, error=str(exc), events=[])

    tree = _ImportStripper().visit(tree)
    ast.fix_missing_locations(tree)

    tracked = TrackedRobot(robot)
    buffer = io.StringIO()
    error: str | None = None

    try:
        with (
            contextlib.redirect_stdout(buffer),
            contextlib.redirect_stderr(buffer),
            _timeout(timeout),
        ):
            exec(compile(tree, "<consola>", "exec"), _namespace(tracked))  # noqa: S102
    except (RobotCommandError, TimeoutError) as exc:
        error = str(exc)
    except Exception as exc:  # noqa: BLE001 - frontera de la API: todo error debe ser serializable
        error = f"{type(exc).__name__}: {exc}"

    return ExecutionResult(
        output=buffer.getvalue().rstrip(),
        angles=tracked.last_angles,
        speed=tracked.last_speed,
        error=error,
        events=tracked.events,
    )

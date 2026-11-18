"""Interfaz de robot y adaptadores: simulación hoy, pymycobot al conectar el USB."""

from __future__ import annotations

import importlib
from collections.abc import Sequence
from dataclasses import dataclass, field
from typing import Any, Protocol

from app.config import Settings

JointAngles = list[float]

# Igual que JOINT_LIMITS en components/RobotArmViewer.tsx.
JOINT_LIMITS: tuple[tuple[float, float], ...] = (
    (-165.0, 165.0),
    (-165.0, 165.0),
    (-165.0, 165.0),
    (-165.0, 165.0),
    (-165.0, 165.0),
    (-175.0, 175.0),
)
MIN_SPEED = 1.0
MAX_SPEED = 1000.0


@dataclass(frozen=True, slots=True)
class MoveEvent:
    """Movimiento ejecutado, con la velocidad usada."""

    angles: JointAngles
    speed: float


@dataclass(frozen=True, slots=True)
class PauseEvent:
    """Pausa ejecutada entre movimientos."""

    seconds: float


MotionEvent = MoveEvent | PauseEvent


class RobotCommandError(ValueError):
    """Error al validar o ejecutar una orden del brazo."""


class Robot(Protocol):
    """Operaciones expuestas a la consola, con la firma de pymycobot."""

    def send_angles(self, angles: JointAngles, speed: float) -> None: ...

    def send_angle(self, joint: int, angle: float, speed: float) -> None: ...

    def get_angles(self) -> JointAngles: ...

    def power_on(self) -> None: ...

    def power_off(self) -> None: ...

    def stop(self) -> None: ...


def validate_angles(angles: Sequence[object]) -> JointAngles:
    """Convierte y valida seis ángulos en grados.

    Args:
        angles: Secuencia con un valor por junta (J1..J6).

    Returns:
        Los seis ángulos como floats.

    Raises:
        RobotCommandError: Si la longitud, el tipo o el rango no son válidos.
    """
    if len(angles) != len(JOINT_LIMITS):
        raise RobotCommandError(f"Se esperaban 6 ángulos, se recibieron {len(angles)}")

    result: JointAngles = []
    for index, value in enumerate(angles):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise RobotCommandError(f"J{index + 1} debe ser un número, no {type(value).__name__}")
        angle = float(value)
        minimum, maximum = JOINT_LIMITS[index]
        if not minimum <= angle <= maximum:
            raise RobotCommandError(
                f"J{index + 1} fuera de rango: {angle}° (permitido {minimum}° a {maximum}°)"
            )
        result.append(angle)
    return result


def validate_speed(speed: object) -> float:
    """Valida la velocidad en grados por segundo."""
    if isinstance(speed, bool) or not isinstance(speed, (int, float)):
        raise RobotCommandError(f"La velocidad debe ser un número, no {type(speed).__name__}")
    value = float(speed)
    if not MIN_SPEED <= value <= MAX_SPEED:
        raise RobotCommandError(f"Velocidad fuera de rango: {value}°/s")
    return value


@dataclass
class SimulationRobot:
    """Robot en memoria; mismo contrato que el adaptador de hardware."""

    initial_angles: JointAngles = field(default_factory=lambda: [0.0] * len(JOINT_LIMITS))
    angles: JointAngles = field(init=False)
    last_speed: float = field(default=60.0, init=False)
    powered: bool = field(default=True, init=False)
    stopped: bool = field(default=False, init=False)

    def __post_init__(self) -> None:
        self.angles = validate_angles(self.initial_angles)

    def send_angles(self, angles: JointAngles, speed: float) -> None:
        self.angles = validate_angles(angles)
        self.last_speed = validate_speed(speed)
        self.stopped = False

    def send_angle(self, joint: int, angle: float, speed: float) -> None:
        if (
            isinstance(joint, bool)
            or not isinstance(joint, int)
            or not 1 <= joint <= len(JOINT_LIMITS)
        ):
            raise RobotCommandError(f"Junta inválida: {joint}")
        next_angles = list(self.angles)
        next_angles[joint - 1] = validate_angles(
            [angle if index == joint - 1 else value for index, value in enumerate(next_angles)]
        )[joint - 1]
        self.angles = next_angles
        self.last_speed = validate_speed(speed)
        self.stopped = False

    def get_angles(self) -> JointAngles:
        return list(self.angles)

    def power_on(self) -> None:
        self.powered = True

    def power_off(self) -> None:
        self.powered = False

    def stop(self) -> None:
        self.stopped = True


@dataclass
class PyMyCobotRobot:
    """Adaptador real: importa pymycobot de forma diferida.

    El puerto y el baudrate viven en la configuración, nunca en el código que
    escribe la persona desde la consola.
    """

    port: str
    baudrate: int
    timeout: float
    _device: Any = field(init=False, repr=False)

    def __post_init__(self) -> None:
        try:
            module: Any = importlib.import_module("pymycobot")
        except ImportError as exc:
            raise RobotCommandError(
                "pymycobot no está instalado. Instala el extra 'hardware' del servicio Python."
            ) from exc

        factory: Any = module.MyCobot
        try:
            self._device = factory(self.port, self.baudrate, timeout=self.timeout)
        except Exception as exc:
            raise RobotCommandError(f"No se pudo abrir {self.port}: {exc}") from exc

    def _call(self, method: str, *args: object) -> Any:
        try:
            return getattr(self._device, method)(*args)
        except Exception as exc:
            raise RobotCommandError(f"{method}: {exc}") from exc

    def send_angles(self, angles: JointAngles, speed: float) -> None:
        self._call("send_angles", validate_angles(angles), validate_speed(speed))

    def send_angle(self, joint: int, angle: float, speed: float) -> None:
        self._call("send_angle", joint, angle, validate_speed(speed))

    def get_angles(self) -> JointAngles:
        raw = self._call("get_angles")
        if not isinstance(raw, list):
            raise RobotCommandError("pymycobot devolvió ángulos con formato inesperado")
        return validate_angles(raw)

    def power_on(self) -> None:
        self._call("power_on")

    def power_off(self) -> None:
        self._call("power_off")

    def stop(self) -> None:
        self._call("stop")


@dataclass
class TrackedRobot:
    """Decora un robot para registrar cada movimiento y pausa ejecutados."""

    delegate: Robot
    last_angles: JointAngles | None = field(default=None, init=False)
    last_speed: float = field(default=60.0, init=False)
    events: list[MotionEvent] = field(default_factory=list, init=False)

    def send_angles(self, angles: JointAngles, speed: float) -> None:
        validated = validate_angles(angles)
        safe_speed = validate_speed(speed)
        self.delegate.send_angles(validated, safe_speed)
        self.last_angles = validated
        self.last_speed = safe_speed
        self.events.append(MoveEvent(angles=validated, speed=safe_speed))

    def send_angle(self, joint: int, angle: float, speed: float) -> None:
        if (
            isinstance(joint, bool)
            or not isinstance(joint, int)
            or not 1 <= joint <= len(JOINT_LIMITS)
        ):
            raise RobotCommandError(f"Junta inválida: {joint}")
        current = (
            list(self.last_angles)
            if self.last_angles is not None
            else list(self.delegate.get_angles())
        )
        validated_angle = validate_angles(
            [angle if index == joint - 1 else value for index, value in enumerate(current)]
        )[joint - 1]
        safe_speed = validate_speed(speed)
        self.delegate.send_angle(joint, validated_angle, safe_speed)
        current[joint - 1] = validated_angle
        self.last_angles = current
        self.last_speed = safe_speed
        self.events.append(MoveEvent(angles=current, speed=safe_speed))

    def get_angles(self) -> JointAngles:
        return self.delegate.get_angles()

    def power_on(self) -> None:
        self.delegate.power_on()

    def power_off(self) -> None:
        self.delegate.power_off()

    def stop(self) -> None:
        self.delegate.stop()


def create_robot(settings: Settings) -> Robot:
    """Construye el adaptador indicado por la configuración."""
    if settings.mode == "sim":
        return SimulationRobot()
    return PyMyCobotRobot(
        port=settings.port, baudrate=settings.baudrate, timeout=settings.command_timeout
    )

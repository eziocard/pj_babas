"""Pruebas del ejecutor acotado."""

from __future__ import annotations

import ast
import time

import pytest

from app.executor import MAX_CODE_LENGTH, _Validator, execute_code
from app.robot import MoveEvent, PauseEvent, RobotCommandError, SimulationRobot

SESSION = """from pymycobot import MyCobot
mc = MyCobot('/dev/ttyUSB0', 115200)
mc.send_angles([0, 35, -20, 0, 0, 0], 60)
"""


class SlowRobot(SimulationRobot):
    """Robot que simula una orden bloqueante para probar el timeout."""

    def send_angles(self, angles: list[float], speed: float) -> None:
        time.sleep(0.3)
        super().send_angles(angles, speed)


def test_full_session_moves_robot() -> None:
    result = execute_code(SESSION, SimulationRobot())
    assert result.error is None
    assert result.output == ""
    assert result.angles == [0.0, 35.0, -20.0, 0.0, 0.0, 0.0]
    assert result.speed == 60.0
    assert result.events == [MoveEvent(angles=[0.0, 35.0, -20.0, 0.0, 0.0, 0.0], speed=60.0)]


def test_print_is_captured() -> None:
    result = execute_code("print(mc.get_angles())", SimulationRobot())
    assert result.error is None
    assert result.output == "[0.0, 0.0, 0.0, 0.0, 0.0, 0.0]"
    assert result.events == []


def test_keyword_arguments_are_allowed() -> None:
    result = execute_code("mc.send_angles(angles=[0, 10, 0, 0, 0, 0], speed=20)", SimulationRobot())
    assert result.error is None
    assert result.angles == [0.0, 10.0, 0.0, 0.0, 0.0, 0.0]
    assert result.events == [MoveEvent(angles=[0.0, 10.0, 0.0, 0.0, 0.0, 0.0], speed=20.0)]


def test_sleep_is_allowed() -> None:
    result = execute_code("from time import sleep\nsleep(0.01)\nprint('listo')", SimulationRobot())
    assert result.error is None
    assert result.output == "listo"
    assert result.events == [PauseEvent(seconds=0.01)]


def test_exported_sequence_records_moves_and_pauses(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(time, "sleep", lambda _: None)
    code = (
        "from pymycobot import MyCobot\n"
        "from time import sleep\n"
        "mc = MyCobot('/dev/ttyUSB0', 115200)\n"
        "mc.send_angles([0, 20, 0, 0, 0, 0], 50)\n"
        "sleep(1)\n"
        "mc.send_angles([0, 40, -10, 0, 0, 0], 60)\n"
    )
    result = execute_code(code, SimulationRobot(), timeout=35.0)
    assert result.error is None
    assert result.events == [
        MoveEvent(angles=[0.0, 20.0, 0.0, 0.0, 0.0, 0.0], speed=50.0),
        PauseEvent(seconds=1.0),
        MoveEvent(angles=[0.0, 40.0, -10.0, 0.0, 0.0, 0.0], speed=60.0),
    ]


def test_sleep_rejects_long_pause() -> None:
    result = execute_code("from time import sleep\nsleep(11)", SimulationRobot())
    assert "Pausa fuera de rango" in str(result.error)
    assert result.events == []


def test_sleep_rejects_non_numeric_value() -> None:
    result = execute_code("from time import sleep\nsleep('x')", SimulationRobot())
    assert "número de segundos" in str(result.error)


def test_total_sleep_is_capped(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(time, "sleep", lambda _: None)
    result = execute_code(
        "from time import sleep\nsleep(10)\nsleep(10)\nsleep(10)\nsleep(1)",
        SimulationRobot(),
    )
    assert "Pausa total fuera de rango" in str(result.error)
    assert result.events == [PauseEvent(seconds=10.0)] * 3


def test_send_angle_updates_one_joint() -> None:
    result = execute_code("mc.send_angle(4, -15, 30)", SimulationRobot())
    assert result.error is None
    assert result.angles is not None
    assert result.angles[3] == -15.0
    assert result.speed == 30.0
    assert result.events == [MoveEvent(angles=[0.0, 0.0, 0.0, -15.0, 0.0, 0.0], speed=30.0)]


def test_syntax_error_is_reported() -> None:
    result = execute_code("mc.send_angles([", SimulationRobot())
    assert "SyntaxError" in str(result.error)
    assert result.angles is None


@pytest.mark.parametrize(
    "code",
    [
        "import os",
        "import time",
        "from os import system",
        "from pymycobot import MyCobot, Robot",
        "from time import sleep as esperar",
        "mc._device",
        "open('/etc/passwd')",
        "for i in range(3): pass",
        "def f(): pass",
        "mc.send_angles([0] * 6, 60); exit()",
        "mc.send_angles(**{'angles': [0] * 6})",
    ],
)
def test_forbidden_code_is_rejected(code: str) -> None:
    result = execute_code(code, SimulationRobot())
    assert result.angles is None
    assert result.error is not None


def test_validator_allows_pass_and_unary_signs() -> None:
    _Validator().visit(ast.parse("pass\nmc.send_angles([-1, +2, 0, 0, 0, 0], 60)"))


def test_empty_code() -> None:
    result = execute_code("   ", SimulationRobot())
    assert "vacío" in str(result.error)


def test_too_long_code() -> None:
    result = execute_code("x" * (MAX_CODE_LENGTH + 1), SimulationRobot())
    assert str(MAX_CODE_LENGTH) in str(result.error)


def test_robot_error_is_returned_not_raised() -> None:
    result = execute_code("mc.send_angles([0, 999, 0, 0, 0, 0], 60)", SimulationRobot())
    assert result.error is not None
    assert "J2 fuera de rango" in result.error


def test_name_error_is_captured() -> None:
    result = execute_code("print(no_definido)", SimulationRobot())
    assert result.error is not None
    assert "NameError" in result.error


def test_timeout_is_enforced() -> None:
    result = execute_code("mc.send_angles([0, 0, 0, 0, 0, 0], 60)", SlowRobot(), timeout=0.05)
    assert result.error is not None
    assert "tardó" in result.error


def test_unexpected_robot_exception_is_wrapped(monkeypatch: pytest.MonkeyPatch) -> None:
    def broken(*args: object, **kwargs: object) -> None:
        raise RobotCommandError("fallo inesperado")

    monkeypatch.setattr("app.executor.TrackedRobot.send_angles", broken)
    result = execute_code("mc.send_angles([0, 0, 0, 0, 0, 0], 60)", SimulationRobot())
    assert "fallo inesperado" in str(result.error)

"""Pruebas de los adaptadores de robot."""

from __future__ import annotations

import importlib
from types import SimpleNamespace
from typing import Any

import pytest

from app.config import Settings
from app.robot import (
    PyMyCobotRobot,
    RobotCommandError,
    SimulationRobot,
    TrackedRobot,
    create_robot,
    validate_angles,
    validate_speed,
)


class FakeDevice:
    """Sustituto de pymycobot.MyCobot para probar el adaptador real."""

    def __init__(self, port: str, baudrate: int, timeout: float) -> None:
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.calls: list[tuple[str, tuple[object, ...]]] = []
        self.fail = False

    def _record(self, name: str, *args: object) -> None:
        if self.fail:
            raise RuntimeError("fallo simulado del puerto")
        self.calls.append((name, args))

    def send_angles(self, angles: list[float], speed: float) -> None:
        self._record("send_angles", angles, speed)

    def send_angle(self, joint: int, angle: float, speed: float) -> None:
        self._record("send_angle", joint, angle, speed)

    def get_angles(self) -> list[float]:
        self._record("get_angles")
        return [10.0, 20.0, 0.0, 0.0, 0.0, 0.0]

    def power_on(self) -> None:
        self._record("power_on")

    def power_off(self) -> None:
        self._record("power_off")

    def stop(self) -> None:
        self._record("stop")


@pytest.fixture
def fake_device(monkeypatch: pytest.MonkeyPatch) -> FakeDevice:
    """Inyecta un módulo pymycobot falso en el import diferido."""
    device = FakeDevice("/dev/ttyUSB0", 115200, 1.0)

    def fake_import(name: str) -> Any:
        assert name == "pymycobot"
        return SimpleNamespace(MyCobot=lambda *args, **kwargs: device)

    monkeypatch.setattr(importlib, "import_module", fake_import)
    return device


def test_validate_angles() -> None:
    assert validate_angles([0, 10.5, -20, 0, 0, 175]) == [0.0, 10.5, -20.0, 0.0, 0.0, 175.0]


@pytest.mark.parametrize(
    "angles",
    [
        [0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        ["0", 0, 0, 0, 0, 0],
        [0, True, 0, 0, 0, 0],
        [0] * 5 + [176],
    ],
)
def test_validate_angles_rejects_invalid(angles: list[object]) -> None:
    with pytest.raises(RobotCommandError):
        validate_angles(angles)


def test_validate_speed() -> None:
    assert validate_speed(60) == 60.0


@pytest.mark.parametrize("speed", [0, 1001, "60", True])
def test_validate_speed_rejects_invalid(speed: object) -> None:
    with pytest.raises(RobotCommandError):
        validate_speed(speed)


def test_simulation_robot_moves_and_tracks_state() -> None:
    robot = SimulationRobot()
    assert robot.get_angles() == [0.0] * 6

    robot.send_angles([0, 30, -20, 0, 0, 0], 45)
    assert robot.get_angles() == [0.0, 30.0, -20.0, 0.0, 0.0, 0.0]
    assert robot.last_speed == 45.0

    robot.send_angle(3, 15, 50)
    assert robot.angles[2] == 15.0
    assert robot.last_speed == 50.0


def test_simulation_robot_joint_validation() -> None:
    robot = SimulationRobot()
    with pytest.raises(RobotCommandError, match="Junta inválida"):
        robot.send_angle(7, 10, 50)
    with pytest.raises(RobotCommandError, match="Junta inválida"):
        robot.send_angle(True, 10, 50)


def test_simulation_robot_power_and_stop() -> None:
    robot = SimulationRobot()
    robot.power_off()
    assert robot.powered is False
    robot.power_on()
    assert robot.powered is True
    robot.stop()
    assert robot.stopped is True
    robot.send_angles([0] * 6, 60)
    assert robot.stopped is False


def test_tracked_robot_records_commands() -> None:
    robot = TrackedRobot(SimulationRobot())
    robot.send_angles([0, 10, 0, 0, 0, 0], 70)
    assert robot.last_angles == [0.0, 10.0, 0.0, 0.0, 0.0, 0.0]
    assert robot.last_speed == 70.0

    robot.send_angle(2, 20, 80)
    assert robot.last_angles is not None
    assert robot.last_angles[1] == 20.0
    assert robot.last_speed == 80.0


def test_tracked_robot_delegates_get_angles() -> None:
    robot = TrackedRobot(SimulationRobot(initial_angles=[1, 2, 3, 4, 5, 6]))
    assert robot.get_angles() == [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]


def test_tracked_robot_rejects_bad_joint() -> None:
    robot = TrackedRobot(SimulationRobot())
    with pytest.raises(RobotCommandError, match="Junta inválida"):
        robot.send_angle(0, 10, 50)


def test_pymycobot_adapter_delegates_calls(fake_device: FakeDevice) -> None:
    robot = PyMyCobotRobot("/dev/ttyUSB0", 115200, 1.0)
    robot.send_angles([0, 10, 0, 0, 0, 0], 60)
    robot.send_angle(1, 5, 60)
    assert robot.get_angles() == [10.0, 20.0, 0.0, 0.0, 0.0, 0.0]
    robot.power_on()
    robot.power_off()
    robot.stop()
    assert [name for name, _ in fake_device.calls] == [
        "send_angles",
        "send_angle",
        "get_angles",
        "power_on",
        "power_off",
        "stop",
    ]


def test_pymycobot_adapter_wraps_device_errors(fake_device: FakeDevice) -> None:
    fake_device.fail = True
    robot = PyMyCobotRobot("/dev/ttyUSB0", 115200, 1.0)
    with pytest.raises(RobotCommandError, match="send_angles"):
        robot.send_angles([0] * 6, 60)


def test_pymycobot_adapter_rejects_unexpected_angles(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_import(name: str) -> Any:
        return SimpleNamespace(
            MyCobot=lambda *args, **kwargs: SimpleNamespace(get_angles=lambda: "mal")
        )

    monkeypatch.setattr(importlib, "import_module", fake_import)
    with pytest.raises(RobotCommandError, match="formato inesperado"):
        PyMyCobotRobot("/dev/ttyUSB0", 115200, 1.0).get_angles()


def test_pymycobot_adapter_requires_library(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_import(name: str) -> Any:
        raise ImportError("no disponible")

    monkeypatch.setattr(importlib, "import_module", fake_import)
    with pytest.raises(RobotCommandError, match="no está instalado"):
        PyMyCobotRobot("/dev/ttyUSB0", 115200, 1.0)


def test_pymycobot_adapter_wraps_connection_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def broken(*args: object) -> None:
        raise OSError("puerto ocupado")

    monkeypatch.setattr(
        importlib,
        "import_module",
        lambda name: SimpleNamespace(MyCobot=broken),
    )
    with pytest.raises(RobotCommandError, match="No se pudo abrir"):
        PyMyCobotRobot("/dev/ttyUSB0", 115200, 1.0)


def test_create_robot_selects_adapter(fake_device: FakeDevice) -> None:
    sim_settings = Settings.from_env()
    assert isinstance(create_robot(sim_settings), SimulationRobot)

    real_settings = Settings(
        mode="real",
        port="/dev/ttyUSB0",
        baudrate=115200,
        host="127.0.0.1",
        http_port=8000,
        token="",
        command_timeout=1.0,
    )
    assert isinstance(create_robot(real_settings), PyMyCobotRobot)

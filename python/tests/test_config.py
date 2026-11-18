"""Pruebas de configuración."""

from __future__ import annotations

import pytest

from app.config import Settings

ENV_KEYS = (
    "MYCOBOT_MODE",
    "MYCOBOT_PORT",
    "MYCOBOT_BAUDRATE",
    "CONSOLE_HOST",
    "CONSOLE_HTTP_PORT",
    "CONSOLE_TOKEN",
    "CONSOLE_COMMAND_TIMEOUT",
)


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Aísla cada prueba de variables de entorno heredadas."""
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)


def test_defaults_are_simulation() -> None:
    settings = Settings.from_env()
    assert settings.mode == "sim"
    assert settings.port == "/dev/ttyUSB0"
    assert settings.baudrate == 115200
    assert settings.host == "127.0.0.1"
    assert settings.http_port == 8000
    assert settings.token == ""
    assert settings.command_timeout == 35.0


def test_custom_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MYCOBOT_MODE", "real")
    monkeypatch.setenv("MYCOBOT_PORT", "/dev/ttyACM0")
    monkeypatch.setenv("MYCOBOT_BAUDRATE", "9600")
    monkeypatch.setenv("CONSOLE_HOST", "0.0.0.0")
    monkeypatch.setenv("CONSOLE_HTTP_PORT", "9000")
    monkeypatch.setenv("CONSOLE_TOKEN", "secreto")
    monkeypatch.setenv("CONSOLE_COMMAND_TIMEOUT", "2.5")

    settings = Settings.from_env()
    assert settings.mode == "real"
    assert settings.port == "/dev/ttyACM0"
    assert settings.baudrate == 9600
    assert settings.host == "0.0.0.0"
    assert settings.http_port == 9000
    assert settings.token == "secreto"
    assert settings.command_timeout == 2.5


@pytest.mark.parametrize("value", ["otro", "simulacion"])
def test_invalid_mode(monkeypatch: pytest.MonkeyPatch, value: str) -> None:
    monkeypatch.setenv("MYCOBOT_MODE", value)
    with pytest.raises(ValueError, match="MYCOBOT_MODE"):
        Settings.from_env()


def test_invalid_integer(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MYCOBOT_BAUDRATE", "abc")
    with pytest.raises(ValueError, match="entero"):
        Settings.from_env()


def test_out_of_range_port(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CONSOLE_HTTP_PORT", "70000")
    with pytest.raises(ValueError, match="rango"):
        Settings.from_env()


def test_invalid_timeout(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CONSOLE_COMMAND_TIMEOUT", "abc")
    with pytest.raises(ValueError, match="número"):
        Settings.from_env()


def test_timeout_below_minimum(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CONSOLE_COMMAND_TIMEOUT", "0")
    with pytest.raises(ValueError, match="rango"):
        Settings.from_env()

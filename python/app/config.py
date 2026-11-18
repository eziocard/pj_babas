"""Configuración del servicio, obtenida exclusivamente de variables de entorno."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Literal

RobotMode = Literal["sim", "real"]


@dataclass(frozen=True, slots=True)
class Settings:
    """Parámetros inmutables del proceso."""

    mode: RobotMode
    port: str
    baudrate: int
    host: str
    http_port: int
    token: str
    command_timeout: float

    @classmethod
    def from_env(cls) -> Settings:
        """Lee y valida la configuración del entorno.

        Returns:
            Configuración validada.

        Raises:
            ValueError: Si algún valor no es válido.
        """
        mode = os.getenv("MYCOBOT_MODE", "sim").strip().lower()
        if mode not in ("sim", "real"):
            raise ValueError(f"MYCOBOT_MODE debe ser 'sim' o 'real', no {mode!r}")

        baudrate = _read_int("MYCOBOT_BAUDRATE", 115200, minimum=1)
        http_port = _read_int("CONSOLE_HTTP_PORT", 8000, minimum=1, maximum=65535)
        # Debe cubrir el total de pausas permitidas (30 s) con margen.
        command_timeout = _read_float("CONSOLE_COMMAND_TIMEOUT", 35.0, minimum=0.1)

        return cls(
            mode=mode,  # type: ignore[arg-type]
            port=os.getenv("MYCOBOT_PORT", "/dev/ttyUSB0").strip(),
            baudrate=baudrate,
            host=os.getenv("CONSOLE_HOST", "127.0.0.1").strip(),
            http_port=http_port,
            token=os.getenv("CONSOLE_TOKEN", "").strip(),
            command_timeout=command_timeout,
        )


def _read_int(name: str, default: int, *, minimum: int, maximum: int | None = None) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} debe ser un entero, no {raw!r}") from exc
    if value < minimum or (maximum is not None and value > maximum):
        raise ValueError(f"{name} fuera de rango: {value}")
    return value


def _read_float(name: str, default: float, *, minimum: float) -> float:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        value = float(raw)
    except ValueError as exc:
        raise ValueError(f"{name} debe ser un número, no {raw!r}") from exc
    if not value >= minimum:
        raise ValueError(f"{name} fuera de rango: {value}")
    return value

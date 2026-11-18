"""Prueba del punto de entrada del servicio."""

from __future__ import annotations

import importlib
from typing import Any

import pytest

from app.config import Settings

main_module: Any = importlib.import_module("app.__main__")


def test_main_starts_uvicorn(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[object, ...]] = []

    def fake_run(*args: object, **kwargs: object) -> None:
        calls.append((args, kwargs))

    monkeypatch.setattr(main_module.uvicorn, "run", fake_run)
    monkeypatch.setattr(
        main_module.Settings,
        "from_env",
        lambda: Settings(
            mode="sim",
            port="/dev/ttyUSB0",
            baudrate=115200,
            host="127.0.0.1",
            http_port=8000,
            token="",
            command_timeout=5.0,
        ),
    )

    main_module.main()
    assert len(calls) == 1
    assert calls[0][1] == {"host": "127.0.0.1", "port": 8000, "log_level": "info"}

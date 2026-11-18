"""Pruebas de la API HTTP."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.server as server_module
from app.config import Settings

client = TestClient(server_module.app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "mode": "sim"}


def test_execute_returns_contract() -> None:
    response = client.post(
        "/execute",
        json={"code": "mc.send_angles([0, 20, 0, 0, 0, 0], 50)"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["error"] is None
    assert payload["angles"] == [0.0, 20.0, 0.0, 0.0, 0.0, 0.0]
    assert payload["speed"] == 50.0
    assert payload["output"] == ""
    assert payload["events"] == [
        {"kind": "move", "angles": [0.0, 20.0, 0.0, 0.0, 0.0, 0.0], "speed": 50.0}
    ]


def test_execute_reports_rejected_code() -> None:
    response = client.post("/execute", json={"code": "import os"})
    assert response.status_code == 200
    assert response.json()["error"] is not None


@pytest.mark.parametrize("code", ["", "x" * 4001])
def test_invalid_payload(code: str) -> None:
    response = client.post("/execute", json={"code": code})
    assert response.status_code == 422


def test_token_is_required_when_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        server_module,
        "_settings",
        Settings(
            mode="sim",
            port="/dev/ttyUSB0",
            baudrate=115200,
            host="127.0.0.1",
            http_port=8000,
            token="secreto",
            command_timeout=5.0,
        ),
    )

    denied = client.post("/execute", json={"code": "print(1)"})
    assert denied.status_code == 401

    allowed = client.post(
        "/execute",
        json={"code": "print(1)"},
        headers={"X-Console-Token": "secreto"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["output"] == "1"

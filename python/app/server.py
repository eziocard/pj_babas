"""API HTTP que consume el Route Handler de Next.js."""

from __future__ import annotations

from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from app.config import Settings
from app.executor import ExecutionResult, execute_code
from app.robot import MotionEvent, MoveEvent, Robot, create_robot

_settings = Settings.from_env()
_robot: Robot = create_robot(_settings)

app = FastAPI(title="myCobot Console", version="0.1.0")


class ExecuteRequest(BaseModel):
    """Código enviado desde la consola del navegador."""

    code: str = Field(min_length=1, max_length=4000)


class MovePayload(BaseModel):
    """Movimiento que el visor debe animar."""

    kind: Literal["move"]
    angles: list[float]
    speed: float


class PausePayload(BaseModel):
    """Pausa que el visor debe respetar entre movimientos."""

    kind: Literal["pause"]
    seconds: float


class ExecuteResponse(BaseModel):
    """Contrato estable compartido con el frontend."""

    output: str
    angles: list[float] | None
    speed: float
    error: str | None
    events: list[MovePayload | PausePayload]


@app.get("/health")
def health() -> dict[str, str]:
    """Devuelve el modo de operación del adaptador."""
    return {"status": "ok", "mode": _settings.mode}


@app.post("/execute")
def execute(
    request: ExecuteRequest,
    x_console_token: str | None = Header(default=None),
) -> ExecuteResponse:
    """Ejecuta una orden acotada en el robot configurado."""
    if _settings.token and x_console_token != _settings.token:
        raise HTTPException(status_code=401, detail="Token de consola inválido")

    result: ExecutionResult = execute_code(
        request.code,
        _robot,
        _settings.command_timeout,
    )
    return ExecuteResponse(
        output=result.output,
        angles=result.angles,
        speed=result.speed,
        error=result.error,
        events=[_serialize_event(event) for event in result.events],
    )


def _serialize_event(event: MotionEvent) -> MovePayload | PausePayload:
    """Convierte un evento interno en el contrato JSON del frontend."""
    if isinstance(event, MoveEvent):
        return MovePayload(kind="move", angles=event.angles, speed=event.speed)
    return PausePayload(kind="pause", seconds=event.seconds)

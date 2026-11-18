"""Arranque del servicio: python -m app."""

from __future__ import annotations

import uvicorn

from app.config import Settings


def main() -> None:
    """Lee la configuración y levanta uvicorn."""
    settings = Settings.from_env()
    uvicorn.run("app.server:app", host=settings.host, port=settings.http_port, log_level="info")


if __name__ == "__main__":
    main()

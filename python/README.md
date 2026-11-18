# Servicio del editor Python

Ejecuta un subconjunto de `pymycobot` detrás de una API HTTP. Next.js llama a este servicio desde sus Route Handlers; el navegador nunca ejecuta Python ni abre el puerto serie.

## Arranque

```bash
python3 -m venv .venv
.venv/bin/pip install -e '.[dev]'
# opcional: exporta las variables de env.example antes de arrancar
.venv/bin/python -m app
```

Desde la raíz del proyecto, en otra terminal:

```bash
npm run dev
```

Abre `/model3d`, abre el editor desde el panel de secuencias y ejecuta, por ejemplo:

```python
mc.send_angles([0, 35, -20, 0, 0, 0], 60)
```

Los ángulos vuelven al navegador y mueven el modelo 3D con `moveJoints`.

## Contrato

`POST /execute` recibe `{ "code": string }` y responde:

```json
{ "output": "", "angles": [0, 35, -20, 0, 0, 0], "speed": 60, "error": null }
```

`GET /health` informa del modo activo (`sim` o `real`).

## Pasar a hardware real

1. Instala el extra de hardware: `.venv/bin/pip install -e '.[hardware]'`.
2. Exporta `MYCOBOT_MODE=real` y el `MYCOBOT_PORT` correcto.
3. Reinicia el servicio. El frontend no cambia: usa los mismos nombres de método de `pymycobot` (`send_angles`, `get_angles`, `send_angle`, `power_on`, `power_off`, `stop`).

## Seguridad

- Solo se permite `from pymycobot import MyCobot`, `from time import sleep` y llamadas a los métodos anteriores.
- `__builtins__` se ejecuta vacío: no hay `open`, `__import__`, bucles ni definiciones de funciones.
- `sleep` está acotado a 10 s por pausa y 30 s por ejecución para no bloquear el servicio.
- `stdout`/`stderr` se capturan y todo error se devuelve como datos.
- El puerto y el baudrate viven en variables de entorno, nunca en el código enviado.
- Define `CONSOLE_TOKEN` en ambos procesos si el servicio deja de escuchar en `127.0.0.1`.

## Validación

```bash
npm run python:check
```

Incluye `ruff`, `black --check`, `mypy --strict` y `pytest` con cobertura mínima del 90%.

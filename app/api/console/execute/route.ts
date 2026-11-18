import { backendHeaders, PYTHON_BACKEND_URL } from '@/lib/python-backend';
import {
  CONSOLE_MAX_CODE_LENGTH,
  type PythonExecutionResult,
  type PythonMotionEvent,
} from '@/lib/python-console';

const REQUEST_TIMEOUT_MS = 60_000;

const failure = (error: string): PythonExecutionResult => ({
  output: '',
  angles: null,
  speed: 60,
  error,
  events: [],
});

const isMotionEvent = (value: unknown): value is PythonMotionEvent => {
  if (typeof value !== 'object' || value === null) return false;
  const event = value as Partial<PythonMotionEvent>;
  if (event.kind === 'move') {
    return (
      Array.isArray(event.angles) &&
      event.angles.every((angle) => typeof angle === 'number') &&
      typeof event.speed === 'number'
    );
  }
  if (event.kind === 'pause') return typeof event.seconds === 'number';
  return false;
};

const isResult = (value: unknown): value is PythonExecutionResult => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PythonExecutionResult>;
  return (
    typeof candidate.output === 'string' &&
    (candidate.angles === null ||
      (Array.isArray(candidate.angles) && candidate.angles.every((angle) => typeof angle === 'number'))) &&
    typeof candidate.speed === 'number' &&
    (candidate.error === null || typeof candidate.error === 'string') &&
    Array.isArray(candidate.events) &&
    candidate.events.every(isMotionEvent)
  );
};

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(failure('La petición no contiene JSON válido.'), { status: 400 });
  }

  const code =
    typeof body === 'object' && body !== null && 'code' in body
      ? (body as { code?: unknown }).code
      : undefined;

  if (typeof code !== 'string' || code.trim() === '') {
    return Response.json(failure('Escribe una orden antes de ejecutar.'), { status: 400 });
  }
  if (code.length > CONSOLE_MAX_CODE_LENGTH) {
    return Response.json(
      failure(`El código supera ${CONSOLE_MAX_CODE_LENGTH} caracteres.`),
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${PYTHON_BACKEND_URL}/execute`, {
      method: 'POST',
      headers: backendHeaders(),
      body: JSON.stringify({ code }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const payload: unknown = await upstream.json();
    if (!upstream.ok || !isResult(payload)) {
      const message =
        typeof payload === 'object' && payload !== null && 'detail' in payload
          ? String((payload as { detail: unknown }).detail)
          : `El servicio Python respondió ${upstream.status}.`;
      return Response.json(failure(message), { status: 502 });
    }

    return Response.json(payload);
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return Response.json(
      failure(
        aborted
          ? 'El servicio Python tardó demasiado en responder.'
          : 'No se pudo conectar con el servicio Python. ¿Está en marcha?'
      ),
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

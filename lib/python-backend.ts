/** Configuración del servicio Python, usada solo desde Route Handlers. */

export const PYTHON_BACKEND_URL = process.env.PYTHON_CONSOLE_URL ?? 'http://127.0.0.1:8000';
export const PYTHON_BACKEND_TOKEN = process.env.CONSOLE_TOKEN ?? '';

export function backendHeaders(): HeadersInit {
  return {
    'content-type': 'application/json',
    ...(PYTHON_BACKEND_TOKEN ? { 'X-Console-Token': PYTHON_BACKEND_TOKEN } : {}),
  };
}

import { backendHeaders, PYTHON_BACKEND_URL } from '@/lib/python-backend';
import type { ConsoleHealth } from '@/lib/python-console';

export async function GET(): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);

  try {
    const upstream = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      headers: backendHeaders(),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!upstream.ok) throw new Error('health check failed');

    const payload: unknown = await upstream.json();
    const mode =
      typeof payload === 'object' && payload !== null && 'mode' in payload ? payload.mode : null;
    const health: ConsoleHealth = {
      connected: true,
      mode: mode === 'sim' || mode === 'real' ? mode : null,
    };
    return Response.json(health, { headers: { 'cache-control': 'no-store' } });
  } catch {
    const health: ConsoleHealth = { connected: false, mode: null };
    return Response.json(health, { headers: { 'cache-control': 'no-store' } });
  } finally {
    clearTimeout(timeout);
  }
}

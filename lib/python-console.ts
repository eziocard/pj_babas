/** Contrato compartido entre el editor del navegador y el servicio Python. */

export type PythonMotionEvent =
  | { kind: 'move'; angles: number[]; speed: number }
  | { kind: 'pause'; seconds: number };

export type PythonExecutionResult = {
  output: string;
  angles: number[] | null;
  speed: number;
  error: string | null;
  /** Secuencia exacta ejecutada, para reproducirla en el visor 3D. */
  events: PythonMotionEvent[];
};

export type PythonInstruction = {
  joint: string;
  angle: string;
  speed: string;
};

export type ConsoleHealth = {
  connected: boolean;
  mode: 'sim' | 'real' | null;
};

export const CONSOLE_ENDPOINT = '/api/console/execute';
export const CONSOLE_HEALTH_ENDPOINT = '/api/console/health';
export const CONSOLE_MAX_CODE_LENGTH = 4000;

/** Código inicial del editor: importación y conexión listas, completamente editable. */
export const DEFAULT_PYTHON_CODE = `from pymycobot import MyCobot
from time import sleep

mc = MyCobot('/dev/ttyUSB0', 115200)

# Escribe tu secuencia aquí. Ejemplo:
# mc.send_angles([0, 35, -20, 0, 0, 0], 60)
# sleep(1)

print(mc.get_angles())
`;

export type SequenceForPython = {
  angles: readonly number[];
  speed: number;
  pauseSeconds: number;
};

const pyNumber = (value: number): string => {
  const safe = Number.isFinite(value) ? value : 0;
  return String(Math.round(safe * 1000) / 1000);
};

/** Convierte los pasos definidos a mano en código editable para el editor. */
export function sequenceToPython(steps: readonly SequenceForPython[]): string {
  const lines: string[] = [
    'from pymycobot import MyCobot',
    'from time import sleep',
    '',
    "mc = MyCobot('/dev/ttyUSB0', 115200)",
    '',
  ];

  steps.forEach((step, index) => {
    const angles = Array.from({ length: 6 }, (_, joint) => pyNumber(step.angles[joint] ?? 0));
    lines.push(`# Paso ${index + 1}`);
    lines.push(`mc.send_angles([${angles.join(', ')}], ${pyNumber(step.speed)})`);
    if (step.pauseSeconds > 0 && index < steps.length - 1) {
      lines.push(`sleep(${pyNumber(step.pauseSeconds)})`);
    }
    lines.push('');
  });

  lines.push('print(mc.get_angles())');
  return lines.join('\n');
}

const formatAngle = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return '0°';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}°`;
};

/** Convierte la última posición devuelta por pymycobot en instrucciones visibles. */
export function instructionsFromResult(result: PythonExecutionResult): PythonInstruction[] {
  if (!result.angles) return [];

  return result.angles
    .map((angle, index) => ({
      joint: `J${index + 1}`,
      angle: formatAngle(angle),
      speed: `${Math.round(result.speed)} °/s`,
    }))
    .filter((instruction) => instruction.angle !== '0°');
}

'use client';

import { Fragment, useRef, useState } from 'react';
import { JOINT_LIMITS, JOINT_NAMES } from '@/components/RobotArmViewer';

/** Paso editable del formulario: los valores se guardan como texto para poder borrarlos mientras se edita. */
export type MovementStep = {
  id: number;
  angles: string[];
  speed: string;
  pauseEnabled: boolean;
  pauseSeconds: string;
};

/** Paso ya validado que se envía al animador. */
export type SequenceStep = {
  angles: number[];
  speed: number;
  /** Segundos a esperar antes del siguiente paso; 0 cuando la pausa está desactivada. */
  pauseSeconds: number;
};

type MovementSequencePanelProps = {
  onExecute: (steps: SequenceStep[]) => Promise<void>;
  running: boolean;
  activeStep: number | null;
  waitingSeconds: number | null;
};

const DEFAULT_SPEED = '60';
const DEFAULT_PAUSE = '1';

const emptyAngles = (): string[] => JOINT_NAMES.map(() => '0');

const createStep = (id: number): MovementStep => ({
  id,
  angles: emptyAngles(),
  speed: DEFAULT_SPEED,
  pauseEnabled: false,
  pauseSeconds: DEFAULT_PAUSE,
});

const parseStep = (step: MovementStep): SequenceStep => ({
  angles: step.angles.map((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }),
  speed: Math.max(1, Number(step.speed) || Number(DEFAULT_SPEED)),
  pauseSeconds: step.pauseEnabled ? Math.max(0, Number(step.pauseSeconds) || 0) : 0,
});

const jointLabel = (index: number): string => `J${index + 1}`;

const fieldClass =
  'w-full rounded-[3px] border border-line bg-surface-raised px-2 py-1.5 font-mono text-xs tabular-nums text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/20 disabled:cursor-not-allowed disabled:opacity-50';

const MovementSequencePanel = ({ onExecute, running, activeStep, waitingSeconds }: MovementSequencePanelProps) => {
  const nextId = useRef(1);
  const [steps, setSteps] = useState<MovementStep[]>(() => [createStep(0)]);

  const handleAngleChange = (stepId: number, jointIndex: number, value: string): void => {
    setSteps((current) =>
      current.map((step) =>
        step.id === stepId
          ? { ...step, angles: step.angles.map((angle, index) => (index === jointIndex ? value : angle)) }
          : step
      )
    );
  };

  const handleSpeedChange = (stepId: number, value: string): void => {
    setSteps((current) => current.map((step) => (step.id === stepId ? { ...step, speed: value } : step)));
  };

  const handlePauseToggle = (stepId: number, enabled: boolean): void => {
    setSteps((current) => current.map((step) => (step.id === stepId ? { ...step, pauseEnabled: enabled } : step)));
  };

  const handlePauseSecondsChange = (stepId: number, value: string): void => {
    setSteps((current) => current.map((step) => (step.id === stepId ? { ...step, pauseSeconds: value } : step)));
  };

  const handleAddStep = (): void => {
    const id = nextId.current;
    nextId.current += 1;
    setSteps((current) => [...current, createStep(id)]);
  };

  const handleRemoveStep = (stepId: number): void => {
    setSteps((current) => current.filter((step) => step.id !== stepId));
  };

  const handleSubmit = async (): Promise<void> => {
    if (running || steps.length === 0) return;
    await onExecute(steps.map(parseStep));
  };

  return (
    <aside className="absolute right-0 top-0 z-10 flex h-full w-[min(24rem,94vw)] flex-col border-l border-white/10 bg-surface text-ink shadow-[-18px_0_48px_rgba(0,0,0,0.35)]">
      <header className="border-b border-white/10 px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Secuencia de movimiento</h2>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
            {String(steps.length).padStart(2, '0')} pasos
          </span>
        </div>
        <p className="mt-1.5 max-w-64 text-xs leading-relaxed text-muted">
          Define posiciones, velocidades y pausas. Se ejecutan en orden.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {steps.map((step, stepIndex) => {
          const isActive = activeStep === stepIndex;
          const isLast = stepIndex === steps.length - 1;

          return (
            <Fragment key={step.id}>
              <section aria-label={`Paso ${stepIndex + 1}`} className={`relative pl-9 ${isLast ? '' : 'pb-5'}`}>
                <span
                  className={`absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-[3px] border font-mono text-[10px] tabular-nums ${
                    isActive
                      ? 'border-signal bg-signal text-surface-raised'
                      : 'border-line bg-surface-raised text-muted'
                  }`}
                >
                  {String(stepIndex + 1).padStart(2, '0')}
                </span>

                {!isLast && <span className="absolute bottom-0 left-[11px] top-7 w-px bg-line" aria-hidden="true" />}

                <div className="flex min-h-6 items-center gap-2">
                  <h3 className="text-[11px] font-medium">Movimiento {stepIndex + 1}</h3>
                  {isActive && (
                    <span className="rounded-[2px] bg-signal-tint px-1.5 py-0.5 font-mono text-[9px] text-signal">
                      En curso
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(step.id)}
                    disabled={running}
                    aria-label={`Eliminar paso ${stepIndex + 1}`}
                    className="ml-auto rounded-[2px] px-1.5 py-0.5 text-[11px] text-muted transition hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Quitar
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2">
                  {JOINT_NAMES.map((name, jointIndex) => {
                    const [min, max] = JOINT_LIMITS[name];
                    const label = jointLabel(jointIndex);

                    return (
                      <label key={name} className="block">
                        <span className="mb-1 block font-mono text-[10px] text-muted">{label}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="1"
                          value={step.angles[jointIndex]}
                          onChange={(event) => handleAngleChange(step.id, jointIndex, event.target.value)}
                          aria-label={`Ángulo ${label} del paso ${stepIndex + 1}`}
                          title={`${label}: ${min}° a ${max}°`}
                          disabled={running}
                          className={fieldClass}
                        />
                      </label>
                    );
                  })}
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-[11px] text-muted">Velocidad del tramo</span>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="1"
                      value={step.speed}
                      onChange={(event) => handleSpeedChange(step.id, event.target.value)}
                      aria-label={`Velocidad del paso ${stepIndex + 1} en grados por segundo`}
                      disabled={running}
                      className={`${fieldClass} pr-10 text-right`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center font-mono text-[10px] text-muted">
                      °/s
                    </span>
                  </div>
                </label>
              </section>

              {!isLast && (
                <div className="mb-5 ml-9 flex items-center gap-3 border-y border-line/70 py-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted">
                    <input
                      type="checkbox"
                      checked={step.pauseEnabled}
                      onChange={(event) => handlePauseToggle(step.id, event.target.checked)}
                      disabled={running}
                      aria-label={`Activar pausa después del paso ${stepIndex + 1}`}
                      className="h-3.5 w-3.5 rounded-[2px] border-line accent-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30 disabled:opacity-50"
                    />
                    Pausa antes del siguiente paso
                  </label>
                  <div className="relative ml-auto w-16">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      value={step.pauseSeconds}
                      onChange={(event) => handlePauseSecondsChange(step.id, event.target.value)}
                      disabled={running || !step.pauseEnabled}
                      aria-label={`Segundos de pausa después del paso ${stepIndex + 1}`}
                      className={`${fieldClass} pr-5 text-right`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center font-mono text-[10px] text-muted">s</span>
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}

        <button
          type="button"
          onClick={handleAddStep}
          disabled={running}
          className="ml-9 w-[calc(100%-2.25rem)] rounded-[3px] border border-dashed border-line py-2.5 text-[11px] text-muted transition hover:border-signal hover:bg-signal-tint/60 hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Agregar movimiento
        </button>
      </div>

      <footer className="border-t border-white/10 bg-surface-raised px-5 py-4">
        <div className="mb-3 flex gap-1" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`h-0.5 flex-1 rounded-full ${
                index === activeStep ? 'bg-signal' : activeStep !== null && index < activeStep ? 'bg-signal/40' : 'bg-line'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={running || steps.length === 0}
          aria-busy={running}
          className="w-full rounded-[3px] bg-signal px-4 py-2.5 text-xs font-semibold tracking-tight text-shell transition hover:bg-signal/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {running ? 'Ejecutando secuencia…' : 'Ejecutar secuencia'}
        </button>
        <p className="mt-2 min-h-4 text-center font-mono text-[10px] tabular-nums text-muted">
          {waitingSeconds !== null
            ? `Pausa de ${waitingSeconds} s antes del siguiente paso`
            : running && activeStep !== null
              ? `Paso ${activeStep + 1} de ${steps.length}`
              : `${steps.length} paso(s) definido(s)`}
        </p>
      </footer>
    </aside>
  );
};

export default MovementSequencePanel;

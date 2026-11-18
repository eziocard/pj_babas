'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import RobotArmViewer, { CameraMode, RobotArmViewerHandle } from '@/components/RobotArmViewer';
import MovementSequencePanel, { SequenceStep } from '@/components/MovementSequencePanel';
import TransformEditor from '@/components/TransformEditor';

type Mode = 'view' | 'edit';

const Home = (): ReactElement => {
  const [mode, setMode] = useState<Mode>('view');
  const [cameraMode, setCameraMode] = useState<CameraMode>('free');
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [waitingSeconds, setWaitingSeconds] = useState<number | null>(null);
  const arm = useRef<RobotArmViewerHandle>(null);

  const handleExecute = useCallback(async (steps: SequenceStep[]): Promise<void> => {
    const controller = arm.current;
    if (!controller) return;

    setRunning(true);
    try {
      for (const [index, step] of steps.entries()) {
        setActiveStep(index);
        setWaitingSeconds(null);
        await controller.moveJoints(step.angles, step.speed);

        if (index === steps.length - 1 || step.pauseSeconds <= 0) continue;

        setWaitingSeconds(step.pauseSeconds);
        await new Promise<void>((resolve) => setTimeout(resolve, step.pauseSeconds * 1000));
      }
    } finally {
      setRunning(false);
      setActiveStep(null);
      setWaitingSeconds(null);
    }
  }, []);

  const handleModeChange = (nextMode: Mode): void => {
    if (running) return;
    setMode(nextMode);
  };

  return (
    <div className="relative flex flex-1 flex-col bg-shell text-ink">
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-shell px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-[3px] border border-white/20 font-mono text-[10px] tracking-tight text-ink/90">
            MC
          </span>
          <span className="hidden text-[13px] font-medium tracking-tight sm:inline">myCobot 280 Pi</span>
        </div>

        <span className="h-5 w-px bg-white/15" aria-hidden="true" />

        <nav aria-label="Vistas" className="flex items-center gap-0.5 rounded-[3px] border border-white/10 bg-white/[0.04] p-0.5">
          <button
            type="button"
            onClick={() => handleModeChange('view')}
            aria-pressed={mode === 'view'}
            className={`rounded-[2px] px-3 py-1.5 text-xs transition ${
              mode === 'view' ? 'bg-surface text-ink' : 'text-ink/60 hover:text-ink'
            }`}
          >
            Visor
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('edit')}
            aria-pressed={mode === 'edit'}
            className={`rounded-[2px] px-3 py-1.5 text-xs transition ${
              mode === 'edit' ? 'bg-surface text-ink' : 'text-ink/60 hover:text-ink'
            }`}
          >
            Editor
          </button>
        </nav>

        {mode === 'view' && (
          <>
            <span className="h-5 w-px bg-white/15" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[10px] tracking-wide text-ink/40 lg:inline">Cámara</span>
              <nav
                aria-label="Modo de cámara"
                className="flex items-center gap-0.5 rounded-[3px] border border-white/10 bg-white/[0.04] p-0.5"
              >
                <button
                  type="button"
                  onClick={() => setCameraMode('free')}
                  aria-pressed={cameraMode === 'free'}
                  className={`rounded-[2px] px-2 py-1.5 text-xs transition sm:px-3 ${
                    cameraMode === 'free' ? 'bg-surface text-ink' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  Libre
                </button>
                <button
                  type="button"
                  onClick={() => setCameraMode('surface')}
                  aria-pressed={cameraMode === 'surface'}
                  className={`rounded-[2px] px-2 py-1.5 text-xs transition sm:px-3 ${
                    cameraMode === 'surface' ? 'bg-surface text-ink' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  Superficie
                </button>
              </nav>
            </div>
          </>
        )}

        <div className="ml-auto hidden items-center gap-2 font-mono text-[10px] tracking-wide text-ink/50 lg:flex">
          <span
            className={`h-1.5 w-1.5 rounded-full ${running ? 'bg-amber-400' : 'bg-emerald-400'}`}
            aria-hidden="true"
          />
          {running ? 'En movimiento' : 'Listo'}
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {mode === 'view' ? (
          <>
            <RobotArmViewer ref={arm} cameraMode={cameraMode} />
            <MovementSequencePanel
              onExecute={handleExecute}
              running={running}
              activeStep={activeStep}
              waitingSeconds={waitingSeconds}
            />
          </>
        ) : (
          <TransformEditor />
        )}
      </main>
    </div>
  );
};

export default Home;

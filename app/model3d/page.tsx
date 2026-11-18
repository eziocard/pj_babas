'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import RobotArmViewer, { CameraMode, RobotArmViewerHandle } from '@/components/RobotArmViewer';
import MovementSequencePanel, { SequenceStep } from '@/components/MovementSequencePanel';
import TransformEditor from '@/components/TransformEditor';
import PythonEditor from '@/components/PythonEditor';
import {
  CONSOLE_ENDPOINT,
  DEFAULT_PYTHON_CODE,
  sequenceToPython,
  type PythonExecutionResult,
} from '@/lib/python-console';

type Mode = 'view' | 'edit';
/** Único panel lateral derecho: en cada momento muestra una de las dos herramientas. */
type SidePanel = 'sequence' | 'python';

export default function Home(): ReactElement {
  const [mode, setMode] = useState<Mode>('view');
  const [cameraMode, setCameraMode] = useState<CameraMode>('free');
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [waitingSeconds, setWaitingSeconds] = useState<number | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>('sequence');
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [editorCode, setEditorCode] = useState(DEFAULT_PYTHON_CODE);
  const [editorFocusToken, setEditorFocusToken] = useState(0);
  const arm = useRef<RobotArmViewerHandle>(null);

  const playEvents = useCallback(
    async (events: PythonExecutionResult['events']): Promise<void> => {
      const controller = arm.current;
      if (!controller) return;

      setRunning(true);
      try {
        for (const [index, event] of events.entries()) {
          setActiveStep(index);
          setWaitingSeconds(null);
          if (event.kind === 'move') {
            await controller.moveJoints(event.angles, event.speed);
          } else {
            setWaitingSeconds(event.seconds);
            await new Promise<void>((resolve) => setTimeout(resolve, event.seconds * 1000));
          }
        }
      } finally {
        setRunning(false);
        setActiveStep(null);
        setWaitingSeconds(null);
      }
    },
    []
  );

  const handleExecute = useCallback(
    async (steps: SequenceStep[]): Promise<void> => {
      await playEvents(
        steps.flatMap((step, index) => [
          { kind: 'move' as const, angles: step.angles, speed: step.speed },
          ...(index < steps.length - 1 && step.pauseSeconds > 0
            ? ([{ kind: 'pause' as const, seconds: step.pauseSeconds }] as const)
            : []),
        ])
      );
    },
    [playEvents]
  );

  const handleSequenceToPython = useCallback((steps: SequenceStep[]): void => {
    setEditorCode(sequenceToPython(steps));
    setEditorFocusToken((value) => value + 1);
    setSidePanel('python');
  }, []);

  const handleShowSequence = useCallback((): void => {
    setSidePanel('sequence');
    setPanelExpanded(false);
  }, []);

  const handleEditorExecute = useCallback(
    async (code: string): Promise<PythonExecutionResult> => {
      if (running) {
        return {
          output: '',
          angles: null,
          speed: 60,
          error: 'Hay una secuencia en ejecución.',
          events: [],
        };
      }

      const response = await fetch(CONSOLE_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result: PythonExecutionResult = await response.json();

      if (!result.error && result.events.length > 0) {
        await playEvents(result.events);
      }
      return result;
    },
    [playEvents, running]
  );

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
          <span className="hidden text-[13px] font-medium tracking-tight sm:inline">MyCobot 280 pi</span>
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
            <aside
              className={`absolute right-0 top-0 z-10 flex h-full flex-col border-l border-white/10 bg-surface text-ink shadow-[-18px_0_48px_rgba(0,0,0,0.35)] transition-[width] duration-300 ease-out motion-reduce:transition-none ${
                panelExpanded ? 'w-[min(64rem,94vw)]' : 'w-[min(24rem,94vw)]'
              }`}
            >
              <nav
                aria-label="Herramienta del brazo"
                className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-shell-raised/40 px-3 py-2"
              >
                <button
                  type="button"
                  aria-pressed={sidePanel === 'sequence'}
                  onClick={handleShowSequence}
                  className={`flex-1 rounded-[3px] px-3 py-1.5 font-display text-[11px] transition ${
                    sidePanel === 'sequence'
                      ? 'bg-surface text-ink shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Secuencia
                </button>
                <button
                  type="button"
                  aria-pressed={sidePanel === 'python'}
                  onClick={() => setSidePanel('python')}
                  className={`flex-1 rounded-[3px] px-3 py-1.5 font-display text-[11px] transition ${
                    sidePanel === 'python'
                      ? 'bg-console text-ink shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Código Python
                </button>
                <button
                  type="button"
                  aria-pressed={panelExpanded}
                  aria-label={panelExpanded ? 'Reducir panel' : 'Expandir panel'}
                  title={panelExpanded ? 'Reducir panel' : 'Expandir panel'}
                  onClick={() => setPanelExpanded((value) => !value)}
                  className="ml-1 shrink-0 rounded-[3px] border border-line/80 px-2 py-1.5 font-data text-[10px] text-muted transition hover:border-signal/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
                >
                  {panelExpanded ? 'Reducir' : 'Expandir'}
                </button>
              </nav>

              {sidePanel === 'sequence' ? (
                <MovementSequencePanel
                  onExecute={handleExecute}
                  running={running}
                  activeStep={activeStep}
                  waitingSeconds={waitingSeconds}
                  onExportPython={handleSequenceToPython}
                />
              ) : (
                <PythonEditor
                  onExecute={handleEditorExecute}
                  code={editorCode}
                  onCodeChange={setEditorCode}
                  focusToken={editorFocusToken}
                  onShowSequence={handleShowSequence}
                  expanded={panelExpanded}
                />
              )}
            </aside>
          </>
        ) : (
          <TransformEditor />
        )}
      </main>
    </div>
  );
}

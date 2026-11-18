'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react';
import {
  CONSOLE_HEALTH_ENDPOINT,
  CONSOLE_MAX_CODE_LENGTH,
  instructionsFromResult,
  type ConsoleHealth,
  type PythonExecutionResult,
  type PythonInstruction,
} from '@/lib/python-console';

export type PythonEditorProps = {
  /** Ejecuta el código en el servicio Python y devuelve el resultado al visor. */
  onExecute?: (code: string) => Promise<PythonExecutionResult>;
  /** Código del editor, controlado por la página para poder inyectar secuencias. */
  code: string;
  onCodeChange: (code: string) => void;
  /** Cambia cuando el exterior inyecta código; enfoca el editor. */
  focusToken?: number;
  /** Vuelve al panel de secuencia; Escape hace lo mismo. */
  onShowSequence?: () => void;
  /** El panel lateral está expandido: el editor puede usar dos columnas. */
  expanded?: boolean;
};

const instructionKey = (instruction: PythonInstruction, index: number): string =>
  `${instruction.joint}-${instruction.angle}-${index}`;

export default function PythonEditor({
  onExecute,
  code,
  onCodeChange,
  focusToken = 0,
  onShowSequence,
  expanded = false,
}: PythonEditorProps): ReactElement {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [lastResult, setLastResult] = useState<PythonExecutionResult | null>(null);
  const [instructions, setInstructions] = useState<PythonInstruction[]>([]);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<ConsoleHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(CONSOLE_HEALTH_ENDPOINT, { cache: 'no-store' })
      .then((response) => response.json() as Promise<ConsoleHealth>)
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth({ connected: false, mode: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onShowSequence) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onShowSequence();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onShowSequence]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    if (focusToken > 0) {
      const end = editor.value.length;
      editor.setSelectionRange(end, end);
    }
  }, [focusToken]);

  const runCode = useCallback(
    async (source: string): Promise<void> => {
      const trimmed = source.trim();
      if (!onExecute || trimmed === '' || busy) return;

      setBusy(true);
      try {
        const result = await onExecute(trimmed);
        setLastResult(result);
        const nextInstructions = instructionsFromResult(result);
        if (nextInstructions.length > 0) setInstructions(nextInstructions);
      } catch (error) {
        setLastResult({
          output: '',
          angles: null,
          speed: 60,
          error: error instanceof Error ? error.message : 'Error inesperado',
          events: [],
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, onExecute]
  );

  const handleEditorKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>): void => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void runCode(code);
    }
  };

  const lineCount = code.split('\n').length;
  const statusLabel =
    health === null
      ? 'Comprobando…'
      : health.connected
        ? health.mode === 'real'
          ? 'Modo real'
          : 'Simulación'
        : 'Sin conexión';

  return (
    <section id="python-editor" aria-label="Editor de código Python" className="flex min-h-0 flex-1 flex-col bg-console text-ink">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-console-line px-4">
        <span aria-hidden="true" className="h-1 w-7 rounded-full bg-console-line" />
        <h2 className="font-display text-[13px] font-semibold tracking-[-0.01em]">Editor Python</h2>
        <span
          className={`rounded-[2px] border px-1.5 py-0.5 font-data text-[9px] ${
            health?.connected
              ? 'border-signal/40 bg-signal-tint text-signal'
              : 'border-danger/40 bg-danger/10 text-danger'
          }`}
        >
          {statusLabel}
        </span>
        <span className="ml-1 hidden font-data text-[10px] text-muted md:inline">
          {health?.connected ? 'API myCobot lista' : 'servicio Python no disponible'}
        </span>
        <button
          type="button"
          onClick={onShowSequence}
          aria-label="Volver a la secuencia"
          className="ml-auto rounded-[2px] border border-console-line px-2 py-1 font-data text-[10px] text-muted transition hover:border-signal/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
        >
          Secuencia
        </button>
      </header>

      <div
        className={`grid min-h-0 flex-1 ${
          expanded
            ? 'grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-1'
            : 'grid-rows-[minmax(0,1fr)_auto]'
        }`}
      >
        <div className="flex min-h-0 flex-col">
          <div className="flex min-h-0 flex-1">
            <div
              ref={gutterRef}
              aria-hidden="true"
              className={`w-10 shrink-0 select-none overflow-hidden border-r border-console-line py-3 pr-2 text-right font-data text-[12px] text-muted/50 ${
                expanded ? 'leading-6' : 'leading-5'
              }`}
            >
              {Array.from({ length: lineCount }, (_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
            <textarea
              id="python-code"
              ref={editorRef}
              aria-label="Código Python"
              aria-describedby="python-shortcut"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              onScroll={(event) => {
                if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
              }}
              maxLength={CONSOLE_MAX_CODE_LENGTH}
              spellCheck={false}
              disabled={!onExecute || busy}
              className={`min-h-0 flex-1 resize-none bg-transparent px-3 py-3 font-data text-ink caret-py outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                expanded ? 'text-[13px] leading-6' : 'text-[12px] leading-5'
              }`}
            />
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-console-line bg-shell-raised/30 px-4 py-2">
            <span id="python-shortcut" className="font-data text-[9px] text-muted/60">
              Ctrl/⌘ + Enter para ejecutar · se envía el código completo
            </span>
            <button
              type="button"
              onClick={() => void runCode(code)}
              disabled={!onExecute || busy}
              className="ml-auto shrink-0 rounded-[3px] border border-signal/50 px-3 py-1.5 font-display text-[11px] font-medium text-ink transition hover:bg-signal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 disabled:cursor-not-allowed disabled:border-console-line disabled:text-muted"
            >
              {busy ? 'Ejecutando…' : 'Ejecutar'}
            </button>
          </div>
        </div>

        <aside
          className={`flex min-h-0 flex-col border-console-line bg-shell-raised/40 px-4 py-3 ${
            expanded
              ? 'border-t lg:border-l lg:border-t-0'
              : 'max-h-44 border-t'
          }`}
        >
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-[11px] font-medium text-muted">Último resultado</h3>
            {lastResult && (
              <span
                className={`font-data text-[9px] ${lastResult.error ? 'text-danger' : 'text-signal'}`}
              >
                {lastResult.error ? 'Error' : 'OK'}
              </span>
            )}
          </div>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto font-data text-[11px] leading-5">
            {lastResult === null ? (
              <p className="text-muted/70">Ejecuta el código para ver el resultado.</p>
            ) : (
              <>
                {lastResult.output && (
                  <pre className="whitespace-pre-wrap text-muted">{lastResult.output}</pre>
                )}
                {lastResult.error && (
                  <p className="mt-1 whitespace-pre-wrap text-danger">{lastResult.error}</p>
                )}
                {!lastResult.output && !lastResult.error && (
                  <p className="text-muted/70">Sin salida. Ángulos aplicados al visor.</p>
                )}
              </>
            )}
          </div>

          <div className="mt-3 border-t border-console-line pt-3">
            <div className="flex items-baseline justify-between">
              <h4 className="font-display text-[11px] font-medium text-muted">Ángulos aplicados</h4>
              <span className="font-data text-[10px] tabular-nums text-muted/70">
                {String(instructions.length).padStart(2, '0')}
              </span>
            </div>

            {instructions.length > 0 ? (
              <ol
                className={`mt-2 flex gap-2 overflow-x-auto ${
                  expanded ? 'lg:flex-col lg:overflow-visible' : ''
                }`}
              >
                {instructions.map((instruction, index) => (
                  <li
                    key={instructionKey(instruction, index)}
                    className={`flex min-w-[10rem] items-center gap-2 rounded-[2px] border border-console-line bg-console px-2 py-1.5 ${
                      expanded ? 'lg:min-w-0' : ''
                    }`}
                  >
                    <span className="font-data text-[10px] tabular-nums text-py">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-data text-[11px] font-medium">{instruction.joint}</span>
                    <span className="ml-auto font-data text-[10px] tabular-nums text-muted">
                      {instruction.angle} · {instruction.speed}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 font-body text-[11px] text-muted/70">Sin ángulos todavía.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

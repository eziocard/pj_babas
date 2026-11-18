'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxesHelper, Group, Object3D } from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { applyOrigin as applyUrdfOrigin, LINKS as LINKS_BASE, loadMesh } from '@/components/robot-assembly';

type Axis = 0 | 1 | 2;

type Edit = {
  visual: { pos: [number, number, number]; rot: [number, number, number] }; // rot en grados
  joints: Record<string, { pos: [number, number, number]; rot: [number, number, number] }>;
};

const PI = Math.PI;

const LINK_ORDER: string[] = Object.keys(LINKS_BASE);

const degToRad = (deg: number): number => (deg * PI) / 180;
const radToDeg = (rad: number): number => (rad * 180) / PI;

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const round5 = (n: number): number => Math.round(n * 100000) / 100000;

/** El editor trabaja en grados; el transform URDF se aplica en radianes. */
function applyOrigin(target: Object3D, pos: [number, number, number], rotDeg: [number, number, number]): void {
  applyUrdfOrigin(target, {
    position: pos,
    rotation: [degToRad(rotDeg[0]), degToRad(rotDeg[1]), degToRad(rotDeg[2])],
  });
}

const initialEdits = (): Record<string, Edit> => {
  const edits: Record<string, Edit> = {};
  for (const [name, link] of Object.entries(LINKS_BASE)) {
    edits[name] = {
      visual: {
        pos: [...link.visual.position],
        rot: link.visual.rotation.map(radToDeg) as [number, number, number],
      },
      joints: {},
    };
    for (const child of link.children) {
      edits[name].joints[child.name] = {
        pos: [...child.joint.position],
        rot: child.joint.rotation.map(radToDeg) as [number, number, number],
      };
    }
  }
  return edits;
};

export default function TransformEditor() {
  const [models, setModels] = useState<Record<string, Object3D>>({});
  const [edits, setEdits] = useState<Record<string, Edit>>(initialEdits());
  const [selected, setSelected] = useState<string>('g_base');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const names = Object.values(LINKS_BASE).map((l) => l.mesh);

    Promise.all(names.map((name) => loadMesh(name)))
      .then((objs) => {
        if (cancelled) return;
        const next: Record<string, Object3D> = {};
        objs.forEach((o, i) => (next[names[i]] = o));
        setModels(next);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLinkSelect = (name: string): void => {
    setSelected(name);
  };

  const handleVisualPosChange = (linkName: string, axis: Axis, value: string): void => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    setEdits((prev) => {
      const cur = prev[linkName];
      if (!cur) return prev;
      const nextPos = [...cur.visual.pos] as [number, number, number];
      nextPos[axis] = num;
      return {
        ...prev,
        [linkName]: {
          ...cur,
          visual: { ...cur.visual, pos: nextPos },
        },
      };
    });
  };

  const handleVisualRotChange = (linkName: string, axis: Axis, value: string): void => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    setEdits((prev) => {
      const cur = prev[linkName];
      if (!cur) return prev;
      const nextRot = [...cur.visual.rot] as [number, number, number];
      nextRot[axis] = num;
      return {
        ...prev,
        [linkName]: {
          ...cur,
          visual: { ...cur.visual, rot: nextRot },
        },
      };
    });
  };

  const handleJointPosChange = (linkName: string, childName: string, axis: Axis, value: string): void => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    setEdits((prev) => {
      const cur = prev[linkName];
      if (!cur || !cur.joints[childName]) return prev;
      const joint = { ...cur.joints[childName] };
      const nextPos = [...joint.pos] as [number, number, number];
      nextPos[axis] = num;
      joint.pos = nextPos;
      return {
        ...prev,
        [linkName]: {
          ...cur,
          joints: { ...cur.joints, [childName]: joint },
        },
      };
    });
  };

  const handleJointRotChange = (linkName: string, childName: string, axis: Axis, value: string): void => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    setEdits((prev) => {
      const cur = prev[linkName];
      if (!cur || !cur.joints[childName]) return prev;
      const joint = { ...cur.joints[childName] };
      const nextRot = [...joint.rot] as [number, number, number];
      nextRot[axis] = num;
      joint.rot = nextRot;
      return {
        ...prev,
        [linkName]: {
          ...cur,
          joints: { ...cur.joints, [childName]: joint },
        },
      };
    });
  };

  const handleResetLink = (linkName: string): void => {
    const base = initialEdits()[linkName];
    if (!base) return;
    setEdits((prev) => ({ ...prev, [linkName]: base }));
  };

  const handleResetAll = (): void => {
    setEdits(initialEdits());
    setSelected('g_base');
  };

  const handleCopyCode = (): void => {
    const code = generateLinksCode(edits);
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopied(false);
      });
  };

  const root = useMemo(() => {
    if (!models || Object.keys(models).length === 0) return null;
    const rootGroup = new Group();

    function build(
      linkName: string,
      parent: Group,
      jointOffset: { pos: [number, number, number]; rot: [number, number, number] }
    ): void {
      const link = LINKS_BASE[linkName];
      if (!link) return;
      const edit = edits[linkName];
      if (!edit) return;

      const linkGroup = new Group();
      linkGroup.position.set(jointOffset.pos[0], jointOffset.pos[1], jointOffset.pos[2]);
      linkGroup.rotation.set(
        degToRad(jointOffset.rot[0]),
        degToRad(jointOffset.rot[1]),
        degToRad(jointOffset.rot[2]),
        'ZYX'
      );
      linkGroup.updateMatrixWorld();
      parent.add(linkGroup);

      const visual = new Group();
      applyOrigin(visual, edit.visual.pos, edit.visual.rot);

      const model = models[link.mesh];
      if (model) {
        visual.add(model.clone());
      }
      linkGroup.add(visual);

      for (const child of link.children) {
        // La origin de la articulación vive en el eslabón padre.
        const joint = edit.joints[child.name];
        if (!joint) continue;
        build(child.name, linkGroup, joint);
      }
    }

    build('g_base', rootGroup, { pos: [0, 0, 0], rot: [0, 0, 0] });
    rootGroup.updateMatrixWorld(true);
    return rootGroup;
  }, [edits, models]);

  if (error) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-shell/95 p-6 text-center backdrop-blur-sm">
        <div className="max-w-md">
          <h3 className="mb-2 font-semibold text-danger">Error cargando modelos</h3>
          <p className="text-sm text-ink/70">{error}</p>
          <button
            onClick={handleResetAll}
            className="mt-4 rounded-[3px] bg-surface px-3 py-1.5 text-xs text-ink transition hover:bg-surface-raised"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-shell text-ink flex">
      <aside className="flex h-full w-[min(20rem,90vw)] flex-col overflow-hidden border-r border-white/10 bg-surface text-ink shadow-[18px_0_48px_rgba(0,0,0,0.35)]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">myCobot 280 Pi — Editor</h2>
          <p className="mt-1 text-xs text-muted">Ajusta posición y rotación de cada eslabón.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <label className="mb-2 block text-[10px] font-medium tracking-wide text-muted">Eslabón</label>
          <div className="space-y-1">
            {LINK_ORDER.map((name) => (
              <button
                key={name}
                onClick={() => handleLinkSelect(name)}
                aria-pressed={selected === name}
                className={`w-full rounded-[3px] px-3 py-2 text-left font-mono text-[11px] tabular-nums transition ${
                  selected === name ? 'bg-signal-tint text-signal' : 'text-muted hover:bg-white/5 hover:text-ink'
                }`}
              >
                {name} ({LINKS_BASE[name].mesh})
              </button>
            ))}
          </div>

          {selected && (
            <>
              <div className="mt-5 border-t border-white/10 pt-4">
                <h3 className="mb-3 text-xs font-semibold text-ink">
                  {selected} — visual
                </h3>
                <div className="space-y-2">
                  {['X', 'Y', 'Z'].map((axis, i) => (
                    <div key={axis} className="flex items-center gap-2">
                      <label
                        htmlFor={`visual-pos-${selected}-${axis}`}
                        className="w-5 shrink-0 font-mono text-[10px] text-muted"
                      >
                        {axis}
                      </label>
                      <input
                        id={`visual-pos-${selected}-${axis}`}
                        type="number"
                        step="0.001"
                        value={edits[selected]?.visual.pos[i] ?? 0}
                        onChange={(e) => handleVisualPosChange(selected, i as Axis, e.target.value)}
                        aria-label={`Posición ${axis} del eslabón ${selected}`}
                        className="flex-1 rounded-[3px] border border-line bg-surface-raised px-2 py-1.5 font-mono text-xs tabular-nums text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                      />
                    </div>
                  ))}
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <h4 className="mb-2 text-[10px] font-medium tracking-wide text-muted">
                      Rotación (grados)
                    </h4>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                      <div key={axis} className="flex items-center gap-2">
                        <label
                          htmlFor={`visual-rot-${selected}-${axis}`}
                          className="w-5 shrink-0 font-mono text-[10px] text-muted"
                        >
                          {axis}
                        </label>
                        <input
                          id={`visual-rot-${selected}-${axis}`}
                          type="number"
                          step="0.1"
                          value={edits[selected]?.visual.rot[i] ?? 0}
                          onChange={(e) => handleVisualRotChange(selected, i as Axis, e.target.value)}
                          aria-label={`Rotación ${axis} del eslabón ${selected} (grados)`}
                          className="flex-1 rounded-[3px] border border-line bg-surface-raised px-2 py-1.5 font-mono text-xs tabular-nums text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <h3 className="mb-3 text-xs font-semibold text-ink">Joints hacia hijos</h3>
                {LINKS_BASE[selected].children.length === 0 ? (
                  <p className="text-xs text-muted">Sin hijos</p>
                ) : (
                  <div className="space-y-3">
                    {LINKS_BASE[selected].children.map((child) => (
                      <div key={child.name} className="rounded-[3px] border border-line bg-surface-raised/70 p-2">
                        <h4 className="mb-2 font-mono text-[10px] font-medium text-muted">
                          Hijo: {child.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Pos', 'Rot'].map((type) => (
                            <div key={type} className="col-span-2 space-y-1">
                              <h5 className="text-[10px] font-medium tracking-wide text-muted">
                                {type === 'Pos' ? 'Posición (m)' : 'Rotación (grados)'}
                              </h5>
                              <div className="flex gap-1">
                                {['X', 'Y', 'Z'].map((axis, i) => (
                                  <input
                                    key={axis}
                                    id={`joint-${selected}-${child.name}-${type}-${axis}`}
                                    type="number"
                                    step={type === 'Pos' ? '0.001' : '0.1'}
                                    value={
                                      type === 'Pos'
                                        ? edits[selected]?.joints[child.name]?.pos[i] ?? 0
                                        : edits[selected]?.joints[child.name]?.rot[i] ?? 0
                                    }
                                    onChange={(e) =>
                                      type === 'Pos'
                                        ? handleJointPosChange(selected, child.name, i as Axis, e.target.value)
                                        : handleJointRotChange(selected, child.name, i as Axis, e.target.value)
                                    }
                                    aria-label={`${type} ${axis} del joint ${selected} → ${child.name}`}
                                    className="min-w-0 rounded-[3px] border border-line bg-surface-raised px-1.5 py-1 font-mono text-[11px] tabular-nums text-ink outline-none focus:border-signal focus:ring-1 focus:ring-signal/20"
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => handleResetLink(selected)}
            className="mb-2 w-full rounded-[3px] border border-line bg-surface-raised px-3 py-2 text-xs text-ink transition hover:border-signal hover:text-signal"
          >
            Resetear eslabón
          </button>
          <button
            onClick={handleResetAll}
            className="mb-3 w-full rounded-[3px] border border-line bg-surface-raised px-3 py-2 text-xs text-ink transition hover:border-signal hover:text-signal"
          >
            Resetear todo
          </button>
          <button
            onClick={handleCopyCode}
            className={`w-full rounded-[3px] px-3 py-2 text-xs font-semibold transition ${
              copied
                ? 'border border-signal bg-signal-tint text-signal'
                : 'bg-signal text-shell hover:bg-signal/85'
            }`}
          >
            {copied ? '¡Copiado!' : 'Copiar código TypeScript'}
          </button>
        </div>
      </aside>

      <main className="flex-1 relative h-full">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-shell/85 font-mono text-xs tracking-wide text-ink/60 backdrop-blur-sm">
            Ensamblando y aplicando transformaciones…
          </div>
        ) : (
          <Canvas shadows camera={{ position: [0.7, 0.5, 0.8], fov: 45 }} className="w-full h-full">
            <ambientLight intensity={0.6} />
            <pointLight position={[1, 1, 1]} intensity={1} />
            <pointLight position={[-1, 1, -1]} intensity={0.5} />
            <Environment preset="city" />
            <primitive object={new AxesHelper(0.2)} dispose={null} />
            {root && (
              // El ensamblado está en Z-up (URDF); se gira -90° en X para verlo de pie.
              <group rotation={[-Math.PI / 2, 0, 0]}>
                <primitive object={root} dispose={null} />
              </group>
            )}
            <OrbitControls makeDefault enablePan={false} target={[0, 0.2, 0]} />
          </Canvas>
        )}
      </main>

      <div aria-live="polite" className="absolute bottom-4 left-4 z-20">
        {copied ? (
          <span className="rounded-[3px] border border-signal/40 bg-signal-tint px-2 py-1 font-mono text-[10px] text-signal">
            Configuración copiada al portapapeles
          </span>
        ) : null}
      </div>
    </div>
  );
}

function generateLinksCode(edits: Record<string, Edit>): string {
  const lines: string[] = [];
  lines.push("const LINKS: Record<string, LinkDef> = {");
  for (const [name, link] of Object.entries(LINKS_BASE)) {
    const edit = edits[name];
    if (!edit) continue;
    lines.push(`  ${name}: {`);
    lines.push(`    mesh: '${link.mesh}',`);
    lines.push(
      `    visual: { position: [${edit.visual.pos.map(round5).join(', ')}], rotation: [${edit.visual.rot
        .map((r) => round3(degToRad(r)))
        .join(', ')}] },`
    );
    lines.push(`    children: [`);
    for (const child of link.children) {
      const joint = edit.joints[child.name] ?? {
        pos: [...child.joint.position],
        rot: child.joint.rotation.map(radToDeg) as [number, number, number],
      };
      lines.push(
        `      { name: '${child.name}', joint: { position: [${joint.pos.map(round5).join(', ')}], rotation: [${joint.rot
          .map((r) => round3(degToRad(r)))
          .join(', ')}] } },`
      );
    }
    lines.push(`    ],`);
    lines.push(`  },`);
  }
  lines.push('};');
  return lines.join('\n');
}

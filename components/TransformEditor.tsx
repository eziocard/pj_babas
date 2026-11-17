'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AxesHelper, Box3, DoubleSide, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type Origin = { position: [number, number, number]; rotation: [number, number, number] };

type LinkDef = {
  mesh: string;
  visual: Origin;
  children: Array<{ name: string; joint: Origin }>;
};

type Axis = 0 | 1 | 2;

type Edit = {
  visual: { pos: [number, number, number]; rot: [number, number, number] }; // rot en grados
  joints: Record<string, { pos: [number, number, number]; rot: [number, number, number] }>;
};

const PI = Math.PI;

const LINKS_BASE: Record<string, LinkDef> = {
  g_base: {
    mesh: 'G_base',
    visual: { position: [0, 0, -0.03], rotation: [0, 0, 1.5708] },
    children: [{ name: 'joint1', joint: { position: [0, 0, 0], rotation: [0, 0, 0] } }],
  },
  joint1: {
    mesh: 'joint1_pi',
    visual: { position: [0, 0, 0], rotation: [0, 0, 0] },
    children: [{ name: 'joint2', joint: { position: [0, 0, 0.13956], rotation: [0, 0, 0] } }],
  },
  joint2: {
    mesh: 'joint2',
    visual: { position: [0, 0, -0.06096], rotation: [0, 0, -1.5708] },
    children: [{ name: 'joint3', joint: { position: [0, 0, -0.001], rotation: [0, 1.5708, -1.5708] } }],
  },
  joint3: {
    mesh: 'joint3',
    visual: { position: [0, 0, 0.03256], rotation: [0, -1.5708, 0] },
    children: [{ name: 'joint4', joint: { position: [-0.1104, 0, 0], rotation: [0, 0, 0] } }],
  },
  joint4: {
    mesh: 'joint4',
    visual: { position: [0, 0, 0.03056], rotation: [0, -1.5708, 0] },
    children: [{ name: 'joint5', joint: { position: [-0.096, 0, 0.06462], rotation: [0, 0, -1.5708] } }],
  },
  joint5: {
    mesh: 'joint5',
    visual: { position: [0, -0.001, -0.0345], rotation: [0, -1.5708, 1.5708] },
    children: [{ name: 'joint6', joint: { position: [0, -0.07318, -0.001], rotation: [1.5708, -1.5708, 0] } }],
  },
  joint6: {
    mesh: 'joint6',
    visual: { position: [0, 0, -0.038], rotation: [0, 0, 0] },
    children: [{ name: 'joint6_flange', joint: { position: [0, 0.0456, 0], rotation: [-1.5708, 0, 0] } }],
  },
  joint6_flange: {
    mesh: 'joint7',
    visual: { position: [0, 0, -0.012], rotation: [0, 0, 0] },
    children: [],
  },
};

const LINK_ORDER: string[] = Object.keys(LINKS_BASE);

const degToRad = (deg: number): number => (deg * PI) / 180;
const radToDeg = (rad: number): number => (rad * 180) / PI;

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const round5 = (n: number): number => Math.round(n * 100000) / 100000;

const BODY_MATERIAL = new MeshStandardMaterial({
  color: '#e8ecf1',
  metalness: 0.15,
  roughness: 0.55,
  side: DoubleSide,
});

function applyOrigin(group: Group, pos: [number, number, number], rotDeg: [number, number, number]): void {
  group.position.set(pos[0], pos[1], pos[2]);
  group.rotation.set(degToRad(rotDeg[0]), degToRad(rotDeg[1]), degToRad(rotDeg[2]), 'ZYX');
  group.updateMatrixWorld();
}

function normalizeMesh(raw: Object3D): Object3D {
  const holder = new Group();
  const inner = new Group();
  inner.add(raw);
  holder.add(inner);

  const size = new Box3().setFromObject(raw).getSize(new Vector3());
  if (Math.max(size.x, size.y, size.z) > 5) holder.scale.setScalar(0.001);

  holder.traverse((o) => {
    if ((o as Mesh).isMesh) (o as Mesh).material = BODY_MATERIAL;
  });

  holder.updateMatrixWorld(true);
  return holder;
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
  const rootRef = useRef<Group | null>(null);

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

  function loadMesh(name: string): Promise<Object3D> {
    const url = `/models/${name}.glb`;
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        url,
        (gltf) => (gltf?.scene ? resolve(normalizeMesh(gltf.scene)) : reject(new Error(`No se pudo cargar ${url}`))),
        undefined,
        () => reject(new Error(`No se pudo cargar ${url}`))
      );
    });
  }

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
        const childEdit = edits[child.name];
        if (!childEdit) continue;
        build(child.name, linkGroup, childEdit.joints[child.name]);
      }
    }

    build('g_base', rootGroup, { pos: [0, 0, 0], rot: [0, 0, 0] });
    rootGroup.updateMatrixWorld(true);
    rootRef.current = rootGroup;
    return rootGroup;
  }, [edits, models]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-20 flex items-center justify-center text-center p-6">
        <div className="max-w-md">
          <h3 className="text-red-400 font-semibold mb-2">Error cargando modelos</h3>
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={handleResetAll}
            className="mt-4 px-3 py-1.5 text-sm text-slate-100 bg-slate-700 rounded hover:bg-slate-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 flex">
      <aside className="w-80 border-r border-slate-800 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">myCobot 280 Pi — Editor</h2>
          <p className="text-xs text-slate-400 mt-1">Ajusta posición y rotación de cada eslabón.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Eslabón</label>
          <div className="space-y-1">
            {LINK_ORDER.map((name) => (
              <button
                key={name}
                onClick={() => handleLinkSelect(name)}
                aria-pressed={selected === name}
                className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                  selected === name ? 'bg-slate-700 text-slate-100' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {name} ({LINKS_BASE[name].mesh})
              </button>
            ))}
          </div>

          {selected && (
            <>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  {selected} — visual
                </h3>
                <div className="space-y-2">
                  {['X', 'Y', 'Z'].map((axis, i) => (
                    <div key={axis} className="flex items-center gap-2">
                      <label
                        htmlFor={`visual-pos-${selected}-${axis}`}
                        className="w-10 text-xs text-slate-400 shrink-0"
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
                        className="flex-1 px-2 py-1.5 text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-800/50">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Rotación (grados)
                    </h4>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                      <div key={axis} className="flex items-center gap-2">
                        <label
                          htmlFor={`visual-rot-${selected}-${axis}`}
                          className="w-10 text-xs text-slate-400 shrink-0"
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
                          className="flex-1 px-2 py-1.5 text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Joints hacia hijos</h3>
                {LINKS_BASE[selected].children.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin hijos</p>
                ) : (
                  <div className="space-y-3">
                    {LINKS_BASE[selected].children.map((child) => (
                      <div key={child.name} className="p-2 rounded bg-slate-900/50 border border-slate-800">
                        <h4 className="text-xs font-semibold text-slate-300 mb-2">
                          → {child.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Pos', 'Rot'].map((type) => (
                            <div key={type} className="col-span-2 space-y-1">
                              <h5 className="text-[10px] font-semibold text-slate-500 uppercase">
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
                                    className="px-1.5 py-1 text-xs text-slate-100 bg-slate-950 border border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
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

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => handleResetLink(selected)}
            className="w-full px-3 py-2 text-sm text-slate-300 bg-slate-800 rounded hover:bg-slate-700 mb-2"
          >
            Resetear eslabón
          </button>
          <button
            onClick={handleResetAll}
            className="w-full px-3 py-2 text-sm text-slate-300 bg-slate-800 rounded hover:bg-slate-700 mb-3"
          >
            Resetear todo
          </button>
          <button
            onClick={handleCopyCode}
            className={`w-full px-3 py-2 text-sm rounded transition ${
              copied
                ? 'text-indigo-100 bg-indigo-900/80 border border-indigo-700'
                : 'text-indigo-100 bg-indigo-900/50 border border-indigo-700 hover:bg-indigo-900/80'
            }`}
          >
            {copied ? '¡Copiado!' : 'Copiar código TypeScript'}
          </button>
        </div>
      </aside>

      <main className="flex-1 relative h-full">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
            Ensamblando y aplicando transformaciones…
          </div>
        ) : (
          <Canvas shadows camera={{ position: [0.7, 0.5, 0.8], fov: 45 }} className="w-full h-full">
            <ambientLight intensity={0.6} />
            <pointLight position={[1, 1, 1]} intensity={1} />
            <pointLight position={[-1, 1, -1]} intensity={0.5} />
            <Environment preset="city" />
            <primitive object={new AxesHelper(0.2)} dispose={null} />
            {root && <primitive object={root} dispose={null} />}
            <OrbitControls makeDefault enablePan={false} target={[0, 0.2, 0]} />
          </Canvas>
        )}
      </main>

      <div aria-live="polite" className="absolute bottom-4 left-4 z-20">
        {copied ? (
          <span className="text-xs text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-700/50">
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

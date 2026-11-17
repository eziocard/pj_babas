'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box3, DoubleSide, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const GLB_IS_Y_UP = false;

const BODY_MATERIAL = new MeshStandardMaterial({
  color: '#e8ecf1',
  metalness: 0.15,
  roughness: 0.55,
  side: DoubleSide,
});

type Origin = { position: [number, number, number]; rotation: [number, number, number] };

type LinkDef = {
  mesh: string;
  visual: Origin;
  children: Array<{ name: string; joint: Origin }>;
};

const LINKS: Record<string, LinkDef> = {
  g_base: {
    mesh: 'G_base',
    visual: { position: [0, 0, 0], rotation: [1.5708, 0, 0] },
    children: [{ name: 'joint1', joint: { position: [0, 0, 0.031], rotation: [1.5708, 0, 0] } }],
  },
  joint1: {
    mesh: 'joint1_pi',
    visual: { position: [0, 0, 0], rotation: [0, 0, 0] },
    children: [{ name: 'joint2', joint: { position: [-0.06, 0.115, -0.004], rotation: [1.5712, -1.5621, 3.1412] } }],
  },
  joint2: {
    mesh: 'joint2',
    visual: { position: [0.00204, 0.00002, -0.001], rotation: [-2.3562, 1.5708, -2.3475] },
    children: [{ name: 'joint3', joint: { position: [0, 0, -0.001], rotation: [0, 1.5708, -1.5708] } }],
  },
  joint3: {
    mesh: 'joint3',
    visual: { position: [0.00028, -0.00001, -0.00144], rotation: [0.7836, -1.5585, 0.7871] },
    children: [{ name: 'joint4', joint: { position: [-0.1104, 0, 0], rotation: [0, 0, 0] } }],
  },
  joint4: {
    mesh: 'joint4',
    visual: { position: [-0.00033, 0.00198, -0.00249], rotation: [0.7836, -1.5585, 0.7871] },
    children: [{ name: 'joint5', joint: { position: [-0.096, 0, 0.06462], rotation: [0, 0, -1.5708] } }],
  },
  joint5: {
    mesh: 'joint5',
    visual: { position: [-0.00398, -0.00033, -0.06674], rotation: [0.7836, -1.5585, 2.3579] },
    children: [{ name: 'joint6', joint: { position: [0, -0.07318, -0.001], rotation: [1.5708, -1.5708, 0] } }],
  },
  joint6: {
    mesh: 'joint6',
    visual: { position: [-0.03494, 0.00525, -0.03812], rotation: [1.5708, 0.0087, 0.0087] },
    children: [{ name: 'joint6_flange', joint: { position: [0, 0.0456, 0], rotation: [-1.5708, 0, 0] } }],
  },
  joint6_flange: {
    mesh: 'joint7',
    visual: { position: [-0.0323, 0.00114, -0.07733], rotation: [1.5707, -0.0087, 0.0087] },
    children: [],
  },
};

/** URDF: R = Rz(yaw)·Ry(pitch)·Rx(roll) → orden 'ZYX' en three.js. */
function applyOrigin(target: Object3D, origin: Origin) {
  target.position.set(...origin.position);
  target.rotation.set(origin.rotation[0], origin.rotation[1], origin.rotation[2], 'ZYX');
  target.updateMatrixWorld();
}

function normalizeMesh(raw: Object3D): Object3D {
  const holder = new Group();
  const inner = new Group();
  inner.add(raw);
  if (GLB_IS_Y_UP) inner.rotation.x = Math.PI / 2;
  holder.add(inner);

  const size = new Box3().setFromObject(raw).getSize(new Vector3());
  if (Math.max(size.x, size.y, size.z) > 5) holder.scale.setScalar(0.001); // estaba en mm

  holder.traverse((o) => {
    if ((o as Mesh).isMesh) (o as Mesh).material = BODY_MATERIAL;
  });

  holder.updateMatrixWorld(true);
  return holder;
}

function buildRobot(models: Record<string, Object3D>) {
  const root = new Group();

  function build(linkName: string, parent: Group, jointOffset: Origin) {
    const link = LINKS[linkName];
    if (!link) return;

    const linkGroup = new Group();
    applyOrigin(linkGroup, jointOffset);
    parent.add(linkGroup);

    const model = models[link.mesh];
    if (model) {
      const visual = new Group();
      applyOrigin(visual, link.visual);
      visual.add(model.clone());
      linkGroup.add(visual);
    }

    for (const child of link.children) build(child.name, linkGroup, child.joint);
  }

  build('g_base', root, { position: [0, 0, 0], rotation: [0, 0, 0] });
  root.updateMatrixWorld(true);
  return root;
}

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

export default function RobotArmViewer() {
  const [models, setModels] = useState<Record<string, Object3D>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const names = Object.values(LINKS).map((l) => l.mesh);

    Promise.all(names.map(loadMesh))
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

  const robot = useMemo(() => (Object.keys(models).length ? buildRobot(models) : null), [models]);

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100">
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/90 p-6 text-center backdrop-blur-sm">
          <div className="max-w-md">
            <h3 className="mb-2 font-semibold text-red-400">Error cargando modelos</h3>
            <p className="text-sm text-slate-300">{error}</p>
          </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [0.7, 0.5, 0.8], fov: 45 }} className="h-full w-full">
        <ambientLight intensity={0.6} />
        <pointLight position={[1, 1, 1]} intensity={1} />
        <pointLight position={[-1, 1, -1]} intensity={0.5} />
        <Environment preset="city" />

        {robot && (
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <primitive object={robot} dispose={null} />
          </group>
        )}

        <OrbitControls makeDefault enablePan={false} target={[0, 0.2, 0]} />
      </Canvas>

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          Ensamblando myCobot 280 Pi…
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10 text-sm text-slate-400">
        myCobot 280 Pi — ensamblado
      </div>
    </div>
  );
}
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box3, DoubleSide, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Formato de los meshes en /public/models:
 *  - 'glb' (recomendado): los GLB que te entrego en models.zip. Ya están en metros y en el
 *    marco Z-up del URDF, con las transformaciones internas aplicadas.
 *  - 'dae': los .dae originales. OJO: joint1_pi.dae y joint5.dae están mal formados para
 *    three.js (ColladaLoader lanza error), por eso no se recomienda.
 */
const FORMAT: 'dae' | 'glb' = 'glb';

// Solo aplica a GLB. Los GLB de models.zip NO están en Y-up, así que debe ser false.
// Si usas tus GLB propios y salen todos girados 90° en X, prueba con true.
const GLB_IS_Y_UP = false;

// Material uniforme (los GLB convertidos no traen colores).
const BODY_MATERIAL = new MeshStandardMaterial({
  color: '#e8ecf1',
  metalness: 0.15,
  roughness: 0.55,
  side: DoubleSide,
});

type Origin = { position: [number, number, number]; rotation: [number, number, number] };

type LinkDef = {
  mesh: string; // nombre base, sin extensión
  visual: Origin;
  children: Array<{ name: string; joint: Origin }>;
};

/** Datos tomados tal cual de mycobot_280_pi.urdf (verificado contra el repo oficial). */
const LINKS: Record<string, LinkDef> = {
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

/**
 * Origen URDF (xyz + rpy). URDF: R = Rz(yaw)·Ry(pitch)·Rx(roll) → orden 'ZYX' en three.js.
 */
function applyOrigin(target: Object3D, origin: Origin) {
  target.position.set(...origin.position);
  target.rotation.set(origin.rotation[0], origin.rotation[1], origin.rotation[2], 'ZYX');
  target.updateMatrixWorld();
}

/**
 * Deja el mesh cargado en el marco que el URDF espera: metros y Z-up.
 * Se devuelve dentro de un Group para no tocar el transform propio del mesh.
 */
function normalizeMesh(raw: Object3D): Object3D {
  const holder = new Group();

  if (FORMAT === 'dae') {
    // ColladaLoader ya aplica la escala de unidad (mm → m), pero además gira la escena
    // -90° en X para pasarla a Y-up. Como el URDF es Z-up, deshacemos esa rotación.
    raw.quaternion.identity();
    holder.add(raw);
  } else {
    // GLB: corregir eje y, si hace falta, unidades (mm → m).
    const inner = new Group();
    inner.add(raw);
    if (GLB_IS_Y_UP) inner.rotation.x = Math.PI / 2;
    holder.add(inner);

    const size = new Box3().setFromObject(raw).getSize(new Vector3());
    if (Math.max(size.x, size.y, size.z) > 5) holder.scale.setScalar(0.001); // está en mm
  }

  holder.traverse((o) => {
    if ((o as Mesh).isMesh) (o as Mesh).material = BODY_MATERIAL;
  });

  holder.updateMatrixWorld(true);
  return holder;
}

/**
 * Jerarquía: root → [joint origin] → linkGroup → [visual origin] → mesh → hijos...
 */
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

    for (const child of link.children) {
      build(child.name, linkGroup, child.joint);
    }
  }

  build('g_base', root, { position: [0, 0, 0], rotation: [0, 0, 0] });
  root.updateMatrixWorld(true);
  return root;
}

function loadMesh(name: string): Promise<Object3D> {
  const url = `/models/${name}.${FORMAT}`;
  return new Promise((resolve, reject) => {
    if (FORMAT === 'dae') {
      new ColladaLoader().load(
        url,
        (collada) => (collada?.scene ? resolve(normalizeMesh(collada.scene as unknown as Object3D)) : reject(new Error(`No se pudo cargar ${url}`))),
        undefined,
        () => reject(new Error(`No se pudo cargar ${url}`))
      );
    } else {
      new GLTFLoader().load(
        url,
        (gltf) => (gltf?.scene ? resolve(normalizeMesh(gltf.scene)) : reject(new Error(`No se pudo cargar ${url}`))),
        undefined,
        () => reject(new Error(`No se pudo cargar ${url}`))
      );
    }
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
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm z-20 text-center p-6">
          <div className="max-w-md">
            <h3 className="text-red-400 font-semibold mb-2">Error cargando modelos</h3>
            <p className="text-sm text-slate-300">{error}</p>
          </div>
        </div>
      )}
      <div className="relative w-full h-full">
        <Canvas shadows camera={{ position: [0.7, 0.5, 0.8], fov: 45 }} className="w-full h-full">
          <ambientLight intensity={0.6} />
          <pointLight position={[1, 1, 1]} intensity={1} />
          <pointLight position={[-1, 1, -1]} intensity={0.5} />
          <Environment preset="city" />

          {/* Ejes de depuración (X rojo, Y verde, Z azul). Quítalo cuando todo se vea bien. */}
          <axesHelper args={[0.2]} />

          {robot && (
            // URDF es Z-up y three.js es Y-up → giramos el robot completo -90° en X.
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <primitive object={robot} dispose={null} />
            </group>
          )}

          <OrbitControls makeDefault enablePan={false} target={[0, 0.2, 0]} />
        </Canvas>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
            Ensamblando myCobot 280 Pi…
          </div>
        )}
      </div>
      <div className="absolute bottom-4 left-4 text-sm text-slate-400 z-10">
        myCobot 280 Pi — ensamblado (g_base → joint6_flange)
      </div>
    </div>
  );
}
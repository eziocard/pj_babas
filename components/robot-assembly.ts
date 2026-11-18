import { Box3, DoubleSide, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type Origin = { position: [number, number, number]; rotation: [number, number, number] };

export type LinkDef = {
  mesh: string;
  visual: Origin;
  children: Array<{ name: string; joint: Origin }>;
};

/**
 * Transformaciones del URDF oficial `mycobot_280_pi.urdf`, en el marco Z-up de ROS.
 * URDF: R = Rz(yaw)·Ry(pitch)·Rx(roll) → orden 'ZYX' en three.js.
 */
export const LINKS: Record<string, LinkDef> = {
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

/** 'GLB_IS_Y_UP' se conserva por claridad: los GLB incluyen Rx(-90°) en su nodo raíz. */
export const GLB_IS_Y_UP = true;

const BODY_MATERIAL = new MeshStandardMaterial({
  color: '#e8ecf1',
  metalness: 0.15,
  roughness: 0.55,
  side: DoubleSide,
});

export function applyOrigin(target: Object3D, origin: Origin): void {
  target.position.set(...origin.position);
  target.rotation.set(origin.rotation[0], origin.rotation[1], origin.rotation[2], 'ZYX');
  target.updateMatrixWorld();
}

/**
 * Deja cada GLB en el marco que el URDF espera: metros y Z-up.
 * Los GLB se exportaron desde DAE (Z-up) con una rotación Rx(-90°) en el nodo
 * raíz para cumplir con glTF (Y-up). Sin deshacerla, las origin del URDF se
 * aplican sobre un marco girado 90° y los eslabones quedan desfasados.
 */
export function normalizeMesh(raw: Object3D): Object3D {
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

export function loadMesh(name: string): Promise<Object3D> {
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

/** Jerarquía: root → [joint origin] → linkGroup → [visual origin] → mesh → hijos… */
export function buildRobot(models: Record<string, Object3D>, links: Record<string, LinkDef> = LINKS): Group {
  const root = new Group();

  function build(linkName: string, parent: Group, jointOffset: Origin): void {
    const link = links[linkName];
    if (!link) return;

    const linkGroup = new Group();
    linkGroup.name = linkName;
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

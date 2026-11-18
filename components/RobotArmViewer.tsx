'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box3, MathUtils, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import type { Group } from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { buildRobot, LINKS, loadMesh } from '@/components/robot-assembly';

export type JointName = 'joint1' | 'joint2' | 'joint3' | 'joint4' | 'joint5' | 'joint6';

/** Ángulos objetivo en grados. Acepta un objeto por articulación o un array [J1…J6]. */
export type JointAxes = Partial<Record<JointName, number>> | number[];

/** `speed` se expresa en grados por segundo. La promesa se resuelve al alcanzar el objetivo. */
export type MoveJoints = (axes: JointAxes, speed: number) => Promise<void>;

export type MoveJointsListener = (axes: JointAxes, speed: number) => void;

/** `free` permite orbitar sin restricciones; `surface` añade suelo y límite de altura. */
export type CameraMode = 'free' | 'surface';

export type RobotArmViewerHandle = {
  moveJoints: MoveJoints;
};

export type RobotArmViewerProps = {
  /** Notifica cada solicitud de movimiento; útil para sincronizar controles externos. */
  onMoveJoints?: MoveJointsListener;
  /** Modo de cámara. Por defecto, libre. */
  cameraMode?: CameraMode;
};

export const JOINT_NAMES: JointName[] = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6'];

/**
 * En el URDF, `joint1` es la carcasa fija del motor que descansa sobre `g_base`
 * (joint `g_base_to_joint1`, tipo `fixed`). El primer eje giratorio real es
 * `joint2`. Este mapa lleva los nombres de usuario J1…J6 a los grupos del URDF
 * que efectivamente deben rotar.
 */
const URDF_JOINT_GROUPS: Record<JointName, string> = {
  joint1: 'joint2',
  joint2: 'joint3',
  joint3: 'joint4',
  joint4: 'joint5',
  joint5: 'joint6',
  joint6: 'joint6_flange',
};

/** Rangos del manual del myCobot: J1–J5 ±165°, J6 ±175°. */
export const JOINT_LIMITS: Record<JointName, readonly [number, number]> = {
  joint1: [-165, 165],
  joint2: [-165, 165],
  joint3: [-165, 165],
  joint4: [-165, 165],
  joint5: [-165, 165],
  joint6: [-175, 175],
};

const DEFAULT_SPEED = 60;
const JOINT_AXIS = new Vector3(0, 0, 1);
const EPSILON = 0.001;

/** Fallback si aún no está cargada la base para medir su altura. */
const FLOOR_FALLBACK_Y = -0.07;
/** Margen mínimo entre la cámara y el suelo en modo superficie. */
const CAMERA_CLEARANCE = 0.02;
/** Punto alrededor del cual orbita la cámara. */
const CAMERA_TARGET = new Vector3(0, 0.2, 0);

type JointNode = { object: Object3D; baseQuaternion: Quaternion };
type JointNodes = Partial<Record<JointName, JointNode>>;
type JointValues = Record<JointName, number>;

type JointAnimatorProps = {
  robot: Group | null;
  onReady: (setTargets: MoveJoints | null) => void;
};

const zeroAngles = (): JointValues => ({
  joint1: 0,
  joint2: 0,
  joint3: 0,
  joint4: 0,
  joint5: 0,
  joint6: 0,
});

const normalizeSpeed = (value: number): number => (Number.isFinite(value) && value > 0 ? value : DEFAULT_SPEED);

/**
 * Vive dentro de Canvas. Mantiene el estado del movimiento y rota cada
 * articulación sobre su eje local sin alterar el origen del URDF ni a sus hijos.
 */
const JointAnimator = ({ robot, onReady }: JointAnimatorProps) => {
  const jointNodes = useRef<JointNodes>({});
  const currentAngles = useRef<JointValues>(zeroAngles());
  const targetAngles = useRef<JointValues>(zeroAngles());
  const speed = useRef<number>(DEFAULT_SPEED);
  const resolveMovement = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!robot) return;

    const nodes: JointNodes = {};
    for (const name of JOINT_NAMES) {
      const object = robot.getObjectByName(URDF_JOINT_GROUPS[name]);
      if (object) nodes[name] = { object, baseQuaternion: object.quaternion.clone() };
    }

    jointNodes.current = nodes;
    currentAngles.current = zeroAngles();
    targetAngles.current = zeroAngles();
    speed.current = DEFAULT_SPEED;
  }, [robot]);

  const applyAngle = useCallback((name: JointName, angleDeg: number): void => {
    const node = jointNodes.current[name];
    if (!node) return;

    const localRotation = new Quaternion().setFromAxisAngle(JOINT_AXIS, MathUtils.degToRad(angleDeg));
    node.object.quaternion.copy(node.baseQuaternion).multiply(localRotation);
  }, []);

  const setTargets = useCallback<MoveJoints>((axes, value) => {
    // Un comando nuevo reemplaza al anterior: se libera su promesa para no dejar
    // secuencias esperando indefinidamente.
    resolveMovement.current?.();
    resolveMovement.current = null;

    speed.current = normalizeSpeed(value);

    JOINT_NAMES.forEach((name, index) => {
      const angle = Array.isArray(axes) ? axes[index] : axes?.[name];
      if (typeof angle !== 'number' || !Number.isFinite(angle)) return;
      const [min, max] = JOINT_LIMITS[name];
      targetAngles.current[name] = MathUtils.clamp(angle, min, max);
    });

    return new Promise<void>((resolve) => {
      resolveMovement.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (!robot) return;

    onReady(setTargets);
    return () => {
      resolveMovement.current?.();
      resolveMovement.current = null;
      onReady(null);
    };
  }, [robot, onReady, setTargets]);

  useFrame((_, delta) => {
    const stepLimit = speed.current * delta;
    if (!Number.isFinite(stepLimit) || stepLimit <= 0) return;

    for (const name of JOINT_NAMES) {
      const difference = targetAngles.current[name] - currentAngles.current[name];
      if (Math.abs(difference) < EPSILON) continue;

      const step = MathUtils.clamp(difference, -stepLimit, stepLimit);
      const next = currentAngles.current[name] + step;
      currentAngles.current[name] = next;
      applyAngle(name, next);
    }

    const reached = JOINT_NAMES.every(
      (name) => Math.abs(targetAngles.current[name] - currentAngles.current[name]) < EPSILON
    );
    if (reached && resolveMovement.current) {
      const resolve = resolveMovement.current;
      resolveMovement.current = null;
      resolve();
    }
  });

  return null;
};

type SceneControlsProps = {
  mode: CameraMode;
  floorY: number;
};

/**
 * La altura de la cámara es `target.y + distancia * cos(polar)`. Calcular el
 * límite polar con la distancia actual permite acercarse a la base sin dejar
 * que la cámara atraviese el suelo al alejarse.
 */
const SceneControls = ({ mode, floorY }: SceneControlsProps) => {
  const camera = useThree((state) => state.camera);
  const [maxPolarAngle, setMaxPolarAngle] = useState(Math.PI);

  useFrame(() => {
    let next = Math.PI;
    if (mode === 'surface') {
      const distance = Math.max(camera.position.distanceTo(CAMERA_TARGET), 0.001);
      const cosLimit = (floorY + CAMERA_CLEARANCE - CAMERA_TARGET.y) / distance;
      next = Math.acos(MathUtils.clamp(cosLimit, -1, 1));
    }

    setMaxPolarAngle((current) => (Math.abs(current - next) > 0.001 ? next : current));
  }, -2);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      target={[CAMERA_TARGET.x, CAMERA_TARGET.y, CAMERA_TARGET.z]}
      maxPolarAngle={maxPolarAngle}
    />
  );
};

const RobotArmViewer = forwardRef<RobotArmViewerHandle, RobotArmViewerProps>(({ onMoveJoints, cameraMode = 'free' }, ref) => {
  const [models, setModels] = useState<Record<string, Object3D>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const animator = useRef<MoveJoints | null>(null);
  const pendingCommand = useRef<{ axes: JointAxes; speed: number; resolve: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const names = Object.values(LINKS).map((link) => link.mesh);

    Promise.all(names.map(loadMesh))
      .then((objs) => {
        if (cancelled) return;
        const next: Record<string, Object3D> = {};
        objs.forEach((obj, index) => (next[names[index]] = obj));
        setModels(next);
        setLoading(false);
      })
      .catch((err: Error) => {
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

  /**
   * El suelo se coloca en el punto más bajo de la malla de la base. Medimos solo
   * el visual de `g_base` (no toda su jerarquía) y lo devolvemos al marco Z-up
   * del robot; tras la rotación Rx(-90°), esa coordenada Z es la altura Y real.
   */
  const floorY = useMemo(() => {
    const base = robot?.getObjectByName('g_base');
    const baseVisual = base?.children.find((child) => child.name === '');
    if (!robot || !baseVisual) return FLOOR_FALLBACK_Y;

    robot.updateWorldMatrix(true, true);
    const toRobotSpace = new Matrix4().copy(robot.matrixWorld).invert();
    const box = new Box3().setFromObject(baseVisual).applyMatrix4(toRobotSpace);
    return box.isEmpty() ? FLOOR_FALLBACK_Y : box.min.z;
  }, [robot]);

  const handleAnimatorReady = useCallback((setTargets: MoveJoints | null): void => {
    animator.current = setTargets;
    if (!setTargets) return;

    const pending = pendingCommand.current;
    if (!pending) return;
    pendingCommand.current = null;
    void setTargets(pending.axes, pending.speed).then(pending.resolve);
  }, []);

  const moveJoints = useCallback<MoveJoints>(
    (axes, value) => {
      const safeSpeed = normalizeSpeed(value);
      onMoveJoints?.(axes, safeSpeed);

      if (animator.current) return animator.current(axes, safeSpeed);

      return new Promise<void>((resolve) => {
        pendingCommand.current = { axes, speed: safeSpeed, resolve };
      });
    },
    [onMoveJoints]
  );

  useImperativeHandle(ref, () => ({ moveJoints }), [moveJoints]);

  return (
    <div className="absolute inset-0 bg-shell text-ink">
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-shell/95 p-6 text-center backdrop-blur-sm">
          <div className="max-w-md">
            <h3 className="mb-2 font-semibold text-danger">Error cargando modelos</h3>
            <p className="text-sm text-ink/70">{error}</p>
          </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [0.7, 0.5, 0.8], fov: 45 }} className="h-full w-full">
        <ambientLight intensity={0.6} />
        <pointLight position={[1, 1, 1]} intensity={1} />
        <pointLight position={[-1, 1, -1]} intensity={0.5} />
        <Environment preset="city" />

        {cameraMode === 'surface' && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]} receiveShadow>
              <planeGeometry args={[8, 8]} />
              <meshStandardMaterial color="#111a20" roughness={0.95} metalness={0.05} />
            </mesh>
            <gridHelper args={[8, 32, '#3c525c', '#202d35']} position={[0, floorY + 0.002, 0]} />
          </>
        )}

        <JointAnimator robot={robot} onReady={handleAnimatorReady} />

        {robot && (
          // El robot se ensambla en Z-up (URDF); three.js espera Y-up.
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <primitive object={robot} dispose={null} />
          </group>
        )}

        <SceneControls mode={cameraMode} floorY={floorY} />
      </Canvas>

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-shell/85 font-mono text-xs tracking-wide text-ink/60 backdrop-blur-sm">
          Ensamblando myCobot 280 Pi…
        </div>
      )}

      <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2.5 font-mono text-[10px] tracking-wide text-ink/40">
        <span className="h-px w-6 bg-ink/25" aria-hidden="true" />
        myCobot 280 Pi · {cameraMode === 'surface' ? 'cámara sobre superficie' : 'cámara libre'}
      </div>
    </div>
  );
});

RobotArmViewer.displayName = 'RobotArmViewer';

export default RobotArmViewer;

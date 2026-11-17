'use client';

import { useEffect, useState, Suspense } from 'react';
import { Object3D } from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

function Joint4Model() {
  const [scene, setScene] = useState<Object3D | null>(null);

  useEffect(() => {
    const loader = new ColladaLoader();
    loader.load('/models/joint4.dae', (collada) => {
      if (collada) setScene(collada.scene as unknown as Object3D);
    });
  }, []);

  if (!scene) return null;
  return <primitive object={scene} dispose={null} />;
}

export default function Joint4Viewer() {
  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100">
      <Canvas shadows camera={{ position: [0, 0, 2.5], fov: 45 }} className="w-full h-full">
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, 10]} intensity={0.5} />
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Cargando joint4...</div>}>
          <Joint4Model />
        </Suspense>
        <OrbitControls makeDefault enablePan={false} />
      </Canvas>
      <div className="absolute bottom-4 left-4 text-sm text-slate-400">
        myCobot 280 Pi — Joint 4
      </div>
    </div>
  );
}

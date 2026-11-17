import { useState } from 'react';
import RobotArmViewer from '@/components/RobotArmViewer';
import TransformEditor from '@/components/TransformEditor';

type Mode = 'view' | 'edit';

export default function Home() {
  const [mode, setMode] = useState<Mode>('view');

  const handleModeChange = (next: Mode): void => {
    setMode(next);
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-950 text-slate-100">
      <div className="flex gap-1 p-4 border-b border-slate-800">
        <button
          onClick={() => handleModeChange('view')}
          aria-pressed={mode === 'view'}
          className={`px-3 py-2 text-sm rounded transition ${
            mode === 'view' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
        >
          Visor
        </button>
        <button
          onClick={() => handleModeChange('edit')}
          aria-pressed={mode === 'edit'}
          className={`px-3 py-2 text-sm rounded transition ${
            mode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
        >
          Editor de transformaciones
        </button>
      </div>

      {mode === 'view' ? <RobotArmViewer /> : <TransformEditor />}
    </div>
  );
}

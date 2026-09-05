import { Smartphone, Tv, Car } from 'lucide-react';

export type AndroidMode = 'mobile' | 'tv' | 'auto';

interface AndroidModeSelectorProps {
  currentMode: AndroidMode;
  onSelectMode: (mode: AndroidMode) => void;
  isFocused?: boolean;
}

export const AndroidModeSelector = ({
  currentMode,
  onSelectMode,
  isFocused,
}: AndroidModeSelectorProps) => {
  const modes = [
    { id: 'mobile' as AndroidMode, label: 'Móvil', icon: Smartphone, desc: 'Android PWA' },
    { id: 'tv' as AndroidMode, label: 'Android TV', icon: Tv, desc: 'Control D-Pad' },
    { id: 'auto' as AndroidMode, label: 'Android Auto', icon: Car, desc: 'Modo Coche' },
  ];

  return (
    <div
      id="android-mode-selector"
      className={`relative flex items-center gap-1 p-1 rounded-2xl bg-black/50 border transition-all ${
        isFocused ? 'border-white ring-2 ring-white/40' : 'border-white/10'
      }`}
    >
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = currentMode === m.id;
        return (
          <button
            key={m.id}
            id={`mode-btn-${m.id}`}
            onClick={() => onSelectMode(m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-white text-black font-semibold shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-white/5 font-medium'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};

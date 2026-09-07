import { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, X, RotateCcw, Volume2, Sparkles } from 'lucide-react';

export interface EqualizerBands {
  bass: number;       // Bajo (~100Hz) -12dB to +12dB
  mid: number;        // Medio (~500Hz) -12dB to +12dB
  intermediate: number;// Intermedio (~2500Hz) -12dB to +12dB
  treble: number;     // Agudo (~8000Hz) -12dB to +12dB
}

export const DEFAULT_EQ_BANDS: EqualizerBands = {
  bass: 0,
  mid: 0,
  intermediate: 0,
  treble: 0,
};

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bands: EqualizerBands;
  onChangeBand: (band: keyof EqualizerBands, value: number) => void;
  onReset: () => void;
  onApplyPreset: (preset: EqualizerBands) => void;
}

const PRESETS: { name: string; icon: string; bands: EqualizerBands }[] = [
  { name: 'Plano', icon: '⚖️', bands: { bass: 0, mid: 0, intermediate: 0, treble: 0 } },
  { name: 'Refuerzo Bajo', icon: '🔊', bands: { bass: 6, mid: 1, intermediate: 0, treble: 2 } },
  { name: 'Voz Clara', icon: '🎙️', bands: { bass: -2, mid: 4, intermediate: 3, treble: 1 } },
  { name: 'Cristal HD', icon: '✨', bands: { bass: 4, mid: -1, intermediate: 2, treble: 5 } },
];

export const EqualizerModal = ({
  isOpen,
  onClose,
  bands,
  onChangeBand,
  onReset,
  onApplyPreset,
}: EqualizerModalProps) => {
  const [focusedItem, setFocusedItem] = useState<string>('preset-0');

  const bandConfigs: { key: keyof EqualizerBands; label: string; freq: string; desc: string }[] = [
    { key: 'bass', label: 'Bajo', freq: '100 Hz', desc: 'Subgraves y pegada' },
    { key: 'mid', label: 'Medio', freq: '500 Hz', desc: 'Cuerpo instrumental' },
    { key: 'intermediate', label: 'Intermedio', freq: '2.5 kHz', desc: 'Presencia y voz' },
    { key: 'treble', label: 'Agudo', freq: '8.0 kHz', desc: 'Brillo y definición' },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    const code = e.keyCode || e.which;

    // Close on Escape or Android TV Back key (keyCode 4)
    if (e.key === 'Escape' || code === 27 || code === 4) {
      e.preventDefault();
      onClose();
      return;
    }

    const isUp = e.key === 'ArrowUp' || code === 19;
    const isDown = e.key === 'ArrowDown' || code === 20;
    const isLeft = e.key === 'ArrowLeft' || code === 21;
    const isRight = e.key === 'ArrowRight' || code === 22;
    const isEnter = e.key === 'Enter' || e.key === ' ' || code === 23 || code === 66;

    if (isEnter) {
      e.preventDefault();
      if (focusedItem.startsWith('preset-')) {
        const idx = parseInt(focusedItem.replace('preset-', ''), 10);
        if (PRESETS[idx]) onApplyPreset(PRESETS[idx].bands);
      } else if (focusedItem === 'eq-reset') {
        onReset();
      } else if (focusedItem === 'eq-done' || focusedItem === 'eq-close') {
        onClose();
      }
      return;
    }

    if (isLeft || isRight) {
      // If on a frequency band, adjust dB with Left/Right
      if (focusedItem.startsWith('band-')) {
        e.preventDefault();
        const bandKey = focusedItem.replace('band-', '') as keyof EqualizerBands;
        const currentVal = bands[bandKey] ?? 0;
        const delta = isLeft ? -1 : 1;
        const nextVal = Math.min(12, Math.max(-12, Number((currentVal + delta).toFixed(1))));
        onChangeBand(bandKey, nextVal);
        return;
      }

      // If on presets row, navigate horizontally
      if (focusedItem.startsWith('preset-') || focusedItem === 'eq-reset') {
        e.preventDefault();
        setFocusedItem((cur) => {
          if (isRight) {
            if (cur === 'preset-0') return 'preset-1';
            if (cur === 'preset-1') return 'preset-2';
            if (cur === 'preset-2') return 'preset-3';
            if (cur === 'preset-3') return 'eq-reset';
            return cur;
          } else {
            if (cur === 'eq-reset') return 'preset-3';
            if (cur === 'preset-3') return 'preset-2';
            if (cur === 'preset-2') return 'preset-1';
            if (cur === 'preset-1') return 'preset-0';
            return cur;
          }
        });
        return;
      }
    }

    if (isDown) {
      e.preventDefault();
      setFocusedItem((cur) => {
        if (cur.startsWith('preset-') || cur === 'eq-reset') return 'band-bass';
        if (cur === 'band-bass') return 'band-mid';
        if (cur === 'band-mid') return 'band-intermediate';
        if (cur === 'band-intermediate') return 'band-treble';
        if (cur === 'band-treble') return 'eq-done';
        return cur;
      });
      return;
    }

    if (isUp) {
      e.preventDefault();
      setFocusedItem((cur) => {
        if (cur === 'eq-done') return 'band-treble';
        if (cur === 'band-treble') return 'band-intermediate';
        if (cur === 'band-intermediate') return 'band-mid';
        if (cur === 'band-mid') return 'band-bass';
        if (cur === 'band-bass') return 'preset-0';
        return cur;
      });
      return;
    }
  }, [isOpen, focusedItem, bands, onChangeBand, onApplyPreset, onReset, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 landscape:p-2 animate-in fade-in duration-200 overflow-hidden">
      <div
        className="w-full max-w-md landscape:max-w-2xl sm:max-w-xl max-h-[96vh] flex flex-col rounded-2xl sm:rounded-3xl glass-surface border border-white/20 p-3.5 sm:p-5 landscape:p-3.5 text-white shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular sheen */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        {/* Header - Compact on landscape */}
        <div className="flex items-center justify-between mb-2.5 landscape:mb-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 text-white shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Ecualizador de Audio
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  4 BANDAS
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block landscape:hidden md:landscape:block">
                Ajuste fino de frecuencias • Control con mando [◄ ►] [▲ ▼]
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            onMouseEnter={() => setFocusedItem('eq-close')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              focusedItem === 'eq-close'
                ? 'bg-white text-black ring-2 ring-white scale-110'
                : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-2.5 landscape:space-y-2 my-1">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Perfiles Rápidos
              </span>
              <button
                onClick={onReset}
                onMouseEnter={() => setFocusedItem('eq-reset')}
                className={`text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer px-2 py-0.5 rounded-lg ${
                  focusedItem === 'eq-reset'
                    ? 'ring-2 ring-white bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Restablecer todas las bandas a 0 dB"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {PRESETS.map((p, index) => {
                const isFocused = focusedItem === `preset-${index}`;
                return (
                  <button
                    key={p.name}
                    onClick={() => onApplyPreset(p.bands)}
                    onMouseEnter={() => setFocusedItem(`preset-${index}`)}
                    className={`px-1.5 py-1.5 rounded-xl border text-center transition-all active:scale-95 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                      isFocused
                        ? 'border-emerald-400 ring-2 ring-emerald-400/80 bg-emerald-500/30 text-white font-bold scale-105 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'
                    }`}
                  >
                    <span className="text-xs">{p.icon}</span>
                    <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Frequency Bands Sliders */}
          <div className="grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
            {bandConfigs.map(({ key, label, freq, desc }) => {
              const val = bands[key];
              const formattedVal = val > 0 ? `+${val.toFixed(1)} dB` : `${val.toFixed(1)} dB`;
              const isFocused = focusedItem === `band-${key}`;

              return (
                <div
                  key={key}
                  onMouseEnter={() => setFocusedItem(`band-${key}`)}
                  className={`p-2.5 sm:p-3 rounded-xl transition-all duration-75 flex flex-col gap-1.5 ${
                    isFocused
                      ? 'bg-emerald-950/30 border-2 border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-black/40 border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs tracking-wide">{label}</span>
                      <span className="text-[9px] font-mono text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {freq}
                      </span>
                      <span className="text-[9px] text-neutral-500 hidden xl:inline">
                        ({desc})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isFocused && (
                        <span className="text-[9px] font-mono text-emerald-400/80 animate-pulse">
                          ◄ ►
                        </span>
                      )}
                      <span
                        className={`font-mono text-xs font-bold ${
                          val > 0
                            ? 'text-emerald-400'
                            : val < 0
                            ? 'text-rose-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {formattedVal}
                      </span>
                    </div>
                  </div>

                  {/* Range Slider & Remote Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onChangeBand(key, Math.max(-12, Number((val - 1).toFixed(1))))}
                      className="w-5 h-5 rounded bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white text-[10px] font-mono flex items-center justify-center cursor-pointer"
                      title="Bajar 1 dB"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={val}
                      onChange={(e) => onChangeBand(key, parseFloat(e.target.value))}
                      className="flex-1 accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer transition-all focus:outline-none"
                      aria-label={`${label} ${freq}`}
                    />
                    <button
                      onClick={() => onChangeBand(key, Math.min(12, Number((val + 1).toFixed(1))))}
                      className="w-5 h-5 rounded bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white text-[10px] font-mono flex items-center justify-center cursor-pointer"
                      title="Subir 1 dB"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Status / Close */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-400">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filtros Biquad activos</span>
          </div>

          <button
            id="eq-done-btn"
            onClick={onClose}
            onMouseEnter={() => setFocusedItem('eq-done')}
            className={`px-5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              focusedItem === 'eq-done'
                ? 'bg-white text-black ring-4 ring-white/80 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.6)]'
                : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-neutral-200'
            }`}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

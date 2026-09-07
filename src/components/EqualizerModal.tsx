import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SlidersHorizontal, X, RotateCcw, Volume2, Sparkles } from 'lucide-react';

export interface EqualizerBands {
  bass: number;        // Bajo (~100Hz) -12dB to +12dB
  mid: number;         // Medio (~500Hz) -12dB to +12dB
  intermediate: number;// Intermedio / Voz (~2500Hz) -12dB to +12dB
  treble: number;      // Agudo (~8000Hz) -12dB to +12dB
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

const BAND_CONFIGS: {
  key: keyof EqualizerBands;
  label: string;
  freq: string;
  desc: string;
}[] = [
  { key: 'bass', label: 'Bajo', freq: '100 Hz', desc: 'Graves y pegada' },
  { key: 'mid', label: 'Medio', freq: '500 Hz', desc: 'Cuerpo' },
  { key: 'intermediate', label: 'Voz', freq: '2.5 kHz', desc: 'Presencia vocal' },
  { key: 'treble', label: 'Agudo', freq: '8.0 kHz', desc: 'Brillo y aire' },
];

interface VerticalFaderProps {
  bandKey: keyof EqualizerBands;
  label: string;
  freq: string;
  desc: string;
  value: number;
  isFocused: boolean;
  onChange: (val: number) => void;
  onSelect: () => void;
}

const VerticalFader: React.FC<VerticalFaderProps> = ({
  label,
  freq,
  value,
  isFocused,
  onChange,
  onSelect,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Normalize: -12 to +12 dB -> 0% to 100%
  const percent = Math.max(0, Math.min(100, ((value + 12) / 24) * 100));

  const updateFromPointer = (clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(rect.height, relY));
    const fraction = 1 - clampedY / rect.height; // 0 at bottom, 1 at top
    const rawVal = fraction * 24 - 12;
    const snapped = Math.round(rawVal * 2) / 2; // 0.5 dB steps
    onChange(Math.max(-12, Math.min(12, snapped)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    onSelect();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if pointer capture not supported
    }
    updateFromPointer(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    e.preventDefault();
    updateFromPointer(e.clientY);
  };

  const formattedVal = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);

  return (
    <div
      onMouseEnter={onSelect}
      className={`flex flex-col items-center justify-between rounded-2xl p-2 transition-all duration-100 select-none ${
        isFocused
          ? 'bg-emerald-950/40 border-2 border-emerald-400 ring-2 ring-emerald-400/60 scale-[1.03] shadow-[0_0_20px_rgba(16,185,129,0.35)]'
          : 'bg-black/40 border border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Header: Label, Freq & dB */}
      <div className="w-full flex flex-col items-center text-center">
        <span className="font-bold text-xs uppercase tracking-wider text-white">
          {label}
        </span>
        <span className="text-[9px] font-mono text-neutral-400">
          {freq}
        </span>

        {/* Current dB badge */}
        <div
          className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
            isFocused
              ? 'bg-emerald-400 text-black shadow-sm'
              : value > 0
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : value < 0
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-white/5 text-neutral-400 border border-white/5'
          }`}
        >
          {formattedVal} dB
        </div>
      </div>

      {/* Up Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          onChange(Math.min(12, Number((value + 1).toFixed(1))));
        }}
        className="my-1.5 w-7 h-6 rounded-md bg-white/5 hover:bg-white/15 active:scale-95 text-neutral-300 hover:text-white text-xs font-bold font-mono flex items-center justify-center cursor-pointer transition-colors"
        title="Subir +1 dB"
      >
        ▲
      </button>

      {/* Vertical Slider Track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative w-8 h-28 sm:h-32 flex items-center justify-center cursor-pointer touch-none"
      >
        {/* Track Groove */}
        <div className="absolute inset-y-0 w-2 rounded-full bg-neutral-900 border border-white/15 overflow-hidden">
          {/* Zero dB reference center line indicator */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/40 z-10" />

          {/* Active Level Fill from center (0 dB) */}
          {value >= 0 ? (
            <div
              className="absolute left-0 right-0 bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-75"
              style={{
                bottom: '50%',
                height: `${Math.max(0, percent - 50)}%`,
              }}
            />
          ) : (
            <div
              className="absolute left-0 right-0 bg-gradient-to-b from-rose-600 to-rose-400 transition-all duration-75"
              style={{
                top: '50%',
                height: `${Math.max(0, 50 - percent)}%`,
              }}
            />
          )}
        </div>

        {/* Level Scale Ticks (Left & Right) */}
        <div className="absolute inset-y-0 left-0 flex flex-col justify-between pointer-events-none py-1 text-[8px] font-mono text-neutral-600">
          <span>+</span>
          <span>0</span>
          <span>-</span>
        </div>

        {/* Fader Knob (Deslizador) */}
        <div
          className={`absolute w-7 h-4 rounded shadow-md flex items-center justify-center border transition-all duration-75 pointer-events-none z-20 ${
            isFocused
              ? 'bg-gradient-to-b from-white to-emerald-200 border-emerald-300 ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
              : 'bg-gradient-to-b from-neutral-200 to-neutral-400 border-white/60 shadow-black/60'
          }`}
          style={{
            bottom: `calc(${percent}% - 8px)`,
          }}
        >
          {/* Center LED notch line */}
          <div
            className={`w-3.5 h-[2px] rounded-full ${
              isFocused ? 'bg-emerald-600' : 'bg-neutral-700'
            }`}
          />
        </div>
      </div>

      {/* Down Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          onChange(Math.max(-12, Number((value - 1).toFixed(1))));
        }}
        className="my-1.5 w-7 h-6 rounded-md bg-white/5 hover:bg-white/15 active:scale-95 text-neutral-300 hover:text-white text-xs font-bold font-mono flex items-center justify-center cursor-pointer transition-colors"
        title="Bajar -1 dB"
      >
        ▼
      </button>

      {/* Remote Helper Hint */}
      {isFocused && (
        <span className="text-[9px] font-mono font-bold text-emerald-400 animate-pulse tracking-tighter">
          [▲▼ dB]
        </span>
      )}
    </div>
  );
};

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  bands,
  onChangeBand,
  onReset,
  onApplyPreset,
}) => {
  // Navigation state for D-Pad / Remote control
  const [focusedItem, setFocusedItem] = useState<string>('band-bass');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      const code = e.keyCode || e.which;

      // Close on Escape or Android TV Back key (code 4)
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

      // ENTER key handling
      if (isEnter) {
        e.preventDefault();
        if (focusedItem.startsWith('preset-')) {
          const idx = parseInt(focusedItem.replace('preset-', ''), 10);
          if (PRESETS[idx]) onApplyPreset(PRESETS[idx].bands);
        } else if (focusedItem === 'eq-reset') {
          onReset();
        } else if (focusedItem === 'eq-done' || focusedItem === 'eq-close') {
          onClose();
        } else if (focusedItem.startsWith('band-')) {
          // Pressing enter on a band moves focus to Listo for immediate exit
          setFocusedItem('eq-done');
        }
        return;
      }

      // If focused on one of the 4 Vertical Bands:
      if (focusedItem.startsWith('band-')) {
        const bandKey = focusedItem.replace('band-', '') as keyof EqualizerBands;
        const currentVal = bands[bandKey] ?? 0;

        // UP: Increase level (+1 dB)
        if (isUp) {
          e.preventDefault();
          onChangeBand(bandKey, Math.min(12, Number((currentVal + 1).toFixed(1))));
          return;
        }

        // DOWN: Decrease level (-1 dB)
        if (isDown) {
          e.preventDefault();
          onChangeBand(bandKey, Math.max(-12, Number((currentVal - 1).toFixed(1))));
          return;
        }

        // LEFT: Switch to previous band (or go to presets)
        if (isLeft) {
          e.preventDefault();
          setFocusedItem((cur) => {
            if (cur === 'band-treble') return 'band-intermediate';
            if (cur === 'band-intermediate') return 'band-mid';
            if (cur === 'band-mid') return 'band-bass';
            if (cur === 'band-bass') return 'preset-0';
            return cur;
          });
          return;
        }

        // RIGHT: Switch to next band (or go to Listo)
        if (isRight) {
          e.preventDefault();
          setFocusedItem((cur) => {
            if (cur === 'band-bass') return 'band-mid';
            if (cur === 'band-mid') return 'band-intermediate';
            if (cur === 'band-intermediate') return 'band-treble';
            if (cur === 'band-treble') return 'eq-done';
            return cur;
          });
          return;
        }
      }

      // If focused on Presets row or Reset:
      if (focusedItem.startsWith('preset-') || focusedItem === 'eq-reset') {
        if (isRight) {
          e.preventDefault();
          setFocusedItem((cur) => {
            if (cur === 'preset-0') return 'preset-1';
            if (cur === 'preset-1') return 'preset-2';
            if (cur === 'preset-2') return 'preset-3';
            if (cur === 'preset-3') return 'eq-reset';
            return cur;
          });
          return;
        }
        if (isLeft) {
          e.preventDefault();
          setFocusedItem((cur) => {
            if (cur === 'eq-reset') return 'preset-3';
            if (cur === 'preset-3') return 'preset-2';
            if (cur === 'preset-2') return 'preset-1';
            if (cur === 'preset-1') return 'preset-0';
            return cur;
          });
          return;
        }
        if (isDown) {
          e.preventDefault();
          setFocusedItem('band-bass');
          return;
        }
      }

      // If focused on Listo button:
      if (focusedItem === 'eq-done') {
        if (isLeft || isUp) {
          e.preventDefault();
          setFocusedItem('band-treble');
          return;
        }
      }
    },
    [isOpen, focusedItem, bands, onChangeBand, onApplyPreset, onReset, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isPresetActive = (pBands: EqualizerBands) => {
    return (
      bands.bass === pBands.bass &&
      bands.mid === pBands.mid &&
      bands.intermediate === pBands.intermediate &&
      bands.treble === pBands.treble
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg sm:max-w-xl landscape:max-w-xl rounded-2xl sm:rounded-3xl glass-surface border border-white/20 p-3 sm:p-4 text-white shadow-2xl relative overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular sheen */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        {/* 1. Header (Compact) */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/15 text-white shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Ecualizador Gráfico
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                4 BANDAS HD
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            onMouseEnter={() => setFocusedItem('eq-close')}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              focusedItem === 'eq-close'
                ? 'bg-white text-black ring-2 ring-white scale-110'
                : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Quick Presets Row (Horizontally compact) */}
        <div className="flex items-center justify-between gap-1.5 pb-2.5 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 flex items-center gap-1 mr-1 shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              Perfiles:
            </span>
            {PRESETS.map((p, index) => {
              const isFocused = focusedItem === `preset-${index}`;
              const active = isPresetActive(p.bands);
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => onApplyPreset(p.bands)}
                  onMouseEnter={() => setFocusedItem(`preset-${index}`)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                    isFocused
                      ? 'bg-emerald-400 text-black ring-2 ring-white font-bold scale-105 shadow-md'
                      : active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                  }`}
                >
                  <span className="text-[10px]">{p.icon}</span>
                  <span className="text-[10px] whitespace-nowrap">{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            onMouseEnter={() => setFocusedItem('eq-reset')}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
              focusedItem === 'eq-reset'
                ? 'ring-2 ring-white bg-white text-black font-bold'
                : 'text-neutral-400 hover:text-white bg-white/5 border border-white/5'
            }`}
            title="Restablecer todas las bandas a 0 dB"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>0 dB</span>
          </button>
        </div>

        {/* 3. The 4 Vertical Equalizer Bands (Always fits without scroll) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 py-1 shrink-0">
          {BAND_CONFIGS.map((config) => {
            const isFocused = focusedItem === `band-${config.key}`;
            return (
              <VerticalFader
                key={config.key}
                bandKey={config.key}
                label={config.label}
                freq={config.freq}
                desc={config.desc}
                value={bands[config.key]}
                isFocused={isFocused}
                onChange={(val) => onChangeBand(config.key, val)}
                onSelect={() => setFocusedItem(`band-${config.key}`)}
              />
            );
          })}
        </div>

        {/* 4. Footer Bar: Status, Remote Navigation Legend & Done Button */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Mando TV:</span>
            <span className="font-mono text-[9px] text-neutral-400">
              [▲▼] Ajustar dB • [◄►] Cambiar banda
            </span>
          </div>

          <button
            id="eq-done-btn"
            type="button"
            onClick={onClose}
            onMouseEnter={() => setFocusedItem('eq-done')}
            className={`px-5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              focusedItem === 'eq-done'
                ? 'bg-white text-black ring-4 ring-white/80 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.6)]'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

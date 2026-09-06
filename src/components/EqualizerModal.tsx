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
  if (!isOpen) return null;

  const bandConfigs: { key: keyof EqualizerBands; label: string; freq: string; desc: string; color: string }[] = [
    { key: 'bass', label: 'Bajo', freq: '100 Hz', desc: 'Subgraves y pegada', color: 'from-emerald-500 to-emerald-400' },
    { key: 'mid', label: 'Medio', freq: '500 Hz', desc: 'Cuerpo instrumental', color: 'from-cyan-500 to-cyan-400' },
    { key: 'intermediate', label: 'Intermedio', freq: '2.5 kHz', desc: 'Presencia y voz', color: 'from-amber-500 to-amber-400' },
    { key: 'treble', label: 'Agudo', freq: '8.0 kHz', desc: 'Brillo y definición', color: 'from-orange-500 to-rose-400' },
  ];

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
                Ajuste fino de frecuencias en tiempo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
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
                className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Restablecer todas las bandas a 0 dB"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => onApplyPreset(p.bands)}
                  className="px-1.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all active:scale-95 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1"
                >
                  <span className="text-xs">{p.icon}</span>
                  <span className="text-[10px] font-semibold text-neutral-200 tracking-tight whitespace-nowrap">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4 Frequency Bands Sliders - 2 columns on landscape/tablets, 1 column on narrow portrait */}
          <div className="grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
            {bandConfigs.map(({ key, label, freq, desc }) => {
              const val = bands[key];
              const formattedVal = val > 0 ? `+${val.toFixed(1)} dB` : `${val.toFixed(1)} dB`;
              return (
                <div
                  key={key}
                  className="p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1.5"
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

                  {/* Range Slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-neutral-500 w-6 text-right">-12</span>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={val}
                      onChange={(e) => onChangeBand(key, parseFloat(e.target.value))}
                      className="flex-1 accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
                      aria-label={`${label} ${freq}`}
                    />
                    <span className="text-[8px] font-mono text-neutral-500 w-6">+12</span>
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
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white text-black font-bold text-xs shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-neutral-200 transition-all cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

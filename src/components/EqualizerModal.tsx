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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl glass-surface border border-white/20 p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular sheen */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-white">
              <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Ecualizador de Audio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  4 BANDAS
                </span>
              </div>
              <p className="text-xs text-neutral-400">
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

        {/* Quick Presets */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
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
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => onApplyPreset(p.bands)}
                className="px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span className="text-xs">{p.icon}</span>
                <span className="text-[10px] font-semibold text-neutral-200 tracking-tight">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 4 Frequency Bands Sliders */}
        <div className="space-y-4 mb-6">
          {bandConfigs.map(({ key, label, freq, desc }) => {
            const val = bands[key];
            const formattedVal = val > 0 ? `+${val.toFixed(1)} dB` : `${val.toFixed(1)} dB`;
            return (
              <div
                key={key}
                className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tracking-wide">{label}</span>
                    <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      {freq}
                    </span>
                    <span className="text-[10px] text-neutral-500 hidden sm:inline">
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
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono text-neutral-500 w-8 text-right">-12dB</span>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={val}
                    onChange={(e) => onChangeBand(key, parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer transition-all"
                  />
                  <span className="text-[9px] font-mono text-neutral-500 w-8">+12dB</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Status / Close */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filtros Biquad activos</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-neutral-200 transition-all cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

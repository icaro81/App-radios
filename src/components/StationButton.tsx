import { RadioStation, PlayerStatus } from '../types';
import { Radio, Play, Pause, Loader2, Signal, Trash2 } from 'lucide-react';

interface StationButtonProps {
  key?: string;
  station: RadioStation;
  isActive: boolean;
  playerStatus: PlayerStatus;
  onSelect: (station: RadioStation) => void;
  onRemove?: (id: string) => void;
}

export const StationButton = ({
  station,
  isActive,
  playerStatus,
  onSelect,
  onRemove,
}: StationButtonProps) => {
  const isPlayingThis = isActive && playerStatus === 'playing';
  const isLoadingThis = isActive && playerStatus === 'loading';

  return (
    <div className="relative group/wrapper">
      <button
        id={`station-btn-${station.id}`}
        onClick={() => onSelect(station)}
        className={`group relative w-full text-left rounded-2xl p-4 sm:p-5 transition-all duration-300 ease-out overflow-hidden select-none cursor-pointer ${
          isActive
            ? 'glass-button-active border border-white/30 text-white'
            : 'glass-button border border-white/10 text-neutral-300 hover:text-white hover:border-white/20'
        }`}
      >
        {/* Specular Diagonal Reflection Sheen */}
        <div className="absolute inset-0 pointer-events-none glass-sheen opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top bevel glass highlight line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Internal ambient corner gloss */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:bg-white/10 transition-colors" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Circular Glass Icon Holder */}
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] border border-white/30'
                  : 'bg-white/5 text-neutral-400 group-hover:bg-white/10 group-hover:text-white border border-white/5'
              }`}
            >
              {isLoadingThis ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : isPlayingThis ? (
                <Signal className="w-5 h-5 text-white animate-pulse" />
              ) : (
                <Radio className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" />
              )}
            </div>

            {/* Station Metadata */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base tracking-tight truncate text-white">
                  {station.name}
                </span>
                {station.badge && (
                  <span className="px-2 py-0.5 text-[9px] uppercase font-mono tracking-widest bg-white/10 text-neutral-300 rounded-full border border-white/10">
                    {station.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 truncate mt-0.5 font-light">
                {isLoadingThis
                  ? 'Sintonizando...'
                  : isPlayingThis
                  ? 'En directo'
                  : station.subtitle || 'Transmisión Online'}
              </p>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Play/Pause state mini button */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isPlayingThis
                  ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'bg-white/10 text-white group-hover:bg-white/20 border border-white/10'
              }`}
            >
              {isPlayingThis ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </div>
          </div>
        </div>

        {/* Active bottom ambient indicator bar */}
        {isActive && (
          <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        )}
      </button>

      {/* Delete custom button */}
      {station.isCustom && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(station.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg opacity-0 group-hover/wrapper:opacity-100 transition-opacity hover:scale-110 z-20 cursor-pointer"
          title="Eliminar esta estación"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

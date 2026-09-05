import { RadioStation, PlayerStatus } from '../types';
import { Play, Pause, Radio, RotateCw, Volume2, VolumeX, ShieldCheck } from 'lucide-react';

interface AndroidAutoViewProps {
  currentStation: RadioStation;
  stations: RadioStation[];
  playerStatus: PlayerStatus;
  volume: number;
  isMuted: boolean;
  onPlayStation: (station: RadioStation) => void;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onSwitchStation: () => void;
}

export const AndroidAutoView = ({
  currentStation,
  stations,
  playerStatus,
  volume,
  isMuted,
  onPlayStation,
  onTogglePlayPause,
  onToggleMute,
  onSwitchStation,
}: AndroidAutoViewProps) => {
  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[580px] p-4 sm:p-8">
      {/* Driving Safety Top Banner */}
      <div className="w-full flex items-center justify-between bg-black/40 border border-white/10 px-5 py-3 rounded-2xl mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-300">
            MODO ANDROID AUTO • VINCULADO AL COCHE
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Controles del volante activos</span>
        </div>
      </div>

      {/* Main Big Display for In-Car Glanceability */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Huge Station Quick Buttons */}
        <div className="md:col-span-6 flex flex-col gap-4">
          <div className="text-xs font-bold tracking-widest text-neutral-400 uppercase px-1">
            ESTACIONES RÁPIDAS
          </div>
          {stations.map((st) => {
            const isThisActive = currentStation.id === st.id;
            return (
              <button
                key={st.id}
                onClick={() => onPlayStation(st)}
                className={`relative w-full min-h-[96px] sm:min-h-[110px] rounded-3xl p-5 flex items-center justify-between border-2 transition-all duration-200 cursor-pointer text-left select-none ${
                  isThisActive
                    ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.35)]'
                    : 'bg-neutral-900/90 text-white border-white/15 hover:border-white/40 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      isThisActive ? 'bg-black text-white' : 'bg-white/10 text-white'
                    }`}
                  >
                    <Radio className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      {st.name}
                    </h2>
                    <p
                      className={`text-xs sm:text-sm font-medium ${
                        isThisActive ? 'text-neutral-700' : 'text-neutral-400'
                      }`}
                    >
                      {isThisActive && isPlaying
                        ? 'En directo ahora'
                        : isThisActive && isLoading
                        ? 'Conectando audio...'
                        : st.badge || 'Online HD'}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isThisActive ? 'bg-black text-white' : 'bg-white/10 text-white'
                  }`}
                >
                  {isThisActive && isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Giant Master Car Media Controls */}
        <div className="md:col-span-6 flex flex-col items-center justify-center glass-surface border border-white/15 rounded-3xl p-8 min-h-[280px]">
          <div className="text-center mb-6">
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
              {isPlaying ? 'REPRODUCIENDO EN EL VEHÍCULO' : isLoading ? 'SINTONIZANDO...' : 'EN PAUSA'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {currentStation.name}
            </h3>
          </div>

          {/* Huge Controls Row */}
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            <button
              onClick={onSwitchStation}
              title="Cambiar estación"
              className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <Radio className="w-7 h-7" />
            </button>

            <button
              onClick={onTogglePlayPause}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                isPlaying
                  ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.4)]'
                  : 'bg-white/10 text-white border-2 border-white/30 hover:border-white shadow-2xl'
              }`}
            >
              {isLoading ? (
                <RotateCw className="w-10 h-10 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-12 h-12 fill-current" />
              ) : (
                <Play className="w-12 h-12 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={onToggleMute}
              title="Silenciar"
              className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-7 h-7 text-neutral-400" />
              ) : (
                <Volume2 className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

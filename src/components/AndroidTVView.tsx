import { RadioStation, PlayerStatus } from '../types';
import { Visualizer } from './Visualizer';
import { Play, Pause, RotateCw, Volume2, VolumeX, Tv, Plus, Trash2 } from 'lucide-react';

interface AndroidTVViewProps {
  currentStation: RadioStation;
  stations: RadioStation[];
  playerStatus: PlayerStatus;
  volume: number;
  isMuted: boolean;
  focusedElement: string;
  analyser?: AnalyserNode | null;
  onPlayStation: (station: RadioStation) => void;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onSwitchStation: () => void;
  onSetFocus: (target: string) => void;
  onOpenAddModal: () => void;
  onRemoveCustomStation: (id: string) => void;
}

export const AndroidTVView = ({
  currentStation,
  stations,
  playerStatus,
  volume,
  isMuted,
  focusedElement,
  analyser,
  onPlayStation,
  onTogglePlayPause,
  onToggleMute,
  onSwitchStation,
  onSetFocus,
  onOpenAddModal,
  onRemoveCustomStation,
}: AndroidTVViewProps) => {
  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-between min-h-[580px] p-4 sm:p-8 select-none">
      {/* TV Header with remote indicator */}
      <div className="w-full flex items-center justify-between bg-black/60 border border-white/10 px-6 py-3.5 rounded-2xl mb-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              RADIO CRISTAL HD • MODO ANDROID TV
            </h2>
            <p className="text-xs text-neutral-400">
              Navega con las flechas del mando y presiona OK / Centro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl text-neutral-300">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
          {isPlaying ? 'TRANSMITIENDO EN VIVO' : 'EN ESPERA'}
        </div>
      </div>

      {/* Main TV Horizontal Stage */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Massive Glass OLED Display with Visualizer */}
        <div className="lg:col-span-7 glass-surface border border-white/15 rounded-3xl p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Specular HD Reflection */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-neutral-300 border border-white/10">
                {currentStation.badge || 'ESTÉREO HD'}
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {isPlaying ? '● EN DIRECTO' : isLoading ? '● CONECTANDO...' : '○ EN PAUSA'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight my-2 drop-shadow-md">
              {currentStation.name}
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 font-light">
              {currentStation.subtitle || 'Emisión en vivo sin interrupciones'}
            </p>
          </div>

          <div className="py-4">
            <Visualizer isPlaying={isPlaying} isLoading={isLoading} analyser={analyser} />
          </div>

          {/* Master TV Remote Action Controls */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5">
            <button
              id="tv-switch-btn"
              onClick={onSwitchStation}
              onMouseEnter={() => onSetFocus('prev-station')}
              className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                focusedElement === 'prev-station'
                  ? 'border-white bg-white text-black scale-110 ring-4 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.8)]'
                  : 'border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              <RotateCw className="w-5 h-5" />
              <span className="text-[9px] font-mono mt-0.5">CAMBIAR</span>
            </button>

            <button
              id="tv-play-btn"
              onClick={onTogglePlayPause}
              onMouseEnter={() => onSetFocus('play-pause')}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all cursor-pointer ${
                focusedElement === 'play-pause'
                  ? 'ring-4 ring-white scale-110 shadow-[0_0_40px_rgba(255,255,255,0.9)] bg-white text-black font-extrabold'
                  : isPlaying
                  ? 'bg-white/90 text-black'
                  : 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
              }`}
            >
              {isLoading ? (
                <RotateCw className="w-8 h-8 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-9 h-9 fill-current" />
              ) : (
                <Play className="w-9 h-9 fill-current ml-1" />
              )}
            </button>

            <button
              id="tv-mute-btn"
              onClick={onToggleMute}
              onMouseEnter={() => onSetFocus('mute')}
              className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                focusedElement === 'mute'
                  ? 'border-white bg-white text-black scale-110 ring-4 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.8)]'
                  : 'border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              <span className="text-[9px] font-mono mt-0.5">AUDIO</span>
            </button>
          </div>
        </div>

        {/* Right Side: Stations List with Remote Focus Rings */}
        <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
              SINTONÍAS DISPONIBLES
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              Usa ↑ ↓ y presiona OK
            </span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
            {stations.map((st) => {
              const isThisActive = currentStation.id === st.id;
              const isTargetFocused = focusedElement === `station-${st.id}`;

              return (
                <div
                  key={st.id}
                  onClick={() => onPlayStation(st)}
                  onMouseEnter={() => onSetFocus(`station-${st.id}`)}
                  className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    isTargetFocused
                      ? 'border-white ring-4 ring-white/60 scale-[1.03] bg-white/20 shadow-[0_0_25px_rgba(255,255,255,0.4)]'
                      : isThisActive
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-white/10 bg-black/40 hover:bg-white/5'
                  }`}
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10">
                        {st.badge || 'RADIO'}
                      </span>
                      {isThisActive && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          ● SONANDO
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-white tracking-wide">
                      {st.name}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">
                      {st.subtitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {st.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCustomStation(st.id);
                        }}
                        className="p-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isThisActive && isPlaying && (
                      <div className="flex items-center gap-0.5 h-4">
                        <span className="w-1 bg-emerald-400 animate-pulse h-4" />
                        <span className="w-1 bg-emerald-400 animate-pulse h-2" />
                        <span className="w-1 bg-emerald-400 animate-pulse h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Custom Station Remote Button */}
            <button
              id="tv-add-station-btn"
              onClick={onOpenAddModal}
              onMouseEnter={() => onSetFocus('add-station')}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                focusedElement === 'add-station'
                  ? 'border-white ring-4 ring-white/60 scale-[1.02] bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.5)]'
                  : 'border-dashed border-white/20 bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs tracking-wider uppercase font-mono">
                + Agregar Nuevo Link de Radio
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

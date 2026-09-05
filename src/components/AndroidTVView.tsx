import { RadioStation, PlayerStatus } from '../types';
import { Visualizer } from './Visualizer';
import { FocusableTarget } from '../hooks/useTVNavigation';
import { Play, Pause, Radio, RotateCw, Volume2, VolumeX, Tv } from 'lucide-react';

interface AndroidTVViewProps {
  currentStation: RadioStation;
  stations: RadioStation[];
  playerStatus: PlayerStatus;
  volume: number;
  isMuted: boolean;
  focusedElement: FocusableTarget;
  analyser?: AnalyserNode | null;
  onPlayStation: (station: RadioStation) => void;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onSwitchStation: () => void;
  onSetFocus: (target: FocusableTarget) => void;
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
}: AndroidTVViewProps) => {
  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-between min-h-[640px] p-6 sm:p-10 select-none">
      {/* TV Header with remote indicator */}
      <div className="w-full flex items-center justify-between bg-black/60 border border-white/10 px-6 py-4 rounded-2xl mb-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              ANDROID TV • EXPERIENCIA 10-FOOT
            </h2>
            <p className="text-xs text-neutral-400">
              Control remoto D-Pad activo: Navega con flechas y pulsa OK
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {isPlaying ? 'TRANSMITIENDO EN TV' : 'EN ESPERA'}
        </div>
      </div>

      {/* Main TV Horizontal Stage */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Massive Glass OLED Display with Visualizer */}
        <div className="lg:col-span-7 glass-surface border border-white/15 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Specular HD Reflection */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-neutral-300 border border-white/10">
                {currentStation.badge || 'ESTÉREO HD'}
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {isPlaying ? '● EN DIRECTO' : isLoading ? '● CONECTANDO' : '○ EN PAUSA'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight my-2">
              {currentStation.name}
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 font-light">
              {currentStation.subtitle || 'Emisión en vivo sin interrupciones'}
            </p>
          </div>

          <div className="py-6">
            <Visualizer isPlaying={isPlaying} isLoading={isLoading} analyser={analyser} />
          </div>

          {/* Master TV Remote Action Controls */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <button
              id="tv-switch-btn"
              onClick={onSwitchStation}
              onMouseEnter={() => onSetFocus('prev-station')}
              className={`w-14 h-14 rounded-2xl glass-button border flex items-center justify-center transition-all cursor-pointer ${
                focusedElement === 'prev-station'
                  ? 'border-white ring-4 ring-white/50 scale-110 bg-white/20 text-white'
                  : 'border-white/10 text-neutral-300'
              }`}
            >
              <Radio className="w-6 h-6" />
            </button>

            <button
              id="tv-play-btn"
              onClick={onTogglePlayPause}
              onMouseEnter={() => onSetFocus('play-pause')}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all cursor-pointer ${
                focusedElement === 'play-pause'
                  ? 'ring-4 ring-white scale-110 shadow-[0_0_35px_rgba(255,255,255,0.6)]'
                  : ''
              } ${
                isPlaying
                  ? 'bg-white text-black'
                  : 'glass-button-active border-2 border-white/40 text-white'
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
              className={`w-14 h-14 rounded-2xl glass-button border flex items-center justify-center transition-all cursor-pointer ${
                focusedElement === 'mute'
                  ? 'border-white ring-4 ring-white/50 scale-110 bg-white/20 text-white'
                  : 'border-white/10 text-neutral-300'
              }`}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-6 h-6 text-neutral-400" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Stations List with Remote Focus Rings */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-center">
          <div className="text-xs font-bold tracking-widest text-neutral-400 uppercase px-2">
            SELECCIÓN DE SINTONÍAS (MANDO TV)
          </div>

          {stations.map((st, index) => {
            const isThisActive = currentStation.id === st.id;
            const targetName: FocusableTarget = index === 0 ? 'station-1' : 'station-2';
            const isTargetFocused = focusedElement === targetName;

            return (
              <button
                key={st.id}
                id={`tv-station-${st.id}`}
                onClick={() => onPlayStation(st)}
                onMouseEnter={() => onSetFocus(targetName)}
                className={`relative w-full rounded-3xl p-6 text-left border-2 transition-all duration-300 cursor-pointer ${
                  isTargetFocused
                    ? 'border-white ring-4 ring-white/60 shadow-[0_0_35px_rgba(255,255,255,0.4)] scale-[1.03] z-20'
                    : 'border-white/10 hover:border-white/25'
                } ${
                  isThisActive
                    ? 'glass-button-active bg-white/10 text-white'
                    : 'glass-button text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                        isThisActive
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <Radio className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          {st.name}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                        {isThisActive && isPlaying
                          ? 'Sintonizado actualmente'
                          : st.subtitle || 'Transmisión Online'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isThisActive
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {isThisActive && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-neutral-400 flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-mono font-bold">
              OK
            </div>
            <span>
              En Android TV, presiona las teclas de dirección del mando a distancia para alternar entre las radios y el botón central OK para reproducir.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

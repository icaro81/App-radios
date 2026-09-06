import React from 'react';
import { RadioStation, PlayerStatus } from '../types';
import { Visualizer } from './Visualizer';
import { APP_VERSION } from '../version';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  Sparkles, 
  Smartphone,
  AlertCircle,
  Radio,
  Signal,
  Loader2
} from 'lucide-react';

interface AndroidTVViewProps {
  currentStation: RadioStation;
  stations: RadioStation[];
  playerStatus: PlayerStatus;
  volume: number;
  isMuted: boolean;
  focusedElement: string;
  analyser?: AnalyserNode | null;
  errorMessage?: string | null;
  onPlayStation: (station: RadioStation) => void;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onNextStation: () => void;
  onPreviousStation: () => void;
  onSetFocus: (target: string) => void;
  onOpenAddModal: () => void;
  onRemoveCustomStation: (id: string) => void;
  onVolumeChange?: (volume: number) => void;
  onCheckUpdate?: () => void;
  isCheckingUpdate?: boolean;
  onSwitchToMobile?: () => void;
  isLandscape?: boolean;
}

export const AndroidTVView: React.FC<AndroidTVViewProps> = ({
  currentStation,
  stations,
  playerStatus,
  volume,
  isMuted,
  focusedElement,
  analyser,
  errorMessage,
  onPlayStation,
  onTogglePlayPause,
  onToggleMute,
  onNextStation,
  onPreviousStation,
  onSetFocus,
  onOpenAddModal,
  onRemoveCustomStation,
  onVolumeChange,
  onCheckUpdate,
  isCheckingUpdate,
  onSwitchToMobile,
}) => {
  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto my-auto select-none flex flex-col justify-center">
      {/* Main Central Crystal Radio Player Console (Horizontal View) */}
      <section
        id="crystal-player-console-tv"
        className="relative glass-surface rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 lg:p-6 overflow-hidden border border-white/15 transition-all duration-500 shadow-2xl"
      >
        {/* Specular Diagonal Reflection Light */}
        <div className="absolute -top-32 -left-32 w-[180%] h-64 bg-gradient-to-b from-white/18 via-white/4 to-transparent rotate-[-25deg] pointer-events-none filter blur-[0.5px]" />
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* 2-Column Horizontal Layout matching the exact style of the mobile console */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* Left Column: OLED Display + Playback Controls + Volume */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-between space-y-3">
            {/* OLED Display Section */}
            <div className="relative rounded-2xl bg-black/60 border border-white/10 p-3.5 sm:p-4 overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
              {/* Status Bar */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      isPlaying
                        ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                        : isLoading
                        ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-ping'
                        : 'bg-neutral-600'
                    }`}
                  />
                  <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 font-medium">
                    {isPlaying ? 'EN DIRECTO' : isLoading ? 'CONECTANDO...' : 'PAUSADO'}
                  </span>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                  {currentStation.badge || 'ESTÉREO HD'}
                </div>
              </div>

              {/* Custom Studio Microphone & Headphones Emblem */}
              <div className="flex justify-center my-1">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 rounded-2xl blur-[1px]" />
                  <img
                    src="/icon.svg"
                    alt="Radio Cristal Icon"
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  />
                </div>
              </div>

              {/* Station Title */}
              <div className="text-center my-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                  {currentStation.name}
                </h1>
                <p className="text-xs text-neutral-400 font-normal mt-0.5 tracking-wide truncate">
                  {currentStation.subtitle || 'Transmisión Online'}
                </p>
              </div>

              {/* Sound Visualizer */}
              <div className="mt-1">
                <Visualizer isPlaying={isPlaying} isLoading={isLoading} analyser={analyser} />
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mt-2 py-1.5 px-2.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-2 text-[11px] text-red-200">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Master Audio Control Buttons */}
            <div className="flex items-center justify-center gap-4 sm:gap-5 my-1">
              {/* Previous Station */}
              <button
                id="tv-prev-station-btn"
                onClick={onPreviousStation}
                onMouseEnter={() => onSetFocus('prev-station')}
                title="Estación anterior (◄ Flecha Izquierda)"
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full glass-button border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg active:scale-90 ${
                  focusedElement === 'prev-station'
                    ? 'border-white bg-white text-black scale-110 ring-4 ring-white/60 shadow-[0_0_25px_rgba(255,255,255,0.8)]'
                    : 'border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                }`}
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 -scale-x-100" />
              </button>

              {/* Central Main Play/Pause Button */}
              <div className="relative group">
                <div
                  className={`absolute -inset-2 rounded-full transition-all duration-500 ${
                    isPlaying
                      ? 'bg-white/20 blur-md group-hover:bg-white/30'
                      : 'bg-transparent blur-none'
                  }`}
                />

                <button
                  id="tv-master-play-pause-btn"
                  onClick={onTogglePlayPause}
                  onMouseEnter={() => onSetFocus('play-pause')}
                  aria-label={isPlaying ? 'Pausar transmisión' : 'Reproducir transmisión'}
                  className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-95 ${
                    focusedElement === 'play-pause'
                      ? 'ring-4 ring-white scale-110 shadow-[0_0_40px_rgba(255,255,255,0.9)] bg-white text-black font-extrabold border-2 border-white'
                      : isPlaying
                      ? 'bg-white text-black shadow-[0_0_35px_rgba(255,255,255,0.4)] border-2 border-white'
                      : 'glass-button-active text-white border-2 border-white/30 hover:border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  {isLoading ? (
                    <RotateCw className="w-7 h-7 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                  )}
                </button>
              </div>

              {/* Next Station */}
              <button
                id="tv-next-station-btn"
                onClick={onNextStation}
                onMouseEnter={() => onSetFocus('next-station')}
                title="Siguiente estación (► Flecha Derecha)"
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full glass-button border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg active:scale-90 ${
                  focusedElement === 'next-station'
                    ? 'border-white bg-white text-black scale-110 ring-4 ring-white/60 shadow-[0_0_25px_rgba(255,255,255,0.8)]'
                    : 'border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                }`}
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Volume Slider & Mute */}
            <div className="px-1">
              <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-2 sm:p-2.5 border border-white/5">
                <button
                  id="tv-toggle-mute-btn"
                  onClick={onToggleMute}
                  onMouseEnter={() => onSetFocus('mute')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    focusedElement === 'mute'
                      ? 'ring-2 ring-white bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  id="tv-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    onVolumeChange?.(parseFloat(e.target.value));
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                />

                <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Sintonías Disponibles + Dial Grid + App Info Footer */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 md:pl-5 lg:pl-6 pt-3 md:pt-0">
            <div>
              {/* Header matching mobile */}
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
                  SINTONÍAS DISPONIBLES
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {stations.length} EN LÍNEA
                </span>
              </div>

              {/* Stations Grid with Glass cards & Focus states for TV D-Pad */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 max-h-[290px] sm:max-h-[330px] lg:max-h-[360px] overflow-y-auto pr-1">
                {stations.map((station, idx) => {
                  const isActive = currentStation.id === station.id;
                  const isPlayingThis = isActive && playerStatus === 'playing';
                  const isLoadingThis = isActive && playerStatus === 'loading';
                  const isTargetFocused = focusedElement === `station-${station.id}`;

                  return (
                    <div key={station.id} className="relative group/tvcard">
                      <button
                        id={`tv-station-${station.id}`}
                        onClick={() => onPlayStation(station)}
                        onMouseEnter={() => onSetFocus(`station-${station.id}`)}
                        className={`relative w-full h-[62px] text-left rounded-2xl p-2.5 transition-all duration-200 ease-out overflow-hidden select-none cursor-pointer flex items-center gap-2.5 ${
                          isTargetFocused
                            ? 'border-2 border-white ring-4 ring-white/70 scale-[1.02] bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.5)]'
                            : isActive
                            ? 'glass-button-active border border-white/35 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                            : 'glass-button border border-white/10 text-neutral-300 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {/* Diagonal Glass Sheen */}
                        <div className="absolute inset-0 pointer-events-none glass-sheen opacity-60 group-hover/tvcard:opacity-100 transition-opacity duration-300" />
                        
                        {/* Top highlight line */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                        {/* Icon Container with Channel Number or Radio Icon */}
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                              : 'bg-white/5 text-neutral-400 group-hover/tvcard:bg-white/10 group-hover/tvcard:text-white border border-white/5'
                          }`}
                        >
                          {isLoadingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPlayingThis ? (
                            <Signal className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <Radio className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Text details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {idx < 9 && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-neutral-300">
                                {idx + 1}
                              </span>
                            )}
                            <span className="block font-semibold text-xs tracking-tight truncate text-white leading-tight">
                              {station.name}
                            </span>
                          </div>
                          <span className="block text-[10px] text-neutral-400 truncate mt-0.5 font-mono">
                            {isLoadingThis
                              ? 'Conectando...'
                              : isPlayingThis
                              ? 'En directo'
                              : station.badge || station.subtitle || 'Online'}
                          </span>
                        </div>

                        {/* Active indicator bar at bottom */}
                        {isActive && (
                          <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />
                        )}
                      </button>

                      {/* Delete button for custom streams */}
                      {station.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCustomStation(station.id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-white/10 transition-colors z-20 cursor-pointer"
                          title="Eliminar sintonía"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add Custom Station Button */}
                <button
                  id="tv-add-station-btn"
                  onClick={onOpenAddModal}
                  onMouseEnter={() => onSetFocus('add-station')}
                  className={`w-full h-[62px] rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    focusedElement === 'add-station'
                      ? 'border-2 border-white ring-4 ring-white/70 scale-[1.02] bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.5)]'
                      : 'border-dashed border-white/20 bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[11px] tracking-wider uppercase font-mono">
                    + Sintonía Personalizada
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Bar matching mobile version exactly */}
            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between px-1 text-[10px] font-mono text-neutral-500">
              <span>Radio Cristal HD v{APP_VERSION}</span>
              <div className="flex items-center gap-3">
                {onSwitchToMobile && (
                  <button
                    id="tv-switch-mobile-btn"
                    onClick={onSwitchToMobile}
                    className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Cambiar a vista móvil vertical"
                  >
                    <Smartphone className="w-3 h-3 text-cyan-400" />
                    <span>Modo Móvil</span>
                  </button>
                )}

                {onCheckUpdate && (
                  <button
                    id="tv-check-updates-btn"
                    onClick={onCheckUpdate}
                    className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Buscar actualizaciones"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>{isCheckingUpdate ? 'Comprobando...' : 'Actualizar'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discrete Remote Control Legend */}
      <div className="text-center text-[10px] font-mono text-neutral-500/75 mt-2">
        Mando a distancia: [OK/Centro] Reproducir • [▲ ▼] Emisoras • [◄ ►] Controles • [1-9] Sintonía directa • [+/-] Volumen
      </div>
    </div>
  );
};

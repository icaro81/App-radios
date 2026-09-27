import React, { useEffect } from 'react';
import { RadioStation, PlayerStatus } from '../types';
import { Visualizer } from './Visualizer';
import { APP_VERSION } from '../version';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCw,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Radio,
  Signal,
  Loader2,
  SlidersHorizontal
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
  onOpenEqualizer?: () => void;
  onToggleSkin?: () => void;
  isCheckingUpdate?: boolean;
  isLandscape?: boolean;
  skin?: 'black' | 'galena';
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
  onOpenEqualizer,
  onToggleSkin,
  isCheckingUpdate,
  skin = 'black',
}: AndroidTVViewProps) => {
  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';
  const isGalena = skin === 'galena';

  // Smoothly ensure the focused station or button is always in the TV viewport
  useEffect(() => {
    if (focusedElement.startsWith('station-') || focusedElement === 'add-station') {
      const el = document.getElementById(`tv-${focusedElement}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedElement]);

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto select-none flex flex-col justify-center">
      {/* Main Central Crystal Radio Player Console (Horizontal View) */}
      <section
        id="crystal-player-console-tv"
        className={`relative glass-surface rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 lg:p-6 overflow-hidden border ${
          isGalena
            ? 'border-white/40 shadow-[0_30px_70px_-10px_rgba(8,51,68,0.45)]'
            : 'border-white/15 shadow-2xl'
        } transition-all duration-300`}
      >
        {/* Specular Diagonal Reflection Light */}
        <div className={`absolute -top-32 -left-32 w-[180%] h-64 ${
          isGalena
            ? 'bg-gradient-to-b from-white/30 via-white/10 to-transparent'
            : 'bg-gradient-to-b from-white/18 via-white/4 to-transparent'
        } rotate-[-25deg] pointer-events-none filter blur-[0.5px]`} />
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* 2-Column Horizontal Layout matching the exact style of the console */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* Left Column: OLED Display + Playback Controls + Volume */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-between space-y-3">
            {/* Dark OLED Stereo Screen Display */}
            <div className="relative rounded-2xl bg-black/80 border border-white/15 p-3 sm:p-3.5 overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)]">
              {/* Status Bar */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      isPlaying
                        ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                        : isLoading
                        ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-ping'
                        : 'bg-neutral-600'
                    }`}
                  />
                  <span className="text-[11px] font-mono tracking-wider uppercase text-white font-semibold">
                    {isPlaying ? 'EN DIRECTO' : isLoading ? 'CONECTANDO...' : 'PAUSADO'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onToggleSkin && (
                    <button
                      id="tv-header-skin-btn"
                      onClick={onToggleSkin}
                      onMouseEnter={() => onSetFocus('skin-toggle')}
                      className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        focusedElement === 'skin-toggle'
                          ? 'border-yellow-300 bg-yellow-400 text-black font-bold scale-110 ring-2 ring-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.85)]'
                          : 'bg-white/10 hover:bg-white/20 border-white/20 text-yellow-300 font-semibold'
                      }`}
                      title="Cambiar tema: Luna 🌙 / Sol ☀️ (Tecla 0 o Color en mando)"
                    >
                      <span className="text-xs">{skin === 'black' ? '🌙' : '☀️'}</span>
                      <span>{skin === 'black' ? 'LUNA' : 'SOL'}</span>
                    </button>
                  )}
                  {onOpenEqualizer && (
                    <button
                      id="tv-eq-btn"
                      onClick={onOpenEqualizer}
                      onMouseEnter={() => onSetFocus('eq-btn')}
                      className={`flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        focusedElement === 'eq-btn'
                          ? 'border-cyan-300 bg-cyan-400 text-black font-bold scale-105 ring-2 ring-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                          : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/30 text-cyan-300 font-semibold'
                      }`}
                      title="Ecualizador de audio (4 Bandas)"
                    >
                      <SlidersHorizontal className={`w-3 h-3 ${focusedElement === 'eq-btn' ? 'text-black' : 'text-cyan-400'}`} />
                      <span>EQ 4-BANDAS</span>
                    </button>
                  )}
                  <div className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white font-semibold">
                    {currentStation.badge || 'ESTÉREO HD'}
                  </div>
                </div>
              </div>

              {/* Custom Studio Microphone & Headphones Emblem */}
              <div className="flex justify-center my-0.5">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-1 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 rounded-2xl blur-[1px]" />
                  <img
                    src="/icon.svg"
                    alt="Galena Digital Icon"
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  />
                </div>
              </div>

              {/* Station Title on Dark Screen */}
              <div className="text-center my-0.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]">
                  {currentStation.name}
                </h1>
                <p className="text-xs text-white/80 font-normal tracking-wide truncate">
                  {currentStation.subtitle || 'Transmisión Online'}
                </p>
              </div>

              {/* High-Contrast Luminous Canvas Sound Visualizer (darkBg={true} ensures crisp contrast on dark screen) */}
              <div className="mt-0.5">
                <Visualizer isPlaying={isPlaying} isLoading={isLoading} analyser={analyser} skin={skin} darkBg={true} />
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mt-1.5 py-1 px-2.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center gap-2 text-[11px] text-red-200">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Master Audio Control Buttons */}
            <div className="flex items-center justify-center gap-4 sm:gap-5 my-0.5">
              {/* Previous Station */}
              <button
                id="tv-prev-station-btn"
                onClick={onPreviousStation}
                onMouseEnter={() => onSetFocus('prev-station')}
                title="Estación anterior (◄ Flecha Izquierda)"
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full border flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-75 ${
                  focusedElement === 'prev-station'
                    ? isGalena
                      ? 'border-2 border-black bg-white text-black scale-110 ring-4 ring-black/40 shadow-lg font-bold'
                      : 'border-cyan-300 bg-cyan-400 text-black scale-110 ring-4 ring-cyan-400/80 shadow-[0_0_15px_#22d3ee]'
                    : isGalena
                    ? 'bg-white/60 border-black/20 text-black hover:bg-white/90 hover:border-black/40 shadow-sm'
                    : 'glass-button border-white/10 text-white hover:text-cyan-300 hover:border-cyan-400/30'
                }`}
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 -scale-x-100" />
              </button>

              {/* Central Main Play/Pause Button */}
              <div className="relative">
                <button
                  id="tv-master-play-pause-btn"
                  onClick={onTogglePlayPause}
                  onMouseEnter={() => onSetFocus('play-pause')}
                  aria-label={isPlaying ? 'Pausar transmisión' : 'Reproducir transmisión'}
                  className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-75 ${
                    focusedElement === 'play-pause'
                      ? isGalena
                        ? 'ring-4 ring-black scale-110 bg-yellow-400 text-black font-extrabold border-2 border-black shadow-[0_0_25px_rgba(0,0,0,0.45)]'
                        : 'ring-4 ring-cyan-400 scale-110 bg-cyan-400 text-black font-extrabold border-2 border-cyan-200 shadow-[0_0_25px_#22d3ee]'
                      : isPlaying
                      ? isGalena
                        ? 'bg-black text-cyan-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2 border-neutral-900'
                        : 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.6)] border-2 border-cyan-300'
                      : isGalena
                      ? 'bg-white/80 text-black border-2 border-black/35 hover:border-black shadow-md'
                      : 'glass-button-active text-white border-2 border-cyan-400/40 hover:border-cyan-400'
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
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full border flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-75 ${
                  focusedElement === 'next-station'
                    ? isGalena
                      ? 'border-2 border-black bg-white text-black scale-110 ring-4 ring-black/40 shadow-lg font-bold'
                      : 'border-cyan-300 bg-cyan-400 text-black scale-110 ring-4 ring-cyan-400/80 shadow-[0_0_15px_#22d3ee]'
                    : isGalena
                    ? 'bg-white/60 border-black/20 text-black hover:bg-white/90 hover:border-black/40 shadow-sm'
                    : 'glass-button border-white/10 text-white hover:text-cyan-300 hover:border-cyan-400/30'
                }`}
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Volume Slider & Mute & Equalizer Controls */}
            <div className="px-1">
              <div className={`flex items-center gap-2 rounded-2xl p-2 sm:p-2.5 border transition-colors ${
                isGalena ? 'bg-white/55 border-black/15 shadow-sm' : 'bg-black/40 border-white/5'
              }`}>
                {/* Mute Button */}
                <button
                  id="tv-toggle-mute-btn"
                  onClick={onToggleMute}
                  onMouseEnter={() => onSetFocus('mute')}
                  className={`p-1.5 rounded-xl cursor-pointer transition-all duration-75 ${
                    focusedElement === 'mute'
                      ? isGalena
                        ? 'ring-2 ring-black bg-black text-white scale-110 shadow-md'
                        : 'ring-2 ring-cyan-300 bg-cyan-400 text-black scale-110 shadow-[0_0_10px_#22d3ee]'
                      : isGalena
                      ? 'text-black hover:text-neutral-800'
                      : 'text-white hover:text-cyan-300'
                  }`}
                  title={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className={`w-4 h-4 ${isGalena ? 'text-black' : 'text-white'}`} />
                  ) : (
                    <Volume2 className={`w-4 h-4 ${isGalena ? 'text-black' : 'text-white'}`} />
                  )}
                </button>

                {/* Vol - Button */}
                <button
                  id="tv-volume-down-btn"
                  onClick={() => onVolumeChange?.(Math.max(0, Number((volume - 0.05).toFixed(2))))}
                  onMouseEnter={() => onSetFocus('vol-down')}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all duration-75 cursor-pointer ${
                    focusedElement === 'vol-down'
                      ? isGalena
                        ? 'ring-2 ring-black bg-black text-white scale-110 shadow-md'
                        : 'ring-2 ring-cyan-300 bg-cyan-400 text-black scale-110 shadow-[0_0_10px_#22d3ee]'
                      : isGalena
                      ? 'bg-black/10 text-black hover:bg-black/20 border border-black/15'
                      : 'bg-white/10 text-white hover:text-cyan-300 hover:bg-white/20'
                  }`}
                  title="Bajar volumen (-5%)"
                >
                  -
                </button>

                {/* Volume Slider */}
                <div className="flex-1 flex items-center gap-2">
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
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isGalena ? 'bg-neutral-300 accent-black' : 'bg-neutral-800 accent-cyan-400'
                    }`}
                  />
                  <span className={`text-[10px] font-mono w-8 text-right font-bold ${
                    isGalena ? 'text-black' : 'text-white'
                  }`}>
                    {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>

                {/* Vol + Button */}
                <button
                  id="tv-volume-up-btn"
                  onClick={() => onVolumeChange?.(Math.min(1, Number((volume + 0.05).toFixed(2))))}
                  onMouseEnter={() => onSetFocus('vol-up')}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all duration-75 cursor-pointer ${
                    focusedElement === 'vol-up'
                      ? isGalena
                        ? 'ring-2 ring-black bg-black text-white scale-110 shadow-md'
                        : 'ring-2 ring-cyan-300 bg-cyan-400 text-black scale-110 shadow-[0_0_10px_#22d3ee]'
                      : isGalena
                      ? 'bg-black/10 text-black hover:bg-black/20 border border-black/15'
                      : 'bg-white/10 text-white hover:text-cyan-300 hover:bg-white/20'
                  }`}
                  title="Subir volumen (+5%)"
                >
                  +
                </button>

                {/* EQ Quick Button */}
                {onOpenEqualizer && (
                  <button
                    id="tv-eq-quick-btn"
                    onClick={onOpenEqualizer}
                    onMouseEnter={() => onSetFocus('eq-btn')}
                    className={`p-1.5 px-2.5 rounded-xl cursor-pointer transition-all duration-75 flex items-center gap-1 shrink-0 ${
                      focusedElement === 'eq-btn'
                        ? isGalena
                          ? 'border-2 border-black ring-2 ring-black/40 bg-black text-white font-bold scale-110 shadow-md'
                          : 'border-2 border-cyan-300 ring-2 ring-cyan-400/80 bg-cyan-400 text-black font-bold scale-110 shadow-[0_0_15px_#22d3ee]'
                        : isGalena
                        ? 'bg-white/70 border border-black/20 text-black hover:bg-white/90 shadow-xs'
                        : 'glass-button border border-white/10 text-cyan-400 hover:text-cyan-300 hover:bg-white/10'
                    }`}
                    title="Ecualizador de audio de 4 bandas"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold">EQ</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sintonías Disponibles + Dial Grid + App Info Footer */}
          <div className={`md:col-span-6 lg:col-span-7 flex flex-col justify-between border-t md:border-t-0 md:border-l ${
            isGalena ? 'border-black/15' : 'border-white/10'
          } md:pl-5 lg:pl-6 pt-3 md:pt-0`}>
            <div>
              {/* Header with High-Contrast Typography */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-[11px] font-bold tracking-widest uppercase ${
                  isGalena ? 'text-black' : 'text-white'
                }`}>
                  SINTONÍAS DISPONIBLES
                </span>
                <span className={`text-[10px] font-mono font-bold ${
                  isGalena ? 'text-neutral-900' : 'text-white font-medium'
                }`}>
                  {stations.length} EN LÍNEA
                </span>
              </div>

              {/* Stations Grid with High Contrast & Snappy Focus states for TV D-Pad */}
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
                        className={`relative w-full h-[58px] text-left rounded-2xl p-2.5 overflow-hidden select-none cursor-pointer flex items-center gap-2.5 transition-transform duration-75 ${
                          isTargetFocused
                            ? isGalena
                              ? 'border-2 border-black ring-4 ring-black/35 bg-white text-black scale-[1.01] shadow-[0_0_18px_rgba(0,0,0,0.35)] font-bold'
                              : 'border-2 border-cyan-400 ring-2 ring-cyan-400/60 bg-cyan-950/60 text-white scale-[1.01] shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                            : isActive
                            ? isGalena
                              ? 'border-2 border-black/80 bg-white/85 text-black shadow-md'
                              : 'glass-button-active border border-cyan-400/50 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : isGalena
                            ? 'border border-black/15 bg-white/50 text-black hover:border-black/30 hover:bg-white/70 shadow-sm'
                            : 'glass-button border border-white/10 text-white hover:border-cyan-400/30'
                        }`}
                      >
                        {/* Diagonal Glass Sheen */}
                        <div className="absolute inset-0 pointer-events-none glass-sheen opacity-60 group-hover/tvcard:opacity-100" />
                        
                        {/* Top highlight line */}
                        <div className={`absolute top-0 left-0 right-0 h-[1px] ${
                          isGalena
                            ? 'bg-gradient-to-r from-transparent via-white/50 to-transparent'
                            : 'bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent'
                        } pointer-events-none`} />

                        {/* Icon Container with Channel Number or Radio Icon */}
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                            isActive
                              ? isGalena
                                ? 'bg-black text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,0,0,0.4)]'
                                : 'bg-cyan-400 text-black font-bold shadow-[0_0_8px_#22d3ee]'
                              : isGalena
                              ? 'bg-black/10 text-black border border-black/15'
                              : 'bg-white/10 text-white border border-white/10'
                          }`}
                        >
                          {isLoadingThis ? (
                            <Loader2 className={`w-3.5 h-3.5 animate-spin ${isGalena ? 'text-black' : 'text-white'}`} />
                          ) : isPlayingThis ? (
                            <Signal className={`w-3.5 h-3.5 animate-pulse ${isGalena ? 'text-cyan-300' : 'text-black'}`} />
                          ) : (
                            <Radio className={`w-3.5 h-3.5 ${isGalena ? 'text-black' : 'text-white'}`} />
                          )}
                        </div>

                        {/* Text details - Crisp Dark Typography on Light Background */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {idx < 9 && (
                              <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                                isGalena ? 'bg-black/15 text-black' : 'bg-white/15 text-white'
                              }`}>
                                {idx + 1}
                              </span>
                            )}
                            <span className={`block font-bold text-xs tracking-tight truncate leading-tight ${
                              isGalena ? 'text-black' : 'text-white'
                            }`}>
                              {station.name}
                            </span>
                          </div>
                          <span className={`block text-[10px] truncate mt-0.5 font-mono ${
                            isGalena ? 'text-neutral-800 font-semibold' : 'text-white'
                          }`}>
                            {isLoadingThis
                              ? 'Conectando...'
                              : isPlayingThis
                              ? 'En directo'
                              : station.badge || station.subtitle || 'Online'}
                          </span>
                        </div>

                        {/* Active indicator bar at bottom */}
                        {isActive && (
                          <div className={`absolute bottom-0 left-2 right-2 h-[2px] ${
                            isGalena
                              ? 'bg-gradient-to-r from-transparent via-black to-transparent'
                              : 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
                          }`} />
                        )}
                      </button>

                      {/* Delete button for custom streams */}
                      {station.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCustomStation(station.id);
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors z-20 cursor-pointer ${
                            isGalena
                              ? 'text-black hover:text-red-600 hover:bg-black/10'
                              : 'text-white hover:text-red-400 hover:bg-white/10'
                          }`}
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
                  className={`w-full h-[58px] rounded-2xl border flex items-center justify-center gap-2 cursor-pointer transition-transform duration-75 ${
                    focusedElement === 'add-station'
                      ? isGalena
                        ? 'border-2 border-black ring-4 ring-black/35 bg-black text-white font-bold scale-[1.01] shadow-lg'
                        : 'border-2 border-cyan-400 ring-2 ring-cyan-400 bg-cyan-400 text-black font-bold scale-[1.01] shadow-[0_0_15px_#22d3ee]'
                      : isGalena
                      ? 'border-dashed border-black/30 bg-black/[0.03] text-black hover:border-black/50 hover:bg-black/[0.07]'
                      : 'border-dashed border-white/20 bg-white/[0.02] text-white hover:border-cyan-400/40 hover:bg-white/5'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className={`text-[11px] tracking-wider uppercase font-mono font-bold ${
                    isGalena ? 'text-black' : 'text-white font-medium'
                  }`}>
                    + Sintonía Personalizada
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Bar: App Info Footer */}
            <div className={`mt-3 pt-2.5 border-t flex items-center justify-between px-1 text-[10px] font-mono ${
              isGalena ? 'border-black/15 text-black font-bold' : 'border-white/10 text-white'
            }`}>
              <span>Galena Digital v{APP_VERSION}</span>
              <div className="flex items-center gap-3">
                {onToggleSkin && (
                  <button
                    id="tv-footer-skin-btn"
                    onClick={onToggleSkin}
                    onMouseEnter={() => onSetFocus('footer-skin')}
                    className={`flex items-center gap-1.5 transition-all duration-75 cursor-pointer px-2.5 py-1 rounded-lg ${
                      focusedElement === 'footer-skin'
                        ? 'bg-yellow-400 text-black ring-2 ring-yellow-300 border border-yellow-200 font-bold scale-105 shadow-[0_0_12px_#facc15]'
                        : isGalena
                        ? 'text-black hover:text-neutral-800 border border-black/15 bg-white/40 font-semibold'
                        : 'text-white hover:text-yellow-300 border border-transparent'
                    }`}
                    title="Alternar Skin Sol ☀️ / Luna 🌙"
                  >
                    <span className="text-xs">{skin === 'black' ? '🌙' : '☀️'}</span>
                    <span>Tema {skin === 'black' ? 'Luna' : 'Sol'}</span>
                  </button>
                )}
                {onOpenEqualizer && (
                  <button
                    id="tv-footer-eq-btn"
                    onClick={onOpenEqualizer}
                    onMouseEnter={() => onSetFocus('eq-btn')}
                    className={`flex items-center gap-1.5 transition-all duration-75 cursor-pointer px-2.5 py-1 rounded-lg ${
                      focusedElement === 'eq-btn'
                        ? isGalena
                          ? 'bg-black text-white ring-2 ring-black border border-neutral-800 font-bold scale-105 shadow-md'
                          : 'bg-cyan-400 text-black ring-2 ring-cyan-300 border border-cyan-200 font-bold scale-105 shadow-[0_0_12px_#22d3ee]'
                        : isGalena
                        ? 'text-black hover:text-neutral-800 border border-black/15 bg-white/40 font-semibold'
                        : 'text-white hover:text-cyan-300 border border-transparent'
                    }`}
                    title="Ecualizador de audio"
                  >
                    <SlidersHorizontal className={`w-3 h-3 ${
                      focusedElement === 'eq-btn'
                        ? isGalena ? 'text-white' : 'text-black'
                        : isGalena ? 'text-black' : 'text-cyan-400'
                    }`} />
                    <span>Ecualizador</span>
                  </button>
                )}
                {onCheckUpdate && (
                  <button
                    id="tv-check-updates-btn"
                    onClick={onCheckUpdate}
                    onMouseEnter={() => onSetFocus('check-updates')}
                    className={`flex items-center gap-1.5 transition-all duration-75 cursor-pointer px-2.5 py-1 rounded-lg ${
                      focusedElement === 'check-updates'
                        ? isGalena
                          ? 'bg-black text-white ring-2 ring-black border border-neutral-800 font-bold scale-105 shadow-md'
                          : 'bg-cyan-400 text-black ring-2 ring-cyan-300 border border-cyan-200 font-bold scale-105 shadow-[0_0_12px_#22d3ee]'
                        : isGalena
                        ? 'text-black hover:text-neutral-800 border border-black/15 bg-white/40 font-semibold'
                        : 'text-white hover:text-cyan-300 border border-transparent'
                    }`}
                    title="Buscar actualizaciones"
                  >
                    <Sparkles className={`w-3 h-3 ${
                      focusedElement === 'check-updates'
                        ? isGalena ? 'text-white' : 'text-black'
                        : isGalena ? 'text-black' : 'text-cyan-400'
                    }`} />
                    <span>{isCheckingUpdate ? 'Comprobando...' : 'Actualizar'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-Contrast Discrete Remote Control Legend */}
      <div className="text-center mt-2.5">
        <div className={`text-[10px] font-mono px-4 py-1 rounded-full inline-block ${
          isGalena
            ? 'text-black font-bold bg-white/60 border border-black/15 shadow-xs'
            : 'text-white/80'
        }`}>
          Mando TV: [OK] Seleccionar • [▲ ▼ ◄ ►] Navegar • [0 / Color] Cambiar Skin (Sol ☀️ / Luna 🌙) • [+/-] Vol • [1-9] Emisoras directas
        </div>
      </div>
    </div>
  );
};

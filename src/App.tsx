import { useState, useRef, useEffect, useCallback } from 'react';
import { RADIO_STATIONS } from './stations';
import { RadioStation, PlayerStatus } from './types';
import { StationButton } from './components/StationButton';
import { Visualizer } from './components/Visualizer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AndroidModeSelector, AndroidMode } from './components/AndroidModeSelector';
import { AndroidTVView } from './components/AndroidTVView';
import { AndroidAutoView } from './components/AndroidAutoView';
import { useMediaSession } from './hooks/useMediaSession';
import { useTVNavigation } from './hooks/useTVNavigation';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  AlertCircle,
  HelpCircle,
  X,
  Smartphone,
  Tv,
  Car,
  Check
} from 'lucide-react';

export default function App() {
  const [currentStation, setCurrentStation] = useState<RadioStation>(RADIO_STATIONS[0]);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [androidMode, setAndroidMode] = useState<AndroidMode>('mobile');
  const [showAndroidInfo, setShowAndroidInfo] = useState<boolean>(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize or update audio element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Lazy setup of Web Audio Analyser graph
  const initAudioSystem = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'none';

      audio.onwaiting = () => {
        setPlayerStatus('loading');
      };

      audio.onplaying = () => {
        setPlayerStatus('playing');
        setErrorMessage(null);
      };

      audio.onpause = () => {
        if (playerStatus !== 'loading') {
          setPlayerStatus('paused');
        }
      };

      audio.onerror = () => {
        console.warn('Audio stream error on:', audio.src);
        setPlayerStatus('error');
        setErrorMessage('Transmisión temporalmente no disponible o reconectando.');
      };

      audioRef.current = audio;
    }

    if (!audioCtxRef.current) {
      try {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (AudioCtxClass) {
          const ctx = new AudioCtxClass();
          const node = ctx.createAnalyser();
          node.fftSize = 512; // 256 high-resolution frequency bins
          node.smoothingTimeConstant = 0.76; // Analog meter ballistics
          node.minDecibels = -85;
          node.maxDecibels = -15;

          if (audioRef.current && !sourceNodeRef.current) {
            try {
              const srcNode = ctx.createMediaElementSource(audioRef.current);
              srcNode.connect(node);
              node.connect(ctx.destination);
              sourceNodeRef.current = srcNode;
            } catch (srcErr) {
              console.warn('createMediaElementSource info:', srcErr);
            }
          }

          audioCtxRef.current = ctx;
          analyserRef.current = node;
          setAnalyser(node);
        }
      } catch (ctxErr) {
        console.warn('Web Audio API AudioContext:', ctxErr);
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [playerStatus]);

  // Audio playback handler
  const playStation = useCallback(
    (station: RadioStation) => {
      setErrorMessage(null);
      initAudioSystem();

      const audio = audioRef.current;
      if (!audio) return;

      audio.volume = isMuted ? 0 : volume;

      // If already playing this station, toggle pause
      if (currentStation.id === station.id && playerStatus === 'playing') {
        audio.pause();
        setPlayerStatus('paused');
        return;
      }

      // If paused on this station, resume
      if (currentStation.id === station.id && playerStatus === 'paused') {
        setPlayerStatus('loading');
        audio
          .play()
          .then(() => setPlayerStatus('playing'))
          .catch((err) => {
            console.error('Playback resume error:', err);
            setErrorMessage('No se pudo reanudar el audio. Pulsa reproducir de nuevo.');
            setPlayerStatus('error');
          });
        return;
      }

      // Switch or new station
      setCurrentStation(station);
      setPlayerStatus('loading');

      audio.pause();
      audio.src = station.streamUrl;
      audio.load();

      audio
        .play()
        .then(() => {
          setPlayerStatus('playing');
        })
        .catch((err) => {
          console.warn('Audio play request interrupted or prevented:', err);
          setPlayerStatus('idle');
        });
    },
    [currentStation.id, playerStatus, volume, isMuted, initAudioSystem]
  );

  // Master Play/Pause toggle
  const togglePlayPause = useCallback(() => {
    if (playerStatus === 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayerStatus('paused');
    } else {
      playStation(currentStation);
    }
  }, [playerStatus, currentStation, playStation]);

  // Switch to alternate station
  const toggleAlternateStation = useCallback(() => {
    const nextIndex = RADIO_STATIONS.findIndex((s) => s.id === currentStation.id) === 0 ? 1 : 0;
    playStation(RADIO_STATIONS[nextIndex]);
  }, [currentStation.id, playStation]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // 1. Android Auto integration: MediaSession API
  useMediaSession({
    currentStation,
    playerStatus,
    onPlay: () => playStation(currentStation),
    onPause: () => {
      if (audioRef.current) audioRef.current.pause();
      setPlayerStatus('paused');
    },
    onNextStation: toggleAlternateStation,
    onPreviousStation: toggleAlternateStation,
  });

  // 2. Android TV integration: Remote Control D-Pad & Keys
  const { focusedElement, setFocusedElement } = useTVNavigation({
    onPlayPause: togglePlayPause,
    onNextStation: toggleAlternateStation,
    onPreviousStation: toggleAlternateStation,
    onSelectStation1: () => playStation(RADIO_STATIONS[0]),
    onSelectStation2: () => playStation(RADIO_STATIONS[1]),
    onToggleMute: toggleMute,
    isTVMode: androidMode === 'tv',
  });

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Auto-detect TV user agents (Android TV, Smart TVs, WebOS, Tizen)
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (
      ua.includes('android tv') ||
      ua.includes('googletv') ||
      ua.includes('smart-tv') ||
      ua.includes('smarttv') ||
      ua.includes('tizen') ||
      ua.includes('webos') ||
      ua.includes('crkey')
    ) {
      setAndroidMode('tv');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';

  return (
    <main className="relative min-h-screen w-full bg-[#050508] flex flex-col items-center justify-between p-3 sm:p-6 overflow-x-hidden select-none">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[400px] h-[180px] bg-white/[0.015] rounded-full blur-[100px] pointer-events-none" />

      {/* Top Global Navigation Bar */}
      <header className="relative z-20 w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 pt-2 pb-4 px-2">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-2.5">
          <img
            src="/icon.svg"
            alt="Radio Icon"
            className="w-8 h-8 rounded-xl border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)] object-cover bg-black/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-white">
                RADIO CRISTAL
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] text-neutral-300 font-mono">
                HD
              </span>
            </div>
          </div>
        </div>

        {/* Center: Android Version Mode Selector */}
        <div className="order-3 sm:order-2 w-full sm:w-auto flex justify-center mt-1 sm:mt-0">
          <AndroidModeSelector
            currentMode={androidMode}
            onSelectMode={setAndroidMode}
            isFocused={focusedElement === 'mode-selector'}
          />
        </div>

        {/* Right: Actions (PWA Install, Info Modal, Fullscreen) */}
        <div className="order-2 sm:order-3 flex items-center gap-2">
          <PWAInstallButton />

          <button
            id="open-android-info-btn"
            onClick={() => setShowAndroidInfo(true)}
            title="Compatibilidad Android"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            id="toggle-fullscreen-btn"
            onClick={toggleFullscreen}
            title="Pantalla completa"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mode View Rendering */}
      {androidMode === 'auto' ? (
        <AndroidAutoView
          currentStation={currentStation}
          stations={RADIO_STATIONS}
          playerStatus={playerStatus}
          volume={volume}
          isMuted={isMuted}
          onPlayStation={playStation}
          onTogglePlayPause={togglePlayPause}
          onToggleMute={toggleMute}
          onSwitchStation={toggleAlternateStation}
        />
      ) : androidMode === 'tv' ? (
        <AndroidTVView
          currentStation={currentStation}
          stations={RADIO_STATIONS}
          playerStatus={playerStatus}
          volume={volume}
          isMuted={isMuted}
          focusedElement={focusedElement}
          analyser={analyser}
          onPlayStation={playStation}
          onTogglePlayPause={togglePlayPause}
          onToggleMute={toggleMute}
          onSwitchStation={toggleAlternateStation}
          onSetFocus={setFocusedElement}
        />
      ) : (
        /* Standard Mobile / Standalone View */
        <div className="relative z-10 w-full max-w-md my-auto">
          {/* Physical Unit Shell */}
          <section
            id="crystal-player-console"
            className="relative glass-surface rounded-[28px] p-6 sm:p-7 overflow-hidden border border-white/15 transition-all duration-500"
          >
            {/* HD Specular Diagonal Light Sweep */}
            <div className="absolute -top-24 -left-24 w-[160%] h-48 bg-gradient-to-b from-white/18 via-white/4 to-transparent rotate-[-25deg] pointer-events-none filter blur-[0.5px]" />

            {/* Secondary Curved Glass Highlight */}
            <div className="absolute top-0 right-0 w-full h-1/2 bg-radial from-white/[0.08] via-transparent to-transparent pointer-events-none" />

            {/* Top perimeter glossy rim bevel */}
            <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            {/* OLED Glass Screen Section */}
            <div className="relative rounded-2xl bg-black/60 border border-white/10 p-5 mb-6 overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),inset_0_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />
              
              {/* Top Display Status Row */}
              <div className="flex items-center justify-between mb-4">
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
                  {currentStation.badge || 'ESTÉREO'}
                </div>
              </div>

              {/* Station Display */}
              <div className="text-center my-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                  {currentStation.name}
                </h1>
                <p className="text-xs text-neutral-400 font-normal mt-1 tracking-wide">
                  {currentStation.subtitle || 'Transmisión Online'}
                </p>
              </div>

              {/* Visualizer */}
              <Visualizer isPlaying={isPlaying} isLoading={isLoading} analyser={analyser} />

              {/* Error or Notice Alert */}
              {errorMessage && (
                <div className="mt-3 py-2 px-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-between text-xs text-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="truncate">{errorMessage}</span>
                  </div>
                  <button
                    onClick={() => playStation(currentStation)}
                    className="ml-2 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] uppercase font-bold text-white transition-colors cursor-pointer"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>

            {/* Master Center Controller */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="flex items-center justify-center gap-6 sm:gap-8">
                {/* Previous / Toggle Station Button */}
                <button
                  id="switch-station-btn"
                  onClick={toggleAlternateStation}
                  title="Cambiar de estación"
                  className="w-12 h-12 rounded-full glass-button border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-transform active:scale-95 cursor-pointer shadow-lg hover:border-white/25"
                >
                  <Radio className="w-5 h-5" />
                </button>

                {/* Master Play / Pause Button */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
                      isPlaying
                        ? 'bg-white/20 blur-xl scale-125'
                        : 'bg-transparent blur-none'
                    }`}
                  />

                  <button
                    id="master-play-pause-btn"
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? 'Pausar transmisión' : 'Reproducir transmisión'}
                    className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-95 ${
                      isPlaying
                        ? 'bg-white text-black shadow-[0_0_35px_rgba(255,255,255,0.4),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.3)] border-2 border-white'
                        : 'glass-button-active text-white border-2 border-white/30 hover:border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.3)]'
                    }`}
                  >
                    <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none" />

                    {isLoading ? (
                      <RotateCw className="w-8 h-8 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-8 h-8 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 fill-current ml-1" />
                    )}
                  </button>
                </div>

                {/* Refresh / Reconnect Button */}
                <button
                  id="reconnect-stream-btn"
                  onClick={() => playStation(currentStation)}
                  title="Reconectar emisión"
                  className="w-12 h-12 rounded-full glass-button border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-transform active:scale-95 cursor-pointer shadow-lg hover:border-white/25"
                >
                  <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Volume Control Glass Slider */}
            <div className="mt-6 mb-6 px-2">
              <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-white/5">
                <button
                  id="toggle-mute-btn"
                  onClick={toggleMute}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-neutral-500" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <input
                  id="volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                />

                <span className="text-[11px] font-mono text-neutral-400 w-9 text-right">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Radio Station Selectors Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
                ESTACIONES DISPONIBLES
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                2 SINTONÍAS
              </span>
            </div>

            {/* Radio Station Selection Buttons */}
            <div className="flex flex-col gap-3">
              {RADIO_STATIONS.map((station) => (
                <StationButton
                  key={station.id}
                  station={station}
                  isActive={currentStation.id === station.id}
                  playerStatus={playerStatus}
                  onSelect={(st) => playStation(st)}
                />
              ))}
            </div>

            {/* Bottom specular rim */}
            <div className="absolute bottom-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </section>

          {/* Glossy Floor Reflection */}
          <div
            aria-hidden="true"
            className="w-full h-16 mt-2 opacity-20 pointer-events-none overflow-hidden select-none filter blur-[1px] reflection-bottom"
          >
            <div className="w-full h-full bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-[28px]" />
          </div>
        </div>
      )}

      {/* Android 3-Version Compatibility Guide Modal */}
      {showAndroidInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl glass-surface border border-white/20 p-6 sm:p-8 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Compatibilidad Total con Android</h3>
                  <p className="text-xs text-neutral-400">Diseñado para las 3 versiones de Android</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidInfo(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Android Móvil / Tablet */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2.5 font-bold text-sm text-white mb-1.5">
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>1. Android Estándar (Smartphones & Tablets)</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Totalmente instalable como <strong>PWA Standalone</strong> sin barras de navegador. Soporta reproducción continua en segundo plano, control desde la pantalla de bloqueo y panel de notificaciones.
                </p>
              </div>

              {/* 2. Android Auto */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2.5 font-bold text-sm text-white mb-1.5">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>2. Android Auto (Coche / Vehículo)</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Integrado con la <strong>MediaSession API nativa</strong>. Al conectar tu móvil por USB, inalámbrico o Bluetooth a Android Auto, la consola del coche muestra la carátula y el nombre de la radio. Los mandos del volante permiten pausar y alternar entre las emisoras. Además, incluye la vista <strong>Modo Auto</strong> con botones gigantes antirreflejos.
                </p>
              </div>

              {/* 3. Android TV */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2.5 font-bold text-sm text-white mb-1.5">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <span>3. Android TV & Google TV</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Compatible al 100% con <strong>controles remotos D-Pad</strong> (flechas y botón central OK). No necesitas ratón ni pantalla táctil: cada botón cuenta con anillos de enfoque visibles en alta definición y una vista horizontal 10-foot adaptada a pantallas de televisión.
                </p>
              </div>

              {/* 4. APK Nativa & PWA */}
              <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/30 bg-emerald-950/20">
                <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-400 mb-1.5">
                  <span className="text-base">📦</span>
                  <span>Proyecto Nativo Android (APK / Gradle)</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Estructura nativa <strong>Android Gradle / Capacitor</strong> generada y sincronizada (`/android`). Lista para compilar con Android Studio, GitHub Actions (`.github/workflows/build-apk.yml`) o instalable de inmediato en tu dispositivo con 1 toque usando el botón <strong>Instalar App</strong> (PWA).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidInfo(false)}
              className="mt-6 w-full py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Cerrar Guía
            </button>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full max-w-md text-center py-3 text-neutral-500 text-xs">
        <p className="font-light tracking-wide">
          Reproductor Minimalista en Alta Definición • Cristal Negro
        </p>
      </footer>
    </main>
  );
}

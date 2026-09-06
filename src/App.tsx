import { useState, useRef, useEffect, useCallback } from 'react';
import { RADIO_STATIONS } from './stations';
import { RadioStation, PlayerStatus } from './types';
import { StationGrid } from './components/StationGrid';
import { Visualizer } from './components/Visualizer';
import { AddStationModal } from './components/AddStationModal';
import { UpdateModal } from './components/UpdateModal';
import { AndroidTVView } from './components/AndroidTVView';
import { checkAppUpdate, UpdateInfo } from './services/updateChecker';
import { APP_VERSION } from './version';
import { useMediaSession } from './hooks/useMediaSession';
import { useTVNavigation } from './hooks/useTVNavigation';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Custom stations loaded from localStorage
  const [stations, setStations] = useState<RadioStation[]>(() => {
    try {
      const saved = localStorage.getItem('radio_cristal_stations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return RADIO_STATIONS;
  });

  const [currentStation, setCurrentStation] = useState<RadioStation>(() => stations[0] || RADIO_STATIONS[0]);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // In-App version update state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);

  // Audio elements & Web Audio Context
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Reconnection tracking
  const reconnectAttempts = useRef<number>(0);
  const reconnectTimer = useRef<number | null>(null);

  // Check for updates on mount and periodically
  const performUpdateCheck = useCallback(async (isManual: boolean = false) => {
    try {
      setIsCheckingUpdate(true);
      const update = await checkAppUpdate();
      if (update && update.hasUpdate) {
        setUpdateInfo(update);
        setIsUpdateModalOpen(true);
      } else if (isManual) {
        alert(`Radio Cristal HD está al día (Versión ${APP_VERSION})`);
      }
    } catch {
      if (isManual) {
        alert('No se pudo verificar la actualización en este momento.');
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  useEffect(() => {
    // Initial check with delay
    const initialTimer = setTimeout(() => {
      performUpdateCheck(false);
    }, 4000);

    // Periodic check every 45 minutes
    const interval = setInterval(() => {
      performUpdateCheck(false);
    }, 45 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [performUpdateCheck]);

  // Audio Context initialization on first user interaction
  const initAudioGraph = useCallback(() => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        const node = ctx.createAnalyser();
        node.fftSize = 64;
        node.smoothingTimeConstant = 0.8;

        try {
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(node);
          node.connect(ctx.destination);

          sourceNodeRef.current = source;
          audioCtxRef.current = ctx;
          setAnalyser(node);
        } catch {
          // If already connected or cross-origin fails, visualizer falls back to CSS pulse
        }
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  // Update volume and mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle Play/Pause
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;
    initAudioGraph();

    if (playerStatus === 'playing') {
      audioRef.current.pause();
      setPlayerStatus('idle');
    } else {
      try {
        setPlayerStatus('loading');
        setErrorMessage(null);
        await audioRef.current.play();
      } catch (err: unknown) {
        setPlayerStatus('error');
        setErrorMessage('Error al reproducir el flujo de audio. Reintentando...');
        console.error('Play error:', err);
      }
    }
  }, [playerStatus, initAudioGraph]);

  // Next / Previous Stations
  const nextStation = useCallback(() => {
    const currentIndex = stations.findIndex((s) => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    playStation(stations[nextIndex]);
  }, [stations, currentStation]);

  const prevStation = useCallback(() => {
    const currentIndex = stations.findIndex((s) => s.id === currentStation.id);
    const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
    playStation(stations[prevIndex]);
  }, [stations, currentStation]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Set up Hardware Media Session keys (Android / Lock Screen / Carplay / TV)
  useMediaSession({
    currentStation,
    playerStatus,
    onPlay: togglePlayPause,
    onPause: togglePlayPause,
    onNextStation: nextStation,
    onPreviousStation: prevStation,
  });

  // Switch Station
  const playStation = useCallback((station: RadioStation) => {
    if (!audioRef.current) return;
    initAudioGraph();

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    reconnectAttempts.current = 0;

    setCurrentStation(station);
    setPlayerStatus('loading');
    setErrorMessage(null);

    // Stop current stream and load new URL
    audioRef.current.pause();
    audioRef.current.src = station.streamUrl;
    audioRef.current.load();

    audioRef.current
      .play()
      .then(() => {
        setPlayerStatus('playing');
      })
      .catch((err) => {
        console.error('Auto-play blocked or failed:', err);
        setPlayerStatus('error');
        setErrorMessage('La señal no responde. Reintentando en breve...');
      });
  }, [initAudioGraph]);

  // Remove Custom Station
  const handleRemoveStation = (id: string) => {
    const filtered = stations.filter((s) => s.id !== id);
    setStations(filtered);
    localStorage.setItem('radio_cristal_stations', JSON.stringify(filtered));

    if (currentStation.id === id) {
      const fallback = filtered[0] || RADIO_STATIONS[0];
      playStation(fallback);
    }
  };

  // Add Custom Station
  const handleAddStation = (newStation: Omit<RadioStation, 'id' | 'isCustom'>) => {
    const custom: RadioStation = {
      ...newStation,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };

    const updated = [...stations, custom];
    setStations(updated);
    localStorage.setItem('radio_cristal_stations', JSON.stringify(updated));
    playStation(custom);
  };

  // Setup Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlaying = () => {
      setPlayerStatus('playing');
      setErrorMessage(null);
      reconnectAttempts.current = 0;
    };

    const handleWaiting = () => {
      setPlayerStatus('loading');
    };

    const handleError = () => {
      setPlayerStatus('error');
      
      // Auto-reconnect with exponential backoff (max 4 attempts)
      if (reconnectAttempts.current < 4) {
        reconnectAttempts.current += 1;
        const delay = reconnectAttempts.current * 2000;
        setErrorMessage(`Reconectando señal en ${delay / 1000}s (intento ${reconnectAttempts.current}/4)...`);

        reconnectTimer.current = window.setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = currentStation.streamUrl;
            audioRef.current.load();
            audioRef.current.play().catch(() => {});
          }
        }, delay);
      } else {
        setErrorMessage('Señal no disponible en este momento. Selecciona otra sintonía.');
      }
    };

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [currentStation.streamUrl]);

  // Initial stream mount
  useEffect(() => {
    if (audioRef.current && !audioRef.current.src) {
      audioRef.current.src = currentStation.streamUrl;
    }
  }, [currentStation.streamUrl]);

  // ==========================================
  // Automatic Device & Orientation Detection
  // ==========================================
  const isTVDevice = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes('large-screen') ||
      ua.includes('googletv') ||
      ua.includes('google-tv') ||
      ua.includes('android tv') ||
      ua.includes('android-tv') ||
      ua.includes('leanback') ||
      ua.includes('smart-tv') ||
      ua.includes('smarttv') ||
      ua.includes('appletv') ||
      ua.includes('hbbtv') ||
      ua.includes('crkey') ||
      ua.includes('roku') ||
      ua.includes('tizen') ||
      ua.includes('webos') ||
      ua.includes('netcast')
    );
  };

  const isTV = useRef<boolean>(isTVDevice()).current;

  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight;
    }
    return false;
  });

  useEffect(() => {
    const handleOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientation);
    }

    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientation);
      }
    };
  }, []);

  // Automatically determine view mode:
  // TV device OR horizontal/landscape orientation -> 'tv'
  // Mobile vertical/portrait -> 'mobile'
  const activeMode: 'mobile' | 'tv' = isTV || isLandscape ? 'tv' : 'mobile';

  // TV remote & keyboard D-Pad navigation
  const { focusedElement, setFocusedElement } = useTVNavigation({
    onPlayPause: togglePlayPause,
    onNextStation: nextStation,
    onPreviousStation: prevStation,
    onSelectStation: playStation,
    onToggleMute: toggleMute,
    onVolumeUp: () => {
      setVolume((v) => {
        const next = Math.min(1, Number((v + 0.05).toFixed(2)));
        if (isMuted) setIsMuted(false);
        return next;
      });
    },
    onVolumeDown: () => {
      setVolume((v) => {
        const next = Math.max(0, Number((v - 0.05).toFixed(2)));
        if (isMuted) setIsMuted(false);
        return next;
      });
    },
    onOpenAddModal: () => setIsAddModalOpen(true),
    stations,
    isTVMode: activeMode === 'tv',
  });

  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';

  return (
    <main
      className={`relative w-full bg-[#050508] text-white flex flex-col justify-center items-center select-none font-sans ${
        activeMode === 'tv'
          ? 'h-screen max-h-screen overflow-hidden p-2 sm:p-3'
          : 'h-[100dvh] max-h-[100dvh] overflow-hidden pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] px-[max(0.75rem,env(safe-area-inset-left))]'
      }`}
    >
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent rounded-full blur-3xl" />
      </div>

      {activeMode === 'tv' ? (
        /* Android TV / Tablet Landscape View with D-Pad focus */
        <div className="relative z-10 w-full max-w-5xl xl:max-w-6xl h-full flex flex-col justify-center items-center">
          <AndroidTVView
            currentStation={currentStation}
            stations={stations}
            playerStatus={playerStatus}
            volume={volume}
            isMuted={isMuted}
            focusedElement={focusedElement}
            analyser={analyser}
            errorMessage={errorMessage}
            onPlayStation={playStation}
            onTogglePlayPause={togglePlayPause}
            onToggleMute={toggleMute}
            onNextStation={nextStation}
            onPreviousStation={prevStation}
            onSetFocus={setFocusedElement}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onRemoveCustomStation={handleRemoveStation}
            onVolumeChange={(vol) => {
              setVolume(vol);
              if (isMuted) setIsMuted(false);
            }}
            onCheckUpdate={() => performUpdateCheck(true)}
            isCheckingUpdate={isCheckingUpdate}
            isLandscape={isLandscape}
          />
        </div>
      ) : (
        /* Main Mobile Screen Layout with Notch/Safe Area handling */
        <div className="relative z-10 w-full max-w-md mx-auto h-full flex flex-col justify-center items-center my-auto overflow-hidden">
          {/* Central Crystal Radio Player Console */}
          <section
            id="crystal-player-console"
            className="relative w-full glass-surface rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-5 overflow-hidden border border-white/15 transition-all duration-300 shadow-2xl flex flex-col justify-between"
          >
            {/* Specular Diagonal Reflection Light */}
            <div className="absolute -top-24 -left-24 w-[160%] h-48 bg-gradient-to-b from-white/18 via-white/4 to-transparent rotate-[-25deg] pointer-events-none filter blur-[0.5px]" />
            <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            {/* OLED Display Section */}
            <div className="relative rounded-2xl bg-black/60 border border-white/10 p-3 sm:p-4 mb-2 overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
              {/* Status Bar */}
              <div className="flex items-center justify-between mb-1.5">
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
              <div className="flex justify-center my-0.5">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-1 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 rounded-2xl blur-[1px]" />
                  <img
                    src="/icon.svg"
                    alt="Radio Cristal Icon"
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  />
                </div>
              </div>

              {/* Station Title */}
              <div className="text-center my-0.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                  {currentStation.name}
                </h1>
                <p className="text-[11px] text-neutral-400 font-normal tracking-wide">
                  {currentStation.subtitle || 'Transmisión Online'}
                </p>
              </div>

              {/* Fluid Zero-Lag Canvas Sound Visualizer */}
              <div className="mt-1">
                <Visualizer isPlaying={isPlaying} isLoading={isLoading} analyser={analyser} />
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mt-2 py-1.5 px-2.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-2 text-xs text-red-200">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Master Audio Control Buttons */}
            <div className="flex items-center justify-center gap-4 sm:gap-5 my-1 sm:my-1.5">
              {/* Previous Station */}
              <button
                id="prev-station-btn"
                onClick={prevStation}
                title="Estación anterior"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full glass-button border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-transform active:scale-90 cursor-pointer shadow-lg hover:border-white/25"
              >
                <RotateCw className="w-4 h-4 -scale-x-100" />
              </button>

              {/* Central Main Play/Pause Button */}
              <div className="relative group">
                <div
                  className={`absolute -inset-2 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? 'bg-white/20 blur-md group-hover:bg-white/30'
                      : 'bg-transparent blur-none'
                  }`}
                />

                <button
                  id="master-play-pause-btn"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? 'Pausar transmisión' : 'Reproducir transmisión'}
                  className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-200 ease-out cursor-pointer active:scale-95 ${
                    isPlaying
                      ? 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.4)] border-2 border-white'
                      : 'glass-button-active text-white border-2 border-white/30 hover:border-white/50 shadow-[0_8px_25px_rgba(0,0,0,0.8)]'
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
                id="next-station-btn"
                onClick={nextStation}
                title="Siguiente estación"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full glass-button border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-transform active:scale-90 cursor-pointer shadow-lg hover:border-white/25"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="my-1 sm:my-1.5 px-1">
              <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-2 sm:p-2.5 border border-white/5">
                <button
                  id="toggle-mute-btn"
                  onClick={toggleMute}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
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

                <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>

            {/* 2x2 Swipeable Stations Grid */}
            <div className="mt-2 pt-2 border-t border-white/5">
              <StationGrid
                stations={stations}
                currentStation={currentStation}
                playerStatus={playerStatus}
                onSelectStation={playStation}
                onRemoveStation={handleRemoveStation}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            </div>

            {/* App Version & In-App Update Trigger */}
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between px-1 text-[10px] font-mono text-neutral-500">
              <span>Radio Cristal HD v{APP_VERSION}</span>
              <div className="flex items-center gap-3">
                <button
                  id="check-updates-btn"
                  onClick={() => performUpdateCheck(true)}
                  className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Buscar actualizaciones"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{isCheckingUpdate ? 'Comprobando...' : 'Actualizar'}</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Add Custom Station Modal */}
      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStation={handleAddStation}
      />

      {/* In-App Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        updateInfo={updateInfo}
        onClose={() => setIsUpdateModalOpen(false)}
      />

      {/* Hidden Audio Element with CORS Enabled for Web Audio Analyser */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="none"
        playsInline
      />
    </main>
  );
}

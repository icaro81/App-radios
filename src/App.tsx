import { useState, useRef, useEffect, useCallback } from 'react';
import { RADIO_STATIONS } from './stations';
import { RadioStation, PlayerStatus } from './types';
import { StationGrid } from './components/StationGrid';
import { Visualizer } from './components/Visualizer';
import { AddStationModal } from './components/AddStationModal';
import { UpdateModal } from './components/UpdateModal';
import { checkAppUpdate, UpdateInfo } from './services/updateChecker';
import { APP_VERSION } from './version';
import { useMediaSession } from './hooks/useMediaSession';
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Persist stations in localStorage
  const saveStations = (newStations: RadioStation[]) => {
    setStations(newStations);
    try {
      localStorage.setItem('radio_cristal_stations', JSON.stringify(newStations));
    } catch {
      // ignore
    }
  };

  const handleAddStation = (newStation: RadioStation) => {
    const updated = [...stations, newStation];
    saveStations(updated);
    playStation(newStation);
  };

  const handleRemoveStation = (id: string) => {
    const updated = stations.filter((s) => s.id !== id);
    saveStations(updated.length > 0 ? updated : RADIO_STATIONS);
    if (currentStation.id === id) {
      playStation(updated[0] || RADIO_STATIONS[0]);
    }
  };

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Audio system initialization
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
        setErrorMessage('Transmisión reconectando o no disponible.');
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
          node.fftSize = 512;
          node.smoothingTimeConstant = 0.76;
          node.minDecibels = -85;
          node.maxDecibels = -15;

          if (audioRef.current && !sourceNodeRef.current) {
            try {
              const srcNode = ctx.createMediaElementSource(audioRef.current);
              srcNode.connect(node);
              node.connect(ctx.destination);
              sourceNodeRef.current = srcNode;
            } catch {
              // fallback if CORS restrictions apply
            }
          }

          ctx.onstatechange = () => {
            if (ctx.state === 'suspended' && playerStatus === 'playing') {
              ctx.resume().catch(() => {});
            }
          };

          analyserRef.current = node;
          audioCtxRef.current = ctx;
          setAnalyser(node);
        }
      } catch (err) {
        console.warn('Web Audio API not supported:', err);
      }
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [playerStatus]);

  // Ensure audio does not stop when screen turns off / visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Device screen locked or app sent to background
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended' && playerStatus === 'playing') {
          audioCtxRef.current.resume().catch(() => {});
        }
      } else {
        // App returned to foreground
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended' && playerStatus === 'playing') {
          audioCtxRef.current.resume().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [playerStatus]);

  // Master Play Station Handler
  const playStation = useCallback(
    (station: RadioStation) => {
      initAudioSystem();
      setErrorMessage(null);

      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;
      }

      if (currentStation.id === station.id && audio.src) {
        setPlayerStatus('loading');
        audio
          .play()
          .then(() => {
            setPlayerStatus('playing');
          })
          .catch((err) => {
            console.warn('Play interrupted:', err);
            setPlayerStatus('error');
          });
        return;
      }

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
          console.warn('Play prevented:', err);
          setPlayerStatus('idle');
        });
    },
    [currentStation.id, initAudioSystem]
  );

  // Play/Pause toggle
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

  // Switch next station
  const nextStation = useCallback(() => {
    const currentIndex = stations.findIndex((s) => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    playStation(stations[nextIndex]);
  }, [currentStation.id, stations, playStation]);

  // Switch previous station
  const prevStation = useCallback(() => {
    const currentIndex = stations.findIndex((s) => s.id === currentStation.id);
    const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
    playStation(stations[prevIndex]);
  }, [currentStation.id, stations, playStation]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // In-App update check handler
  const performUpdateCheck = useCallback(async (isManual = false) => {
    setIsCheckingUpdate(true);
    try {
      const info = await checkAppUpdate();
      setIsCheckingUpdate(false);
      if (info) {
        setUpdateInfo(info);
        if (info.hasUpdate || isManual) {
          setIsUpdateModalOpen(true);
        }
      } else if (isManual) {
        setIsUpdateModalOpen(true);
      }
    } catch {
      setIsCheckingUpdate(false);
      if (isManual) {
        setIsUpdateModalOpen(true);
      }
    }
  }, []);

  // Automatic check on app launch
  useEffect(() => {
    const timer = setTimeout(() => {
      performUpdateCheck(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [performUpdateCheck]);

  // Media Notification & Lockscreen Controls on Android
  useMediaSession({
    currentStation,
    playerStatus,
    onPlay: () => playStation(currentStation),
    onPause: () => {
      if (audioRef.current) audioRef.current.pause();
      setPlayerStatus('paused');
    },
    onNextStation: nextStation,
    onPreviousStation: prevStation,
  });

  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';

  return (
    <main className="relative min-h-screen w-full bg-[#050508] text-white flex flex-col justify-center items-center overflow-x-hidden p-3 sm:p-4 select-none font-sans">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main Mobile Screen Layout */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-3 my-auto">
        
        {/* Central Crystal Radio Player Console */}
        <section
          id="crystal-player-console"
          className="relative glass-surface rounded-[28px] p-5 sm:p-6 overflow-hidden border border-white/15 transition-all duration-500 shadow-2xl"
        >
          {/* Specular Diagonal Reflection Light */}
          <div className="absolute -top-24 -left-24 w-[160%] h-48 bg-gradient-to-b from-white/18 via-white/4 to-transparent rotate-[-25deg] pointer-events-none filter blur-[0.5px]" />
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          {/* OLED Display Section */}
          <div className="relative rounded-2xl bg-black/60 border border-white/10 p-4 sm:p-5 mb-4 overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
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
            <div className="text-center my-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                {currentStation.name}
              </h1>
              <p className="text-xs text-neutral-400 font-normal mt-0.5 tracking-wide">
                {currentStation.subtitle || 'Transmisión Online'}
              </p>
            </div>

            {/* Sound Visualizer */}
            <Visualizer isPlaying={isPlaying} isLoading={isLoading} analyser={analyser} />

            {/* Error Notice */}
            {errorMessage && (
              <div className="mt-3 py-2 px-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Master Audio Control Buttons */}
          <div className="flex items-center justify-center gap-5 my-2">
            {/* Previous Station */}
            <button
              id="prev-station-btn"
              onClick={prevStation}
              title="Estación anterior"
              className="w-12 h-12 rounded-full glass-button border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-transform active:scale-90 cursor-pointer shadow-lg hover:border-white/25"
            >
              <RotateCw className="w-4 h-4 -scale-x-100" />
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
                id="master-play-pause-btn"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pausar transmisión' : 'Reproducir transmisión'}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-95 ${
                  isPlaying
                    ? 'bg-white text-black shadow-[0_0_35px_rgba(255,255,255,0.4)] border-2 border-white'
                    : 'glass-button-active text-white border-2 border-white/30 hover:border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.8)]'
                }`}
              >
                {isLoading ? (
                  <RotateCw className="w-8 h-8 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>
            </div>

            {/* Next Station */}
            <button
              id="next-station-btn"
              onClick={nextStation}
              title="Siguiente estación"
              className="w-12 h-12 rounded-full glass-button border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-transform active:scale-90 cursor-pointer shadow-lg hover:border-white/25"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="my-3 px-1">
            <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-2.5 border border-white/5">
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
          <div className="mt-4 pt-3 border-t border-white/5">
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
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between px-1 text-[10px] font-mono text-neutral-500">
            <span>Radio Cristal HD v{APP_VERSION}</span>
            <button
              id="check-updates-btn"
              onClick={() => performUpdateCheck(true)}
              className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Buscar actualizaciones"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{isCheckingUpdate ? 'Comprobando...' : 'Buscar actualización'}</span>
            </button>
          </div>
        </section>
      </div>

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
        onCheckAgain={() => performUpdateCheck(true)}
        isChecking={isCheckingUpdate}
      />
    </main>
  );
}

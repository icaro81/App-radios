import { useState, useRef, useEffect, useCallback } from 'react';
import { RADIO_STATIONS } from './stations';
import { RadioStation, PlayerStatus } from './types';
import { StationButton } from './components/StationButton';
import { Visualizer } from './components/Visualizer';
import { AndroidTVView } from './components/AndroidTVView';
import { AndroidAutoView } from './components/AndroidAutoView';
import { AddStationModal } from './components/AddStationModal';
import { CrystalBanner } from './components/CrystalBanner';
import { useMediaSession } from './hooks/useMediaSession';
import { useTVNavigation } from './hooks/useTVNavigation';
import { useDeviceDetection, DetectedPlatform } from './utils/deviceDetector';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  AlertCircle,
  Plus,
  Tv,
  Car,
  Smartphone
} from 'lucide-react';

export default function App() {
  const { device, isNative } = useDeviceDetection();
  
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
  
  // Active UI mode: automatically selects 'tv' if Android TV detected, otherwise 'mobile'
  const [activeMode, setActiveMode] = useState<DetectedPlatform>(device);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Sync mode whenever device detection resolves
  useEffect(() => {
    setActiveMode(device);
  }, [device]);

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

  // Web Audio Analyser graph initialization
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
              // cross-origin restriction fallback
            }
          }

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

  // 1. Android Auto / Media Notification Lockscreen Support
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

  // 2. Android TV Remote Control D-Pad Navigation Support
  const { focusedElement, setFocusedElement } = useTVNavigation({
    onPlayPause: togglePlayPause,
    onNextStation: nextStation,
    onPreviousStation: prevStation,
    onSelectStation: (st) => playStation(st),
    onToggleMute: toggleMute,
    onOpenAddModal: () => setIsAddModalOpen(true),
    stations,
    isTVMode: activeMode === 'tv',
  });

  const isPlaying = playerStatus === 'playing';
  const isLoading = playerStatus === 'loading';

  return (
    <main className="relative min-h-screen w-full bg-[#050508] text-white flex flex-col justify-between overflow-x-hidden p-3 sm:p-6 select-none font-sans">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent rounded-full blur-3xl" />
      </div>

      {/* Clean Header - Automatically Native */}
      <header className="relative z-20 w-full max-w-7xl mx-auto flex items-center justify-between py-2 border-b border-white/5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-lg">
            <span className="font-extrabold text-sm tracking-wider">CR</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                RADIO CRISTAL HD
              </span>
              <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                {activeMode === 'tv' ? 'ANDROID TV' : 'NATIVO'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-light">
              Emisión Digital en Vivo
            </p>
          </div>
        </div>

        {/* Action button: Add custom stream */}
        <div className="flex items-center gap-2">
          {/* Subtle switcher for testing only if on browser, discrete */}
          <div className="hidden sm:flex items-center bg-black/40 rounded-xl p-0.5 border border-white/10 text-[11px]">
            <button
              onClick={() => setActiveMode('mobile')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                activeMode === 'mobile' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista Móvil"
            >
              <Smartphone className="w-3 h-3" />
              <span>Móvil</span>
            </button>
            <button
              onClick={() => setActiveMode('tv')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                activeMode === 'tv' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista TV"
            >
              <Tv className="w-3 h-3" />
              <span>TV</span>
            </button>
            <button
              onClick={() => setActiveMode('auto')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                activeMode === 'auto' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista Auto"
            >
              <Car className="w-3 h-3" />
              <span>Auto</span>
            </button>
          </div>

          <button
            id="open-add-station-header-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Agregar Radio</span>
          </button>
        </div>
      </header>

      {/* Main Content Area: Adapts automatically to device */}
      {activeMode === 'auto' ? (
        <AndroidAutoView
          currentStation={currentStation}
          stations={stations}
          playerStatus={playerStatus}
          volume={volume}
          isMuted={isMuted}
          onPlayStation={playStation}
          onTogglePlayPause={togglePlayPause}
          onToggleMute={toggleMute}
          onSwitchStation={nextStation}
        />
      ) : activeMode === 'tv' ? (
        <AndroidTVView
          currentStation={currentStation}
          stations={stations}
          playerStatus={playerStatus}
          volume={volume}
          isMuted={isMuted}
          focusedElement={focusedElement}
          analyser={analyser}
          onPlayStation={playStation}
          onTogglePlayPause={togglePlayPause}
          onToggleMute={toggleMute}
          onSwitchStation={nextStation}
          onSetFocus={setFocusedElement}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onRemoveCustomStation={handleRemoveStation}
        />
      ) : (
        /* Mobile / Tablet / Native View with Lateral Modern Crystal Banners */
        <div className="relative z-10 w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Lateral Crystal Banner (Desktop/Tablet) */}
          <div className="hidden lg:block lg:col-span-3">
            <CrystalBanner position="left" className="h-72" />
          </div>

          {/* Central Crystal Radio Player */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <section
              id="crystal-player-console"
              className="relative glass-surface rounded-[28px] p-6 sm:p-7 overflow-hidden border border-white/15 transition-all duration-500 shadow-2xl"
            >
              {/* Specular Diagonal Reflection Light */}
              <div className="absolute -top-24 -left-24 w-[160%] h-48 bg-gradient-to-b from-white/18 via-white/4 to-transparent rotate-[-25deg] pointer-events-none filter blur-[0.5px]" />
              <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

              {/* OLED Display Section */}
              <div className="relative rounded-2xl bg-black/60 border border-white/10 p-5 mb-5 overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                {/* Status Bar */}
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
                    {currentStation.badge || 'ESTÉREO HD'}
                  </div>
                </div>

                {/* Station Title */}
                <div className="text-center my-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                    {currentStation.name}
                  </h1>
                  <p className="text-xs text-neutral-400 font-normal mt-1 tracking-wide">
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
              <div className="flex items-center justify-center gap-5 my-3">
                {/* Previous Station */}
                <button
                  id="prev-station-btn"
                  onClick={prevStation}
                  title="Estación anterior"
                  className="w-12 h-12 rounded-full glass-button border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-transform active:scale-95 cursor-pointer shadow-lg hover:border-white/25"
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
                  className="w-12 h-12 rounded-full glass-button border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-transform active:scale-95 cursor-pointer shadow-lg hover:border-white/25"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="my-5 px-1">
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

              {/* Station List Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
                  ESTACIONES
                </span>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>AGREGAR LINK</span>
                </button>
              </div>

              {/* Stations List */}
              <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                {stations.map((station) => (
                  <StationButton
                    key={station.id}
                    station={station}
                    isActive={currentStation.id === station.id}
                    playerStatus={playerStatus}
                    onSelect={(st) => playStation(st)}
                    onRemove={handleRemoveStation}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Lateral Crystal Banner (Desktop/Tablet) */}
          <div className="hidden lg:block lg:col-span-3">
            <CrystalBanner position="right" className="h-72" />
          </div>

          {/* Mobile Bottom Crystal Banner */}
          <div className="block lg:hidden w-full max-w-md mx-auto mt-2">
            <CrystalBanner position="bottom" />
          </div>
        </div>
      )}

      {/* Add Custom Station Modal */}
      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStation={handleAddStation}
      />

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full text-center py-2 text-neutral-500 text-[11px]">
        <p className="font-light tracking-wide">
          Radio Cristal HD • Sonido Digital sin Cortes
        </p>
      </footer>
    </main>
  );
}

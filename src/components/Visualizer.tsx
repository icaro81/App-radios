import { useEffect, useRef, useState } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  isLoading: boolean;
  analyser?: AnalyserNode | null;
}

// 8 Balanced Studio Frequency Bands (Optimized for fluid mobile performance)
const FREQUENCY_BANDS = [
  { name: '60Hz', start: 1, end: 3, gain: 1.2 },     // 0: Sub / Kick punch
  { name: '150Hz', start: 3, end: 7, gain: 1.2 },    // 1: Warm Bass
  { name: '400Hz', start: 7, end: 14, gain: 1.25 },  // 2: Snare / Low-Mid
  { name: '1kHz', start: 14, end: 28, gain: 1.35 },  // 3: Vocal / Acoustic Mid
  { name: '2.5kHz', start: 28, end: 55, gain: 1.45 },// 4: Lead Presence
  { name: '5kHz', start: 55, end: 95, gain: 1.65 },  // 5: Percussion Snap
  { name: '10kHz', start: 95, end: 160, gain: 2.0 }, // 6: Hi-Hat Treble
  { name: '16kHz', start: 160, end: 245, gain: 2.4 },// 7: High Air Shimmer
];

export const Visualizer = ({ isPlaying, isLoading, analyser }: VisualizerProps) => {
  // 8 responsive studio frequency bands
  const [bars, setBars] = useState<number[]>(() => new Array(8).fill(10));
  const [peaks, setPeaks] = useState<number[]>(() => new Array(8).fill(14));

  // Active frequency domain indicator
  const [activeFrequencyRegion, setActiveFrequencyRegion] = useState<'BASS' | 'MID' | 'TREBLE' | 'BALANCE'>('BALANCE');

  // References for 60fps loop without state clutter
  const animFrameRef = useRef<number | null>(null);
  const currentBarsRef = useRef<number[]>(new Array(8).fill(10));
  const currentPeaksRef = useRef<number[]>(new Array(8).fill(14));
  const beatClockRef = useRef<number>(0);

  useEffect(() => {
    // Smooth idle baseline when paused
    if (!isPlaying) {
      const restBars = [10, 15, 12, 18, 14, 12, 9, 6];
      const restPeaks = [12, 17, 14, 20, 16, 14, 11, 8];
      setBars(restBars);
      setPeaks(restPeaks);
      currentBarsRef.current = [...restBars];
      currentPeaksRef.current = [...restPeaks];
      setActiveFrequencyRegion('BALANCE');
      return;
    }

    let freqBuffer: Uint8Array | null = null;
    if (analyser) {
      freqBuffer = new Uint8Array(analyser.frequencyBinCount);
    }

    let lastUpdate = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastUpdate) / 1000, 0.1);
      lastUpdate = timestamp;
      beatClockRef.current += dt;

      let realDataAvailable = false;
      const targetBands = new Array(8).fill(0);

      if (analyser && freqBuffer) {
        analyser.getByteFrequencyData(freqBuffer);

        let totalEnergy = 0;
        for (let i = 0; i < freqBuffer.length; i++) {
          totalEnergy += freqBuffer[i];
        }

        if (totalEnergy > 50) {
          realDataAvailable = true;

          // Calculate real audio energy for the 8 bands
          FREQUENCY_BANDS.forEach((band, index) => {
            let sum = 0;
            const count = Math.max(1, band.end - band.start);
            for (let b = band.start; b < band.end && b < freqBuffer!.length; b++) {
              sum += freqBuffer![b];
            }
            const avg = sum / count;

            let scaled = (avg / 255) * 100 * band.gain;
            scaled = Math.pow(Math.min(scaled / 100, 1), 1.25) * 100;
            targetBands[index] = Math.max(8, Math.min(100, scaled));
          });

          // Dominant frequency detection across 8 bands
          const bassEnergy = (targetBands[0] + targetBands[1]) / 2;
          const midEnergy = (targetBands[2] + targetBands[3] + targetBands[4]) / 3;
          const trebleEnergy = (targetBands[5] + targetBands[6] + targetBands[7]) / 3;

          if (bassEnergy > midEnergy && bassEnergy > trebleEnergy && bassEnergy > 52) {
            setActiveFrequencyRegion('BASS');
          } else if (trebleEnergy > bassEnergy && trebleEnergy > midEnergy && trebleEnergy > 48) {
            setActiveFrequencyRegion('TREBLE');
          } else if (midEnergy > bassEnergy && midEnergy > trebleEnergy && midEnergy > 48) {
            setActiveFrequencyRegion('MID');
          } else {
            setActiveFrequencyRegion('BALANCE');
          }
        }
      }

      // Smooth rhythmic fallback if stream is buffering or cross-origin restricted
      if (!realDataAvailable) {
        const time = beatClockRef.current;
        const bpm = 124;
        const beatPeriod = 60 / bpm;
        const beatPhase = (time % beatPeriod) / beatPeriod;
        const measurePhase = (time % (beatPeriod * 4)) / (beatPeriod * 4);

        const kickEnvelope = Math.max(0, Math.exp(-beatPhase * 7));
        const isSnareBeat = (measurePhase >= 0.25 && measurePhase < 0.5) || (measurePhase >= 0.75);
        const snareEnvelope = isSnareBeat ? Math.max(0, Math.exp(-beatPhase * 6)) : 0;
        const hihatPhase = (time % (beatPeriod / 4)) / (beatPeriod / 4);
        const hihatEnvelope = Math.max(0, Math.exp(-hihatPhase * 10));
        const bassMelody = 0.5 + 0.5 * Math.sin(time * 3.5 + Math.sin(time * 2));

        // 8 bands envelope
        targetBands[0] = Math.max(10, Math.min(100, 18 + kickEnvelope * 78 + bassMelody * 20));
        targetBands[1] = Math.max(10, Math.min(100, 16 + kickEnvelope * 65 + bassMelody * 30));
        targetBands[2] = Math.max(10, Math.min(100, 20 + snareEnvelope * 55 + Math.sin(time * 4) * 20));
        targetBands[3] = Math.max(10, Math.min(100, 22 + snareEnvelope * 65 + Math.cos(time * 5) * 25));
        targetBands[4] = Math.max(10, Math.min(100, 18 + snareEnvelope * 50 + Math.sin(time * 6) * 25));
        targetBands[5] = Math.max(10, Math.min(100, 15 + hihatEnvelope * 65 + Math.cos(time * 7) * 20));
        targetBands[6] = Math.max(10, Math.min(100, 16 + hihatEnvelope * 75 + Math.sin(time * 8) * 18));
        targetBands[7] = Math.max(8, Math.min(100, 12 + hihatEnvelope * 60 + Math.cos(time * 9) * 15));
      }

      // Ballistics smoothing (Snappy transient attack, fluid release)
      const newBars = currentBarsRef.current.map((current, idx) => {
        const target = targetBands[idx];
        if (target > current) {
          return current + (target - current) * 0.78;
        } else {
          return current - (current - target) * 0.22;
        }
      });

      // Gravity peak holders
      const newPeaks = currentPeaksRef.current.map((peak, idx) => {
        const barVal = newBars[idx];
        if (barVal >= peak) {
          return barVal;
        }
        return Math.max(barVal, peak - 1.5);
      });

      currentBarsRef.current = newBars;
      currentPeaksRef.current = newPeaks;

      setBars([...newBars]);
      setPeaks([...newPeaks]);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, analyser]);

  return (
    <div id="audio-visualizer-container" className="flex flex-col items-center justify-center py-2 w-full">
      {/* Top Frequency Region & Band Indicator */}
      <div className="flex items-center justify-between w-full max-w-sm px-3 mb-2 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 uppercase tracking-wider">RESPUESTA REAL:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest transition-colors duration-300 ${
              activeFrequencyRegion === 'BASS'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : activeFrequencyRegion === 'MID'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : activeFrequencyRegion === 'TREBLE'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'bg-white/5 text-neutral-400 border border-white/10'
            }`}
          >
            {activeFrequencyRegion}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">8 BANDAS</span>
        </div>
      </div>

      {/* 8 Studio VU Meter Bars */}
      <div className="flex items-end justify-center gap-2 sm:gap-3 h-16 px-4 py-1 w-full max-w-sm">
        {bars.map((height, index) => {
          const peakHeight = peaks[index] ?? height;
          const isHighPeak = height > 68;
          const isVeryHighPeak = height > 82;

          return (
            <div key={index} className="relative flex flex-col items-center justify-end h-full w-3.5 sm:w-4">
              {/* Floating Peak Indicator Dot */}
              {isPlaying && (
                <div
                  className="absolute w-full rounded-full transition-all duration-75 pointer-events-none"
                  style={{
                    bottom: `${Math.min(peakHeight, 100)}%`,
                    height: '2.5px',
                    backgroundColor:
                      peakHeight > 78
                        ? '#ff3b00'
                        : peakHeight > 52
                        ? '#fbbf24'
                        : '#00e676',
                    boxShadow:
                      peakHeight > 78
                        ? '0 0 6px #ff4500, 0 0 10px #ff3b00'
                        : '0 0 5px #00e676',
                  }}
                />
              )}

              {/* Main VU Bar with Rounded Studio Styling */}
              <div
                className="w-full rounded-full transition-all duration-75 ease-out"
                style={{
                  height: isLoading ? `${((index % 4) + 1) * 22}%` : `${height}%`,
                  background: isPlaying
                    ? 'linear-gradient(0deg, #00e676 0%, #39ff14 38%, #eab308 70%, #ff6a00 86%, #ff2200 100%)'
                    : 'rgba(0, 230, 118, 0.25)',
                  boxShadow: isPlaying
                    ? isVeryHighPeak
                      ? '0 0 14px rgba(255, 69, 0, 0.8), 0 0 6px rgba(57, 255, 20, 0.6)'
                      : isHighPeak
                      ? '0 0 10px rgba(251, 191, 36, 0.7), 0 0 5px rgba(57, 255, 20, 0.6)'
                      : '0 0 8px rgba(0, 230, 118, 0.65)'
                    : 'none',
                  opacity: isPlaying ? 1 : 0.35,
                  animation: isLoading
                    ? `pulse 0.8s ease-in-out ${index * 0.08}s infinite alternate`
                    : undefined,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Subtle Glass Floor Reflection */}
      <div className="flex items-start justify-center gap-2 sm:gap-3 h-5 px-4 w-full max-w-sm overflow-hidden opacity-30 filter blur-[0.6px] pointer-events-none -mt-1">
        {bars.map((height, index) => (
          <div
            key={`refl-${index}`}
            className="w-3.5 sm:w-4 rounded-full transition-all duration-75 ease-out"
            style={{
              height: `${Math.min(height * 0.35, 14)}px`,
              background: isPlaying
                ? 'linear-gradient(180deg, #00e676 0%, #39ff14 35%, #ff4500 100%)'
                : 'rgba(0, 230, 118, 0.2)',
              maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
            }}
          />
        ))}
      </div>

      {/* Frequency Distribution Range Labels */}
      <div className="flex items-center justify-between w-full max-w-sm px-3 mt-1.5 text-[9px] font-mono tracking-wider text-neutral-400">
        <span className="text-emerald-400 font-semibold">GRAVES (60-250Hz)</span>
        <span className="text-amber-400 font-semibold">MEDIOS (400-2.5kHz)</span>
        <span className="text-orange-500 font-semibold">AGUDOS (5-16kHz)</span>
      </div>

      {/* VU Decibel Level Scale Markers */}
      <div className="flex items-center justify-between w-full max-w-xs px-2 mt-1 text-[8px] font-mono tracking-widest text-neutral-500 uppercase">
        <span className="text-emerald-500/80 font-bold">-20dB</span>
        <span className="text-emerald-400/80 font-bold">-10dB</span>
        <span className="text-lime-400/80 font-bold">-3dB</span>
        <span className="text-amber-400/90 font-bold">0dB</span>
        <span className="text-orange-500 font-bold">+3dB</span>
        <span className="text-red-500 font-bold">PEAK</span>
      </div>
    </div>
  );
};

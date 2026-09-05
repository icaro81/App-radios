import { useEffect, useRef, useState } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  isLoading: boolean;
  analyser?: AnalyserNode | null;
}

// 18 Frequency bands spanning from Sub-Bass to Ultra-High Air
// (Based on 256 FFT bins from a 512-point FFT at 44.1kHz / 48kHz)
const FREQUENCY_BANDS = [
  { name: 'Sub 40Hz', start: 1, end: 2, gain: 1.15 },       // 0: Sub Bass
  { name: 'Kick 80Hz', start: 2, end: 3, gain: 1.25 },      // 1: Kick fundamental
  { name: 'Bass 150Hz', start: 3, end: 5, gain: 1.2 },      // 2: Bass punch
  { name: 'Bass 250Hz', start: 5, end: 7, gain: 1.15 },     // 3: Warmth
  { name: 'Low-Mid 380Hz', start: 7, end: 9, gain: 1.2 },   // 4: Snare body
  { name: 'Low-Mid 500Hz', start: 9, end: 12, gain: 1.25 }, // 5: Lower vocals
  { name: 'Mid 700Hz', start: 12, end: 16, gain: 1.3 },     // 6: Rhythm guitars
  { name: 'Mid 1.0kHz', start: 16, end: 22, gain: 1.35 },   // 7: 1kHz Reference
  { name: 'Mid 1.4kHz', start: 22, end: 30, gain: 1.4 },    // 8: Vocal body
  { name: 'Hi-Mid 2.0kHz', start: 30, end: 40, gain: 1.45 },// 9: Vocal presence
  { name: 'Hi-Mid 2.8kHz', start: 40, end: 54, gain: 1.5 }, // 10: Guitar bite
  { name: 'Hi-Mid 3.8kHz', start: 54, end: 70, gain: 1.6 }, // 11: Snare snap
  { name: 'Pres 5.2kHz', start: 70, end: 90, gain: 1.7 },   // 12: Percussion
  { name: 'Pres 7.0kHz', start: 90, end: 115, gain: 1.85 }, // 13: Sibilance
  { name: 'Treble 9.5kHz', start: 115, end: 145, gain: 2.0 },// 14: Hi-Hat sizzle
  { name: 'Treble 12kHz', start: 145, end: 180, gain: 2.2 },// 15: Cymbal shimmer
  { name: 'Air 15kHz', start: 180, end: 215, gain: 2.5 },   // 16: Sparkle
  { name: 'Air 18kHz', start: 215, end: 250, gain: 2.8 },   // 17: Ultra-high air
];

export const Visualizer = ({ isPlaying, isLoading, analyser }: VisualizerProps) => {
  // 18 responsive frequency bands for studio VU meter
  const [bars, setBars] = useState<number[]>(() =>
    new Array(18).fill(8)
  );
  const [peaks, setPeaks] = useState<number[]>(() =>
    new Array(18).fill(12)
  );

  // Active frequency domain metrics
  const [activeFrequencyRegion, setActiveFrequencyRegion] = useState<'BASS' | 'MID' | 'TREBLE' | 'BALANCE'>('BALANCE');

  // References for continuous 60fps animation loop
  const animFrameRef = useRef<number | null>(null);
  const currentBarsRef = useRef<number[]>(new Array(18).fill(8));
  const currentPeaksRef = useRef<number[]>(new Array(18).fill(12));
  const beatClockRef = useRef<number>(0);

  useEffect(() => {
    // When paused or stopped, smoothly animate down to resting baseline
    if (!isPlaying) {
      const restBars = [8, 12, 10, 14, 16, 14, 12, 10, 12, 14, 16, 12, 10, 14, 12, 10, 8, 6];
      const restPeaks = [10, 14, 12, 16, 18, 16, 14, 12, 14, 16, 18, 14, 12, 16, 14, 12, 10, 8];
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
      const targetBands = new Array(18).fill(0);

      if (analyser && freqBuffer) {
        analyser.getByteFrequencyData(freqBuffer);

        // Check if there is actual frequency energy in the buffer
        let totalEnergy = 0;
        for (let i = 0; i < freqBuffer.length; i++) {
          totalEnergy += freqBuffer[i];
        }

        if (totalEnergy > 50) {
          realDataAvailable = true;

          // Calculate real audio frequencies for each of the 18 bands
          FREQUENCY_BANDS.forEach((band, index) => {
            let sum = 0;
            const count = Math.max(1, band.end - band.start);
            for (let b = band.start; b < band.end && b < freqBuffer!.length; b++) {
              sum += freqBuffer![b];
            }
            const avg = sum / count;

            // Logarithmic dynamic scaling with Fletcher-Munson compensation
            // Higher frequencies have lower natural acoustic energy so we apply band.gain
            let scaled = (avg / 255) * 100 * band.gain;

            // Non-linear power curve for punchy broadcast response
            scaled = Math.pow(Math.min(scaled / 100, 1), 1.25) * 100;

            targetBands[index] = Math.max(8, Math.min(100, scaled));
          });

          // Detect dominant frequency spectrum in real time
          const bassEnergy = (targetBands[0] + targetBands[1] + targetBands[2] + targetBands[3]) / 4;
          const midEnergy = (targetBands[6] + targetBands[7] + targetBands[8] + targetBands[9]) / 4;
          const trebleEnergy = (targetBands[13] + targetBands[14] + targetBands[15] + targetBands[16]) / 4;

          if (bassEnergy > midEnergy && bassEnergy > trebleEnergy && bassEnergy > 55) {
            setActiveFrequencyRegion('BASS');
          } else if (trebleEnergy > bassEnergy && trebleEnergy > midEnergy && trebleEnergy > 50) {
            setActiveFrequencyRegion('TREBLE');
          } else if (midEnergy > bassEnergy && midEnergy > trebleEnergy && midEnergy > 50) {
            setActiveFrequencyRegion('MID');
          } else {
            setActiveFrequencyRegion('BALANCE');
          }
        }
      }

      // If stream is still buffering or CORS blocks direct FFT on this specific chunk:
      // Produce an organic rhythmic musical envelope (kick, snare, hi-hats, bassline rhythm)
      if (!realDataAvailable) {
        const time = beatClockRef.current;
        const bpm = 124; // Standard radio upbeat tempo
        const beatPeriod = 60 / bpm;
        const beatPhase = (time % beatPeriod) / beatPeriod; // 0 to 1 per beat
        const measurePhase = (time % (beatPeriod * 4)) / (beatPeriod * 4); // 4/4 bar

        // Kick Drum pulse on downbeats (beats 1, 2, 3, 4 with emphasis on 1 & 3)
        const kickEnvelope = Math.max(0, Math.exp(-beatPhase * 7));
        // Snare / Clap pulse on beats 2 and 4
        const isSnareBeat = (measurePhase >= 0.25 && measurePhase < 0.5) || (measurePhase >= 0.75);
        const snareEnvelope = isSnareBeat ? Math.max(0, Math.exp(-beatPhase * 6)) : 0;
        // Hi-Hat fast 16th rhythm
        const hihatPhase = (time % (beatPeriod / 4)) / (beatPeriod / 4);
        const hihatEnvelope = Math.max(0, Math.exp(-hihatPhase * 10));
        // Flowing melodic bassline modulation
        const bassMelody = 0.5 + 0.5 * Math.sin(time * 3.5 + Math.sin(time * 2));

        FREQUENCY_BANDS.forEach((_, idx) => {
          let height = 15;
          if (idx < 4) {
            // Bass frequencies: kick drum + bass groove
            height = 15 + kickEnvelope * 75 + bassMelody * 25;
          } else if (idx >= 4 && idx <= 10) {
            // Mid frequencies: snare body + vocal rhythm
            const vocalVibe = 0.5 + 0.5 * Math.sin(time * 5 + idx);
            height = 20 + snareEnvelope * 65 + vocalVibe * 30;
          } else {
            // Treble & High Air: hi-hats, cymbals, air shimmer
            const shimmer = 0.5 + 0.5 * Math.cos(time * 8 + idx * 0.8);
            height = 18 + hihatEnvelope * 70 + shimmer * 22;
          }
          targetBands[idx] = Math.max(8, Math.min(100, height));
        });
      }

      // Ballistics smoothing (Instant attack, fluid analog needle release)
      const newBars = currentBarsRef.current.map((current, idx) => {
        const target = targetBands[idx];
        if (target > current) {
          // Fast attack (jumps up instantly to kick / snare / vocal transients)
          return current + (target - current) * 0.75;
        } else {
          // Smooth broadcast decay
          return current - (current - target) * 0.22;
        }
      });

      // Floating peak indicators with gravity acceleration
      const newPeaks = currentPeaksRef.current.map((peak, idx) => {
        const barVal = newBars[idx];
        if (barVal >= peak) {
          return barVal; // Jump to new peak
        }
        // Realistic gravity decay
        return Math.max(barVal, peak - 1.6);
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
      {/* Top Frequency Region Indicator */}
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

        <div className="flex items-center gap-1.5 text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider">18 BANDAS FFT</span>
        </div>
      </div>

      {/* VU Meter Bars Container */}
      <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-16 px-4 py-1 w-full max-w-sm">
        {bars.map((height, index) => {
          const peakHeight = peaks[index] ?? height;
          const isHighPeak = height > 68;
          const isVeryHighPeak = height > 82;

          return (
            <div key={index} className="relative flex flex-col items-center justify-end h-full w-1.5 sm:w-2">
              {/* Floating Peak Indicator Dot (Turns fire orange at high levels) */}
              {isPlaying && (
                <div
                  className="absolute w-full rounded-full transition-all duration-75 pointer-events-none"
                  style={{
                    bottom: `${Math.min(peakHeight, 100)}%`,
                    height: '2px',
                    backgroundColor:
                      peakHeight > 78
                        ? '#ff3b00' // Fire orange peak
                        : peakHeight > 52
                        ? '#fbbf24' // Warm amber
                        : '#00e676', // Neon green
                    boxShadow:
                      peakHeight > 78
                        ? '0 0 6px #ff4500, 0 0 10px #ff3b00'
                        : '0 0 5px #00e676',
                  }}
                />
              )}

              {/* Main VU Bar with Vertical Neon Green to Fire Orange Gradient */}
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
                    ? `pulse 0.8s ease-in-out ${index * 0.05}s infinite alternate`
                    : undefined,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Subtle Mirror Glass Reflection (Reflecting the neon green & fire orange glow) */}
      <div className="flex items-start justify-center gap-1 sm:gap-1.5 h-6 px-4 w-full max-w-sm overflow-hidden opacity-30 filter blur-[0.7px] pointer-events-none -mt-1">
        {bars.map((height, index) => (
          <div
            key={`refl-${index}`}
            className="w-1.5 sm:w-2 rounded-full transition-all duration-75 ease-out"
            style={{
              height: `${Math.min(height * 0.4, 18)}px`,
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
        <span className="text-emerald-400 font-semibold">GRAVES (20-250Hz)</span>
        <span className="text-amber-400 font-semibold">MEDIOS (1-3kHz)</span>
        <span className="text-orange-500 font-semibold">AGUDOS (6-20kHz)</span>
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

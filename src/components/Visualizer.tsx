import { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  isLoading: boolean;
  analyser?: AnalyserNode | null;
}

// 8 Balanced Studio Frequency Bands (Optimized for fluid performance on TV Box & Mobile)
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const regionBadgeRef = useRef<HTMLSpanElement | null>(null);

  // References for zero-allocation 60fps loop
  const animFrameRef = useRef<number | null>(null);
  const currentBarsRef = useRef<number[]>([10, 15, 12, 18, 14, 12, 9, 6]);
  const currentPeaksRef = useRef<number[]>([12, 17, 14, 20, 16, 14, 11, 8]);
  const beatClockRef = useRef<number>(0);
  const lastRegionUpdateRef = useRef<number>(0);
  const currentRegionRef = useRef<'BASS' | 'MID' | 'TREBLE' | 'BALANCE'>('BALANCE');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let freqBuffer: Uint8Array | null = null;
    if (analyser) {
      freqBuffer = new Uint8Array(analyser.frequencyBinCount);
    }

    let lastUpdate = performance.now();

    const drawBars = (bars: number[], peaks: number[], isLive: boolean) => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 8;
      const barWidth = 14;
      const spacing = (width - numBars * barWidth) / (numBars + 1);
      const maxHeight = height - 10; // leave top room for peak line

      for (let i = 0; i < numBars; i++) {
        const x = spacing + i * (barWidth + spacing);
        const barH = Math.max(3, (bars[i] / 100) * maxHeight);
        const y = height - barH - 2;

        // Draw Bar
        if (isLive) {
          // Pre-calculated vertical gradient for active playback
          const grad = ctx.createLinearGradient(0, height, 0, 0);
          grad.addColorStop(0, '#00e676');
          grad.addColorStop(0.35, '#39ff14');
          grad.addColorStop(0.68, '#eab308');
          grad.addColorStop(0.85, '#ff6a00');
          grad.addColorStop(1.0, '#ff2200');
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = 'rgba(0, 230, 118, 0.25)';
        }

        // Rounded bar top
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, [4, 4, 2, 2]);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barWidth, barH);
        }

        // Draw Peak indicator
        if (isLive) {
          const peakH = Math.max(barH, (peaks[i] / 100) * maxHeight);
          const peakY = Math.max(1, height - peakH - 4);
          ctx.fillStyle = peakH > 78 ? '#ff3b00' : peakH > 52 ? '#fbbf24' : '#00e676';
          ctx.fillRect(x, peakY, barWidth, 2);
        }
      }
    };

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastUpdate) / 1000, 0.1);
      lastUpdate = timestamp;
      beatClockRef.current += dt;

      if (!isPlaying) {
        // Idle state
        const restBars = [10, 14, 12, 16, 13, 11, 8, 6];
        const restPeaks = [12, 16, 14, 18, 15, 13, 10, 8];
        drawBars(restBars, restPeaks, false);
        if (regionBadgeRef.current && currentRegionRef.current !== 'BALANCE') {
          currentRegionRef.current = 'BALANCE';
          regionBadgeRef.current.textContent = 'BALANCE';
          regionBadgeRef.current.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest bg-white/5 text-neutral-400 border border-white/10';
        }
        return;
      }

      let realDataAvailable = false;
      const targetBands = [0, 0, 0, 0, 0, 0, 0, 0];

      if (analyser && freqBuffer) {
        analyser.getByteFrequencyData(freqBuffer);

        let totalEnergy = 0;
        for (let i = 0; i < freqBuffer.length; i++) {
          totalEnergy += freqBuffer[i];
        }

        if (totalEnergy > 50) {
          realDataAvailable = true;

          for (let i = 0; i < FREQUENCY_BANDS.length; i++) {
            const band = FREQUENCY_BANDS[i];
            let sum = 0;
            const count = Math.max(1, band.end - band.start);
            for (let b = band.start; b < band.end && b < freqBuffer.length; b++) {
              sum += freqBuffer[b];
            }
            const avg = sum / count;
            let scaled = (avg / 255) * 100 * band.gain;
            scaled = Math.pow(Math.min(scaled / 100, 1), 1.25) * 100;
            targetBands[i] = Math.max(8, Math.min(100, scaled));
          }

          // Dominant region detection (throttled DOM update every 400ms)
          if (timestamp - lastRegionUpdateRef.current > 400 && regionBadgeRef.current) {
            lastRegionUpdateRef.current = timestamp;
            const bassEnergy = (targetBands[0] + targetBands[1]) / 2;
            const midEnergy = (targetBands[2] + targetBands[3] + targetBands[4]) / 3;
            const trebleEnergy = (targetBands[5] + targetBands[6] + targetBands[7]) / 3;

            let newRegion: 'BASS' | 'MID' | 'TREBLE' | 'BALANCE' = 'BALANCE';
            if (bassEnergy > midEnergy && bassEnergy > trebleEnergy && bassEnergy > 52) {
              newRegion = 'BASS';
            } else if (trebleEnergy > bassEnergy && trebleEnergy > midEnergy && trebleEnergy > 48) {
              newRegion = 'TREBLE';
            } else if (midEnergy > bassEnergy && midEnergy > trebleEnergy && midEnergy > 48) {
              newRegion = 'MID';
            }

            if (newRegion !== currentRegionRef.current) {
              currentRegionRef.current = newRegion;
              regionBadgeRef.current.textContent = newRegion;
              if (newRegion === 'BASS') {
                regionBadgeRef.current.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
              } else if (newRegion === 'MID') {
                regionBadgeRef.current.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/40';
              } else if (newRegion === 'TREBLE') {
                regionBadgeRef.current.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/40';
              } else {
                regionBadgeRef.current.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest bg-white/5 text-neutral-400 border border-white/10';
              }
            }
          }
        }
      }

      // Smooth rhythmic fallback if stream is buffering or CORS restricted
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

        targetBands[0] = Math.max(10, Math.min(100, 18 + kickEnvelope * 78 + bassMelody * 20));
        targetBands[1] = Math.max(10, Math.min(100, 16 + kickEnvelope * 65 + bassMelody * 30));
        targetBands[2] = Math.max(10, Math.min(100, 20 + snareEnvelope * 55 + Math.sin(time * 4) * 20));
        targetBands[3] = Math.max(10, Math.min(100, 22 + snareEnvelope * 65 + Math.cos(time * 5) * 25));
        targetBands[4] = Math.max(10, Math.min(100, 18 + snareEnvelope * 50 + Math.sin(time * 6) * 25));
        targetBands[5] = Math.max(10, Math.min(100, 15 + hihatEnvelope * 65 + Math.cos(time * 7) * 20));
        targetBands[6] = Math.max(10, Math.min(100, 16 + hihatEnvelope * 75 + Math.sin(time * 8) * 18));
        targetBands[7] = Math.max(8, Math.min(100, 12 + hihatEnvelope * 60 + Math.cos(time * 9) * 15));
      }

      // Ballistics smoothing
      for (let i = 0; i < 8; i++) {
        const cur = currentBarsRef.current[i];
        const tgt = targetBands[i];
        if (tgt > cur) {
          currentBarsRef.current[i] = cur + (tgt - cur) * 0.78;
        } else {
          currentBarsRef.current[i] = cur - (cur - tgt) * 0.22;
        }

        const barVal = currentBarsRef.current[i];
        const peak = currentPeaksRef.current[i];
        if (barVal >= peak) {
          currentPeaksRef.current[i] = barVal;
        } else {
          currentPeaksRef.current[i] = Math.max(barVal, peak - 1.4);
        }
      }

      // Render directly to Canvas without React setState
      drawBars(currentBarsRef.current, currentPeaksRef.current, true);

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
    <div id="audio-visualizer-container" className="flex flex-col items-center justify-center py-1 w-full select-none">
      {/* Top Frequency Region & Band Indicator */}
      <div className="flex items-center justify-between w-full max-w-xs sm:max-w-sm px-2 mb-1 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 uppercase tracking-wider text-[9px]">RESPUESTA:</span>
          <span
            ref={regionBadgeRef}
            className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest bg-white/5 text-neutral-400 border border-white/10"
          >
            BALANCE
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">8 BANDAS</span>
        </div>
      </div>

      {/* High-Performance Canvas VU Meter */}
      <div className="flex items-center justify-center w-full max-w-xs sm:max-w-sm h-12 sm:h-14">
        <canvas
          ref={canvasRef}
          width={280}
          height={52}
          className="w-[280px] h-[52px] block filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
        />
      </div>

      {/* VU Decibel Level Scale Markers */}
      <div className="flex items-center justify-between w-full max-w-xs px-2 mt-0.5 text-[8px] font-mono tracking-widest text-neutral-500 uppercase">
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

import React from 'react';

interface SunMoonToggleProps {
  skin: 'black' | 'galena';
  onToggle: () => void;
  onSelectSkin: (targetSkin: 'black' | 'galena') => void;
}

/**
 * Intuitive Luna 🌙 & Sol ☀️ Skin Switcher:
 * - Luna 🌙 activa el skin clásico Negro Cristal
 * - Sol ☀️ activa el skin Celeste Galena
 * Siluetas claras, nítidas y reconocibles con efecto cristal.
 */
export const SunMoonToggle: React.FC<SunMoonToggleProps> = ({
  skin,
  onToggle,
  onSelectSkin,
}) => {
  const isBlack = skin === 'black';

  return (
    <div
      role="group"
      aria-label="Selector de tema: Luna (Negro Cristal) o Sol (Celeste Galena)"
      className={`fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-40 flex items-center p-0.5 rounded-full backdrop-blur-md transition-all duration-300 select-none shadow-lg ${
        isBlack
          ? 'glass-button border border-white/20 bg-black/60 shadow-[0_4px_16px_rgba(0,0,0,0.7)]'
          : 'glass-button border border-black/20 bg-white/45 shadow-[0_4px_16px_rgba(8,51,68,0.25)]'
      }`}
    >
      {/* Botón Luna 🌙 (Activa skin Negro Cristal) */}
      <button
        id="theme-moon-btn"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectSkin('black');
        }}
        aria-pressed={isBlack}
        aria-label="Activar skin Negro Cristal (Luna 🌙)"
        title="Luna 🌙: Skin Negro Cristal"
        className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
          isBlack
            ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.45)] scale-105 font-bold'
            : 'text-black/50 hover:text-black hover:bg-black/5 border border-transparent'
        }`}
      >
        {/* Silueta de Luna Creciente 🌙 */}
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 transition-transform duration-200"
          aria-hidden="true"
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill="currentColor"
          />
        </svg>
        <span className="hidden sm:inline text-[10px] font-mono tracking-tight font-semibold">
          Luna
        </span>
      </button>

      {/* Botón Sol ☀️ (Activa skin Celeste Galena) */}
      <button
        id="theme-sun-btn"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectSkin('galena');
        }}
        aria-pressed={!isBlack}
        aria-label="Activar skin Celeste Galena (Sol ☀️)"
        title="Sol ☀️: Skin Celeste Galena"
        className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
          !isBlack
            ? 'bg-black text-amber-300 border border-neutral-900 shadow-[0_0_10px_rgba(0,0,0,0.35)] scale-105 font-bold'
            : 'text-white/50 hover:text-white hover:bg-white/10 border border-transparent'
        }`}
      >
        {/* Silueta de Sol con Rayos ☀️ */}
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 transition-transform duration-200"
          aria-hidden="true"
        >
          {/* Disco solar central */}
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          {/* Rayos de sol */}
          <path
            d="M12 2v2.5M12 19.5v2.5M2 12h2.5M19.5 12h2.5M4.93 4.93l1.8 1.8M17.27 17.27l1.8 1.8M4.93 19.07l1.8-1.8M17.27 6.73l1.8-1.8"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
        <span className="hidden sm:inline text-[10px] font-mono tracking-tight font-semibold">
          Sol
        </span>
      </button>
    </div>
  );
};

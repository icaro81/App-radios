import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone } from 'lucide-react';

export const PWAInstallButton = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as standalone app, show clean subtle status badge or return null
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-semibold">Instalado</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition-all shadow-[0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // Fallback for Android Chrome or iOS (guiding the user to add to home screen)
  return (
    <>
      <button
        id="pwa-guide-btn"
        onClick={() => setShowGuide(true)}
        title="Instalar en Android / Móvil"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl glass-surface border border-white/20 p-6 text-white shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Instalar Radio Player</h3>
                <p className="text-xs text-neutral-400">Compatible con Android, TV y Auto</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 bg-black/40 p-4 rounded-xl border border-white/5">
              {isIOS ? (
                <>
                  <p>1. Pulsa el botón <strong>Compartir</strong> en la barra de Safari.</p>
                  <p>2. Desplázate hacia abajo y selecciona <strong>Añadir a la pantalla de inicio</strong>.</p>
                </>
              ) : (
                <>
                  <p>1. Pulsa los <strong>tres puntos (⋮)</strong> en la esquina superior de Chrome en tu Android.</p>
                  <p>2. Selecciona <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</p>
                  <p>3. En Android TV o navegadores de TV, puedes guardarla en favoritos o añadirla como acceso directo.</p>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

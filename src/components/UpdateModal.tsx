import React, { useState } from 'react';
import { UpdateInfo } from '../services/updateChecker';
import { DEFAULT_REPO } from '../version';
import { Download, X, Sparkles, CheckCircle2, RefreshCw, Github, AlertTriangle } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  updateInfo: UpdateInfo | null;
  onClose: () => void;
  onCheckAgain: () => void;
  isChecking?: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  updateInfo,
  onClose,
  onCheckAgain,
  isChecking,
}) => {
  const [showRepoConfig, setShowRepoConfig] = useState<boolean>(false);
  const [repoInput, setRepoInput] = useState<string>(() => {
    const saved = localStorage.getItem('radio_cristal_github_repo');
    if (saved && saved !== 'icarojose81/RadioCristal') {
      return saved;
    }
    return DEFAULT_REPO;
  });
  const [repoSaved, setRepoSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveRepo = () => {
    const clean = repoInput.trim() || DEFAULT_REPO;
    localStorage.setItem('radio_cristal_github_repo', clean);
    setRepoInput(clean);
    setRepoSaved(true);
    setTimeout(() => setRepoSaved(false), 2000);
    onCheckAgain();
  };

  const hasUpdate = updateInfo?.hasUpdate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-3xl p-6 overflow-hidden glass-surface border border-white/20 shadow-[0_16px_50px_rgba(0,0,0,0.9)] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular sheen reflection */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              hasUpdate
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-white/10 text-white border-white/20'
            }`}
          >
            {hasUpdate ? (
              <Sparkles className="w-6 h-6 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              {hasUpdate ? '¡Nueva versión disponible!' : 'Aplicación actualizada'}
            </h2>
            <p className="text-xs text-neutral-400">
              {hasUpdate
                ? `Actualización ${updateInfo?.latestVersion}`
                : `Tienes la versión más reciente (v${updateInfo?.currentVersion})`}
            </p>
          </div>
        </div>

        {/* Content Box */}
        {hasUpdate ? (
          <div className="space-y-3 mb-5">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Tu versión actual:</span>
                <span className="text-neutral-300 font-semibold">v{updateInfo?.currentVersion}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Nueva versión:</span>
                <span className="text-emerald-400 font-bold">{updateInfo?.latestVersion}</span>
              </div>
            </div>

            {/* Notes */}
            {updateInfo?.releaseNotes && (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-neutral-300 space-y-1 max-h-36 overflow-y-auto">
                <span className="block font-semibold text-white tracking-wide text-[11px] uppercase">
                  Novedades de la actualización:
                </span>
                <p className="text-neutral-300 leading-relaxed whitespace-pre-line text-xs">
                  {updateInfo.releaseNotes}
                </p>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-tight">
              ✓ Se instalará directamente sobre tu aplicación actual. No perderás tus emisoras ni configuraciones.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center my-4 space-y-2">
            <p className="text-sm text-neutral-300">
              Estás disfrutando de la versión más reciente de <strong className="text-white">Radio Cristal HD</strong>.
            </p>
            <p className="text-xs text-neutral-500">
              Versión instalada: v{updateInfo?.currentVersion || '1.0.4'}
            </p>

            {updateInfo?.repoNotFound && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-300/90 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Repositorio Privado o no encontrado</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Si tu repositorio en GitHub es <strong>Privado</strong>, GitHub no permite que la app consulte las actualizaciones sin iniciar sesión.
                </p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Para habilitar actualizaciones automáticas, en GitHub ve a: <br/>
                  <strong className="text-white">Settings → Danger Zone → Change visibility → Make public</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {hasUpdate ? (
            <>
              <a
                href={updateInfo?.downloadUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all active:scale-[0.98] shadow-[0_0_25px_rgba(255,255,255,0.3)] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Actualizar ahora (Descargar APK)
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Recordármelo más tarde
              </button>
            </>
          ) : (
            <button
              onClick={onCheckAgain}
              disabled={isChecking}
              className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Comprobando...' : 'Volver a comprobar'}
            </button>
          )}
        </div>

        {/* Small GitHub Repo Config Collapsible */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => setShowRepoConfig(!showRepoConfig)}
            className="flex items-center justify-between w-full text-[11px] text-neutral-500 hover:text-neutral-400 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5" />
              Repositorio de origen de versiones
            </span>
            <span>{showRepoConfig ? '▲' : '▼'}</span>
          </button>

          {showRepoConfig && (
            <div className="mt-2.5 p-3 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
              <label className="block text-[10px] text-neutral-400">
                Usuario / Repositorio en GitHub:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="ej. tu-usuario/tu-repo"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={handleSaveRepo}
                  className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  {repoSaved ? '¡Listo!' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

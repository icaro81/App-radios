import React, { useState, useEffect } from 'react';
import { UpdateInfo } from '../services/updateChecker';
import { isNativeUpdaterAvailable, startInAppUpdate } from '../services/inAppUpdater';
import { DEFAULT_REPO, CURRENT_CHANGELOG } from '../version';
import { Download, X, Sparkles, CheckCircle2, RefreshCw, Github, AlertTriangle, ChevronDown, ChevronUp, FileText, Loader2 } from 'lucide-react';

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
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'installing' | 'error'>('idle');
  const [downloadPercent, setDownloadPercent] = useState<number>(0);
  const [bytesDownloaded, setBytesDownloaded] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [repoInput, setRepoInput] = useState<string>(() => {
    const saved = localStorage.getItem('radio_cristal_github_repo');
    if (saved && saved !== 'icarojose81/RadioCristal') {
      return saved;
    }
    return DEFAULT_REPO;
  });
  const [repoSaved, setRepoSaved] = useState<boolean>(false);

  // Reset download state whenever modal opens or updateInfo changes
  useEffect(() => {
    if (isOpen) {
      setDownloadStatus('idle');
      setDownloadPercent(0);
      setBytesDownloaded(0);
      setTotalBytes(0);
      setErrorMessage('');
    }
  }, [isOpen, updateInfo?.latestVersion]);

  // TV Remote D-Pad / Back support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.keyCode || e.which;
      // Close on Escape or Android TV Back (code 4)
      if (e.key === 'Escape' || code === 27 || code === 4) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasUpdate = updateInfo?.hasUpdate;
  const isNative = isNativeUpdaterAvailable();

  const handleStartInAppUpdate = () => {
    if (!updateInfo?.downloadUrl) return;

    setDownloadStatus('downloading');
    setDownloadPercent(0);
    setBytesDownloaded(0);
    setTotalBytes(0);
    setErrorMessage('');

    startInAppUpdate({
      apkUrl: updateInfo.downloadUrl,
      onProgress: (percent, read, total) => {
        setDownloadStatus('downloading');
        setDownloadPercent(percent);
        setBytesDownloaded(read);
        setTotalBytes(total);
      },
      onSuccess: () => {
        setDownloadStatus('installing');
      },
      onError: (err) => {
        setDownloadStatus('error');
        setErrorMessage(err);
      },
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleSaveRepo = () => {
    const clean = repoInput.trim() || DEFAULT_REPO;
    localStorage.setItem('radio_cristal_github_repo', clean);
    setRepoInput(clean);
    setRepoSaved(true);
    setTimeout(() => setRepoSaved(false), 2000);
    onCheckAgain();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 overflow-hidden glass-surface border border-white/20 shadow-[0_16px_50px_rgba(0,0,0,0.9)] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular sheen reflection */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal Centered Hero */}
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg mb-3 ${
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

          <h2 className="text-base font-bold tracking-wide text-white">
            {hasUpdate ? 'Nueva versión disponible' : 'Aplicación al día'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {hasUpdate
              ? `Versión ${updateInfo?.latestVersion}`
              : `Versión instalada: v${updateInfo?.currentVersion || '1.0'}`}
          </p>
        </div>

        {/* Action Area */}
        <div className="space-y-2 pt-1">
          {hasUpdate ? (
            <>
              {downloadStatus === 'downloading' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      Descargando actualización...
                    </span>
                    <span className="font-bold text-emerald-400">
                      {downloadPercent >= 0 ? `${downloadPercent}%` : '...'}
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150 rounded-full"
                      style={{ width: `${Math.max(4, downloadPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>
                      {totalBytes > 0
                        ? `${formatBytes(bytesDownloaded)} de ${formatBytes(totalBytes)}`
                        : `${formatBytes(bytesDownloaded)} descargados`}
                    </span>
                    <span className="text-[10px] text-neutral-500">Sin salir de la app</span>
                  </div>
                </div>
              )}

              {downloadStatus === 'installing' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-300 text-xs font-semibold">
                    <Sparkles className="w-4 h-4 animate-pulse text-emerald-400" />
                    <span>¡Descarga completa!</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    Abriendo el instalador del sistema. Pulsa <strong className="text-white font-bold">"Instalar"</strong> para completar la actualización.
                  </p>
                </div>
              )}

              {downloadStatus === 'error' && (
                <div className="space-y-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Error en la descarga interna</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 break-words">
                    {errorMessage || 'No se pudo completar la descarga.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleStartInAppUpdate}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-all cursor-pointer text-center"
                    >
                      Reintentar
                    </button>
                    {updateInfo?.downloadUrl && (
                      <a
                        href={updateInfo.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-mono transition-all cursor-pointer"
                      >
                        Vía navegador
                      </a>
                    )}
                  </div>
                </div>
              )}

              {downloadStatus === 'idle' && (
                <>
                  {isNative ? (
                    <button
                      onClick={handleStartInAppUpdate}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer tracking-wide uppercase font-mono"
                    >
                      <Download className="w-4 h-4 text-black" />
                      Descargar e instalar directamente
                    </button>
                  ) : (
                    <a
                      href={updateInfo?.downloadUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer tracking-wide uppercase font-mono"
                    >
                      <Download className="w-4 h-4 text-black" />
                      Descargar actualización
                    </a>
                  )}

                  {isNative && updateInfo?.downloadUrl && (
                    <div className="text-center pt-0.5">
                      <a
                        href={updateInfo.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        ¿Prefieres descargar con el navegador? Pulsa aquí
                      </a>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Ahora no
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Entendido
              </button>

              <button
                onClick={onCheckAgain}
                disabled={isChecking}
                className="w-full py-1.5 text-[11px] text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Comprobando...' : 'Volver a comprobar'}</span>
              </button>
            </>
          )}
        </div>

        {/* Optional Collapsible Details Toggle */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer py-1"
          >
            <span>{showDetails ? 'Ocultar detalles' : 'Más detalles'}</span>
            {showDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-150 text-xs">
              {/* Version Comparison */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Actual: v{updateInfo?.currentVersion}</span>
                <span className="text-neutral-500">→</span>
                <span className="text-emerald-400 font-semibold">Nueva: {updateInfo?.latestVersion}</span>
              </div>

              {/* Release Notes / Novedades de la versión */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-emerald-400">
                  <FileText className="w-3 h-3" />
                  <span>Novedades y cambios:</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-neutral-200 max-h-36 overflow-y-auto leading-relaxed space-y-1.5">
                  {updateInfo?.releaseNotes ? (
                    <div className="whitespace-pre-line text-neutral-300 font-normal">
                      {updateInfo.releaseNotes}
                    </div>
                  ) : (
                    <ul className="space-y-1 text-neutral-300">
                      {CURRENT_CHANGELOG.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                          <span className="text-emerald-400 font-bold leading-none mt-0.5">•</span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Repo Warning */}
              {updateInfo?.repoNotFound && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Si el repo es privado, hazlo público en GitHub Settings para actualizaciones.</span>
                </div>
              )}

              {/* Repository config */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
                <label className="block text-[10px] text-neutral-400 flex items-center gap-1">
                  <Github className="w-3 h-3 text-neutral-500" />
                  <span>Repositorio de GitHub:</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="usuario/repo"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 font-mono"
                  />
                  <button
                    onClick={handleSaveRepo}
                    className="px-2.5 py-1 bg-white text-black font-semibold text-[11px] rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    {repoSaved ? '✓' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

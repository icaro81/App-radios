import React, { useState, useEffect } from 'react';
import { UpdateInfo } from '../services/updateChecker';
import { isNativeUpdaterAvailable, startInAppUpdate } from '../services/inAppUpdater';
import { DEFAULT_REPO, VERSION_HISTORY, LATEST_RELEASE, VersionRelease } from '../version';
import { Download, X, Sparkles, CheckCircle2, RefreshCw, Github, AlertTriangle, ChevronDown, ChevronUp, FileText, Loader2, History, Calendar } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  updateInfo: UpdateInfo | null;
  onClose: () => void;
  onCheckAgain: () => void;
  isChecking?: boolean;
  skin?: 'black' | 'galena';
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  updateInfo,
  onClose,
  onCheckAgain,
  isChecking,
  skin = 'black',
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
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

  // Available version releases
  const historyList: VersionRelease[] = updateInfo?.versionHistory && updateInfo.versionHistory.length > 0
    ? updateInfo.versionHistory
    : VERSION_HISTORY;

  const activeRelease: VersionRelease = historyList[selectedVersionIndex] || LATEST_RELEASE;

  // Reset download state whenever modal opens or updateInfo changes
  useEffect(() => {
    if (isOpen) {
      setDownloadStatus('idle');
      setDownloadPercent(0);
      setBytesDownloaded(0);
      setTotalBytes(0);
      setErrorMessage('');
      setSelectedVersionIndex(0);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-sm rounded-3xl p-5 sm:p-6 overflow-hidden glass-surface border border-white/20 shadow-[0_16px_50px_rgba(0,0,0,0.9)] text-white max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular sheen reflection */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer z-10"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto pr-0.5 space-y-3.5 custom-scrollbar">
          {/* Minimal Centered Hero */}
          <div className="flex flex-col items-center text-center pt-1 pb-1">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg mb-2.5 ${
                hasUpdate
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-white/10 text-white border-white/20'
              }`}
            >
              {hasUpdate ? (
                <Sparkles className="w-6 h-6 animate-pulse text-cyan-400" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              )}
            </div>

            <h2 className="text-base font-bold tracking-wide text-white">
              {hasUpdate ? 'Nueva versión disponible' : 'Galena Digital al día'}
            </h2>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              {hasUpdate
                ? `Versión ${updateInfo?.latestVersion}`
                : `Versión instalada: v${updateInfo?.currentVersion || '1.0.24'}`}
            </p>
          </div>

          {/* Action Area */}
          <div className="space-y-2 pt-0.5">
            {hasUpdate ? (
              <>
                {downloadStatus === 'downloading' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-white">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        Descargando actualización...
                      </span>
                      <span className="font-bold text-cyan-300">
                        {downloadPercent >= 0 ? `${downloadPercent}%` : '...'}
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full h-2 rounded-full bg-neutral-900 border border-white/10 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)] transition-all duration-150 rounded-full"
                        style={{ width: `${Math.max(4, downloadPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-white">
                      <span>
                        {totalBytes > 0
                          ? `${formatBytes(bytesDownloaded)} de ${formatBytes(totalBytes)}`
                          : `${formatBytes(bytesDownloaded)} descargados`}
                      </span>
                      <span className="text-[10px] text-white font-medium">Sin salir de la app</span>
                    </div>
                  </div>
                )}

                {downloadStatus === 'installing' && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-center">
                    <div className="flex items-center justify-center gap-2 text-cyan-200 text-xs font-semibold">
                      <Sparkles className="w-4 h-4 animate-pulse text-cyan-400" />
                      <span>¡Descarga completa!</span>
                    </div>
                    <p className="text-[11px] text-white">
                      Abriendo el instalador del sistema. Pulsa <strong className="text-cyan-300 font-bold">"Instalar"</strong> para completar la actualización.
                    </p>
                  </div>
                )}

                {downloadStatus === 'error' && (
                  <div className="space-y-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                    <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Error en la descarga interna</span>
                    </div>
                    <p className="text-[11px] text-white break-words">
                      {errorMessage || 'No se pudo completar la descarga.'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleStartInAppUpdate}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-mono transition-all cursor-pointer text-center"
                      >
                        Reintentar
                      </button>
                      {updateInfo?.downloadUrl && (
                        <a
                          href={updateInfo.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white underline decoration-[#94a3b8]/50 text-xs font-mono transition-all cursor-pointer"
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
                        className="w-full py-3 px-4 rounded-2xl bg-cyan-400 text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer tracking-wide uppercase font-mono"
                      >
                        <Download className="w-4 h-4 text-black" />
                        Descargar e instalar directamente
                      </button>
                    ) : (
                      <a
                        href={updateInfo?.downloadUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 px-4 rounded-2xl bg-cyan-400 text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer tracking-wide uppercase font-mono"
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
                          className="text-[10px] font-mono text-[#94a3b8] hover:text-white underline decoration-[#94a3b8]/50 transition-colors"
                        >
                          ¿Prefieres descargar con el navegador? Pulsa aquí
                        </a>
                      </div>
                    )}

                    <button
                      onClick={onClose}
                      className="w-full py-1.5 text-xs text-white/80 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      Ahora no
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onCheckAgain}
                  disabled={isChecking}
                  className="flex-1 py-2 px-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Comprobando...' : 'Comprobar'}</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            )}
          </div>

          {/* Cuadro de cambios y detalles de la actualización */}
          <div className="pt-2 border-t border-white/15">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer py-1.5"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cuadro de cambios y detalles</span>
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-cyan-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            {showDetails && (
              <div className="mt-2 space-y-3 animate-in fade-in duration-150 text-xs">
                {/* Version Selector Tabs / Pills */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[#94a3b8]">
                    <span className="flex items-center gap-1">
                      <History className="w-3 h-3 text-cyan-400" />
                      <span>Seleccionar versión:</span>
                    </span>
                    <span>{historyList.length} registradas</span>
                  </div>

                  {/* Horizontal Scrollable Version Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
                    {historyList.map((rel, idx) => {
                      const isSelected = idx === selectedVersionIndex;
                      return (
                        <button
                          key={rel.version}
                          onClick={() => setSelectedVersionIndex(idx)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                              : 'bg-white/5 text-white/80 border-white/15 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          v{rel.version}
                          {idx === 0 && ' (Última)'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Version Header & Date */}
                <div className="p-2.5 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-cyan-300">Versión {activeRelease.version}</span>
                    {selectedVersionIndex === 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider font-semibold">
                        {hasUpdate ? 'Disponible' : 'Actual'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[#94a3b8] text-[10px]">
                    <Calendar className="w-3 h-3" />
                    <span>{activeRelease.date}</span>
                  </div>
                </div>

                {/* Reseña Destacada de la Actualización */}
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/35 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-cyan-300 font-bold">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Reseña del cambio realizado:</span>
                  </div>
                  <p className="text-white text-[11.5px] font-medium leading-relaxed italic">
                    "{activeRelease.tagline}"
                  </p>
                </div>

                {/* Detalle de Cambios de la Versión */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[#94a3b8]">
                    <span>Modificaciones y mejoras:</span>
                    <span>{activeRelease.changes.length} puntos</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/15 max-h-36 overflow-y-auto space-y-1.5 leading-relaxed custom-scrollbar">
                    <ul className="space-y-2 text-white">
                      {activeRelease.changes.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px]">
                          <span className="text-cyan-400 font-bold leading-none mt-0.5 shrink-0">•</span>
                          <span className="leading-snug text-white font-normal">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Repo Warning if private */}
                {updateInfo?.repoNotFound && (
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Si el repo es privado, hazlo público en GitHub Settings para actualizaciones automáticas.</span>
                  </div>
                )}

                {/* Repository config */}
                <div className="p-2.5 rounded-2xl bg-black/60 border border-white/15 space-y-1.5 text-left">
                  <label className="block text-[10px] text-white flex items-center gap-1 font-medium">
                    <Github className="w-3 h-3 text-white" />
                    <span>Repositorio de GitHub:</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="usuario/repo"
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-neutral-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                    />
                    <button
                      onClick={handleSaveRepo}
                      className="px-2.5 py-1 bg-cyan-400 text-black font-semibold text-[11px] rounded-lg hover:bg-cyan-300 transition-colors cursor-pointer"
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
    </div>
  );
};

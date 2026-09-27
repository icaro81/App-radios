import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UpdateInfo } from '../services/updateChecker';
import { isNativeUpdaterAvailable, startInAppUpdate } from '../services/inAppUpdater';
import { DEFAULT_REPO, VERSION_HISTORY, LATEST_RELEASE, VersionRelease } from '../version';
import {
  Download,
  X,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Github,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  History,
  Calendar
} from 'lucide-react';

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
  const isGalena = skin === 'galena';
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

  // TV Remote Navigation Focus state:
  // 'action-primary' | 'action-secondary' | 'action-browser' | 'details-toggle' | 'version-pill' | 'repo-input' | 'repo-save' | 'btn-close'
  const [tvFocus, setTvFocus] = useState<string>('action-primary');
  const repoInputRef = useRef<HTMLInputElement | null>(null);

  // Available version releases
  const historyList: VersionRelease[] =
    updateInfo?.versionHistory && updateInfo.versionHistory.length > 0
      ? updateInfo.versionHistory
      : VERSION_HISTORY;

  const activeRelease: VersionRelease = historyList[selectedVersionIndex] || LATEST_RELEASE;
  const hasUpdate = updateInfo?.hasUpdate;
  const isNative = isNativeUpdaterAvailable();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDownloadStatus('idle');
      setDownloadPercent(0);
      setBytesDownloaded(0);
      setTotalBytes(0);
      setErrorMessage('');
      setSelectedVersionIndex(0);
      setTvFocus(hasUpdate ? 'action-primary' : 'action-secondary');
    }
  }, [isOpen, hasUpdate]);

  const handleStartInAppUpdate = useCallback(() => {
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
  }, [updateInfo?.downloadUrl]);

  const handleSaveRepo = useCallback(() => {
    const clean = repoInput.trim() || DEFAULT_REPO;
    localStorage.setItem('radio_cristal_github_repo', clean);
    setRepoInput(clean);
    setRepoSaved(true);
    setTimeout(() => setRepoSaved(false), 2000);
    onCheckAgain();
  }, [repoInput, onCheckAgain]);

  // Smoothly scroll the focused element into view inside the modal
  useEffect(() => {
    if (!isOpen) return;
    const el = document.getElementById(`tv-modal-${tvFocus}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [tvFocus, isOpen]);

  // TV Remote D-Pad / Keys listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.keyCode || e.which;

      // Close on Escape or Android TV Back key (code 4)
      if (e.key === 'Escape' || code === 27 || code === 4 || e.key === 'BrowserBack') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // If user is currently typing in an input field:
      // Allow them to press Escape or Enter or Down to exit
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      const isUp = e.key === 'ArrowUp' || code === 19;
      const isDown = e.key === 'ArrowDown' || code === 20;
      const isLeft = e.key === 'ArrowLeft' || code === 21;
      const isRight = e.key === 'ArrowRight' || code === 22;
      const isEnter = e.key === 'Enter' || e.key === ' ' || code === 23 || code === 66;

      if (isTyping) {
        if (isEnter) {
          e.preventDefault();
          (activeEl as HTMLElement).blur();
          setTvFocus('repo-save');
          return;
        }
        if (isDown) {
          e.preventDefault();
          (activeEl as HTMLElement).blur();
          setTvFocus('repo-save');
          return;
        }
        if (isUp) {
          e.preventDefault();
          (activeEl as HTMLElement).blur();
          setTvFocus('details-toggle');
          return;
        }
        return; // Let standard text typing happen
      }

      // ENTER / OK on focused element
      if (isEnter) {
        e.preventDefault();
        if (tvFocus === 'btn-close') {
          onClose();
        } else if (tvFocus === 'action-primary') {
          if (hasUpdate) {
            if (downloadStatus === 'error') {
              handleStartInAppUpdate();
            } else if (downloadStatus === 'idle') {
              handleStartInAppUpdate();
            }
          } else {
            onCheckAgain();
          }
        } else if (tvFocus === 'action-secondary') {
          onClose();
        } else if (tvFocus === 'action-browser') {
          if (updateInfo?.downloadUrl) {
            window.open(updateInfo.downloadUrl, '_blank');
          }
        } else if (tvFocus === 'details-toggle') {
          setShowDetails((prev) => !prev);
        } else if (tvFocus === 'repo-input') {
          repoInputRef.current?.focus();
        } else if (tvFocus === 'repo-save') {
          handleSaveRepo();
        }
        return;
      }

      // D-PAD NAVIGATION
      if (isUp || isDown || isLeft || isRight) {
        e.preventDefault();

        setTvFocus((current) => {
          // DOWN
          if (isDown) {
            if (current === 'btn-close') return 'action-primary';
            if (current === 'action-primary') {
              if (hasUpdate && downloadStatus === 'error') return 'action-browser';
              return 'action-secondary';
            }
            if (current === 'action-browser') return 'action-secondary';
            if (current === 'action-secondary') return 'details-toggle';
            if (current === 'details-toggle') {
              if (showDetails) return 'version-pill';
              return 'details-toggle';
            }
            if (current === 'version-pill') return 'repo-input';
            if (current === 'repo-input') return 'repo-save';
            if (current === 'repo-save') return 'btn-close';
            return current;
          }

          // UP
          if (isUp) {
            if (current === 'repo-save') return 'repo-input';
            if (current === 'repo-input') return showDetails ? 'version-pill' : 'details-toggle';
            if (current === 'version-pill') return 'details-toggle';
            if (current === 'details-toggle') return 'action-secondary';
            if (current === 'action-secondary') {
              if (hasUpdate && downloadStatus === 'error') return 'action-browser';
              return 'action-primary';
            }
            if (current === 'action-browser') return 'action-primary';
            if (current === 'action-primary') return 'btn-close';
            if (current === 'btn-close') return 'repo-save';
            return current;
          }

          // RIGHT
          if (isRight) {
            if (current === 'action-primary' && !hasUpdate) return 'action-secondary';
            if (current === 'repo-input') return 'repo-save';
            if (current === 'version-pill') {
              setSelectedVersionIndex((idx) => Math.min(historyList.length - 1, idx + 1));
              return 'version-pill';
            }
            return current;
          }

          // LEFT
          if (isLeft) {
            if (current === 'action-secondary' && !hasUpdate) return 'action-primary';
            if (current === 'repo-save') return 'repo-input';
            if (current === 'version-pill') {
              setSelectedVersionIndex((idx) => Math.max(0, idx - 1));
              return 'version-pill';
            }
            return current;
          }

          return current;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    tvFocus,
    hasUpdate,
    downloadStatus,
    showDetails,
    historyList.length,
    onClose,
    onCheckAgain,
    handleStartInAppUpdate,
    handleSaveRepo,
    updateInfo?.downloadUrl,
  ]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${
      isGalena ? 'bg-cyan-950/70 backdrop-blur-md' : 'bg-black/85 backdrop-blur-md'
    } animate-fade-in`}>
      <div
        className={`relative w-full max-w-sm rounded-3xl p-5 sm:p-6 overflow-hidden glass-surface border ${
          isGalena
            ? 'border-white/50 text-black shadow-[0_25px_60px_rgba(8,51,68,0.5)]'
            : 'border-white/20 text-white shadow-[0_16px_50px_rgba(0,0,0,0.9)]'
        } max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular sheen reflection */}
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${
          isGalena ? 'via-white/60' : 'via-white/40'
        } to-transparent pointer-events-none`} />

        {/* Close Button with TV focus */}
        <button
          id="tv-modal-btn-close"
          onClick={onClose}
          onMouseEnter={() => setTvFocus('btn-close')}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
            tvFocus === 'btn-close'
              ? isGalena
                ? 'ring-4 ring-black bg-black text-white font-extrabold shadow-md scale-110'
                : 'ring-4 ring-cyan-400 bg-cyan-400 text-black font-extrabold shadow-[0_0_15px_#22d3ee] scale-110'
              : isGalena
              ? 'bg-black/10 hover:bg-black/20 text-black'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Cerrar [Atrás]"
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
                  : isGalena
                  ? 'bg-black/10 text-black border-black/20'
                  : 'bg-white/10 text-white border-white/20'
              }`}
            >
              {hasUpdate ? (
                <Sparkles className="w-6 h-6 animate-pulse text-cyan-400" />
              ) : (
                <CheckCircle2 className={`w-6 h-6 ${isGalena ? 'text-black' : 'text-cyan-400'}`} />
              )}
            </div>

            <h2 className={`text-base font-bold tracking-wide ${isGalena ? 'text-black' : 'text-white'}`}>
              {hasUpdate ? 'Nueva versión disponible' : 'Galena Digital al día'}
            </h2>
            <p className={`text-xs mt-0.5 font-medium ${isGalena ? 'text-neutral-900' : 'text-white/90'}`}>
              {hasUpdate
                ? `Versión ${updateInfo?.latestVersion}`
                : `Versión instalada: v${updateInfo?.currentVersion || '1.0.40'}`}
            </p>
          </div>

          {/* Action Area */}
          <div className="space-y-2 pt-0.5">
            {hasUpdate ? (
              <>
                {downloadStatus === 'downloading' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={`flex items-center gap-1.5 ${isGalena ? 'text-black font-bold' : 'text-white'}`}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        Descargando actualización...
                      </span>
                      <span className="font-bold text-cyan-400">
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

                    <div className={`flex items-center justify-between text-[11px] font-mono ${isGalena ? 'text-black font-semibold' : 'text-white'}`}>
                      <span>
                        {totalBytes > 0
                          ? `${formatBytes(bytesDownloaded)} de ${formatBytes(totalBytes)}`
                          : `${formatBytes(bytesDownloaded)} descargados`}
                      </span>
                      <span className="text-[10px] font-medium">Sin salir de la app</span>
                    </div>
                  </div>
                )}

                {downloadStatus === 'installing' && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-center">
                    <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-bold">
                      <Sparkles className="w-4 h-4 animate-pulse text-cyan-400" />
                      <span>¡Descarga completa!</span>
                    </div>
                    <p className={`text-[11px] ${isGalena ? 'text-black font-medium' : 'text-white'}`}>
                      Abriendo el instalador del sistema. Pulsa <strong className="text-cyan-400 font-bold">"Instalar"</strong> para completar la actualización.
                    </p>
                  </div>
                )}

                {downloadStatus === 'error' && (
                  <div className="space-y-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40">
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Error en la descarga interna</span>
                    </div>
                    <p className={`text-[11px] break-words ${isGalena ? 'text-black' : 'text-white'}`}>
                      {errorMessage || 'No se pudo completar la descarga.'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        id="tv-modal-action-primary"
                        onClick={handleStartInAppUpdate}
                        onMouseEnter={() => setTvFocus('action-primary')}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer text-center font-bold ${
                          tvFocus === 'action-primary'
                            ? isGalena
                              ? 'ring-4 ring-black bg-black text-cyan-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105'
                              : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-105'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30'
                        }`}
                      >
                        Reintentar [OK]
                      </button>
                      {updateInfo?.downloadUrl && (
                        <button
                          id="tv-modal-action-browser"
                          onClick={() => window.open(updateInfo.downloadUrl, '_blank')}
                          onMouseEnter={() => setTvFocus('action-browser')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold ${
                            tvFocus === 'action-browser'
                              ? isGalena
                                ? 'ring-4 ring-black bg-black text-white shadow-md scale-105'
                                : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-105'
                              : isGalena
                              ? 'bg-black/10 text-black hover:bg-black/20'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          Vía navegador
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {downloadStatus === 'idle' && (
                  <>
                    <button
                      id="tv-modal-action-primary"
                      onClick={handleStartInAppUpdate}
                      onMouseEnter={() => setTvFocus('action-primary')}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer tracking-wide uppercase font-mono ${
                        tvFocus === 'action-primary'
                          ? isGalena
                            ? 'ring-4 ring-black bg-black text-cyan-300 shadow-[0_0_20px_rgba(0,0,0,0.6)] scale-[1.03] border-2 border-neutral-900'
                            : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-[1.03] border-2 border-cyan-300'
                          : isGalena
                          ? 'bg-black text-cyan-300 shadow-[0_0_20px_rgba(0,0,0,0.4)] border border-neutral-900'
                          : 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300'
                      }`}
                    >
                      <Download className="w-4 h-4 text-current" />
                      <span>{isNative ? 'Descargar e instalar directamente' : 'Descargar actualización'}</span>
                    </button>

                    <button
                      id="tv-modal-action-secondary"
                      onClick={onClose}
                      onMouseEnter={() => setTvFocus('action-secondary')}
                      className={`w-full py-2 rounded-xl text-xs transition-all cursor-pointer font-bold ${
                        tvFocus === 'action-secondary'
                          ? isGalena
                            ? 'ring-4 ring-black bg-black text-white shadow-md scale-105'
                            : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-105'
                          : isGalena
                          ? 'text-black hover:bg-black/10'
                          : 'text-white/80 hover:text-cyan-300'
                      }`}
                    >
                      Ahora no [Cerrar]
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  id="tv-modal-action-primary"
                  onClick={onCheckAgain}
                  disabled={isChecking}
                  onMouseEnter={() => setTvFocus('action-primary')}
                  className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                    tvFocus === 'action-primary'
                      ? isGalena
                        ? 'ring-4 ring-black bg-black text-cyan-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105'
                        : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-105'
                      : isGalena
                      ? 'bg-white/60 border border-black/20 text-black'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Comprobando...' : 'Comprobar'}</span>
                </button>

                <button
                  id="tv-modal-action-secondary"
                  onClick={onClose}
                  onMouseEnter={() => setTvFocus('action-secondary')}
                  className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tvFocus === 'action-secondary'
                      ? isGalena
                        ? 'ring-4 ring-black bg-black text-white shadow-md scale-105'
                        : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-105'
                      : isGalena
                      ? 'bg-black text-white hover:bg-neutral-800'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Entendido
                </button>
              </div>
            )}
          </div>

          {/* Cuadro de cambios y detalles de la actualización */}
          <div className={`pt-2 border-t ${isGalena ? 'border-black/15' : 'border-white/15'}`}>
            <button
              id="tv-modal-details-toggle"
              onClick={() => setShowDetails(!showDetails)}
              onMouseEnter={() => setTvFocus('details-toggle')}
              className={`flex items-center justify-between w-full text-xs font-bold transition-all cursor-pointer py-1.5 px-2 rounded-xl ${
                tvFocus === 'details-toggle'
                  ? isGalena
                    ? 'ring-4 ring-black bg-black text-white shadow-md scale-102'
                    : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-102'
                  : isGalena
                  ? 'text-black hover:bg-black/5'
                  : 'text-cyan-300 hover:text-cyan-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Cuadro de cambios y detalles</span>
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDetails && (
              <div className="mt-2 space-y-3 animate-in fade-in duration-150 text-xs">
                {/* Version Selector Tabs / Pills */}
                <div className="space-y-1">
                  <div className={`flex items-center justify-between text-[10px] uppercase font-mono tracking-wider font-bold ${
                    isGalena ? 'text-black' : 'text-[#94a3b8]'
                  }`}>
                    <span className="flex items-center gap-1">
                      <History className="w-3 h-3 text-cyan-400" />
                      <span>Seleccionar versión:</span>
                    </span>
                    <span>[◄ ►] Navegar</span>
                  </div>

                  {/* Horizontal Scrollable Version Pills with TV Focus */}
                  <div
                    id="tv-modal-version-pill"
                    className={`flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 custom-scrollbar p-1 rounded-2xl ${
                      tvFocus === 'version-pill'
                        ? isGalena
                          ? 'ring-2 ring-black bg-black/10'
                          : 'ring-2 ring-cyan-400 bg-cyan-400/20'
                        : ''
                    }`}
                  >
                    {historyList.map((rel, idx) => {
                      const isSelected = idx === selectedVersionIndex;
                      return (
                        <button
                          key={rel.version}
                          onClick={() => {
                            setSelectedVersionIndex(idx);
                            setTvFocus('version-pill');
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)] scale-105'
                              : isGalena
                              ? 'bg-white/70 text-black border-black/20 hover:bg-white'
                              : 'bg-white/5 text-white/80 border-white/15 hover:bg-white/10'
                          }`}
                        >
                          v{rel.version}
                          {idx === 0 && ' (Actual)'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Version Header & Date */}
                <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-[11px] font-mono ${
                  isGalena ? 'bg-white/60 border-black/15 text-black' : 'bg-black/60 border-white/15 text-white'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">Versión {activeRelease.version}</span>
                    {selectedVersionIndex === 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 uppercase tracking-wider font-bold">
                        {hasUpdate ? 'Disponible' : 'Actual'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    <span>{activeRelease.date}</span>
                  </div>
                </div>

                {/* Reseña Destacada de la Actualización */}
                <div className={`p-3 rounded-2xl border text-left space-y-1 ${
                  isGalena ? 'bg-white/80 border-black/20' : 'bg-cyan-500/10 border-cyan-400/35'
                }`}>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Reseña del cambio:</span>
                  </div>
                  <p className={`text-[11.5px] font-medium leading-relaxed italic ${
                    isGalena ? 'text-black' : 'text-white'
                  }`}>
                    "{activeRelease.tagline}"
                  </p>
                </div>

                {/* Detalle de Cambios de la Versión */}
                <div className="space-y-1.5 text-left">
                  <div className={`flex items-center justify-between text-[10px] uppercase font-mono tracking-wider font-bold ${
                    isGalena ? 'text-black' : 'text-[#94a3b8]'
                  }`}>
                    <span>Modificaciones:</span>
                    <span>{activeRelease.changes.length} puntos</span>
                  </div>
                  <div className={`p-3 rounded-2xl border max-h-36 overflow-y-auto space-y-1.5 leading-relaxed custom-scrollbar ${
                    isGalena ? 'bg-white/60 border-black/15' : 'bg-white/[0.04] border-white/15'
                  }`}>
                    <ul className="space-y-2">
                      {activeRelease.changes.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px]">
                          <span className="text-cyan-400 font-bold leading-none mt-0.5 shrink-0">•</span>
                          <span className={`leading-snug font-normal ${isGalena ? 'text-black font-medium' : 'text-white'}`}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Repository config */}
                <div className={`p-2.5 rounded-2xl border space-y-1.5 text-left ${
                  isGalena ? 'bg-white/60 border-black/15' : 'bg-black/60 border-white/15'
                }`}>
                  <label className={`block text-[10px] flex items-center gap-1 font-bold ${
                    isGalena ? 'text-black' : 'text-white'
                  }`}>
                    <Github className="w-3 h-3 text-current" />
                    <span>Repositorio de GitHub:</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      id="tv-modal-repo-input"
                      ref={repoInputRef}
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      onFocus={() => setTvFocus('repo-input')}
                      placeholder="usuario/repo"
                      className={`flex-1 rounded-lg px-2.5 py-1 text-[11px] font-mono focus:outline-none transition-all ${
                        tvFocus === 'repo-input'
                          ? isGalena
                            ? 'ring-2 ring-black bg-white text-black font-bold'
                            : 'ring-2 ring-cyan-400 bg-black text-white font-bold'
                          : isGalena
                          ? 'bg-white/80 border border-black/20 text-black'
                          : 'bg-white/10 border border-white/20 text-white'
                      }`}
                    />
                    <button
                      id="tv-modal-repo-save"
                      onClick={handleSaveRepo}
                      onMouseEnter={() => setTvFocus('repo-save')}
                      className={`px-3 py-1 font-bold text-[11px] rounded-lg transition-all cursor-pointer ${
                        tvFocus === 'repo-save'
                          ? isGalena
                            ? 'ring-4 ring-black bg-black text-white shadow-md scale-105'
                            : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-105'
                          : isGalena
                          ? 'bg-black text-white hover:bg-neutral-800'
                          : 'bg-cyan-400 text-black hover:bg-cyan-300'
                      }`}
                    >
                      {repoSaved ? '✓' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remote Navigation Guide at Bottom */}
          <div className="pt-2 text-center">
            <span className={`text-[10px] font-mono px-3 py-1 rounded-full inline-block font-bold ${
              isGalena ? 'bg-black/10 text-black' : 'bg-white/10 text-white/90'
            }`}>
              Mando TV: [OK] Seleccionar • [▲ ▼ ◄ ►] Navegar • [Atrás] Salir
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

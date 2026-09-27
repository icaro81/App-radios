import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RadioStation } from '../types';
import { Plus, X, Radio, Link as LinkIcon, Tag, ClipboardPaste, Check } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStation: (station: RadioStation) => void;
  skin?: 'black' | 'galena';
}

export const AddStationModal = ({
  isOpen,
  onClose,
  onAddStation,
  skin = 'black',
}: AddStationModalProps) => {
  const isGalena = skin === 'galena';
  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('CUSTOM');
  const [error, setError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // TV Remote Navigation State:
  // 'name' | 'url' | 'paste' | 'subtitle' | 'badge' | 'cancel' | 'submit' | 'close'
  const [tvFocus, setTvFocus] = useState<string>('name');

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);
  const badgeInputRef = useRef<HTMLInputElement | null>(null);

  // Reset focus when opened
  useEffect(() => {
    if (isOpen) {
      setTvFocus('name');
      setError(null);
    }
  }, [isOpen]);

  const handlePasteClipboard = useCallback(async () => {
    let pastedText = '';

    // 1. Try native Android / Capacitor clipboard first
    try {
      const result = await Clipboard.read();
      if (result && typeof result.value === 'string' && result.value.trim().length > 0) {
        pastedText = result.value.trim();
      }
    } catch {
      // Ignored
    }

    // 2. Fallback to standard Web navigator.clipboard
    if (!pastedText && typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          pastedText = text.trim();
        }
      } catch {
        // Ignored
      }
    }

    // 3. Fallback prompt if security policy blocked reading
    if (!pastedText) {
      const promptText = window.prompt('Pega aquí el enlace de la radio:');
      if (promptText && promptText.trim().length > 0) {
        pastedText = promptText.trim();
      }
    }

    if (pastedText) {
      const clean = pastedText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
      setStreamUrl(clean);
      if (urlInputRef.current) {
        urlInputRef.current.value = clean;
      }
      setError(null);
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 2000);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const nameVal = (nameInputRef.current ? nameInputRef.current.value : name)?.trim() || name.trim();
    let urlVal = (urlInputRef.current ? urlInputRef.current.value : streamUrl)?.trim() || streamUrl.trim();
    const subtitleVal = (subtitleInputRef.current ? subtitleInputRef.current.value : subtitle)?.trim() || subtitle.trim();
    const badgeVal = (badgeInputRef.current ? badgeInputRef.current.value : badge)?.trim() || badge.trim();

    urlVal = urlVal.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    if (!nameVal) {
      setError('Por favor escribe el nombre de la radio.');
      setTvFocus('name');
      nameInputRef.current?.focus();
      return;
    }

    if (!urlVal) {
      setError('Por favor ingresa la URL del stream de audio.');
      setTvFocus('url');
      urlInputRef.current?.focus();
      return;
    }

    if (!/^https?:\/\//i.test(urlVal)) {
      urlVal = `https://${urlVal}`;
    }

    try {
      new URL(urlVal);
    } catch {
      setError('Ingresa una URL válida (ej: https://servidor.com/stream).');
      setTvFocus('url');
      return;
    }

    const newStation: RadioStation = {
      id: `custom-${Date.now()}`,
      name: nameVal,
      streamUrl: urlVal,
      subtitle: subtitleVal || 'Emisión personalizada',
      badge: badgeVal.toUpperCase() || 'CUSTOM',
      isCustom: true,
    };

    onAddStation(newStation);
    setName('');
    setStreamUrl('');
    setSubtitle('');
    setError(null);
    onClose();
  }, [name, streamUrl, subtitle, badge, onAddStation, onClose]);

  // TV Remote Navigation Key Listener
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

      const activeEl = document.activeElement;
      const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      const isUp = e.key === 'ArrowUp' || code === 19;
      const isDown = e.key === 'ArrowDown' || code === 20;
      const isLeft = e.key === 'ArrowLeft' || code === 21;
      const isRight = e.key === 'ArrowRight' || code === 22;
      const isEnter = e.key === 'Enter' || code === 23 || code === 66;

      // When software keyboard is open and user presses Enter or Down/Up
      if (isInputActive) {
        if (isEnter) {
          e.preventDefault();
          (activeEl as HTMLElement).blur();
          if (tvFocus === 'name') setTvFocus('url');
          else if (tvFocus === 'url') setTvFocus('submit');
          else if (tvFocus === 'subtitle') setTvFocus('badge');
          else if (tvFocus === 'badge') setTvFocus('submit');
          return;
        }
        if (isDown) {
          e.preventDefault();
          (activeEl as HTMLElement).blur();
          if (tvFocus === 'name') setTvFocus('url');
          else if (tvFocus === 'url') setTvFocus('subtitle');
          else if (tvFocus === 'subtitle' || tvFocus === 'badge') setTvFocus('submit');
          return;
        }
        if (isUp) {
          e.preventDefault();
          (activeEl as HTMLElement).blur();
          if (tvFocus === 'url') setTvFocus('name');
          else if (tvFocus === 'subtitle' || tvFocus === 'badge') setTvFocus('url');
          else if (tvFocus === 'name') setTvFocus('close');
          return;
        }
        return; // Allow typing characters
      }

      // ENTER key when in navigation mode
      if (isEnter) {
        e.preventDefault();
        if (tvFocus === 'close' || tvFocus === 'cancel') {
          onClose();
        } else if (tvFocus === 'submit') {
          handleSubmit();
        } else if (tvFocus === 'paste') {
          handlePasteClipboard();
        } else if (tvFocus === 'name') {
          nameInputRef.current?.focus();
        } else if (tvFocus === 'url') {
          urlInputRef.current?.focus();
        } else if (tvFocus === 'subtitle') {
          subtitleInputRef.current?.focus();
        } else if (tvFocus === 'badge') {
          badgeInputRef.current?.focus();
        }
        return;
      }

      // D-PAD NAVIGATION
      if (isUp || isDown || isLeft || isRight) {
        e.preventDefault();

        setTvFocus((cur) => {
          // DOWN
          if (isDown) {
            if (cur === 'close') return 'name';
            if (cur === 'name') return 'url';
            if (cur === 'url' || cur === 'paste') return 'subtitle';
            if (cur === 'subtitle') return 'badge';
            if (cur === 'badge') return 'submit';
            if (cur === 'cancel') return 'submit';
            if (cur === 'submit') return 'close';
            return cur;
          }

          // UP
          if (isUp) {
            if (cur === 'submit') return 'badge';
            if (cur === 'cancel') return 'subtitle';
            if (cur === 'badge') return 'subtitle';
            if (cur === 'subtitle') return 'url';
            if (cur === 'paste') return 'name';
            if (cur === 'url') return 'name';
            if (cur === 'name') return 'close';
            if (cur === 'close') return 'submit';
            return cur;
          }

          // RIGHT
          if (isRight) {
            if (cur === 'url') return 'paste';
            if (cur === 'subtitle') return 'badge';
            if (cur === 'cancel') return 'submit';
            return cur;
          }

          // LEFT
          if (isLeft) {
            if (cur === 'paste') return 'url';
            if (cur === 'badge') return 'subtitle';
            if (cur === 'submit') return 'cancel';
            return cur;
          }

          return cur;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, tvFocus, onClose, handleSubmit, handlePasteClipboard]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      isGalena ? 'bg-cyan-950/70 backdrop-blur-md' : 'bg-black/80 backdrop-blur-md'
    } p-4 animate-in fade-in duration-200`}>
      <div className={`w-full max-w-md rounded-3xl glass-surface ${
        isGalena
          ? 'border border-white/50 text-black shadow-[0_25px_60px_rgba(8,51,68,0.5)]'
          : 'border border-white/20 text-white shadow-2xl'
      } p-6 sm:p-7 relative overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Specular sheen */}
        <div className={`absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent ${
          isGalena ? 'via-white/60' : 'via-cyan-400/60'
        } to-transparent pointer-events-none`} />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              isGalena
                ? 'bg-black/10 border-black/20 text-black'
                : 'bg-cyan-500/20 border-cyan-400/30 text-cyan-400'
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-extrabold tracking-wide ${isGalena ? 'text-black' : 'text-white'}`}>
                Agregar Nueva Radio
              </h2>
              <p className={`text-xs ${isGalena ? 'text-neutral-900 font-medium' : 'text-white'}`}>
                Añade cualquier enlace de streaming MP3 o AAC
              </p>
            </div>
          </div>

          <button
            id="tv-add-close"
            onClick={onClose}
            onMouseEnter={() => setTvFocus('close')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              tvFocus === 'close'
                ? isGalena
                  ? 'ring-4 ring-black bg-black text-white font-extrabold shadow-md scale-110'
                  : 'ring-4 ring-cyan-400 bg-cyan-400 text-black font-extrabold shadow-[0_0_15px_#22d3ee] scale-110'
                : isGalena
                ? 'bg-black/10 hover:bg-black/20 text-black'
                : 'bg-white/10 hover:bg-white/20 text-white hover:text-cyan-300'
            }`}
            title="Cerrar [Atrás]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 py-2.5 px-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button 
              type="button" 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white text-xs ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
          {/* Nombre de la Radio */}
          <div>
            <label className={`block text-xs font-mono uppercase tracking-wider mb-1 font-bold ${isGalena ? 'text-black' : 'text-white'}`}>
              Nombre de la Radio
            </label>
            <div className="relative">
              <input
                id="tv-add-name"
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                onFocus={() => setTvFocus('name')}
                placeholder="Ej. Radio Impacto 94.5"
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
                  tvFocus === 'name'
                    ? isGalena
                      ? 'ring-2 ring-black bg-white text-black font-bold border-2 border-black'
                      : 'ring-2 ring-cyan-400 bg-black text-white font-bold border-2 border-cyan-400'
                    : isGalena
                    ? 'bg-white/80 border border-black/20 text-black placeholder-neutral-500'
                    : 'bg-black/60 border border-white/20 text-white placeholder-neutral-400'
                }`}
              />
            </div>
          </div>

          {/* URL Stream */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-xs font-mono uppercase tracking-wider font-bold ${isGalena ? 'text-black' : 'text-white'}`}>
                URL del Stream
              </label>
              <button
                id="tv-add-paste"
                type="button"
                onClick={handlePasteClipboard}
                onMouseEnter={() => setTvFocus('paste')}
                className={`flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer px-2.5 py-1 rounded-lg ${
                  tvFocus === 'paste'
                    ? isGalena
                      ? 'ring-4 ring-black bg-black text-white shadow-md scale-105'
                      : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-105'
                    : pasteSuccess
                    ? isGalena
                      ? 'bg-black text-cyan-300 border border-black'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : isGalena
                    ? 'text-black bg-black/10 hover:bg-black/20'
                    : 'text-cyan-400 hover:text-cyan-300 bg-cyan-500/10'
                }`}
              >
                {pasteSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-cyan-300" />
                    <span>¡Pegado!</span>
                  </>
                ) : (
                  <>
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Pegar enlace [►]</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                id="tv-add-url"
                ref={urlInputRef}
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={streamUrl}
                onChange={(e) => {
                  setStreamUrl(e.target.value);
                  if (error) setError(null);
                }}
                onFocus={() => setTvFocus('url')}
                placeholder="https://servidor.com:8000/stream"
                className={`w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm transition-all font-mono focus:outline-none ${
                  tvFocus === 'url'
                    ? isGalena
                      ? 'ring-2 ring-black bg-white text-black font-bold border-2 border-black'
                      : 'ring-2 ring-cyan-400 bg-black text-white font-bold border-2 border-cyan-400'
                    : isGalena
                    ? 'bg-white/80 border border-black/20 text-black placeholder-neutral-500'
                    : 'bg-black/60 border border-white/20 text-white placeholder-neutral-400'
                }`}
              />
              <LinkIcon className={`w-4 h-4 absolute left-3 top-3 pointer-events-none ${
                tvFocus === 'url'
                  ? isGalena ? 'text-black' : 'text-cyan-400'
                  : isGalena ? 'text-black' : 'text-cyan-400'
              }`} />
            </div>
          </div>

          {/* Subtítulo y Badge */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-1 font-bold ${isGalena ? 'text-black' : 'text-white'}`}>
                Subtítulo (Opcional)
              </label>
              <input
                id="tv-add-subtitle"
                ref={subtitleInputRef}
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                onFocus={() => setTvFocus('subtitle')}
                placeholder="Ej. 94.5 MHz FM"
                className={`w-full rounded-xl px-3 py-2 text-xs transition-all focus:outline-none ${
                  tvFocus === 'subtitle'
                    ? isGalena
                      ? 'ring-2 ring-black bg-white text-black font-bold border-2 border-black'
                      : 'ring-2 ring-cyan-400 bg-black text-white font-bold border-2 border-cyan-400'
                    : isGalena
                    ? 'bg-white/80 border border-black/20 text-black placeholder-neutral-500'
                    : 'bg-black/60 border border-white/20 text-white placeholder-neutral-400'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-1 font-bold ${isGalena ? 'text-black' : 'text-white'}`}>
                Etiqueta / Badge
              </label>
              <div className="relative">
                <input
                  id="tv-add-badge"
                  ref={badgeInputRef}
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  onFocus={() => setTvFocus('badge')}
                  placeholder="ONLINE / FM"
                  className={`w-full rounded-xl pl-8 pr-3 py-2 text-xs uppercase font-mono transition-all focus:outline-none ${
                    tvFocus === 'badge'
                      ? isGalena
                        ? 'ring-2 ring-black bg-white text-black font-bold border-2 border-black'
                        : 'ring-2 ring-cyan-400 bg-black text-white font-bold border-2 border-cyan-400'
                      : isGalena
                      ? 'bg-white/80 border border-black/20 text-black placeholder-neutral-500'
                      : 'bg-black/60 border border-white/20 text-white placeholder-neutral-400'
                  }`}
                />
                <Tag className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 pointer-events-none ${
                  isGalena ? 'text-black' : 'text-cyan-400'
                }`} />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              id="tv-add-cancel"
              type="button"
              onClick={onClose}
              onMouseEnter={() => setTvFocus('cancel')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                tvFocus === 'cancel'
                  ? isGalena
                    ? 'ring-4 ring-black bg-black text-white shadow-md scale-105'
                    : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-105'
                  : isGalena
                  ? 'text-black hover:bg-black/10'
                  : 'text-white hover:text-cyan-300'
              }`}
            >
              Cancelar [◄]
            </button>
            <button
              id="tv-add-submit"
              type="button"
              onClick={handleSubmit}
              onMouseEnter={() => setTvFocus('submit')}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tvFocus === 'submit'
                  ? isGalena
                    ? 'ring-4 ring-black bg-black text-cyan-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-105 border-2 border-neutral-900'
                    : 'ring-4 ring-cyan-400 bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-105 border-2 border-cyan-300'
                  : isGalena
                  ? 'bg-black text-cyan-300 shadow-[0_0_20px_rgba(0,0,0,0.35)]'
                  : 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              }`}
            >
              <Plus className="w-4 h-4 text-current" />
              <span>Guardar Radio [OK]</span>
            </button>
          </div>

          {/* Remote Navigation Guide */}
          <div className="pt-1 text-center">
            <span className={`text-[10px] font-mono px-3 py-0.5 rounded-full inline-block font-bold ${
              isGalena ? 'bg-black/10 text-black' : 'bg-white/10 text-white/90'
            }`}>
              Mando TV: [OK] Seleccionar / Escribir • [▲ ▼] Campos • [Atrás] Salir
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

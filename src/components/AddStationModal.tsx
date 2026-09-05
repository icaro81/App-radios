import React, { useState, useRef } from 'react';
import { RadioStation } from '../types';
import { Plus, X, Radio, Link as LinkIcon, Tag, ClipboardPaste } from 'lucide-react';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStation: (station: RadioStation) => void;
}

export const AddStationModal = ({
  isOpen,
  onClose,
  onAddStation,
}: AddStationModalProps) => {
  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('CUSTOM');
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);
  const badgeInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = text.trim();
          setStreamUrl(clean);
          if (urlInputRef.current) {
            urlInputRef.current.value = clean;
          }
          setError(null);
        }
      }
    } catch {
      // If clipboard permission is restricted on WebView, user can still long-press paste
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Directly read from DOM ref as primary source to bypass any WebView synthetic event lag
    const nameVal = (urlInputRef.current ? nameInputRef.current?.value : name)?.trim() || name.trim();
    let urlVal = (urlInputRef.current ? urlInputRef.current?.value : streamUrl)?.trim() || streamUrl.trim();
    const subtitleVal = (subtitleInputRef.current ? subtitleInputRef.current?.value : subtitle)?.trim() || subtitle.trim();
    const badgeVal = (badgeInputRef.current ? badgeInputRef.current?.value : badge)?.trim() || badge.trim();

    // Clean invisible Unicode control characters that Android keyboards sometimes paste
    urlVal = urlVal.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    if (!nameVal) {
      setError('Por favor escribe el nombre de la radio.');
      return;
    }

    if (!urlVal) {
      setError('Por favor ingresa la URL del stream de audio.');
      return;
    }

    // Auto-prepend https:// if protocol was omitted (e.g. server.laradio.org:8000/stream)
    if (!/^https?:\/\//i.test(urlVal)) {
      urlVal = `https://${urlVal}`;
    }

    try {
      new URL(urlVal);
    } catch {
      setError('Ingresa una URL válida (ej: https://servidor.com/stream).');
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl glass-surface border border-white/20 p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden">
        {/* Specular sheen */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-white">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Agregar Nueva Radio
              </h2>
              <p className="text-xs text-neutral-400">
                Añade cualquier enlace de streaming MP3 o AAC
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
              Nombre de la Radio
            </label>
            <div className="relative">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                onInput={(e) => {
                  setName((e.target as HTMLInputElement).value);
                  if (error) setError(null);
                }}
                placeholder="Ej. Radio Impacto 94.5"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                URL del Stream de Audio
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>Pegar enlace</span>
              </button>
            </div>
            <div className="relative">
              <input
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
                onInput={(e) => {
                  setStreamUrl((e.target as HTMLInputElement).value);
                  if (error) setError(null);
                }}
                onPaste={(e) => {
                  setTimeout(() => {
                    if (urlInputRef.current) {
                      setStreamUrl(urlInputRef.current.value);
                    }
                    setError(null);
                  }, 20);
                }}
                placeholder="https://servidor.com:8000/stream"
                className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all font-mono"
              />
              <LinkIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                Subtítulo (Opcional)
              </label>
              <input
                ref={subtitleInputRef}
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                onInput={(e) => setSubtitle((e.target as HTMLInputElement).value)}
                placeholder="Ej. 94.5 MHz FM"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                Etiqueta / Badge
              </label>
              <div className="relative">
                <input
                  ref={badgeInputRef}
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  onInput={(e) => setBadge((e.target as HTMLInputElement).value)}
                  placeholder="ONLINE / FM"
                  className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 transition-all uppercase font-mono"
                />
                <Tag className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Radio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

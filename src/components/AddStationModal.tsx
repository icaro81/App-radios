import { useState } from 'react';
import { RadioStation } from '../types';
import { Plus, X, Radio, Link as LinkIcon, Tag } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor escribe el nombre de la radio.');
      return;
    }
    if (!streamUrl.trim()) {
      setError('Por favor ingresa la URL del stream de audio.');
      return;
    }

    try {
      new URL(streamUrl.trim());
    } catch {
      setError('Ingresa una URL válida (ej: https://servidor.com/stream).');
      return;
    }

    const newStation: RadioStation = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      streamUrl: streamUrl.trim(),
      subtitle: subtitle.trim() || 'Emisión personalizada',
      badge: badge.trim().toUpperCase() || 'CUSTOM',
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
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        
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
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 py-2 px-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
              Nombre de la Radio
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Radio Impacto 94.5"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
              URL del Stream de Audio
            </label>
            <div className="relative">
              <input
                type="url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://servidor.com:8000/stream"
                className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all font-mono"
              />
              <LinkIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                Subtítulo (Opcional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
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
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="ONLINE / FM"
                  className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 transition-all uppercase font-mono"
                />
                <Tag className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition-colors"
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

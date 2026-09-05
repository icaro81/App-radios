import { Sparkles, Radio } from 'lucide-react';

interface CrystalBannerProps {
  position?: 'left' | 'right' | 'bottom';
  className?: string;
}

export const CrystalBanner = ({ position = 'left', className = '' }: CrystalBannerProps) => {
  return (
    <div
      className={`relative rounded-2xl glass-surface border border-white/10 p-3.5 sm:p-4 overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/20 group select-none ${className}`}
    >
      {/* Specular sheen effect */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
      <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[9px] font-mono tracking-widest uppercase text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            ESPACIO DESTACADO
          </span>
          <span className="text-[9px] font-mono text-neutral-500">HD AUDIO</span>
        </div>

        {/* Content Body */}
        <div className="my-1">
          <h4 className="text-xs font-bold text-white tracking-wide group-hover:text-emerald-300 transition-colors">
            Tu Marca o Publicidad Aquí
          </h4>
          <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
            Emisión simultánea en Móvil, Smart TV y streaming en directo 24/7.
          </p>
        </div>

        {/* Bottom micro-card */}
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
          <span className="text-neutral-400 font-mono">Cristal Sponsor</span>
          <span className="text-emerald-400 font-semibold cursor-pointer hover:underline flex items-center gap-1">
            <Radio className="w-2.5 h-2.5" />
            Anúnciate
          </span>
        </div>
      </div>
    </div>
  );
};

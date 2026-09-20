import { Sparkles, Radio } from 'lucide-react';

interface CrystalBannerProps {
  position?: 'left' | 'right' | 'bottom';
  className?: string;
}

export const CrystalBanner = ({ position = 'left', className = '' }: CrystalBannerProps) => {
  return (
    <div
      className={`relative rounded-2xl glass-surface border border-white/10 p-3.5 sm:p-4 overflow-hidden shadow-2xl transition-all duration-300 hover:border-cyan-400/30 group select-none ${className}`}
    >
      {/* Specular sheen effect */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
      <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[9px] font-mono tracking-widest uppercase text-white bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
            ESPACIO DESTACADO
          </span>
          <span className="text-[9px] font-mono text-white font-medium">HD AUDIO</span>
        </div>

        {/* Content Body */}
        <div className="my-1">
          <h4 className="text-xs font-bold text-white tracking-wide group-hover:text-cyan-300 transition-colors">
            Tu Marca o Publicidad Aquí
          </h4>
          <p className="text-[11px] text-white mt-1 leading-snug">
            Emisión simultánea en Móvil, Smart TV y streaming en directo 24/7.
          </p>
        </div>

        {/* Bottom micro-card */}
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
          <span className="text-white font-mono">Galena Digital Sponsor</span>
          <a 
            href="#anunciate"
            onClick={(e) => e.preventDefault()}
            className="text-[#94a3b8] hover:text-white font-semibold cursor-pointer underline decoration-[#94a3b8]/60 flex items-center gap-1 transition-colors"
          >
            <Radio className="w-2.5 h-2.5 text-cyan-400" />
            Anúnciate
          </a>
        </div>
      </div>
    </div>
  );
};

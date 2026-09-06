import React, { useRef, useState, useEffect } from 'react';
import { RadioStation, PlayerStatus } from '../types';
import { Radio, Loader2, Signal, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface StationGridProps {
  stations: RadioStation[];
  currentStation: RadioStation;
  playerStatus: PlayerStatus;
  onSelectStation: (station: RadioStation) => void;
  onRemoveStation: (id: string) => void;
  onOpenAddModal: () => void;
}

type GridSlot =
  | { type: 'station'; station: RadioStation }
  | { type: 'add'; id: string };

export const StationGrid: React.FC<StationGridProps> = ({
  stations,
  currentStation,
  playerStatus,
  onSelectStation,
  onRemoveStation,
  onOpenAddModal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Calculate 2x2 pages with dynamic add-slots
  const pages: GridSlot[][] = React.useMemo(() => {
    const items: GridSlot[] = stations.map((s) => ({ type: 'station', station: s }));
    const remainder = items.length % 4;

    if (remainder === 0) {
      // Exactly full: create next page with add slots
      items.push({ type: 'add', id: 'add-slot-next-1' });
      items.push({ type: 'add', id: 'add-slot-next-2' });
    } else {
      // Fill current page remainder with add slots
      const emptyNeeded = 4 - remainder;
      for (let i = 0; i < emptyNeeded; i++) {
        items.push({ type: 'add', id: `add-slot-${i + 1}` });
      }
    }

    const chunks: GridSlot[][] = [];
    for (let i = 0; i < items.length; i += 4) {
      chunks.push(items.slice(i, i + 4));
    }
    return chunks;
  }, [stations]);

  // Track scroll position to update pagination dots
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    if (clientWidth > 0) {
      const page = Math.round(scrollLeft / clientWidth);
      if (page !== currentPage && page >= 0 && page < pages.length) {
        setCurrentPage(page);
      }
    }
  };

  const scrollToPage = (pageIndex: number) => {
    if (!containerRef.current) return;
    const clientWidth = containerRef.current.clientWidth;
    containerRef.current.scrollTo({
      left: pageIndex * clientWidth,
      behavior: 'smooth',
    });
    setCurrentPage(pageIndex);
  };

  // If current station changes, make sure page is visible
  useEffect(() => {
    const stationIndex = stations.findIndex((s) => s.id === currentStation.id);
    if (stationIndex >= 0) {
      const targetPage = Math.floor(stationIndex / 4);
      if (targetPage !== currentPage && targetPage < pages.length) {
        scrollToPage(targetPage);
      }
    }
  }, [currentStation.id]);

  return (
    <div className="w-full flex flex-col">
      {/* Header bar of the stations section */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
            SINTONÍAS DISPONIBLES
          </span>
          {pages.length > 1 && (
            <span className="text-[10px] font-mono text-neutral-500">
              ({currentPage + 1}/{pages.length})
            </span>
          )}
        </div>

        {/* Quick controls if multiple pages */}
        {pages.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollToPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-neutral-300 transition-all cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollToPage(Math.min(pages.length - 1, currentPage + 1))}
              disabled={currentPage === pages.length - 1}
              className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-neutral-300 transition-all cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Swipeable 2x2 Grid Carousel */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none scroll-smooth pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {pages.map((page, pageIndex) => (
          <div
            key={`page-${pageIndex}`}
            className="w-full flex-shrink-0 snap-center grid grid-cols-2 gap-2.5"
          >
            {page.map((slot) => {
              if (slot.type === 'station') {
                const station = slot.station;
                const isActive = currentStation.id === station.id;
                const isPlayingThis = isActive && playerStatus === 'playing';
                const isLoadingThis = isActive && playerStatus === 'loading';

                return (
                  <div key={station.id} className="relative group/card">
                    <button
                      id={`station-compact-${station.id}`}
                      onClick={() => onSelectStation(station)}
                      className={`relative w-full h-[56px] sm:h-[62px] text-left rounded-xl sm:rounded-2xl p-2 sm:p-2.5 transition-all duration-200 ease-out overflow-hidden select-none cursor-pointer flex items-center gap-2 sm:gap-2.5 ${
                        isActive
                          ? 'glass-button-active border border-white/35 text-white shadow-[0_0_15px_rgba(255,255,255,0.18)]'
                          : 'glass-button border border-white/10 text-neutral-300 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {/* Diagonal Glass Sheen */}
                      <div className="absolute inset-0 pointer-events-none glass-sheen opacity-60 group-hover/card:opacity-100 transition-opacity duration-300" />
                      
                      {/* Top highlight border line */}
                      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                      {/* Icon Container */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                            : 'bg-white/5 text-neutral-400 group-hover/card:bg-white/10 group-hover/card:text-white border border-white/5'
                        }`}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isPlayingThis ? (
                          <Signal className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Radio className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Text details */}
                      <div className="min-w-0 flex-1">
                        <span className="block font-semibold text-xs sm:text-sm tracking-tight truncate text-white leading-tight">
                          {station.name}
                        </span>
                        <span className="block text-[10px] text-neutral-400 truncate mt-0.5 font-mono">
                          {isLoadingThis
                            ? 'Conectando...'
                            : isPlayingThis
                            ? 'En directo'
                            : station.badge || station.subtitle || 'Online'}
                        </span>
                      </div>

                      {/* Active indicator bar at the bottom */}
                      {isActive && (
                        <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />
                      )}
                    </button>

                    {/* Delete button for custom streams */}
                    {station.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveStation(station.id);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg opacity-80 hover:opacity-100 hover:scale-110 transition-all z-20 cursor-pointer"
                        title="Eliminar esta estación"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              }

              // Add Station Slot
              return (
                <button
                  key={slot.id}
                  onClick={onOpenAddModal}
                  className="relative w-full h-[56px] sm:h-[62px] rounded-xl sm:rounded-2xl border border-dashed border-white/20 hover:border-emerald-400/50 bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200 p-2 sm:p-2.5 flex items-center justify-center gap-2 cursor-pointer group/add select-none"
                  title="Agregar nueva transmisión"
                >
                  <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 group-hover/add:border-emerald-400/40 group-hover/add:bg-emerald-500/10 flex items-center justify-center text-neutral-400 group-hover/add:text-emerald-400 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="block text-xs font-medium text-neutral-300 group-hover/add:text-white truncate">
                      Agregar radio
                    </span>
                    <span className="block text-[9px] font-mono text-neutral-500 group-hover/add:text-emerald-400/80 truncate">
                      + Nueva URL
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Pagination Dots (if more than 1 page) */}
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {pages.map((_, dotIndex) => (
            <button
              key={`dot-${dotIndex}`}
              onClick={() => scrollToPage(dotIndex)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentPage === dotIndex
                  ? 'w-5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
              title={`Ir a página ${dotIndex + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import { useEffect, useState, useCallback } from 'react';
import { RadioStation } from '../types';

interface TVNavigationOptions {
  onPlayPause: () => void;
  onNextStation: () => void;
  onPreviousStation: () => void;
  onSelectStation: (station: RadioStation) => void;
  onToggleMute: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onOpenAddModal?: () => void;
  onOpenEqualizer?: () => void;
  onCheckUpdate?: () => void;
  stations: RadioStation[];
  isTVMode: boolean;
  isModalOpen?: boolean;
}

export function useTVNavigation({
  onPlayPause,
  onNextStation,
  onPreviousStation,
  onSelectStation,
  onToggleMute,
  onVolumeUp,
  onVolumeDown,
  onOpenAddModal,
  onOpenEqualizer,
  onCheckUpdate,
  stations,
  isTVMode,
  isModalOpen = false,
}: TVNavigationOptions) {
  // Focus elements:
  // Controls: 'prev-station' | 'play-pause' | 'next-station'
  // Audio:    'mute' | 'vol-down' | 'vol-up' | 'eq-btn'
  // Stations: 'station-${id}' | 'add-station'
  // Footer:   'check-updates'
  const [focusedElement, setFocusedElement] = useState<string>('play-pause');

  const handleSelectFocused = useCallback(() => {
    if (focusedElement === 'play-pause') {
      onPlayPause();
    } else if (focusedElement === 'prev-station') {
      onPreviousStation();
    } else if (focusedElement === 'next-station') {
      onNextStation();
    } else if (focusedElement === 'mute') {
      onToggleMute();
    } else if (focusedElement === 'vol-down') {
      onVolumeDown?.();
    } else if (focusedElement === 'vol-up') {
      onVolumeUp?.();
    } else if (focusedElement === 'eq-btn') {
      onOpenEqualizer?.();
    } else if (focusedElement === 'check-updates') {
      onCheckUpdate?.();
    } else if (focusedElement === 'add-station') {
      onOpenAddModal?.();
    } else if (focusedElement.startsWith('station-')) {
      const stationId = focusedElement.replace('station-', '');
      const matched = stations.find((s) => s.id === stationId);
      if (matched) {
        onSelectStation(matched);
      }
    }
  }, [
    focusedElement,
    onPlayPause,
    onPreviousStation,
    onNextStation,
    onToggleMute,
    onVolumeDown,
    onVolumeUp,
    onOpenEqualizer,
    onCheckUpdate,
    onOpenAddModal,
    stations,
    onSelectStation,
  ]);

  useEffect(() => {
    if (!isTVMode || isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore navigation shortcuts if typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const code = e.keyCode || e.which;

      // 1. Native Media and Volume keys
      if (e.key === 'MediaPlayPause' || e.code === 'MediaPlayPause' || code === 85) {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (e.key === 'MediaPlay' || e.code === 'MediaPlay' || code === 126) {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (e.key === 'MediaPause' || e.code === 'MediaPause' || code === 127) {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (e.key === 'MediaTrackNext' || e.code === 'MediaTrackNext' || code === 87) {
        e.preventDefault();
        onNextStation();
        return;
      }
      if (e.key === 'MediaTrackPrevious' || e.code === 'MediaTrackPrevious' || code === 88) {
        e.preventDefault();
        onPreviousStation();
        return;
      }

      // Volume keys
      if (e.key === '+' || e.key === '=' || code === 24) {
        e.preventDefault();
        onVolumeUp?.();
        return;
      }
      if (e.key === '-' || e.key === '_' || code === 25) {
        e.preventDefault();
        onVolumeDown?.();
        return;
      }
      if (code === 164 || e.key === 'AudioVolumeMute') {
        e.preventDefault();
        onToggleMute();
        return;
      }

      // 2. Direct Station Select with Numeric Keys (1 to 9)
      if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (stations[index]) {
          e.preventDefault();
          onSelectStation(stations[index]);
          setFocusedElement(`station-${stations[index].id}`);
          return;
        }
      }

      // 3. Spatial Navigation on TV (D-Pad Arrows and Center OK button)
      const isUp = e.key === 'ArrowUp' || code === 19;
      const isDown = e.key === 'ArrowDown' || code === 20;
      const isLeft = e.key === 'ArrowLeft' || code === 21;
      const isRight = e.key === 'ArrowRight' || code === 22;
      const isEnter = e.key === 'Enter' || e.key === ' ' || code === 23 || code === 66;

      if (isEnter) {
        e.preventDefault();
        handleSelectFocused();
        return;
      }

      if (isUp || isDown || isLeft || isRight) {
        e.preventDefault();

        setFocusedElement((current) => {
          const isStationItem = current.startsWith('station-');
          const isAddBtn = current === 'add-station';

          // RIGHT ARROW NAVIGATION
          if (isRight) {
            if (current === 'prev-station') return 'play-pause';
            if (current === 'play-pause') return 'next-station';
            if (current === 'next-station') {
              return stations.length > 0 ? `station-${stations[0].id}` : current;
            }

            if (current === 'mute') return 'vol-down';
            if (current === 'vol-down') return 'vol-up';
            if (current === 'vol-up') return 'eq-btn';
            if (current === 'eq-btn') {
              return stations.length > 0 ? `station-${stations[0].id}` : current;
            }

            if (current === 'check-updates') {
              return 'add-station';
            }

            if (isStationItem) {
              const currentId = current.replace('station-', '');
              const currentIndex = stations.findIndex((s) => s.id === currentId);
              if (currentIndex >= 0 && currentIndex < stations.length - 1) {
                return `station-${stations[currentIndex + 1].id}`;
              }
              return 'add-station';
            }

            return current;
          }

          // LEFT ARROW NAVIGATION
          if (isLeft) {
            if (isStationItem) {
              const currentId = current.replace('station-', '');
              const currentIndex = stations.findIndex((s) => s.id === currentId);
              if (currentIndex === 0) {
                return 'next-station';
              }
              if (currentIndex > 0) {
                return `station-${stations[currentIndex - 1].id}`;
              }
              return 'play-pause';
            }

            if (isAddBtn) {
              return stations.length > 0 ? `station-${stations[stations.length - 1].id}` : 'check-updates';
            }

            if (current === 'eq-btn') return 'vol-up';
            if (current === 'vol-up') return 'vol-down';
            if (current === 'vol-down') return 'mute';
            if (current === 'mute') return 'prev-station';

            if (current === 'next-station') return 'play-pause';
            if (current === 'play-pause') return 'prev-station';

            if (current === 'check-updates') return 'mute';

            return current;
          }

          // DOWN ARROW NAVIGATION
          if (isDown) {
            if (current === 'prev-station') return 'mute';
            if (current === 'play-pause') return 'vol-down';
            if (current === 'next-station') return 'eq-btn';

            if (current === 'mute' || current === 'vol-down' || current === 'vol-up') {
              return 'check-updates';
            }
            if (current === 'eq-btn') {
              return 'check-updates';
            }

            if (isStationItem) {
              const currentId = current.replace('station-', '');
              const currentIndex = stations.findIndex((s) => s.id === currentId);
              if (currentIndex >= 0 && currentIndex < stations.length - 1) {
                return `station-${stations[currentIndex + 1].id}`;
              }
              return 'add-station';
            }

            if (isAddBtn) {
              return 'check-updates';
            }

            return current;
          }

          // UP ARROW NAVIGATION
          if (isUp) {
            if (current === 'check-updates') {
              return 'eq-btn';
            }

            if (current === 'mute') return 'prev-station';
            if (current === 'vol-down' || current === 'vol-up') return 'play-pause';
            if (current === 'eq-btn') return 'next-station';

            if (isAddBtn && stations.length > 0) {
              return `station-${stations[stations.length - 1].id}`;
            }

            if (isStationItem) {
              const currentId = current.replace('station-', '');
              const currentIndex = stations.findIndex((s) => s.id === currentId);
              if (currentIndex > 0) {
                return `station-${stations[currentIndex - 1].id}`;
              }
              return 'play-pause';
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
    handleSelectFocused,
    onPlayPause,
    onNextStation,
    onPreviousStation,
    onToggleMute,
    onVolumeUp,
    onVolumeDown,
    onSelectStation,
    stations,
    isTVMode,
    isModalOpen,
  ]);

  return {
    focusedElement,
    setFocusedElement,
  };
}

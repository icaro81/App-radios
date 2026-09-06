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
  stations: RadioStation[];
  isTVMode: boolean;
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
  stations,
  isTVMode,
}: TVNavigationOptions) {
  // Can be 'play-pause' | 'prev-station' | 'next-station' | 'mute' | 'station-${id}' | 'add-station'
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
    onOpenAddModal,
    stations,
    onSelectStation,
  ]);

  useEffect(() => {
    if (!isTVMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore navigation shortcuts if typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // 1. Native TV Remote Media & Volume Buttons
      const code = e.keyCode || e.which;
      
      // Standard Android TV key codes:
      // KEYCODE_MEDIA_PLAY_PAUSE = 85
      // KEYCODE_MEDIA_PLAY = 126
      // KEYCODE_MEDIA_PAUSE = 127
      // KEYCODE_MEDIA_NEXT = 87
      // KEYCODE_MEDIA_PREVIOUS = 88
      // KEYCODE_VOLUME_UP = 24
      // KEYCODE_VOLUME_DOWN = 25
      // KEYCODE_VOLUME_MUTE = 164

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

      // Volume controls (+ / - / Mute / TV remote keys)
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

      // 3. Spatial Navigation on TV (D-Pad Arrows and Center button)
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
          const isControlBtn = ['prev-station', 'play-pause', 'next-station', 'mute'].includes(current);
          const isStationItem = current.startsWith('station-');
          const isAddBtn = current === 'add-station';

          if (isRight) {
            if (current === 'prev-station') return 'play-pause';
            if (current === 'play-pause') return 'next-station';
            if (current === 'next-station') return 'mute';
            if (isControlBtn && stations.length > 0) return `station-${stations[0].id}`;
            return current;
          }

          if (isLeft) {
            if (isStationItem || isAddBtn) return 'play-pause';
            if (current === 'mute') return 'next-station';
            if (current === 'next-station') return 'play-pause';
            if (current === 'play-pause') return 'prev-station';
            return current;
          }

          if (isDown) {
            if (isControlBtn) {
              return 'play-pause';
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

          if (isUp) {
            if (isAddBtn && stations.length > 0) {
              return `station-${stations[stations.length - 1].id}`;
            }
            if (isStationItem) {
              const currentId = current.replace('station-', '');
              const currentIndex = stations.findIndex((s) => s.id === currentId);
              if (currentIndex > 0) {
                return `station-${stations[currentIndex - 1].id}`;
              }
              return `station-${stations[0].id}`;
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
  ]);

  return {
    focusedElement,
    setFocusedElement,
  };
}

import { useEffect, useState, useCallback } from 'react';
import { RadioStation } from '../types';

interface TVNavigationOptions {
  onPlayPause: () => void;
  onNextStation: () => void;
  onPreviousStation: () => void;
  onSelectStation: (station: RadioStation) => void;
  onToggleMute: () => void;
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
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Native TV Remote Media Buttons (Play/Pause, Next, Prev)
      const code = e.keyCode || e.which;
      
      // Standard Android TV key codes:
      // KEYCODE_MEDIA_PLAY_PAUSE = 85
      // KEYCODE_MEDIA_PLAY = 126
      // KEYCODE_MEDIA_PAUSE = 127
      // KEYCODE_MEDIA_NEXT = 87
      // KEYCODE_MEDIA_PREVIOUS = 88
      // KEYCODE_DPAD_UP = 19
      // KEYCODE_DPAD_DOWN = 20
      // KEYCODE_DPAD_LEFT = 21
      // KEYCODE_DPAD_RIGHT = 22
      // KEYCODE_DPAD_CENTER / ENTER = 23, 66
      // KEYCODE_VOLUME_MUTE = 164

      if (
        e.key === 'MediaPlayPause' ||
        e.code === 'MediaPlayPause' ||
        code === 85
      ) {
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

      // 2. Spatial Navigation on TV (D-Pad Arrows and Center button)
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
    stations,
    isTVMode,
  ]);

  return {
    focusedElement,
    setFocusedElement,
  };
}

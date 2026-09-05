import { useEffect, useState } from 'react';

interface TVNavigationOptions {
  onPlayPause: () => void;
  onNextStation: () => void;
  onPreviousStation: () => void;
  onSelectStation1: () => void;
  onSelectStation2: () => void;
  onToggleMute: () => void;
  isTVMode: boolean;
}

export type FocusableTarget = 
  | 'station-1'
  | 'station-2'
  | 'play-pause'
  | 'prev-station'
  | 'next-station'
  | 'mute'
  | 'mode-selector';

export function useTVNavigation({
  onPlayPause,
  onNextStation,
  onPreviousStation,
  onSelectStation1,
  onSelectStation2,
  onToggleMute,
  isTVMode,
}: TVNavigationOptions) {
  const [focusedElement, setFocusedElement] = useState<FocusableTarget>('play-pause');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Direct Media Keys from Android TV / Android Auto / Bluetooth remotes
      if (e.key === 'MediaPlayPause' || e.code === 'MediaPlayPause') {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (e.key === 'MediaPlay' || e.code === 'MediaPlay') {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (e.key === 'MediaPause' || e.code === 'MediaPause') {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (e.key === 'MediaTrackNext' || e.code === 'MediaTrackNext') {
        e.preventDefault();
        onNextStation();
        return;
      }
      if (e.key === 'MediaTrackPrevious' || e.code === 'MediaTrackPrevious') {
        e.preventDefault();
        onPreviousStation();
        return;
      }

      // If user presses spatial arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) {
        // Spatial map navigation
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedElement((prev) => {
            if (prev === 'mode-selector') return 'play-pause';
            if (prev === 'prev-station' || prev === 'play-pause' || prev === 'next-station') return 'station-1';
            if (prev === 'station-1') return 'station-2';
            if (prev === 'station-2') return 'mute';
            return prev;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedElement((prev) => {
            if (prev === 'mute') return 'station-2';
            if (prev === 'station-2') return 'station-1';
            if (prev === 'station-1') return 'play-pause';
            if (prev === 'play-pause' || prev === 'prev-station' || prev === 'next-station') return 'mode-selector';
            return prev;
          });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setFocusedElement((prev) => {
            if (prev === 'next-station') return 'play-pause';
            if (prev === 'play-pause') return 'prev-station';
            return prev;
          });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setFocusedElement((prev) => {
            if (prev === 'prev-station') return 'play-pause';
            if (prev === 'play-pause') return 'next-station';
            return prev;
          });
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Trigger the focused element action
          if (focusedElement === 'play-pause') {
            onPlayPause();
          } else if (focusedElement === 'station-1') {
            onSelectStation1();
          } else if (focusedElement === 'station-2') {
            onSelectStation2();
          } else if (focusedElement === 'prev-station') {
            onPreviousStation();
          } else if (focusedElement === 'next-station') {
            onNextStation();
          } else if (focusedElement === 'mute') {
            onToggleMute();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedElement,
    onPlayPause,
    onNextStation,
    onPreviousStation,
    onSelectStation1,
    onSelectStation2,
    onToggleMute,
    isTVMode,
  ]);

  return {
    focusedElement,
    setFocusedElement,
  };
}

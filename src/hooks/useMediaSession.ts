import { useEffect } from 'react';
import { RadioStation, PlayerStatus } from '../types';

interface UseMediaSessionProps {
  currentStation: RadioStation;
  playerStatus: PlayerStatus;
  onPlay: () => void;
  onPause: () => void;
  onNextStation: () => void;
  onPreviousStation: () => void;
}

export function useMediaSession({
  currentStation,
  playerStatus,
  onPlay,
  onPause,
  onNextStation,
  onPreviousStation,
}: UseMediaSessionProps) {
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    // Set Android Auto & Android lock screen metadata
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: 'Radio en Directo • Streaming HD',
        album: 'Radio Cristal',
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });
    } catch (e) {
      console.warn('Could not set MediaMetadata:', e);
    }

    // Set playback state for Android Auto & System controls
    try {
      if (playerStatus === 'playing') {
        navigator.mediaSession.playbackState = 'playing';
      } else if (playerStatus === 'paused') {
        navigator.mediaSession.playbackState = 'paused';
      } else {
        navigator.mediaSession.playbackState = 'none';
      }
    } catch (e) {
      console.warn('Could not set playbackState:', e);
    }

    // Bind Android Auto / Steering Wheel / Media Key Action Handlers
    const actionHandlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', onPlay],
      ['pause', onPause],
      ['stop', onPause],
      ['nexttrack', onNextStation],
      ['previoustrack', onPreviousStation],
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        console.warn(`MediaSession action ${action} not supported:`, e);
      }
    });

    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      });
    };
  }, [currentStation, playerStatus, onPlay, onPause, onNextStation, onPreviousStation]);
}

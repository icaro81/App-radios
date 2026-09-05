import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type DetectedPlatform = 'tv' | 'mobile' | 'web';

export function isAndroidTVDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = (navigator.userAgent || '').toLowerCase();
  
  // Known TV User Agents & identifiers
  const tvKeywords = [
    'android tv',
    'googletv',
    'google tv',
    'smart-tv',
    'smarttv',
    'tizen',
    'webos',
    'crkey',
    'aftt', // Amazon Fire TV
    'aftm',
    'aftb',
    'mibox',
    'nexus player',
    'bravia',
    'apple tv',
    'appletv',
    'large screen',
    'hbtv'
  ];

  const matchUA = tvKeywords.some(keyword => ua.includes(keyword));
  if (matchUA) return true;

  // TV typically has 16:9 ratio, no touch pointer, or coarse navigation
  try {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isFine = window.matchMedia('(pointer: fine)').matches;
    const isHover = window.matchMedia('(hover: hover)').matches;
    const isLargeLandscape = window.innerWidth >= 960 && (window.innerWidth / window.innerHeight) >= 1.5;
    
    // Android device without fine mouse or standard primary touch, landscape
    if (ua.includes('android') && isLargeLandscape && !isFine && !isCoarse) {
      return true;
    }
  } catch {
    // Ignore media match errors
  }

  return false;
}

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function useDeviceDetection() {
  const [device, setDevice] = useState<DetectedPlatform>('mobile');
  const [isNative, setIsNative] = useState<boolean>(false);

  useEffect(() => {
    const native = isNativeApp();
    setIsNative(native);

    if (isAndroidTVDevice()) {
      setDevice('tv');
    } else {
      setDevice('mobile');
    }
  }, []);

  return { device, isNative };
}

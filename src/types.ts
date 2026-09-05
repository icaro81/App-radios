export interface RadioStation {
  id: string;
  name: string;
  streamUrl: string;
  subtitle?: string;
  badge?: string;
  isCustom?: boolean;
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

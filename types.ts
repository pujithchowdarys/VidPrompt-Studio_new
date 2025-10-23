
export type AppState = 'upload' | 'prompt' | 'editor';

export type Language = 'English' | 'Telugu' | 'Mixed';

export interface Scene {
  id: string;
  startTime: string;
  endTime: string;
  narration: string;
}
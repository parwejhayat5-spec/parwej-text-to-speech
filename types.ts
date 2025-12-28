export type VoiceMode = 'PRESET' | 'CLONE';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  personality?: string;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voice: string;
  language: string;
  mode: VoiceMode;
  timestamp: number;
  audioBuffer: AudioBuffer;
}

export enum TTSStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}
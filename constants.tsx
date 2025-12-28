import { VoiceOption, Language } from './types';

export const LANGUAGES: Language[] = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
];

export const VOICES: VoiceOption[] = [
  { 
    id: 'Puck', 
    name: 'Mad Scientist', 
    description: 'Very Angry, eccentric, and screaming genius', 
    gender: 'male',
    personality: 'Speak as a VERY ANGRY MAD SCIENTIST. Your voice should be loud, furious, and full of manic energy. You are yelling because your experiment just exploded!' 
  },
  { 
    id: 'Charon', 
    name: 'Neutral Voice', 
    description: 'Flat, robotic, and steady unbiased tone', 
    gender: 'neutral',
    personality: 'Speak in a completely neutral, flat, and robotic tone. No emotion, just clear and steady speech.'
  },
  { id: 'Kore', name: 'Kore', description: 'Deep, resonant male voice', gender: 'male' },
  { id: 'Zephyr', name: 'Zephyr', description: 'Professional and clear female voice', gender: 'female' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Authoritative and calm male voice', gender: 'male' },
  { id: 'Aoide', name: 'Aoide', description: 'Warm and expressive female voice', gender: 'female' },
];

export const SAMPLE_RATE = 24000;
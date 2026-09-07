export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface TTSProvider {
  name: string;
  speak(text: string, options?: TTSOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  isSpeaking(): boolean;
  setRate(rate: number): void;
  setVoice(voice: SpeechSynthesisVoice | string): void;
  getVoices(): SpeechSynthesisVoice[];
}

export type TTSProviderType = 'web' | 'openai';

import { TTSProvider, TTSOptions } from './provider';
import { synthesizeOpenAITTSAction } from '@/actions/tts.actions';

interface OpenAISpeechOptions {
  model?: string;
  voice?: string;
  instructions?: string;
}

export class OpenAITTSProvider implements TTSProvider {
  name = 'openai-tts';

  private speaking = false;
  private paused = false;
  private audio: HTMLAudioElement | null = null;
  private rate = 1;
  private selectedVoice = 'nova';
  private cache = new Map<string, Blob>();
  private speechOptions: OpenAISpeechOptions;

  constructor(speechOptions?: OpenAISpeechOptions) {
    this.speechOptions = {
      model: speechOptions?.model ?? 'gpt-4o-mini-tts',
      voice: speechOptions?.voice ?? 'nova',
      instructions: speechOptions?.instructions,
    };
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    this.stop();

    options?.onStart?.();

    try {
      let dataUrl: string;

      const cacheKey = `${text}:${this.speechOptions.model}:${this.selectedVoice}`;
      if (this.cache.has(cacheKey)) {
        const cachedBlob = this.cache.get(cacheKey)!;
        dataUrl = URL.createObjectURL(cachedBlob);
      } else {
        dataUrl = await synthesizeOpenAITTSAction(
          text,
          this.speechOptions.model,
          this.selectedVoice,
        );
      }

      this.audio = new Audio(dataUrl);
      this.audio.playbackRate = this.rate;

      return new Promise<void>((resolve, reject) => {
        if (!this.audio) {
          reject(new Error('Audio element not created'));
          return;
        }

        this.audio.onplay = () => {
          this.speaking = true;
        };

        this.audio.onended = () => {
          this.speaking = false;
          if (!dataUrl.startsWith('data:')) {
            URL.revokeObjectURL(dataUrl);
          }
          options?.onEnd?.();
          resolve();
        };

        this.audio.onerror = () => {
          this.speaking = false;
          if (!dataUrl.startsWith('data:')) {
            URL.revokeObjectURL(dataUrl);
          }
          const error = new Error('Audio playback error');
          options?.onError?.(error);
          reject(error);
        };

        this.audio.play().catch(reject);
      });
    } catch (error) {
      this.speaking = false;
      const err = error instanceof Error ? error : new Error(String(error));
      options?.onError?.(err);
      throw err;
    }
  }

  pause(): void {
    if (this.audio && this.speaking && !this.paused) {
      this.audio.pause();
      this.paused = true;
    }
  }

  resume(): void {
    if (this.audio && this.paused) {
      this.audio.play();
      this.paused = false;
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.speaking = false;
    this.paused = false;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(4, rate));
    if (this.audio) {
      this.audio.playbackRate = this.rate;
    }
  }

  setVoice(voice: SpeechSynthesisVoice | string): void {
    if (typeof voice === 'string') {
      this.selectedVoice = voice;
    } else {
      this.selectedVoice = voice.name;
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return [];
  }

  getProgress(): number {
    if (!this.audio || !this.audio.duration) return 0;
    return (this.audio.currentTime / this.audio.duration) * 100;
  }

  getDuration(): number {
    return this.audio?.duration ?? 0;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  onTimeUpdate(callback: (progress: number, currentTime: number, duration: number) => void): void {
    if (this.audio) {
      this.audio.ontimeupdate = () => {
        if (this.audio) {
          callback(this.getProgress(), this.audio.currentTime, this.audio.duration);
        }
      };
    }
  }
}

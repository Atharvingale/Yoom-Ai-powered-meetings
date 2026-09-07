import { TTSProvider, TTSOptions } from './provider';

const MAX_CHUNK_LENGTH = 32000;

export class WebSpeechProvider implements TTSProvider {
  name = 'web-speech';

  private speaking = false;
  private paused = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private rate = 1;
  private abortController: AbortController | null = null;

  speak(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const error = new Error('Web Speech API is not supported in this browser');
        options?.onError?.(error);
        reject(error);
        return;
      }

      this.stop();
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      const chunks = this.splitText(text);
      let chunkIndex = 0;

      const speakNextChunk = () => {
        if (signal.aborted || chunkIndex >= chunks.length) {
          this.speaking = false;
          options?.onEnd?.();
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
        utterance.rate = options?.rate ?? this.rate;
        utterance.pitch = options?.pitch ?? 1;
        utterance.volume = options?.volume ?? 1;

        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        } else if (options?.lang) {
          utterance.lang = options.lang;
        }

        this.currentUtterance = utterance;

        utterance.onstart = () => {
          if (chunkIndex === 0) {
            this.speaking = true;
            options?.onStart?.();
          }
        };

        utterance.onend = () => {
          chunkIndex++;
          speakNextChunk();
        };

        utterance.onerror = (event) => {
          if (event.error !== 'canceled') {
            const error = new Error(`Speech error: ${event.error}`);
            this.speaking = false;
            options?.onError?.(error);
            reject(error);
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNextChunk();
    });
  }

  pause(): void {
    if (this.speaking && !this.paused) {
      window.speechSynthesis?.pause();
      this.paused = true;
    }
  }

  resume(): void {
    if (this.paused) {
      window.speechSynthesis?.resume();
      this.paused = false;
    }
  }

  stop(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.speaking = false;
    this.paused = false;
    this.currentUtterance = null;
    window.speechSynthesis?.cancel();
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  setRate(rate: number): void {
    this.rate = Math.max(0.1, Math.min(10, rate));
  }

  setVoice(voice: SpeechSynthesisVoice | string): void {
    if (typeof voice === 'string') {
      const voices = this.getVoices();
      this.selectedVoice = voices.find(
        (v) => v.name === voice || v.lang === voice,
      ) ?? null;
    } else {
      this.selectedVoice = voice;
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis?.getVoices() ?? [];
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private splitText(text: string): string[] {
    if (text.length <= MAX_CHUNK_LENGTH) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.match(/[^.!?\n]+[.!\n]?|[^.!?\n]+$/g) ?? [text];
    let current = '';

    for (const sentence of sentences) {
      if (current.length + sentence.length > MAX_CHUNK_LENGTH) {
        if (current) chunks.push(current);
        current = sentence;
      } else {
        current += sentence;
      }
    }

    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [text];
  }
}

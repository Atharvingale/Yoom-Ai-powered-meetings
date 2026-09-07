import { TTSProvider, TTSProviderType, TTSOptions } from './provider';
import { WebSpeechProvider } from './web-speech';
import { OpenAITTSProvider } from './openai-tts';

export * from './provider';
export * from './web-speech';
export * from './openai-tts';

let defaultProvider: TTSProvider | null = null;

export function createTTSProvider(type?: TTSProviderType): TTSProvider {
  if (type === 'openai') {
    return new OpenAITTSProvider();
  }

  if (type === 'web') {
    return new WebSpeechProvider();
  }

  if (typeof window !== 'undefined') {
    const webProvider = new WebSpeechProvider();
    if (webProvider.isSupported()) {
      return webProvider;
    }
  }

  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TTS_PROVIDER === 'openai') {
    return new OpenAITTSProvider();
  }

  return new WebSpeechProvider();
}

function getDefaultProvider(): TTSProvider {
  if (!defaultProvider) {
    defaultProvider = createTTSProvider();
  }
  return defaultProvider;
}

export async function speakText(text: string, options?: TTSOptions): Promise<void> {
  const provider = getDefaultProvider();
  return provider.speak(text, options);
}

export function pauseSpeech(): void {
  getDefaultProvider().pause();
}

export function resumeSpeech(): void {
  getDefaultProvider().resume();
}

export function stopSpeech(): void {
  getDefaultProvider().stop();
}

export function isSpeechSpeaking(): boolean {
  return getDefaultProvider().isSpeaking();
}

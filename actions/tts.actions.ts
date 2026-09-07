'use server';

import { currentUser } from '@clerk/nextjs/server';

export async function synthesizeOpenAITTSAction(
  text: string,
  model = 'gpt-4o-mini-tts',
  voice = 'nova',
): Promise<string> {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS request failed: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:audio/mp3;base64,${base64}`;
}

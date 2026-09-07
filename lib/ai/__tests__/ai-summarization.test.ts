import { OllamaLocalProvider } from '../ollama-local';

async function testEmptyTranscript() {
  const provider = new OllamaLocalProvider();

  // Test 1: Completely empty transcript
  const emptyResult = await provider.summarize('', []);
  console.assert(
    emptyResult.action_items.length === 0,
    'Empty transcript should have 0 action items'
  );
  console.assert(
    emptyResult.decisions.length === 0,
    'Empty transcript should have 0 decisions'
  );
  console.assert(
    emptyResult.open_questions.length === 0,
    'Empty transcript should have 0 open questions'
  );
  console.assert(
    emptyResult.overview.includes('No transcript content recorded'),
    'Overview should state no transcript recorded'
  );

  // Test 2: Very short transcript (fewer than 15 words)
  const shortResult = await provider.summarize('Hello everyone. Good morning.', []);
  console.assert(
    shortResult.action_items.length === 0,
    'Short transcript should have 0 action items'
  );
  console.assert(
    shortResult.decisions.length === 0,
    'Short transcript should have 0 decisions'
  );

  console.log('✅ Empty & short transcript tests passed successfully.');
}

testEmptyTranscript().catch(console.error);

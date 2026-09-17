export async function transcribeWithDeepgram(audioBuffer: Buffer | Blob): Promise<{ text: string; words: any[] }> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error('Missing DEEPGRAM_API_KEY in environment variables');

  // Deepgram Nova-2 API endpoint with word-level timestamps
  const endpoint =
    'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&utterances=true';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'audio/wav',
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram API failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const alt = data.results?.channels?.[0]?.alternatives?.[0];
  const fullText = alt?.transcript || '';

  // Format Deepgram words array to Capgen's standard schema:
  const words = (alt?.words || []).map((w: any) => ({
    word: (w.punctuated_word || w.word).trim(),
    start: Number(w.start),
    end: Number(w.end),
  }));

  return { text: fullText, words };
}

import { TranscribeResult, hasDevanagari, devanagariToLatin } from './transcribe-gemini';

const LANGUAGE_CODE_MAP: Record<string, string> = {
  auto: 'en',
  english: 'en',
  spanish: 'es',
  arabic: 'ar',
  japanese: 'ja',
  hindi: 'hi',
  nepali: 'ne',
  hinglish: 'hi',
};

export async function transcribeWithGroq(
  fileBlob: Blob,
  filename: string,
  language: string
): Promise<TranscribeResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured on the server.');
  }

  const rawLang = (language || '').toLowerCase().trim();
  const isoLangCode = LANGUAGE_CODE_MAP[rawLang] || (rawLang.length === 2 ? rawLang : 'en');

  const groqFormData = new FormData();
  groqFormData.append('file', fileBlob, filename || 'audio.wav');
  groqFormData.append('model', 'whisper-large-v3');
  groqFormData.append('response_format', 'verbose_json');
  groqFormData.append('timestamp_granularities[]', 'word');
  groqFormData.append('temperature', '0');
  groqFormData.append('language', isoLangCode);

  if (rawLang === 'hinglish') {
    groqFormData.append(
      'prompt',
      "Transcribe verbatim in Hinglish using Latin English alphabet only. Absolutely DO NOT translate to English. Write exact spoken words: to aap ye bol rahe ho, newton ko gravity nahi mila, anpadh aadmi tha, khet me, tatti, video, mast."
    );
  } else if (rawLang === 'hindi' || rawLang === 'hi') {
    groqFormData.append(
      'prompt',
      'हिन्दी में साफ और सही तरीके से लिखें। बोलचाल के शब्दों को शुद्ध देवनागरी लिपि में लिखें।'
    );
  }

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: groqFormData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();

  const words = Array.isArray(data.words)
    ? data.words.map((w: any) => {
        let wordStr = String(w.word || '').trim();
        if (rawLang === 'hinglish' && hasDevanagari(wordStr)) {
          wordStr = devanagariToLatin(wordStr);
        }
        return {
          word: wordStr,
          start: typeof w.start === 'number' ? w.start : Number(w.start) || 0,
          end: typeof w.end === 'number' ? w.end : Number(w.end) || 0,
        };
      })
    : [];

  let fullText = data.text || '';
  if (rawLang === 'hinglish' && hasDevanagari(fullText)) {
    fullText = devanagariToLatin(fullText);
  }

  return {
    text: fullText,
    words,
  };
}

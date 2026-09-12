export interface TranscribeResult {
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}

export function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

export function devanagariToLatin(text: string): string {
  const map: Record<string, string> = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah',
    'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'nga',
    'च': 'cha', 'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'nya',
    'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha', 'ण': 'na',
    'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na',
    'प': 'pa', 'फ': 'fa', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
    'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'sha', 'ष': 'sha', 'स': 'sa', 'ह': 'ha',
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ः': 'h', '्': '',
    '़': '', 'ऽ': '', '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };

  return text
    .split('')
    .map((char) => map[char] || char)
    .join('');
}

export async function transcribeWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
  language: string
): Promise<TranscribeResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const base64Audio = audioBuffer.toString('base64');

  let promptText = '';
  if (language === 'hinglish') {
    promptText =
      'You are an expert audio transcriber. Listen to the Hindi/Urdu audio and transcribe verbatim strictly into Roman English letters (Hinglish/Latin alphabet). Absolutely NO Devanagari Hindi characters allowed. Example: write "to aap ye bol rahe ho ki gravity ki khoj newton ne nahi ki thi". Return JSON object with "text" string and "words" array of objects with start and end timestamps in seconds: {"text": "...", "words": [{"word": "string", "start": number, "end": number}]}';
  } else if (language === 'nepali' || language === 'ne') {
    promptText =
      'Transcribe this spoken Nepali audio verbatim into Devanagari script with word-level timestamps. Return a JSON object: {"text": "...", "words": [{"word": "string", "start": number, "end": number}]}';
  } else {
    promptText =
      'Transcribe this spoken audio verbatim with word-level timestamps. Return a JSON object with "text" string and "words" array of objects: {"text": "...", "words": [{"word": "string", "start": number, "end": number}]}';
  }

  const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash'];
  let lastErrorText = '';

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/wav',
                data: base64Audio,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        lastErrorText = await response.text();
        console.warn(`Gemini model ${model} returned error status ${response.status}: ${lastErrorText}`);
        continue; // Try next model fallback
      }

      const json = await response.json();
      const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        continue;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(candidateText);
      } catch {
        const cleaned = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      const wordsList = Array.isArray(parsed?.words)
        ? parsed.words
        : Array.isArray(parsed)
        ? parsed
        : [];

      const normalizedWords = wordsList.map((w: any) => {
        let wordStr = String(w.word || '').trim();
        if (language === 'hinglish' && hasDevanagari(wordStr)) {
          wordStr = devanagariToLatin(wordStr);
        }
        return {
          word: wordStr,
          start: typeof w.start === 'number' ? w.start : Number(w.start) || 0,
          end: typeof w.end === 'number' ? w.end : Number(w.end) || 0,
        };
      });

      let fullText = parsed?.text || normalizedWords.map((w: { word: string }) => w.word).join(' ');
      if (language === 'hinglish' && hasDevanagari(fullText)) {
        fullText = devanagariToLatin(fullText);
      }

      return {
        text: fullText,
        words: normalizedWords,
      };
    } catch (err: any) {
      lastErrorText = err?.message || String(err);
    }
  }

  throw new Error(`Gemini API failed across all models. Last error: ${lastErrorText}`);
}

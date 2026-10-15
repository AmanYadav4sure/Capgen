import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { apiError, ApiError, privateJson, requireUser, sameOrigin } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/auth-state';
import { profileFor } from '@/lib/server/repository';
import type { CaptionWord } from '@/lib/types';

export const maxDuration = 60;
const MAX_AUDIO = 25 * 1024 * 1024;
function cleanWords(value: unknown): CaptionWord[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12000).flatMap((word) => {
    const text = word?.punctuated_word || word?.word;
    return typeof text === 'string' &&
      text.trim() &&
      text.length <= 500 &&
      Number.isFinite(word.start) &&
      Number.isFinite(word.end) &&
      word.start >= 0 &&
      word.end >= word.start
      ? [{ word: text.trim(), start: word.start, end: word.end }]
      : [];
  });
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const user = await requireUser(req);
    if (!req.headers.get('content-type')?.startsWith('multipart/form-data'))
      throw new ApiError(415, 'Upload an audio file using multipart form data.');
    if (!process.env.GROQ_API_KEY && !process.env.DEEPGRAM_API_KEY)
      throw new ApiError(
        503,
        'Caption generation is temporarily unavailable. Please try again later.',
      );
    const profile = await profileFor(user);
    if (profile.credits <= 0)
      throw new ApiError(
        403,
        'You have no video credits left. Choose a plan before captioning a new video.',
      );
    await rateLimit(`transcribe:${user.uid}`, 6, 60000);
    // Bound streamed bodies even when Content-Length is missing or forged.
    if (Number(req.headers.get('content-length')) > MAX_AUDIO + 65536)
      throw new ApiError(413, 'The audio is too large. Shorten the clip and try again.');
    const reader = req.body?.getReader();
    if (!reader) throw new ApiError(400, 'Choose an audio file.');
    let size = 0;
    const parts: Uint8Array[] = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_AUDIO + 65536) {
          await reader.cancel();
          throw new ApiError(413, 'The audio is too large. Shorten the clip and try again.');
        }
        parts.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    let form: FormData;
    try {
      form = await new Response(Buffer.concat(parts), {
        headers: { 'Content-Type': req.headers.get('content-type')! },
      }).formData();
    } catch {
      throw new ApiError(400, 'The audio upload is incomplete. Please try again.');
    }
    const file = form.get('file');
    if (!(file instanceof File) || !file.size)
      throw new ApiError(400, 'Choose a non-empty audio file.');
    if (file.size > MAX_AUDIO)
      throw new ApiError(413, 'The audio is too large. Shorten the clip and try again.');
    if (
      !/^audio\//.test(file.type) &&
      !['video/mp4', 'video/webm', 'application/octet-stream'].includes(file.type)
    )
      throw new ApiError(415, 'Upload supported audio, not a document or image.');
    const rawLanguage = form.get('language') || 'auto';
    if (
      typeof rawLanguage !== 'string' ||
      !/^(auto|hinglish|[a-z]{2,3}(?:-[A-Za-z]{2,4})?|english|spanish|hindi|nepali)$/i.test(
        rawLanguage,
      )
    )
      throw new ApiError(400, 'Select a supported spoken language.');
    const aliases: Record<string, string> = {
      english: 'en',
      spanish: 'es',
      hindi: 'hi',
      nepali: 'ne',
    };
    const language = aliases[rawLanguage.toLowerCase()] || rawLanguage.toLowerCase().split('-')[0];
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 40000, maxRetries: 0 });
        const result = await groq.audio.transcriptions.create({
          file,
          model: 'whisper-large-v3',
          response_format: 'verbose_json',
          timestamp_granularities: ['word'],
          temperature: 0,
          ...(language !== 'auto' && language !== 'hinglish' ? { language } : {}),
        });
        const words = cleanWords((result as unknown as { words?: unknown }).words);
        if (words.length || result.text?.trim())
          return privateJson({ text: result.text || '', words });
      } catch {
        console.warn('[transcribe] Primary provider failed; trying fallback.');
      }
    }
    if (process.env.DEEPGRAM_API_KEY) {
      try {
        const url = new URL('https://api.deepgram.com/v1/listen');
        url.search = new URLSearchParams({
          model: 'nova-2',
          smart_format: 'true',
          punctuate: 'true',
          utterances: 'true',
          ...(language !== 'auto' && language !== 'hinglish' ? { language } : {}),
        }).toString();
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            'Content-Type': file.type,
          },
          body: await file.arrayBuffer(),
          signal: AbortSignal.timeout(15000),
        });
        if (response.ok) {
          const data = await response.json();
          const alternative = data.results?.channels?.[0]?.alternatives?.[0];
          const words = cleanWords(alternative?.words);
          if (words.length || alternative?.transcript?.trim())
            return privateJson({ text: alternative?.transcript || '', words });
        }
      } catch {
        console.warn('[transcribe] Fallback provider failed.');
      }
    }
    throw new ApiError(
      502,
      'No usable speech transcript was returned. Check the audio and spoken language, then try again.',
    );
  } catch (error) {
    return apiError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 60; // Allow up to 60s for processing

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "auto";

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    console.log(`[Transcribe] Received file: ${file.name}, size: ${(file.size / 1024).toFixed(1)} KB, lang: ${language}`);

    // ==========================================
    // 1. PRIMARY ENGINE: GROQ WHISPER SDK
    // ==========================================
    if (process.env.GROQ_API_KEY) {
      try {
        console.log("[Transcribe] Calling Groq SDK (whisper-large-v3)...");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const transcriptionParams: any = {
          file: file,
          model: "whisper-large-v3",
          response_format: "verbose_json",
          timestamp_granularities: ["word"],
          temperature: 0,
        };

        if (language !== "auto" && language !== "hinglish") {
          const langMap: Record<string, string> = { english: 'en', spanish: 'es', hindi: 'hi', nepali: 'ne' };
          transcriptionParams.language = langMap[language.toLowerCase()] || language;
        }

        const groqData = await groq.audio.transcriptions.create(transcriptionParams);

        const words = ((groqData as any).words || []).map((w: any) => ({
          word: w.word.trim(),
          start: Number(w.start),
          end: Number(w.end),
        }));

        console.log(`[Transcribe] Groq SDK success! Extracted ${words.length} words.`);
        return NextResponse.json({ text: groqData.text || "", words });
      } catch (groqErr: any) {
        console.warn("[Transcribe] Groq SDK failed, checking Deepgram fallback:", groqErr?.message || groqErr);
      }
    }

    // ==========================================
    // 2. FALLBACK ENGINE: DEEPGRAM NOVA-2
    // ==========================================
    if (process.env.DEEPGRAM_API_KEY) {
      try {
        console.log("[Transcribe] Calling Deepgram Nova-2 fallback...");
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        let deepgramUrl = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&utterances=true";
        if (language !== "auto" && language !== "hinglish") {
          deepgramUrl += `&language=${language}`;
        }

        const deepgramRes = await fetch(deepgramUrl, {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": file.type || "audio/wav",
          },
          body: audioBuffer,
        });

        if (deepgramRes.ok) {
          const dgData = await deepgramRes.json();
          const alt = dgData.results?.channels?.[0]?.alternatives?.[0];
          const words = (alt?.words || []).map((w: any) => ({
            word: (w.punctuated_word || w.word).trim(),
            start: Number(w.start),
            end: Number(w.end),
          }));

          if (words.length > 0) {
            console.log(`[Transcribe] Deepgram success! Extracted ${words.length} words.`);
            return NextResponse.json({ text: alt?.transcript || "", words });
          }
        }
      } catch (dgErr) {
        console.warn("[Transcribe] Deepgram exception:", dgErr);
      }
    }

    return NextResponse.json(
      { error: "Groq transcription failed or GROQ_API_KEY is not configured." },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[Transcribe Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to transcribe audio" }, { status: 500 });
  }
}

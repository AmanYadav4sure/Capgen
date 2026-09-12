/**
 * Client-side utility to extract and convert audio from a video file using Web Audio API.
 * Downsamples audio to 16kHz Mono 16-bit PCM WAV (<1MB), perfectly optimized for Whisper & Vercel limits.
 */

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = 1; // Mono
  const sampleRate = buffer.sampleRate; // 16000 Hz
  const samples = buffer.getChannelData(0);
  const bufferLength = samples.length * 2; // 16-bit = 2 bytes per sample
  const out = new DataView(new ArrayBuffer(44 + bufferLength));

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(0, 'RIFF');
  out.setUint32(4, 36 + bufferLength, true);
  writeString(8, 'WAVE');

  // fmt chunk (PCM 16-bit Mono)
  writeString(12, 'fmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true); // PCM format
  out.setUint16(22, numOfChan, true); // 1 channel
  out.setUint32(24, sampleRate, true); // 16000 Hz
  out.setUint32(28, sampleRate * 2, true); // Byte rate
  out.setUint16(32, 2, true); // Block align
  out.setUint16(34, 16, true); // Bits per sample

  // data chunk
  writeString(36, 'data');
  out.setUint32(40, bufferLength, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export const audioBufferToWav = audioBufferToWavBlob;

/**
 * Extracts audio and downsamples to 16kHz Mono WAV (<1MB), perfectly optimized for Whisper & Vercel limits.
 */
export async function extractAudioFromVideo(videoFile: File): Promise<Blob> {
  if (!videoFile) {
    throw new Error('A valid video file must be provided.');
  }

  const arrayBuffer = await videoFile.arrayBuffer();
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  const audioCtx = new AudioContextClass();
  let decodedBuffer: AudioBuffer;

  try {
    decodedBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      const res = audioCtx.decodeAudioData(
        arrayBuffer,
        (buf) => resolve(buf),
        (err) => reject(err || new Error('Failed to decode audio data.'))
      );
      if (res && typeof res.catch === 'function') {
        res.catch(reject);
      }
    });
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }

  // Whisper optimal target: 16000Hz, 1 channel (Mono)
  const targetSampleRate = 16000;
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(decodedBuffer.duration * targetSampleRate),
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const resampledBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(resampledBuffer);
}

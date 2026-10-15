import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Capgen: turn your voice into captions automatically';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const mark = await readFile(join(process.cwd(), 'public', 'logo.png'));
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '72px',
        gap: '48px',
        background: 'linear-gradient(135deg, #eff6ff, #ffffff)',
        color: '#0f172a',
      }}
    >
      <img
        src={`data:image/png;base64,${mark.toString('base64')}`}
        width={340}
        height={340}
        alt=""
      />
      <div style={{ display: 'flex', flexDirection: 'column', width: '600px' }}>
        <div style={{ display: 'flex', fontSize: '42px', fontWeight: 700, marginBottom: '32px' }}>
          Capgen<span style={{ color: '#2563eb' }}>.app</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '60px',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-2px',
          }}
        >
          Turn your voice into captions automatically.
        </div>
        <div style={{ display: 'flex', fontSize: '23px', color: '#475569', marginTop: '28px' }}>
          Timed captions. Your style. Ready to export.
        </div>
      </div>
    </div>,
    size,
  );
}

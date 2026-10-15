import type { CSSProperties } from 'react';
import { PREMIUM_STYLES } from '@/lib/premiumStyles';

/** An honest typography illustration using the editor's actual preset definitions. */
export default function CaptionStyleSample({
  presetId,
  text,
  activeWord = 0,
}: {
  presetId: string;
  text: string;
  activeWord?: number;
}) {
  const preset = PREMIUM_STYLES.find((style) => style.id === presetId);
  if (!preset) return <span>{text}</span>;
  const stroke =
    preset.stroke === 'none'
      ? undefined
      : preset.stroke.replace(/^([\d.]+)px/, (_, width) => `${Number(width) * 0.25}px`);
  const style: CSSProperties = {
    fontFamily: `'${preset.fontFamily}', sans-serif`,
    color: preset.textColor,
    WebkitTextStroke: stroke,
    paintOrder: 'stroke fill',
    textShadow: '0 2px 5px rgba(0,0,0,.8)',
  };
  return (
    <span className="caption-style-sample" style={style} data-preset={preset.id}>
      {text.split(' ').map((word, index) => (
        <span key={index}>
          {index > 0 && ' '}
          <span
            style={
              index === activeWord
                ? {
                    color: preset.highlightColor,
                    background: preset.highlightBg,
                    borderRadius: 4,
                    padding: preset.highlightBg ? '1px 4px' : undefined,
                    textShadow:
                      preset.animation === 'glow' ? `0 0 10px ${preset.highlightColor}` : undefined,
                  }
                : undefined
            }
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}

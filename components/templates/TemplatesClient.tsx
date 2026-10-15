'use client';

import Link from 'next/link';

import { Shell } from '@/components/site';
import CaptionStyleSample from '@/components/CaptionStyleSample';

const templates = [
  {
    name: 'The Bumblebee',
    presetId: 'bumblebee',
    sample: 'Wait until you see this.',
    description:
      'Anton lettering with yellow word highlights and a dark outline. Uses pop motion in the Studio.',
    className: 'bg-gradient-to-br from-amber-300 via-pink-500 to-purple-700',
    accent: 'text-pink-600',
  },
  {
    name: 'Golden Hour Serif',
    presetId: 'golden_hour',
    sample: 'There is a story behind this.',
    description:
      'Playfair Display with warm amber highlights and a dark word background. Uses fade-slide motion.',
    className: 'bg-gradient-to-br from-slate-950 via-slate-700 to-blue-500',
    accent: 'text-blue-600',
  },
  {
    name: 'Apple Minimalist',
    presetId: 'clean_minimal',
    sample: "Here's how I made this video.",
    description:
      'White Inter lettering, a soft outline and sky-blue word emphasis. Uses fade-slide motion.',
    className: 'bg-gradient-to-br from-slate-100 via-white to-blue-200',
    accent: 'text-slate-600',
  },
  {
    name: 'Raj Shamani Gold Glow',
    presetId: 'shamani_gold_glow',
    sample: 'What changed your mind?',
    description:
      'Montserrat with amber active words, a dark outline and glow motion for spoken dialogue.',
    className: 'bg-gradient-to-br from-indigo-950 via-purple-700 to-pink-500',
    accent: 'text-purple-600',
  },
  {
    name: 'MrBeast Viral',
    presetId: 'mrbeast',
    sample: 'This took three attempts.',
    description:
      'Anton lettering with emerald highlights and a black outline. Uses bounce motion in the Studio.',
    className: 'bg-gradient-to-br from-blue-700 via-cyan-400 to-yellow-300',
    accent: 'text-cyan-600',
  },
  {
    name: 'Sunset Coral',
    presetId: 'sunset_glow',
    sample: 'A little practice every day.',
    description: 'White Outfit lettering with black active words on a coral marker background.',
    className: 'bg-gradient-to-br from-rose-200 via-orange-200 to-yellow-100',
    accent: 'text-orange-600',
  },
  {
    name: 'Versely Bold Impact',
    presetId: 'versely_bold',
    sample: 'MAKE EVERY WORD COUNT.',
    description:
      'Condensed Bebas Neue lettering with gold emphasis and a dark word background. Uses pop motion.',
    className: 'bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-700',
    accent: 'text-emerald-600',
  },
  {
    name: 'Frosted Ice Blue',
    presetId: 'frosted_ice',
    sample: 'Start with one small change.',
    description:
      'Poppins lettering with a translucent white word background and blue glow emphasis.',
    className: 'bg-gradient-to-br from-slate-400 via-sky-200 to-white',
    accent: 'text-sky-600',
  },
];

export default function TemplatesClient() {
  return (
    <Shell>
      <div>
        <section className="relative flex min-h-[480px] items-center justify-center overflow-hidden bg-[url('/hero-sky.webp')] bg-cover bg-center px-4 pb-20 pt-16 text-center rounded-3xl max-w-6xl mx-auto my-6 border border-white/80 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-slate-900/40" />
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-blue-700 shadow-md backdrop-blur-md">
              Caption style library
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl drop-shadow-sm">
              Animated video caption templates.
            </h1>
            <p className="mt-4 max-w-2xl rounded-full border border-white/80 bg-white/70 px-6 py-2.5 text-base font-medium leading-relaxed text-slate-800 shadow-sm backdrop-blur-md sm:text-lg">
              Explore caption presets available in the studio, then customize fonts, colors,
              animation and word highlights on your own footage.
            </p>
            <Link
              href="/editor"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-blue-500/30 transition-all hover:scale-105 hover:bg-blue-500"
            >
              Try a template
            </Link>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-20 pt-8">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Presets from the Studio
              </span>
              <h2 className="mt-1 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                Pick a starting point.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              Static illustrations of the actual preset fonts and colors. Preview motion on your own
              video in the Studio.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((template) => (
              <article
                key={template.name}
                className="group overflow-hidden rounded-3xl border border-white/90 bg-white/70 p-3 shadow-xl shadow-blue-500/5 backdrop-blur-2xl transition-all hover:-translate-y-1 hover:bg-white/90 hover:shadow-2xl"
              >
                <div
                  className={`relative aspect-[4/5] overflow-hidden rounded-2xl ${template.className}`}
                >
                  <div className="absolute inset-x-5 top-6 h-2 rounded-full bg-white/40" />
                  <div className="absolute inset-x-5 top-12 h-2 w-2/3 rounded-full bg-white/25" />
                  <div className="absolute inset-x-4 bottom-16 rounded-xl bg-slate-950/80 px-3 py-4 text-center text-xl font-extrabold leading-relaxed">
                    <CaptionStyleSample
                      presetId={template.presetId}
                      text={template.sample}
                      activeWord={2}
                    />
                  </div>
                  <div className="absolute bottom-5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/70" />
                </div>
                <div className="px-2 pb-2 pt-4">
                  <h3 className={`text-lg font-bold ${template.accent}`}>{template.name}</h3>
                  <p className="mt-2 min-h-16 text-sm leading-relaxed text-slate-600">
                    {template.description}
                  </p>
                  <Link
                    href="/editor"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600"
                  >
                    Preview in Studio
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-white/90 bg-gradient-to-br from-blue-500/10 via-white/75 to-purple-500/10 px-6 py-12 text-center shadow-xl shadow-blue-500/5 backdrop-blur-2xl">
            <h2 className="mb-2 text-3xl font-extrabold text-slate-900">
              Adjust the preset to your video.
            </h2>
            <p className="mx-auto mb-6 max-w-md text-base text-slate-600">
              Customize fonts, colors, placement and animation without starting over. These
              illustrative previews are starting points; check each preset on your footage in the
              studio.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-700">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm">
                {' '}
                Word timestamps
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm">
                {' '}
                Zero watermarks
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm">
                {' '}
                Free re-exports
              </span>
            </div>
            <Link
              href="/editor"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-105 hover:bg-blue-500"
            >
              Open Studio
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}

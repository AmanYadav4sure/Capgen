# Capgen artwork

`capgen-mark.png` is the original transparent artwork supplied by the owner. Keep its colors, proportions and transparency intact; do not redraw or stretch it.

Run `node scripts/generate-brand-assets.mjs` to rebuild the browser, touch and app icons from this source using Sharp (included with Next.js). To intentionally replace the source artwork, pass the new image's absolute path as the first argument.

The shared `components/Logo.tsx` component supplies the mark to navigation, footers, authentication pages and editor branding. `app/manifest.ts` defines the app icons, and `app/opengraph-image.tsx` uses the same artwork for link previews. No service worker or offline functionality is implied by the manifest.

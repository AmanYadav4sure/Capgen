import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Capgen: Video Captions',
    short_name: 'Capgen',
    description: 'Turn video speech into timed captions with Capgen.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon-192.png?v=20261015', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png?v=20261015', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icon-maskable-512.png?v=20261015',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

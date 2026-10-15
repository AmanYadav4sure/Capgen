import type { NextConfig } from 'next';

const clerkHost = (() => {
  try {
    const encoded =
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split('_').slice(2).join('_') || '';
    const host = Buffer.from(encoded, 'base64').toString().replace(/\$$/, '');
    return /^[a-z0-9.-]+$/i.test(host) && host.includes('.') ? `https://${host}` : '';
  } catch {
    return '';
  }
})();

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=(), payment=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com ${clerkHost} https://challenges.cloudflare.com https://*.protect.clerk.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "media-src 'self' blob: data:",
      `connect-src 'self' ${clerkHost} https://*.protect.clerk.com:* https://clerk-telemetry.com https://*.clerk-telemetry.com https://www.google-analytics.com https://*.google-analytics.com https://*.vercel-insights.com https://*.vercel-analytics.com`,
      "worker-src 'self' blob:",
      `frame-src 'self' ${clerkHost} https://challenges.cloudflare.com https://*.protect.clerk.com`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

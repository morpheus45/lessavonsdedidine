import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,

  // L'ébauche visuelle et le site construit pour GitHub Pages ne font pas
  // partie de l'application : ils ne doivent pas être compilés par Next.
  outputFileTracingExcludes: {
    '*': ['./design/**', './_site/**'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Le service worker ne doit jamais être servi depuis le cache HTTP,
        // sinon une mise à jour du site peut rester invisible des jours.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
};

export default config;

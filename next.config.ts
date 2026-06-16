import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    // Skip custom cache headers in dev — they break Turbopack HMR.
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

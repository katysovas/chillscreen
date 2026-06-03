import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.coverr.co' },
      { protocol: 'https', hostname: 'coverr.co' },
    ],
  },
};

export default nextConfig;

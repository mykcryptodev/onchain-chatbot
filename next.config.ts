import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'ipfs.io',
      },
      {
        hostname: 'gateway.ipfs.io',
      },
      {
        hostname: 'cloudflare-ipfs.com',
      },
    ],
  },
};

export default nextConfig;

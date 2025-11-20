import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'www.cegid.com',
      },
    ],
  },
  // Exclude pdf-parse from bundling to avoid compatibility issues
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;

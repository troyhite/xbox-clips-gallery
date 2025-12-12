import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone', // Optimized for production deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.xboxlive.com',
      },
      {
        protocol: 'https',
        hostname: 'images-eds-ssl.xboxlive.com',
      },
      {
        protocol: 'https',
        hostname: 'avatar-ssl.xboxlive.com',
      },
    ],
  },
};

export default nextConfig;

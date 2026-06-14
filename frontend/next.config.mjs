import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Untuk deployment static/Vercel yang ringkas
  },
};

export default nextConfig;

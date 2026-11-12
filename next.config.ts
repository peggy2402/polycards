import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      "./public/models/**",
      "./public/images/**",
      "./public/targets/**",
      "./public/audio/**",
      "./public/lib/**",
      "./scripts/**",
      "./docs/**",
    ],
  },
};

export default nextConfig;

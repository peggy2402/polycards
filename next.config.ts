import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

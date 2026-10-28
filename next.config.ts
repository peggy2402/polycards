import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

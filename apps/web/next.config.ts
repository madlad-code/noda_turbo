import type { NextConfig } from "next";
import path from "path"; // Import the path module

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this webpack configuration to resolve the path alias
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // This tells Webpack that `@/` maps to the root of the `apps/web` directory
      "@": path.resolve(__dirname, "./"),
    };
    return config;
  },
};

export default nextConfig;

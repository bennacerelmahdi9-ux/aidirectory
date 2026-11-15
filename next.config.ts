import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return {
      // The favicon is admin-configurable (stored in the DB), so /favicon.ico
      // is handled by the branding route instead of the file convention.
      beforeFiles: [{ source: "/favicon.ico", destination: "/api/branding/favicon" }],
      afterFiles: [],
      fallback: [],
    };
  },
  experimental: {
    serverActions: {
      // Allow branding image uploads (logo / favicon / OG image).
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
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

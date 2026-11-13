import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }],
  },
  async rewrites() {
    const base = process.env.API_INTERNAL_URL || "http://localhost:5000";
    return [{ source: "/backend-api/:path*", destination: `${base}/api/:path*` }];
  },
};

export default nextConfig;

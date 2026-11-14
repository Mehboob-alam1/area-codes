import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
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
    const base = process.env.API_INTERNAL_URL || "http://127.0.0.1:5000";
    return [{ source: "/backend-api/:path*", destination: `${base}/api/:path*` }];
  },
};

export default nextConfig;

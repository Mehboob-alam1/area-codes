import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const frontendDir = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: frontendDir,
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

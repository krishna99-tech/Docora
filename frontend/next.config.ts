import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.29.139",
    "192.168.29.139:3005",
    "100.123.197.94",
    "100.123.197.94:3005",
    "localhost:3005",
    "127.0.0.1:3005",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.INTERNAL_API_URL || (process.env.NODE_ENV === "production" ? "http://backend:8087" : "http://127.0.0.1:8087")}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' blob: data:; object-src 'self' blob: data:; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

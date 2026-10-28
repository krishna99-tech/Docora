import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "192.168.29.139",
    "192.168.29.139:3005",
    "192.168.0.159",
    "100.123.197.94",
    "100.123.197.94:3005",
    "localhost:3005",
    "127.0.0.1:3005",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.INTERNAL_API_URL || (process.env.NODE_ENV === "production" ? "http://backend:8087" : "http://100.73.229.66:8087")}/api/:path*`,
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

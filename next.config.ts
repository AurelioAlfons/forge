import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 75 is next/image's own default, used everywhere else (album art etc).
    // 90 is for the project carousel specifically — its screenshots are
    // text-dense UI, where q75's webp re-encode goes visibly soft.
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        source: "/pc-sequence/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

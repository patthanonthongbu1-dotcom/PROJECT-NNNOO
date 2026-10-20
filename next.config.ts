import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1 MB, which rejects most phone photos before uploadImage
      // runs. Kept under Vercel's 4.5 MB request cap.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;

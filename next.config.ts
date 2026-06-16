import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qfchzmurgiigltdiakdj.supabase.co",
      },
    ],
  },
};

export default nextConfig;

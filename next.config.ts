import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API-кабинет требует Node-сервер; для статического хостинга
  // временно верните output: "export" и вынесите API отдельно.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
};

export default nextConfig;

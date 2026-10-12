import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  typedRoutes: true,
  transpilePackages: ["@anaphor/system"],
  serverExternalPackages: ["postgres"],
};

export default nextConfig;

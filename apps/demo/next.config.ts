import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  typedRoutes: true,
  transpilePackages: ["@design-language/system"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["10.0.0.217"],
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
};

export default nextConfig;

import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: isDevelopment ? {} : false,
};

export default nextConfig;

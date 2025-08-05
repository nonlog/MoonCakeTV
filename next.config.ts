import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.DOCKER_ENV === "true" ? "standalone" : undefined,
};

export default nextConfig;

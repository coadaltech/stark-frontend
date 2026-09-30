import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Organization sites are *.localhost subdomains in development (spec §2); let them load dev assets.
  allowedDevOrigins: ["*.localhost"],
};

export default nextConfig;

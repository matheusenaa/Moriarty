import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  outputFileTracingIncludes: {
    "/**": ["./scripts/**/*.mjs"],
  },
};

export default nextConfig;

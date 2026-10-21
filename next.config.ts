import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  outputFileTracingIncludes: {
    "/api/admin/seed": ["./scripts/**/*.mjs"],
  },
};

export default nextConfig;

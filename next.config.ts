// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Allow deployment even if lint errors exist
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Optional: uncomment below line if TS errors also block builds
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;

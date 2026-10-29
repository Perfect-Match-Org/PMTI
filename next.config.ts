import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // A second player in the same browser opens 127.0.0.1:3000; a different host keeps a separate sign-in.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;

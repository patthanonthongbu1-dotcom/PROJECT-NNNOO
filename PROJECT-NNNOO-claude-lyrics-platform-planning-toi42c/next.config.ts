import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nothing gains from advertising the framework in a header on every
  // response, and it is one fewer thing to tell a scanner.
  poweredByHeader: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async redirects() {
    return [
      // "/" previews land on the default locale of the prototype
      { source: "/", destination: "/en", permanent: false },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allows importing the client-safe shared package from ../../packages/shared
  experimental: { externalDir: true },
  images: { remotePatterns: [{ protocol: "https", hostname: "maps.googleapis.com" }] },
};
export default nextConfig;

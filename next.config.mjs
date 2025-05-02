/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [],
    remotePatterns: [],
    unoptimized: true,
  },
  // Optimize for static export if needed
  output: 'standalone',
  // Add the serverActions configuration to increase body size limit
  experimental: {
    serverActions: {
      // Set to 50MB (value is in bytes: 50 * 1024 * 1024)
      bodySizeLimit: 50 * 1024 * 1024,
    },
  },
};

export default nextConfig;

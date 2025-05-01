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
      // Set to 100MB (value is in bytes: 100 * 1024 * 1024)
      bodySizeLimit: 100 * 1024 * 1024,
    },
  },
};

export default nextConfig;

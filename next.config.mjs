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
  // Increase the body size limit for API routes and Server Actions
  experimental: {
    serverActions: {
      // Set to 100MB (value is in bytes: 100 * 1024 * 1024)
      bodySizeLimit: 100 * 1024 * 1024,
    },
  },
  // Add API route configuration to increase body size limit
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: '100mb',
  },
};

export default nextConfig;

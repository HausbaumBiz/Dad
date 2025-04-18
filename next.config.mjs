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
};

export default nextConfig;

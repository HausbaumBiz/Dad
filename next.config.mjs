/** @type {import('next').NextConfig} */

// This file sets up Sentry for Next.js
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    remotePatterns: [],
    unoptimized: true,
  },
  // Optimize for static export if needed
  output: 'standalone',
  // Ignore ESLint errors during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Sentry webpack plugin configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore
  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);

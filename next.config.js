/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force dynamic rendering for Firebase pages
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@quantum/core-types', '@quantum/ui-components'],
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GATEWAY_API_URL: process.env.NEXT_PUBLIC_GATEWAY_API_URL,
    NEXT_PUBLIC_GATEWAY_WS_URL: process.env.NEXT_PUBLIC_GATEWAY_WS_URL,
  },
};

module.exports = nextConfig;

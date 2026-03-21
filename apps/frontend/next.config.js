/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone-Output fuer Docker (aktiviert mit DOCKER_BUILD=1)
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

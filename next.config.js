/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // This is needed for the file system operations in the API route
    serverActions: true,
  }
}

module.exports = nextConfig 
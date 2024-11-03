/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BASE_URL: process.env.BASE_URL,
  },
  output: 'export',
  images: { unoptimized: true }
};

export default nextConfig;

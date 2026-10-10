/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // نسخة GitHub Pages الثابتة: تُبنى إلى ./out وتُستضاف تحت /efe-yemen-portal/
  output: 'export',
  basePath: '/efe-yemen-portal',
  images: { unoptimized: true },
  trailingSlash: true
};
module.exports = nextConfig;

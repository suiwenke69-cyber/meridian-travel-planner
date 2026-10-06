/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The dev overlay sits in the bottom-left corner over the map and reads as
  // product UI in screenshots. Development affordance only; never shipped.
  devIndicators: false,
  eslint: {
    // Linting is run explicitly via `npm run lint`; do not block production builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

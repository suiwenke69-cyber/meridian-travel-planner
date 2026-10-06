/**
 * `STATIC_EXPORT=1` builds the site as a static export for GitHub Pages.
 * See scripts/build-static.mjs for why that is a script rather than a flag.
 */
const isStaticExport = process.env.STATIC_EXPORT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isStaticExport
    ? {
        output: 'export',
        // A static host has no image optimiser, so images are served as-is.
        images: { unoptimized: true },
        // GitHub Pages resolves /destination/bali to /destination/bali/index.html
        // only with a trailing slash; without it every deep link 404s.
        trailingSlash: true,
      }
    : {}),
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

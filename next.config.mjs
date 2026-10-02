/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return process.env.SITE_INDEXABLE === "true"
      ? []
      : [{
          source: "/:path*",
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
        }];
  },
};

export default nextConfig;

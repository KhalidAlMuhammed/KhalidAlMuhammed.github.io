import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static build. The AWS RDS content store is read at BUILD time only,
  // so the published site has no runtime dependency on the database.
  output: "export",
  // GitHub Pages serves /blog/slug/ from /blog/slug/index.html, which is what
  // trailingSlash emits. Without it, clean URLs 404 on Pages.
  trailingSlash: true,
  images: { unoptimized: true },
  // kalmuhammed.com is an apex custom domain, so no basePath/assetPrefix.
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runs on Vercel rather than exporting to static files: the analytics
  // endpoint needs a runtime, and the build reads posts from AWS RDS, which
  // GitHub's runners may not be able to reach. Pages are still prerendered.
  trailingSlash: true,

  // lib/db.ts reads the RDS CA bundle from disk at runtime via a computed
  // path, which Next's file tracing cannot see. Without this the serverless
  // function deploys without the certificate and every query fails TLS.
  outputFileTracingIncludes: {
    "/api/collect": ["./db/rds-global-bundle.pem"],
  },
};

export default nextConfig;

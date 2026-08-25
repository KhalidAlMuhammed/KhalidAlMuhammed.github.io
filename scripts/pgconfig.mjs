/**
 * Shared Postgres connection config for AWS RDS.
 *
 * pg >= 8.16 treats `sslmode=require` in a connection string as `verify-full`,
 * which fails against RDS because Amazon's root CA is not in Node's trust store.
 * The fix is to actually verify against Amazon's published CA bundle rather
 * than to turn verification off: we strip sslmode from the URL and pass the
 * bundle explicitly, so the connection is both encrypted AND authenticated.
 *
 * Bundle: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(root, "db", "rds-global-bundle.pem");

export function pgConfig() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");

  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("ssl");

  if (!existsSync(bundlePath)) {
    throw new Error(`RDS CA bundle missing at ${bundlePath} — re-download it before building`);
  }

  return {
    connectionString: url.toString(),
    ssl: {
      ca: readFileSync(bundlePath, "utf8"),
      // Verify the chain against Amazon's CA, and check the hostname.
      rejectUnauthorized: true,
      servername: url.hostname,
    },
  };
}

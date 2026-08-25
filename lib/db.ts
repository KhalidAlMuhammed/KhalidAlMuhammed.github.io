import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";

/**
 * Build-time-only database access.
 *
 * Every caller here runs during `next build` (output: "export"), never in the
 * browser and never on a request. If the DB is unreachable the build FAILS —
 * deliberately. Silently shipping a site with zero posts because a connection
 * blipped would look like a successful deploy and quietly delete the blog.
 */

const CA_PATH = path.join(process.cwd(), "db", "rds-global-bundle.pem");

function config(): pg.PoolConfig {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. The build reads posts from AWS RDS; without it there is nothing to publish.",
    );
  }

  const url = new URL(raw);
  // pg >= 8.16 reads sslmode=require as verify-full and then fails on RDS's
  // Amazon-issued chain. Strip it and verify against Amazon's CA bundle.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("ssl");

  if (!existsSync(CA_PATH)) {
    throw new Error(`RDS CA bundle missing at ${CA_PATH}`);
  }

  return {
    connectionString: url.toString(),
    ssl: {
      ca: readFileSync(CA_PATH, "utf8"),
      rejectUnauthorized: true,
      servername: url.hostname,
    },
    max: 4,
  };
}

// Next builds many pages concurrently; one pool for the whole build.
const globalForPg = globalThis as unknown as { __blogPool?: pg.Pool };
const pool = globalForPg.__blogPool ?? new pg.Pool(config());
globalForPg.__blogPool = pool;

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

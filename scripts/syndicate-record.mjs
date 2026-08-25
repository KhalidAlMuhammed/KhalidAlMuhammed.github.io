#!/usr/bin/env node
/**
 * Record where a manually-published copy landed.
 *
 *   npm run syndicate:record -- <slug> substack https://...
 *
 * Substack, LinkedIn and X have no write API, so their URLs are entered by
 * hand. Once recorded, the post page links out to them under "Also published at".
 */
import pg from "pg";
import { loadEnv } from "./env.mjs";
import { pgConfig } from "./pgconfig.mjs";

loadEnv();

const [, , slug, platform, url] = process.argv;
if (!slug || !platform || !url) {
  console.error("usage: npm run syndicate:record -- <slug> <devto|hashnode|substack|linkedin|x> <url>");
  process.exit(1);
}

const client = new pg.Client(pgConfig());
await client.connect();
try {
  const { rows } = await client.query(
    `INSERT INTO syndications (post_id, platform, remote_url, status, synced_at)
     SELECT id, $2, $3, 'manual', now() FROM posts WHERE slug = $1
     ON CONFLICT (post_id, platform) DO UPDATE SET
       remote_url = EXCLUDED.remote_url, status = 'manual', error = NULL, synced_at = now()
     RETURNING platform, remote_url`,
    [slug, platform, url],
  );
  if (!rows.length) {
    console.error(`no post with slug "${slug}"`);
    process.exit(1);
  }
  console.log(`recorded ${rows[0].platform}: ${rows[0].remote_url}`);
  console.log("Rebuild the site for the link to appear on the post page.");
} finally {
  await client.end();
}

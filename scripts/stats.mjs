#!/usr/bin/env node
/** Reading stats. `npm run stats -- 30` for the last 30 days (default 7). */
import pg from "pg";
import { loadEnv } from "./env.mjs";
import { pgConfig } from "./pgconfig.mjs";

loadEnv();
const days = Number(process.argv[2] ?? 7);
const c = new pg.Client(pgConfig());
await c.connect();

const q = async (sql) => (await c.query(sql.replace("$DAYS", String(days)))).rows;
const show = (title, rows, fmt) => {
  console.log(`\n${title}`);
  if (!rows.length) return console.log("  (nothing yet)");
  for (const r of rows) console.log("  " + fmt(r));
};

show(
  `Most read (last ${days}d)`,
  await q(`SELECT COALESCE(slug, path) AS page, count(*) AS reads,
                  round(avg(engaged_ms)/1000) AS avg_s,
                  round(avg(max_scroll_pct)) AS avg_scroll,
                  count(*) FILTER (WHERE reached_end) AS finished
           FROM page_reads WHERE started_at > now() - interval '$DAYS days'
           GROUP BY 1 ORDER BY reads DESC LIMIT 15`),
  (r) => `${String(r.reads).padStart(4)} reads  ${String(r.avg_s).padStart(4)}s avg  ${String(r.avg_scroll).padStart(3)}% scroll  ${String(r.finished).padStart(3)} finished  ${r.page}`,
);

show(
  "Where people stop reading",
  await q(`SELECT slug, last_heading, count(*) AS n
           FROM page_reads
           WHERE started_at > now() - interval '$DAYS days'
             AND last_heading IS NOT NULL AND NOT reached_end
           GROUP BY 1,2 ORDER BY n DESC LIMIT 12`),
  (r) => `${String(r.n).padStart(4)}  ${r.slug ?? "-"} — "${r.last_heading}"`,
);

show(
  "Countries",
  await q(`SELECT country, count(*) AS n FROM page_reads
           WHERE started_at > now() - interval '$DAYS days' AND country IS NOT NULL
           GROUP BY 1 ORDER BY n DESC LIMIT 12`),
  (r) => `${String(r.n).padStart(4)}  ${r.country}`,
);

show(
  "Referrers",
  await q(`SELECT referrer_host, count(*) AS n FROM page_reads
           WHERE started_at > now() - interval '$DAYS days' AND referrer_host IS NOT NULL
           GROUP BY 1 ORDER BY n DESC LIMIT 12`),
  (r) => `${String(r.n).padStart(4)}  ${r.referrer_host}`,
);

show(
  "Outbound clicks",
  await q(`SELECT href, count(*) AS n FROM link_clicks
           WHERE clicked_at > now() - interval '$DAYS days' AND kind = 'outbound'
           GROUP BY 1 ORDER BY n DESC LIMIT 15`),
  (r) => `${String(r.n).padStart(4)}  ${r.href}`,
);

console.log("");
await c.end();

#!/usr/bin/env node
/**
 * Syndicate a published post to the other platforms.
 *
 *   npm run syndicate -- <slug>                    # every configured target
 *   npm run syndicate -- <slug> --to devto,x
 *   npm run syndicate -- <slug> --dry-run
 *
 * What is actually automatable, and what is not:
 *
 *   devto     full API. Publishes, sets canonical_url back here.
 *   hashnode  full GraphQL API. Publishes, sets originalArticleURL back here.
 *   substack  NO public write API exists. Substack's editor has an
 *             import-from-URL that pulls a published post in one click, so we
 *             prepare that and print the link. Anyone claiming to automate
 *             Substack publishing is driving a headless browser.
 *   linkedin  no article API (only member-authored shares via a reviewed app).
 *   x         no article API. Both get generated announcement copy to paste.
 *
 * Every target records its outcome in the `syndications` table, so a re-run
 * updates the existing copy instead of publishing a duplicate.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { loadEnv } from "./env.mjs";
import { pgConfig } from "./pgconfig.mjs";

loadEnv();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, ".syndication");
const SITE_URL = "https://kalmuhammed.com";

const [, , slug, ...flags] = process.argv;
if (!slug || slug.startsWith("--")) {
  console.error("usage: npm run syndicate -- <slug> [--to devto,hashnode,substack,linkedin,x] [--dry-run]");
  process.exit(1);
}

const dryRun = flags.includes("--dry-run");
const toFlag = flags.find((f) => f.startsWith("--to="))
  ?? (flags.includes("--to") ? `--to=${flags[flags.indexOf("--to") + 1]}` : null);
const requested = toFlag ? toFlag.replace("--to=", "").split(",").map((s) => s.trim()) : null;

const client = new pg.Client(pgConfig());
await client.connect();

const { rows } = await client.query(`SELECT * FROM posts WHERE slug = $1`, [slug]);
if (!rows.length) {
  console.error(`no post with slug "${slug}"`);
  await client.end();
  process.exit(1);
}
const post = rows[0];
if (post.status !== "published") {
  console.error(`"${slug}" is a draft. Publish it first: npm run post:publish -- ${slug}`);
  await client.end();
  process.exit(1);
}

const canonicalUrl = `${SITE_URL}/blog/${post.slug}/`;
const references = Array.isArray(post.refs) ? post.refs : [];

/**
 * Rewrite the post for a platform that has none of our citation machinery.
 *
 * On kalmuhammed.com `[@key]` becomes a superscript link into the References
 * block. Elsewhere that anchor does not exist, so the citation is flattened to
 * a plain [n] and the bibliography is appended as an ordinary numbered list.
 * Without this step every syndicated copy ships with dead in-page anchors.
 */
function toSyndicatedMarkdown() {
  const numberOf = new Map(references.map((ref, i) => [ref.id, i + 1]));

  let body = post.body_md.replace(/\[@([^\]]+)\]/g, (whole, inner) => {
    const numbers = inner
      .split(";")
      .map((k) => numberOf.get(k.trim().replace(/^@/, "")))
      .filter(Boolean);
    return numbers.length ? `[${numbers.join(", ")}]` : whole;
  });

  if (references.length) {
    const list = references
      .map((ref, i) => {
        const title = ref.url ? `[${ref.title}](${ref.url})` : ref.title;
        const year = ref.year ? ` (${ref.year})` : "";
        const venue = ref.venue ? `. ${ref.venue}` : "";
        return `${i + 1}. ${ref.authors}${year}. ${title}${venue}.`;
      })
      .join("\n");
    body += `\n\n## References\n\n${list}\n`;
  }

  body += `\n\n---\n\n*Originally published at [kalmuhammed.com](${canonicalUrl}).*\n`;
  return body;
}

const markdown = toSyndicatedMarkdown();

async function record(platform, { status, remoteId = null, remoteUrl = null, error = null }) {
  await client.query(
    `INSERT INTO syndications (post_id, platform, remote_id, remote_url, status, error, synced_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (post_id, platform) DO UPDATE SET
       remote_id = COALESCE(EXCLUDED.remote_id, syndications.remote_id),
       remote_url = COALESCE(EXCLUDED.remote_url, syndications.remote_url),
       status = EXCLUDED.status,
       error = EXCLUDED.error,
       synced_at = now()`,
    [post.id, platform, remoteId, remoteUrl, status, error],
  );
}

async function existing(platform) {
  const { rows } = await client.query(
    `SELECT remote_id, remote_url, status FROM syndications WHERE post_id = $1 AND platform = $2`,
    [post.id, platform],
  );
  return rows[0] ?? null;
}

/* ── dev.to ──────────────────────────────────────────────────────── */

async function syndicateDevto() {
  const key = process.env.DEVTO_API_KEY;
  if (!key) return console.log("devto:     skipped (DEVTO_API_KEY not set)");

  const prior = await existing("devto");
  // dev.to allows at most 4 tags and rejects anything non-alphanumeric.
  const tags = (post.tags ?? [])
    .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .slice(0, 4);

  const payload = {
    article: {
      title: post.title,
      body_markdown: markdown,
      published: true,
      canonical_url: canonicalUrl,
      description: post.description,
      tags,
    },
  };

  if (dryRun) return console.log(`devto:     would ${prior?.remote_id ? "update" : "create"} (${tags.join(", ")})`);

  const url = prior?.remote_id
    ? `https://dev.to/api/articles/${prior.remote_id}`
    : "https://dev.to/api/articles";

  const response = await fetch(url, {
    method: prior?.remote_id ? "PUT" : "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/vnd.forem.api-v1+json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    await record("devto", { status: "failed", error: `${response.status} ${text.slice(0, 300)}` });
    return console.log(`devto:     FAILED ${response.status} ${text.slice(0, 200)}`);
  }

  const data = JSON.parse(text);
  await record("devto", { status: "synced", remoteId: String(data.id), remoteUrl: data.url });
  console.log(`devto:     ${prior?.remote_id ? "updated" : "published"} ${data.url}`);
}

/* ── Hashnode ────────────────────────────────────────────────────── */

async function hashnodeGraphql(token, query, variables) {
  const response = await fetch("https://gql.hashnode.com/", {
    method: "POST",
    headers: { authorization: token, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const data = await response.json();
  if (data.errors) throw new Error(data.errors.map((e) => e.message).join("; "));
  return data.data;
}

async function syndicateHashnode() {
  const token = process.env.HASHNODE_TOKEN;
  if (!token) return console.log("hashnode:  skipped (HASHNODE_TOKEN not set)");

  const prior = await existing("hashnode");

  if (dryRun) return console.log(`hashnode:  would ${prior?.remote_id ? "update" : "create"}`);

  try {
    let publicationId = process.env.HASHNODE_PUBLICATION_ID;
    if (!publicationId) {
      const me = await hashnodeGraphql(
        token,
        `query { me { publications(first: 1) { edges { node { id url } } } } }`,
        {},
      );
      publicationId = me?.me?.publications?.edges?.[0]?.node?.id;
      if (!publicationId) throw new Error("no publication on this Hashnode account — create one first");
    }

    if (prior?.remote_id) {
      const data = await hashnodeGraphql(
        token,
        `mutation Update($input: UpdatePostInput!) {
           updatePost(input: $input) { post { id url } }
         }`,
        {
          input: {
            id: prior.remote_id,
            title: post.title,
            contentMarkdown: markdown,
            originalArticleURL: canonicalUrl,
          },
        },
      );
      const updated = data.updatePost.post;
      await record("hashnode", { status: "synced", remoteId: updated.id, remoteUrl: updated.url });
      return console.log(`hashnode:  updated ${updated.url}`);
    }

    const data = await hashnodeGraphql(
      token,
      `mutation Publish($input: PublishPostInput!) {
         publishPost(input: $input) { post { id url } }
       }`,
      {
        input: {
          publicationId,
          title: post.title,
          contentMarkdown: markdown,
          originalArticleURL: canonicalUrl,
          subtitle: post.description.slice(0, 250),
          tags: (post.tags ?? []).slice(0, 5).map((t) => ({ slug: t.toLowerCase().replace(/[^a-z0-9]/g, "-"), name: t })),
        },
      },
    );
    const created = data.publishPost.post;
    await record("hashnode", { status: "synced", remoteId: created.id, remoteUrl: created.url });
    console.log(`hashnode:  published ${created.url}`);
  } catch (error) {
    await record("hashnode", { status: "failed", error: String(error.message).slice(0, 300) });
    console.log(`hashnode:  FAILED ${error.message}`);
  }
}

/* ── Substack ────────────────────────────────────────────────────── */

async function syndicateSubstack() {
  // No write API. Substack's editor imports a live URL, which is the only
  // first-party path that keeps formatting and does not violate their ToS.
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${post.slug}.substack.md`);
  writeFileSync(path, markdown);

  if (!dryRun) await record("substack", { status: "pending" });

  console.log("substack:  manual step (no write API exists)");
  console.log(`           1. open https://substack.com/publish/post?type=newsletter`);
  console.log(`           2. editor menu > Import > paste: ${canonicalUrl}`);
  console.log(`           3. fallback if the import misbehaves: ${path}`);
  console.log(`           then record the URL:`);
  console.log(`           npm run syndicate:record -- ${post.slug} substack <url>`);
}

/* ── LinkedIn + X ────────────────────────────────────────────────── */

function announcement(platform) {
  const opener = post.description.split(/(?<=\.)\s/)[0];

  if (platform === "x") {
    // Keep it inside a single post; the link is what earns the click.
    return `${post.title}\n\n${opener}\n\n${canonicalUrl}`;
  }

  return `${post.title}\n\n${post.description}\n\n${
    references.length
      ? `Argued against ${references.length} papers, and against my own production logs.\n\n`
      : ""
  }${canonicalUrl}`;
}

async function syndicateSocial(platform) {
  mkdirSync(OUT_DIR, { recursive: true });
  const text = announcement(platform);
  const path = join(OUT_DIR, `${post.slug}.${platform}.txt`);
  writeFileSync(path, text);

  if (!dryRun) await record(platform, { status: "pending" });

  console.log(`${platform.padEnd(10)} announcement written to ${path}`);
  if (platform === "x") console.log(`           ${text.length} characters`);
}

/* ── run ─────────────────────────────────────────────────────────── */

const targets = {
  devto: syndicateDevto,
  hashnode: syndicateHashnode,
  substack: syndicateSubstack,
  linkedin: () => syndicateSocial("linkedin"),
  x: () => syndicateSocial("x"),
};

const selected = requested ?? Object.keys(targets);
const unknown = selected.filter((t) => !targets[t]);
if (unknown.length) {
  console.error(`unknown target(s): ${unknown.join(", ")}`);
  await client.end();
  process.exit(1);
}

console.log(`\n"${post.title}"`);
console.log(`${canonicalUrl}${dryRun ? "   [dry run]" : ""}\n`);

for (const name of selected) {
  await targets[name]();
}

console.log("");
await client.end();

#!/usr/bin/env node
/**
 * Post authoring CLI.
 *
 * The AWS RDS `blog` database is the source of truth. You still write in a real
 * editor: `pull` brings a post down to content/<slug>.md, `push` sends it back.
 * The local file is a working copy, never the canonical version — which is why
 * push always writes the whole row and pull always overwrites the file.
 *
 *   npm run post:new     -- <slug>
 *   npm run post:list
 *   npm run post:push    -- content/<slug>.md
 *   npm run post:pull    -- <slug>
 *   npm run post:publish -- <slug>
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import matter from "gray-matter";
import pg from "pg";
import { loadEnv } from "./env.mjs";
import { pgConfig } from "./pgconfig.mjs";

loadEnv();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "content");

const [, , command, ...rest] = process.argv;
const args = rest.filter((a) => !a.startsWith("--"));

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

const TEMPLATE = (slug) => `---
title: "A working title that states the argument"
description: "One or two sentences. This is the dek under the title, the meta description, and the excerpt every syndication target shows. Make it the thesis, not a teaser."
tags: [ai, systems]
status: draft
publishedAt: null
references:
  - id: vaswani2017
    authors: "Vaswani, A., Shazeer, N., Parmar, N., et al."
    year: 2017
    title: "Attention Is All You Need"
    venue: "NeurIPS"
    url: "https://arxiv.org/abs/1706.03762"
    note: "Verify every reference before publishing."
---

Open on the concrete thing that happened. A specific moment, a specific
failure, a specific number on a specific night. Not a definition.

## The claim everyone repeats

State the received wisdom fairly and at its strongest, then cite where it comes
from [@vaswani2017]. An argument that beats a weak version of the other side
has not beaten anything.

## Where it breaks

This is the section only you can write: what happened when you actually built
it. Numbers, logs, the shape of the failure.

## What I think is actually true

Land the thesis. Say what you would do differently and what you are still
unsure about — the uncertainty is what makes the rest credible.
`;

async function withClient(fn) {
  const client = new pg.Client(pgConfig());
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

function parseFile(path) {
  if (!existsSync(path)) fail(`no such file: ${path}`);
  const { data, content } = matter(readFileSync(path, "utf8"));

  if (!data.title) fail(`${path}: frontmatter is missing "title"`);
  if (!data.description) fail(`${path}: frontmatter is missing "description"`);

  const slug = data.slug || path.split("/").pop().replace(/\.md$/, "");
  const status = data.status === "published" ? "published" : "draft";

  // A published post needs a date; the DB enforces this too, but failing here
  // gives a readable message instead of a constraint violation.
  let publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
  if (status === "published" && !publishedAt) publishedAt = new Date();

  const references = Array.isArray(data.references) ? data.references : [];
  for (const ref of references) {
    if (!ref.id) fail(`${path}: every reference needs an "id" to cite it by`);
    if (!ref.title || !ref.authors) fail(`${path}: reference "${ref.id}" needs authors and title`);
  }

  // Citation keys used in the prose must exist in the bibliography, or the
  // build renders a visible "?" where a number should be.
  const keys = new Set(references.map((r) => r.id));
  const used = [...content.matchAll(/\[@([^\]]+)\]/g)].flatMap((m) =>
    m[1].split(";").map((k) => k.trim().replace(/^@/, "")),
  );
  const unknown = [...new Set(used)].filter((k) => !keys.has(k));
  if (unknown.length) fail(`${path}: cited but not in references: ${unknown.join(", ")}`);

  return {
    slug,
    title: data.title,
    description: data.description,
    body: content.trim(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    references,
    status,
    publishedAt,
  };
}

function toFile(row) {
  const frontmatter = {
    slug: row.slug,
    title: row.title,
    description: row.description,
    tags: row.tags ?? [],
    status: row.status,
    publishedAt: row.published_at ? row.published_at.toISOString().slice(0, 10) : null,
    references: row.refs ?? [],
  };
  return matter.stringify(row.body_md, frontmatter);
}

switch (command) {
  case "new": {
    const slug = args[0];
    if (!slug) fail("usage: npm run post:new -- <slug>");
    mkdirSync(CONTENT_DIR, { recursive: true });
    const path = join(CONTENT_DIR, `${slug}.md`);
    if (existsSync(path)) fail(`${path} already exists`);
    writeFileSync(path, TEMPLATE(slug));
    console.log(`created ${path}`);
    break;
  }

  case "list": {
    await withClient(async (client) => {
      const { rows } = await client.query(
        `SELECT slug, title, status, published_at,
                (SELECT count(*) FROM syndications s WHERE s.post_id = p.id AND s.status IN ('synced','manual')) AS synced
         FROM posts p ORDER BY COALESCE(published_at, created_at) DESC`,
      );
      if (!rows.length) return console.log("no posts yet");
      for (const row of rows) {
        const date = row.published_at ? row.published_at.toISOString().slice(0, 10) : "unpublished";
        console.log(
          `${row.status.padEnd(9)} ${date.padEnd(12)} ${String(row.synced).padStart(2)} syndicated  ${row.slug}  —  ${row.title}`,
        );
      }
    });
    break;
  }

  case "push": {
    const path = args[0];
    if (!path) fail("usage: npm run post:push -- content/<slug>.md");
    const post = parseFile(path);
    await withClient(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO posts (slug, title, description, body_md, tags, refs, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           body_md = EXCLUDED.body_md,
           tags = EXCLUDED.tags,
           refs = EXCLUDED.refs,
           status = EXCLUDED.status,
           -- Keep the original publication date on re-push; an edit is not a republish.
           published_at = COALESCE(posts.published_at, EXCLUDED.published_at)
         RETURNING id, slug, status, published_at`,
        [
          post.slug,
          post.title,
          post.description,
          post.body,
          post.tags,
          JSON.stringify(post.references),
          post.status,
          post.publishedAt,
        ],
      );
      const row = rows[0];
      console.log(`pushed "${row.slug}" (${row.status}${row.published_at ? `, ${row.published_at.toISOString().slice(0, 10)}` : ""})`);
      console.log(`${post.references.length} references, ${post.body.split(/\s+/).length} words`);
    });
    break;
  }

  case "pull": {
    const slug = args[0];
    if (!slug) fail("usage: npm run post:pull -- <slug>");
    await withClient(async (client) => {
      const { rows } = await client.query(`SELECT * FROM posts WHERE slug = $1`, [slug]);
      if (!rows.length) fail(`no post with slug "${slug}"`);
      mkdirSync(CONTENT_DIR, { recursive: true });
      const path = join(CONTENT_DIR, `${slug}.md`);
      writeFileSync(path, toFile(rows[0]));
      console.log(`wrote ${path}`);
    });
    break;
  }

  case "publish": {
    const slug = args[0];
    if (!slug) fail("usage: npm run post:publish -- <slug>");
    await withClient(async (client) => {
      const { rows } = await client.query(
        `UPDATE posts SET status = 'published', published_at = COALESCE(published_at, now())
         WHERE slug = $1 RETURNING slug, published_at`,
        [slug],
      );
      if (!rows.length) fail(`no post with slug "${slug}"`);
      console.log(`published "${rows[0].slug}" at ${rows[0].published_at.toISOString()}`);
      console.log("Run the deploy workflow (or push to main) to rebuild the static site.");
    });
    break;
  }

  default:
    console.log("commands: new | list | push | pull | publish");
    process.exit(command ? 1 : 0);
}

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
import { lintPost } from "./lint.mjs";

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
title: ""
description: ""
tags: []
status: draft
publishedAt: null
references: []
---

<!-- ────────────────────────────────────────────────────────────────
     THE BRIEF. Answer all five, in writing, before you draft a line
     of the essay. Delete this block when the answers stop being
     useful to you.

     There is deliberately no section skeleton here. The last one
     produced four essays with the same four headings, which is how
     you get a blog that reads like one piece written repeatedly.
     The shape should come from the argument, not from a template.

     1. THE CLAIM I AM ARGUING AGAINST, AND WHOSE IT IS.
        A specific paper, method, practice or person. Not "the field",
        not "people think" — those are opponents who never turn up.
        If this is blank you do not have an essay yet, you have a topic.

        >

     2. WHAT I MEASURED, AND OUT OF WHAT.
        Real numbers from a real log, table or file, each with its
        denominator, plus how you counted. No invented evidence, ever.
        If you have not measured anything, go and measure it; that is
        the part of this nobody else can write.

        >

     3. WHAT WOULD PROVE ME WRONG.
        The observation that would change your mind. If nothing could,
        the thesis is a preference and should be written as one.

        >

     4. THE STRONGEST OBJECTION, FROM SOMEONE WHO KNOWS MORE THAN ME.
        Write it at full strength, then say what it legitimately
        retires. An essay that concedes nothing argued with a strawman.

        >

     5. THE PAPERS, AND WHAT EACH ONE ACTUALLY DID.
        Open each one. Method, dataset, a number it reported, or the
        limitation that makes it not quite fit your case. If all you
        can write is the title, you have not read it and must not
        cite it.

        >

     ──────────────────────────────────────────────────────────────── -->

Start with the concrete thing you can show: the artifact, the log line, the
measurement. Not a definition, and not a scene you reconstructed from memory.
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

const NO_LINT = rest.includes("--no-lint");

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

  // Prose lint. Errors block the push; the point is to force the rewrite
  // rather than to publish something essay-shaped and hollow.
  const { errors, warnings } = NO_LINT ? { errors: [], warnings: [] } : lintPost({
    body: content,
    references,
    description: data.description,
  });
  for (const w of warnings) console.warn(`  warning: ${w}`);
  if (errors.length) {
    console.error(`\n${path} failed the prose lint:\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("\nSee docs/VOICE.md. Override for a deliberate exception: --no-lint\n");
    process.exit(1);
  }

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

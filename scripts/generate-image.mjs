#!/usr/bin/env node
/**
 * Generate a post image through Reem's internal image endpoint.
 *
 *   npm run image -- <slug> "what the photograph shows" [--figure name]
 *
 * The house rules for these images live in docs/IMAGES.md and come straight
 * from the Figma ad system (docs/reem-ad-system.md §1.4, §6.5) — the same rules
 * we make in Figma, applied to essay illustration:
 *
 *   - documentary editorial photography, warm natural light, natural film
 *     grain, candid and unposed
 *   - no text, no logos, no watermarks (a generated sign always reads as fake)
 *   - the photograph must depict the essay's ACTUAL subject
 *   - populated: other people in frame, never a lone figure shot from behind
 *     in an empty place at night — that is the grammar of surveillance footage
 *   - compose the negative space deliberately: the hero is overlaid by nothing,
 *     but it is cropped wide, so brief the subject into the lower two-thirds
 *
 * Endpoint notes, learned the hard way (§6.5):
 *   - it IGNORES aspectRatio and picks its own model, so the returned size must
 *     be read back rather than assumed
 *   - it takes 90–190s; the timeout here is set accordingly
 *   - it must run as a QA tester, never a real user. The Figma doc says user
 *     110; that id no longer exists (the 2026-08 QA fleet cleanup took it), so
 *     the id is configurable via REEM_IMAGE_USER_ID. Current QA testers are the
 *     `999*` phone numbers in reem_users.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { loadEnv } from "./env.mjs";
import { pgConfig } from "./pgconfig.mjs";

loadEnv();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REEM = process.env.REEM_INTERNAL_URL ?? "http://10.128.0.2:4000";
const TOKEN = process.env.REEM_INTERNAL_TOKEN;
const QA_USER_ID = Number(process.env.REEM_IMAGE_USER_ID ?? 2840);

const [, , slug, subject, ...flags] = process.argv;
if (!slug || !subject) {
  console.error('usage: npm run image -- <slug> "what the photograph shows" [--figure <name>] [--alt "..."]');
  process.exit(1);
}
if (!TOKEN) {
  console.error("REEM_INTERNAL_TOKEN is not set (copy it from /opt/work/reem/.env)");
  process.exit(1);
}

function flagValue(name) {
  const i = flags.indexOf(`--${name}`);
  return i === -1 ? null : flags[i + 1];
}

const figureName = flagValue("figure");
const altText = flagValue("alt") ?? subject;

/**
 * The style contract. Everything after the subject is fixed, so every image on
 * the site reads as one photographic body of work rather than a grab bag.
 */
const STYLE = [
  "documentary editorial photography",
  "warm natural light",
  "natural film grain",
  "candid and unposed",
  "real people going about their business, other people visible in frame",
  "shallow but not artificial depth of field",
  "muted natural colour, nothing oversaturated",
  "composed with calm negative space in the upper third",
  "no text, no logos, no watermarks, no signage, no user interface elements",
].join(", ");

const prompt = `${subject}. ${STYLE}.`;

console.log(`subject: ${subject}`);
console.log(`this takes 90-190s...\n`);

const started = Date.now();
const response = await fetch(`${REEM}/internal/image/generate`, {
  method: "POST",
  headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
  body: JSON.stringify({
    userId: QA_USER_ID,
    prompt,
    // Sent, but the endpoint is documented to ignore it — the real size is
    // whatever the model it picked returns, and is checked below.
    aspectRatio: figureName ? "4:3" : "16:9",
  }),
  signal: AbortSignal.timeout(300_000),
});

const payload = await response.json().catch(() => ({}));
if (!response.ok || !payload.ok) {
  console.error(`generation failed (${response.status}):`, payload.error ?? "no body");
  if (String(payload.error ?? "").includes("not found")) {
    console.error(
      `\nQA user ${QA_USER_ID} no longer exists. Pick another and set REEM_IMAGE_USER_ID:\n` +
      `  psql "$DATABASE_URL" -c "select id, pn from reem_users where pn like '999%' limit 5"`,
    );
  }
  process.exit(1);
}

const elapsed = Math.round((Date.now() - started) / 1000);
console.log(`model: ${payload.model}  cost: $${payload.costUsd ?? "?"}  ${elapsed}s`);
console.log(`paths: ${JSON.stringify(payload.paths)}`);

const remote = Array.isArray(payload.paths) ? payload.paths[0] : payload.paths;
if (!remote) {
  console.error("endpoint returned no path");
  process.exit(1);
}

const fileName = String(remote).split("/").pop();
const media = await fetch(`${REEM}/internal/admin/media/${fileName}`, {
  headers: { authorization: `Bearer ${TOKEN}` },
  signal: AbortSignal.timeout(120_000),
});
if (!media.ok) {
  console.error(`could not retrieve the image (${media.status})`);
  process.exit(1);
}

const bytes = Buffer.from(await media.arrayBuffer());

// The endpoint picks its own model and its own size. Read the real dimensions
// out of the PNG/JPEG header rather than trusting the aspectRatio we asked for.
function dimensions(buf) {
  if (buf.length > 24 && buf.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: "png" };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5), type: "jpeg" };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

const size = dimensions(bytes);
const outName = figureName ? `${slug}-${figureName}` : `${slug}-hero`;
const ext = size?.type === "jpeg" ? "jpg" : "png";
const dir = join(ROOT, "public", "images");
mkdirSync(dir, { recursive: true });
const outPath = join(dir, `${outName}.${ext}`);
writeFileSync(outPath, bytes);

const publicPath = `/images/${outName}.${ext}`;
console.log(`\nsaved ${outPath}`);
if (size) {
  const ratio = (size.w / size.h).toFixed(2);
  console.log(`size: ${size.w}x${size.h} (${ratio}:1)`);
  if (Math.abs(size.w / size.h - 16 / 9) > 0.25 && !figureName) {
    console.log("note: not 16:9 — the endpoint chose its own size. Crop before shipping.");
  }
} else {
  console.log("size: could not read header");
}

if (figureName) {
  console.log(`\nembed it in the post body:\n`);
  console.log(`![${altText}](${publicPath})`);
  console.log(`*${altText}*\n`);
  process.exit(0);
}

const client = new pg.Client(pgConfig());
await client.connect();
try {
  const { rows } = await client.query(
    `UPDATE posts SET hero_image = $2, hero_alt = $3 WHERE slug = $1 RETURNING slug`,
    [slug, publicPath, altText],
  );
  if (!rows.length) {
    console.log(`\nno post with slug "${slug}" — image saved but not attached`);
  } else {
    console.log(`\nattached as hero image of "${slug}"`);
  }
} finally {
  await client.end();
}

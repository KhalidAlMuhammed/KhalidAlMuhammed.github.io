import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// pg needs the Node runtime, and this must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Analytics ingest.
 *
 * Public and unauthenticated by necessity — it is called from the reader's
 * browser — so everything here treats the body as hostile: every field is
 * type-checked, length-capped and clamped before it reaches SQL, and anything
 * unrecognised is dropped rather than stored.
 *
 * No IP is ever written. Vercel resolves geo at the edge and the raw address
 * stays in the request.
 */

const MAX_BODY = 8 * 1024;

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function int(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Only same-site paths. A caller can otherwise attribute reads to any string. */
function safePath(value: unknown): string | null {
  const p = str(value, 512);
  if (!p || !p.startsWith("/") || p.startsWith("//")) return null;
  return p;
}

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.slice(0, 253) || null;
  } catch {
    return null;
  }
}

/** Vercel URL-encodes the geo headers: "Council%20Bluffs". */
function decodeHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function deviceFrom(userAgent: string | null): string | null {
  if (!userAgent) return null;
  if (/iPad|Tablet/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const sessionId = str(body.sid, 64);
  const path = safePath(body.path);
  if (!sessionId || !path) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const headers = request.headers;
  const country = str(headers.get("x-vercel-ip-country"), 2);
  const region = decodeHeader(str(headers.get("x-vercel-ip-country-region"), 16))?.slice(0, 8) ?? null;
  const city = decodeHeader(str(headers.get("x-vercel-ip-city"), 120))?.slice(0, 80) ?? null;
  const device = deviceFrom(headers.get("user-agent"));

  try {
    if (body.type === "click") {
      const href = str(body.href, 2048);
      const kind = str(body.kind, 16);
      const allowed = ["outbound", "internal", "anchor", "mailto", "download"];
      if (!href || !kind || !allowed.includes(kind)) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }

      await query(
        `INSERT INTO link_clicks (session_id, path, href, target_host, kind, link_text)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, path, href, hostOf(href), kind, str(body.text, 120)],
      );

      return NextResponse.json({ ok: true });
    }

    // A read beacon. Monotonic fields only ever move forward, because beacons
    // can arrive late or out of order.
    await query(
      `INSERT INTO page_reads (
         session_id, path, slug, engaged_ms, max_scroll_pct, last_heading,
         reached_end, referrer_host, country, region, city, device, viewport_w
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (session_id, path) DO UPDATE SET
         engaged_ms     = GREATEST(page_reads.engaged_ms, EXCLUDED.engaged_ms),
         max_scroll_pct = GREATEST(page_reads.max_scroll_pct, EXCLUDED.max_scroll_pct),
         last_heading   = COALESCE(EXCLUDED.last_heading, page_reads.last_heading),
         reached_end    = page_reads.reached_end OR EXCLUDED.reached_end,
         updated_at     = now()`,
      [
        sessionId,
        path,
        str(body.slug, 200),
        int(body.engagedMs, 0, 6 * 60 * 60 * 1000) ?? 0,
        int(body.maxScrollPct, 0, 100) ?? 0,
        str(body.lastHeading, 200),
        body.reachedEnd === true,
        hostOf(str(body.referrer, 2048)),
        country,
        region,
        city,
        device,
        int(body.viewportW, 0, 10000),
      ],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Analytics must never surface an error to a reader.
    console.error("collect failed", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

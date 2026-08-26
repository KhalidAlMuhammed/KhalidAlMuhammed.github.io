-- kalmuhammed.com — content store (AWS RDS Postgres, database "blog").
--
-- The DB is the source of truth for posts. The Next.js build reads it at build
-- time and emits a fully static site, so nothing here is on the request path:
-- an outage of this instance cannot take the published site down, it only
-- blocks the next build.

CREATE TABLE IF NOT EXISTS posts (
  id           BIGSERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  -- The dek/standfirst: one or two sentences under the title. Also the meta
  -- description and the syndicated excerpt, so it is required, not optional.
  description  TEXT NOT NULL,
  body_md      TEXT NOT NULL,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  -- Ordered bibliography. Citation numbering in the prose is derived from this
  -- array's order at build time, so numbers can never drift from the list.
  -- [{id, authors, year, title, venue, url, note}]
  refs         JSONB NOT NULL DEFAULT '[]'::jsonb,
  status       TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT posts_status_chk CHECK (status IN ('draft', 'published')),
  -- A published post without a date would sort unpredictably and break the feed.
  CONSTRAINT posts_published_needs_date CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (status, published_at DESC);

-- One row per (post, platform). Records where a post was syndicated and what
-- URL it landed on, so a re-run updates rather than duplicating, and so the
-- post page can link out to its copies.
CREATE TABLE IF NOT EXISTS syndications (
  id         BIGSERIAL PRIMARY KEY,
  post_id    BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform   TEXT NOT NULL,
  remote_id  TEXT,
  remote_url TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',
  error      TEXT,
  synced_at  TIMESTAMPTZ,
  CONSTRAINT syndications_platform_chk CHECK (platform IN ('devto', 'hashnode', 'substack', 'linkedin', 'x')),
  CONSTRAINT syndications_status_chk CHECK (status IN ('pending', 'synced', 'manual', 'failed')),
  UNIQUE (post_id, platform)
);

CREATE OR REPLACE FUNCTION posts_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_touch ON posts;
CREATE TRIGGER posts_touch BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_touch_updated_at();

-- Hero image. Essays are illustrated with generated documentary photography
-- rather than charts (see docs/IMAGES.md), so a post carries one lead image
-- plus its alt text. Figures inside the body are plain markdown images.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_image TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_alt TEXT;

-- ── Reading analytics ────────────────────────────────────────────────
-- Cookieless. No IP is stored: Vercel resolves geo at the edge and the raw
-- address is discarded. session_id is random per tab and is never persisted
-- across visits, so nothing here identifies a person.

-- One row per (session, page), updated as the reader moves down the page.
-- Upserting rather than appending keeps this table small and makes "how far
-- did they get" a single column instead of an aggregation.
CREATE TABLE IF NOT EXISTS page_reads (
  id             BIGSERIAL PRIMARY KEY,
  session_id     TEXT NOT NULL,
  path           TEXT NOT NULL,
  slug           TEXT,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Time the tab was VISIBLE and the reader was active. Wall-clock since load
  -- counts the tab someone left open over lunch as deep engagement.
  engaged_ms     INTEGER NOT NULL DEFAULT 0,
  max_scroll_pct SMALLINT NOT NULL DEFAULT 0,
  -- The last heading scrolled past: where they stopped reading.
  last_heading   TEXT,
  reached_end    BOOLEAN NOT NULL DEFAULT false,
  referrer_host  TEXT,
  country        TEXT,
  region         TEXT,
  city           TEXT,
  device         TEXT,
  viewport_w     SMALLINT,
  UNIQUE (session_id, path)
);

CREATE INDEX IF NOT EXISTS page_reads_slug_idx ON page_reads (slug, started_at DESC);
CREATE INDEX IF NOT EXISTS page_reads_started_idx ON page_reads (started_at DESC);

-- Every link click, inbound or outbound.
CREATE TABLE IF NOT EXISTS link_clicks (
  id          BIGSERIAL PRIMARY KEY,
  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id  TEXT NOT NULL,
  path        TEXT NOT NULL,
  href        TEXT NOT NULL,
  target_host TEXT,
  kind        TEXT NOT NULL,
  link_text   TEXT,
  CONSTRAINT link_clicks_kind_chk CHECK (kind IN ('outbound', 'internal', 'anchor', 'mailto', 'download'))
);

CREATE INDEX IF NOT EXISTS link_clicks_at_idx ON link_clicks (clicked_at DESC);
CREATE INDEX IF NOT EXISTS link_clicks_host_idx ON link_clicks (target_host, clicked_at DESC);

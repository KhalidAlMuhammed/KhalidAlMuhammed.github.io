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

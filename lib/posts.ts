import { query } from "./db";
import type { Post, Reference, Syndication } from "./types";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body_md: string;
  tags: string[];
  refs: Reference[];
  status: "draft" | "published";
  published_at: Date | null;
  updated_at: Date;
  hero_image: string | null;
  hero_alt: string | null;
  syndications: Syndication[] | null;
};

/**
 * Drafts are never selected here, so an unpublished post cannot be emitted as a
 * static page by accident — a static host has no auth to hide it behind.
 */
const SELECT = `
  SELECT p.id, p.slug, p.title, p.description, p.body_md, p.tags, p.refs,
         p.status, p.published_at, p.updated_at, p.hero_image, p.hero_alt,
         COALESCE(
           (SELECT json_agg(json_build_object(
                      'platform', s.platform,
                      'remoteUrl', s.remote_url,
                      'status', s.status) ORDER BY s.platform)
            FROM syndications s
            WHERE s.post_id = p.id AND s.status IN ('synced', 'manual')),
           '[]'::json
         ) AS syndications
  FROM posts p
  WHERE p.status = 'published'
`;

function toPost(row: PostRow): Post {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    bodyMd: row.body_md,
    tags: row.tags ?? [],
    references: Array.isArray(row.refs) ? row.refs : [],
    status: row.status,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    updatedAt: row.updated_at.toISOString(),
    heroImage: row.hero_image,
    heroAlt: row.hero_alt,
    syndications: row.syndications ?? [],
  };
}

export async function getPublishedPosts(): Promise<Post[]> {
  const rows = await query<PostRow>(`${SELECT} ORDER BY p.published_at DESC`);
  return rows.map(toPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const rows = await query<PostRow>(`${SELECT} AND p.slug = $1`, [slug]);
  return rows.length ? toPost(rows[0]) : null;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export type Reference = {
  /** Citation key used in prose as [@id]. */
  id: string;
  authors: string;
  year?: string | number;
  title: string;
  /** Journal, conference, publisher or site. */
  venue?: string;
  url?: string;
  /** Optional one-line gloss: why this source is here, or what it actually shows. */
  note?: string;
};

export type Platform = "devto" | "hashnode" | "substack" | "linkedin" | "x";

export type Syndication = {
  platform: Platform;
  remoteUrl: string | null;
  status: "pending" | "synced" | "manual" | "failed";
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  description: string;
  bodyMd: string;
  tags: string[];
  references: Reference[];
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
  heroImage: string | null;
  heroAlt: string | null;
  syndications: Syndication[];
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  devto: "DEV",
  hashnode: "Hashnode",
  substack: "Substack",
  linkedin: "LinkedIn",
  x: "X",
};

import Link from "next/link";
import Reveal from "./Reveal";
import { formatDate } from "@/lib/posts";
import { readingTime } from "@/lib/markdown";
import type { Post } from "@/lib/types";

export default function PostCard({ post }: { post: Post }) {
  return (
    <li>
      <Reveal>
      <Link
        href={`/blog/${post.slug}/`}
        className={`post-card${post.heroImage ? " post-card--media" : ""}`}
      >
        {post.heroImage && (
          <div className="post-card__media">
            <img
              src={post.heroImage}
              alt={post.heroAlt ?? ""}
              width={1184}
              height={507}
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <div className="post-card__body">
        <div className="post-card__meta">
          <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
          <span className="sep">/</span>
          <span>{readingTime(post.bodyMd)}</span>
          {post.references.length > 0 && (
            <>
              <span className="sep">/</span>
              <span>
                {post.references.length} {post.references.length === 1 ? "source" : "sources"}
              </span>
            </>
          )}
        </div>
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        {post.tags.length > 0 && (
          <div className="tag-row">
            {post.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
        </div>
      </Link>
      </Reveal>
    </li>
  );
}

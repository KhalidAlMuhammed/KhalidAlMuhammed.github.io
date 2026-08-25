import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPosts, getPostBySlug, formatDate } from "@/lib/posts";
import { renderMarkdown, readingTime } from "@/lib/markdown";
import References from "@/components/References";
import { SITE } from "@/lib/site";
import { PLATFORM_LABEL } from "@/lib/types";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}/` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${SITE.url}/blog/${post.slug}/`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [SITE.author],
      tags: post.tags,
      ...(post.heroImage ? { images: [{ url: post.heroImage, alt: post.heroAlt ?? post.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(post.heroImage ? { images: [post.heroImage] } : {}),
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { html, headings } = await renderMarkdown(post.bodyMd, post.references);

  // Schema.org so the citations and dates are machine-readable. Research-shaped
  // writing benefits from being indexed as an article with a real author.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: SITE.author, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}/`,
    keywords: post.tags.join(", "),
    ...(post.heroImage ? { image: `${SITE.url}${post.heroImage}` } : {}),
    citation: post.references.map((ref) => ({
      "@type": "CreativeWork",
      name: ref.title,
      author: ref.authors,
      ...(ref.url ? { url: ref.url } : {}),
    })),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="shell-narrow article-head">
        <p className="eyebrow">Essay</p>
        <h1>{post.title}</h1>
        <p className="article-head__dek">{post.description}</p>
        <div className="article-head__meta">
          <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
          <span className="sep">/</span>
          <span>{readingTime(post.bodyMd)}</span>
          {post.references.length > 0 && (
            <>
              <span className="sep">/</span>
              <span>{post.references.length} sources</span>
            </>
          )}
        </div>
      </header>

      {post.heroImage && (
        <figure className="hero-figure">
          <img
            src={post.heroImage}
            alt={post.heroAlt ?? ""}
            width={1184}
            height={672}
            /* Above the fold on every post page, so never lazy. */
            loading="eager"
            decoding="async"
          />
        </figure>
      )}

      {headings.length > 2 && (
        <div className="shell-narrow">
          <nav className="toc" aria-label="Table of contents">
            <p className="toc__label">Contents</p>
            <ol>
              {headings.map((heading) => (
                <li key={heading.slug} className={`depth-${heading.depth}`}>
                  <a href={`#${heading.slug}`}>{heading.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}

      <div className="shell-narrow">
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        <References references={post.references} />

        {post.syndications.length > 0 && (
          <aside className="elsewhere">
            <p className="elsewhere__label">Also published at</p>
            <div className="elsewhere__links">
              {post.syndications
                .filter((s) => s.remoteUrl)
                .map((s) => (
                  <a
                    key={s.platform}
                    className="pill"
                    href={s.remoteUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {PLATFORM_LABEL[s.platform]}
                  </a>
                ))}
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}

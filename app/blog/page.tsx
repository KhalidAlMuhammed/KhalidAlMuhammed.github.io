import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays on building AI systems for real users.",
  alternates: { canonical: "/blog/" },
};

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <section className="shell-narrow page">
      <ul className="index">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}/`}>
              <span className="index__date">{formatDate(post.publishedAt)}</span>
              <span className="index__title">{post.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      {posts.length === 0 && <p className="page__note">Nothing published yet.</p>}
    </section>
  );
}

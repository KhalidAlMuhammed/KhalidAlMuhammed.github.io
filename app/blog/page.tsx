import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Long-form essays on building AI systems for real users — argued from published research and from production failures.",
  alternates: { canonical: "/blog/" },
};

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <section className="shell section" style={{ paddingTop: "clamp(48px, 8vw, 88px)" }}>
      <p className="eyebrow">Writing</p>
      <h1
        style={{
          marginTop: 18,
          fontSize: "clamp(32px, 5vw, 46px)",
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          fontWeight: 600,
          maxWidth: "18ch",
        }}
      >
        Essays, with sources.
      </h1>
      <p style={{ marginTop: 20, color: "var(--ink-2)", maxWidth: "56ch", fontSize: 18 }}>
        Each one takes a position and defends it — against the papers where the idea came from, and
        against the system I actually shipped.
      </p>

      <ul className="post-list" style={{ marginTop: 44 }}>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </ul>

      {posts.length === 0 && (
        <p style={{ marginTop: 40, color: "var(--ink-3)" }}>Nothing published yet.</p>
      )}
    </section>
  );
}

import Link from "next/link";
import PostCard from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default async function Home() {
  const posts = await getPublishedPosts();
  const latest = posts.slice(0, 4);

  return (
    <>
      <section className="shell hero">
        <p className="eyebrow rise rise-1">Khalid Al Muhammed</p>
        <h1 className="rise rise-2">I build AI systems that have to survive real users.</h1>
        <p className="hero__lede rise rise-3">
          I write about what happens when a model leaves the benchmark and meets a person with a
          problem, a budget and no patience. Long essays, argued from the literature and from the
          things that broke in production at 3am. <strong>Mostly the second one.</strong>
        </p>
        <div className="hero__actions rise rise-3">
          <Link href="/blog/" className="pill pill--solid">
            Read the essays
          </Link>
          <Link href="/about/" className="pill">
            About me
          </Link>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="shell section">
          <div className="section__head">
            <h2>Latest writing</h2>
            <Link href="/blog/">All essays &rarr;</Link>
          </div>
          <ul className="post-list">
            {latest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </ul>
        </section>
      )}

      {latest.length === 0 && (
        <section className="shell section">
          <div className="section__head">
            <h2>Latest writing</h2>
          </div>
          <p style={{ color: "var(--ink-2)", maxWidth: "52ch" }}>
            The first essay is being written. Subscribe to the{" "}
            <a href="/feed.xml" style={{ color: "var(--ink)", textDecoration: "underline" }}>
              feed
            </a>{" "}
            or find me on{" "}
            <a href={SITE.x} style={{ color: "var(--ink)", textDecoration: "underline" }}>
              X
            </a>
            .
          </p>
        </section>
      )}
    </>
  );
}

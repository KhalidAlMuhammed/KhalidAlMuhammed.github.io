import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";

/**
 * Home, in the reem.chat landing's language: everything centred, a pill badge
 * over a very large bold wordmark, a two-line subtitle, one solid pill CTA with
 * a small muted note under it, and then a big rounded photographic card. Same
 * rhythm as reem.chat/en, same generous vertical air.
 */
export default async function Home() {
  const posts = await getPublishedPosts();
  const hasPosts = posts.length > 0;

  return (
    <>
      <section className="shell lp-hero">
        <p className="lp-badge rise rise-1">Essays on AI in production</p>

        <h1 className="lp-wordmark rise rise-2">Khalid</h1>

        <p className="lp-sub rise rise-2">I build AI systems that have to survive real users.</p>

        <div className="lp-cta rise rise-3">
          <Link href={hasPosts ? "/blog/" : "/about/"} className="pill pill--solid lp-pill">
            {hasPosts ? "Read the writing" : "About me"}
          </Link>
        </div>

        <p className="lp-note rise rise-3">
          {hasPosts ? (
            <>New essays go out on the <a href="/feed.xml">feed</a>.</>
          ) : (
            <>
              Nothing published yet. Subscribe to the <a href="/feed.xml">feed</a> to catch the
              first one.
            </>
          )}
        </p>
      </section>

      <figure className="lp-showcase rise rise-4">
        <img
          src="/images/home-band.png"
          alt="Late afternoon in a busy cafe, people at tables talking and using their phones"
          width={1024}
          height={768}
          loading="eager"
          decoding="async"
        />
      </figure>
    </>
  );
}

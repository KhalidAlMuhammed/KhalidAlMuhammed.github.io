import Link from "next/link";
import PostCard from "@/components/PostCard";
import Reveal from "@/components/Reveal";
import { getPublishedPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

/**
 * The work I want on the page. Keep this list short — three entries that are
 * real beats six that are padding. `href` is optional; an entry with no link
 * still renders, it just isn't clickable.
 */
const WORK = [
  {
    name: "Reem",
    role: "Founder",
    href: "https://reem.chat",
    blurb:
      "A personal AI assistant that lives inside WhatsApp, built for Saudi Arabia. It compares prices, drafts documents, orders dinner and groceries, books travel — from one chat, in Arabic, with no app to install.",
    meta: "Live",
  },
  {
    name: "Second project",
    role: "Your role",
    href: null,
    blurb:
      "Replace this. One paragraph on what it is and who it is for, in the same register as the entry above — plainly, no adjectives doing work that a fact could do.",
    meta: "",
  },
];

export default async function Home() {
  const posts = await getPublishedPosts();
  const latest = posts.slice(0, 3);

  return (
    <>
      <section className="shell hero">
        <div className="hero__grid">
          <div>
            <p className="eyebrow rise rise-1">Khalid Al Muhammed</p>
            <h1 className="rise rise-2">I build AI systems that have to survive real users.</h1>
            <p className="hero__lede rise rise-3">
              Most of what I know about machine learning I learned from watching it fail in
              production, in Arabic, at three in the morning. I write that down here — long essays
              about the distance between what a model does on a benchmark and what it does to
              somebody&apos;s actual day.
            </p>
            <div className="hero__actions rise rise-3">
              <Link href="/blog/" className="pill pill--solid">
                Read the writing
              </Link>
              <Link href="/about/" className="pill">
                About me
              </Link>
            </div>
          </div>

          <aside className="now rise rise-4" aria-label="Currently">
            <p className="now__label">Currently</p>
            <ul className="now__list">
              <li>
                Building <a href="https://reem.chat" target="_blank" rel="noopener noreferrer">Reem</a>,
                a personal AI in WhatsApp
              </li>
              <li>Finishing a degree at Columbia</li>
              <li>Writing about agents that meet real people</li>
            </ul>
            <div className="now__links">
              <a href={SITE.x} target="_blank" rel="noopener noreferrer">X</a>
              <a href={SITE.github} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href={`mailto:${SITE.email}`}>Email</a>
            </div>
          </aside>
        </div>
      </section>

      <Reveal>
        <figure className="band">
          <img
            src="/images/home-band.png"
            alt="Late afternoon in a busy cafe, people at tables talking and using their phones"
            width={1024}
            height={768}
            loading="lazy"
            decoding="async"
          />
          <figcaption>The people it has to work for. Everything else is a detail.</figcaption>
        </figure>
      </Reveal>

      <section className="shell section">
        <div className="section__head">
          <h2>Work</h2>
        </div>
        <ul className="work-list">
          {WORK.map((item, i) => (
            <li key={item.name}>
              <Reveal delay={i * 60}>
                <article className="work-card">
                  <div className="work-card__head">
                    <h3>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer">
                          {item.name}
                        </a>
                      ) : (
                        item.name
                      )}
                    </h3>
                    <span className="work-card__role">{item.role}</span>
                    {item.meta && <span className="work-card__meta">{item.meta}</span>}
                  </div>
                  <p>{item.blurb}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell section">
        <div className="section__head">
          <h2>Writing</h2>
          {latest.length > 0 && <Link href="/blog/">All essays &rarr;</Link>}
        </div>

        {latest.length > 0 ? (
          <ul className="post-list">
            {latest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </ul>
        ) : (
          <p className="empty-note">
            Nothing published yet. The first essay is being written — subscribe to the{" "}
            <a href="/feed.xml">feed</a>, or find me on{" "}
            <a href={SITE.x} target="_blank" rel="noopener noreferrer">
              X
            </a>
            .
          </p>
        )}
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Who I am and what I am building.",
  alternates: { canonical: "/about/" },
};

export default function About() {
  return (
    <section className="shell-narrow" style={{ paddingBlock: "clamp(48px, 8vw, 88px)" }}>
      <p className="eyebrow">About</p>
      <h1
        style={{
          marginTop: 18,
          fontSize: "clamp(32px, 5vw, 46px)",
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          fontWeight: 600,
        }}
      >
        Khalid Al Muhammed
      </h1>

      <div className="prose" style={{ paddingTop: 32 }}>
        <p>
          Placeholder. Replace this with the real thing — it is the page people read right before
          they decide whether to email you, so it should sound like you and not like a CV.
        </p>
        <p>
          Worth covering: what you are building right now, the through-line between the projects,
          and the one opinion you hold that most people in the field do not.
        </p>
        <p>
          Reach me at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, or on{" "}
          <a href={SITE.x} target="_blank" rel="noopener noreferrer">
            X
          </a>
          .
        </p>
      </div>
    </section>
  );
}

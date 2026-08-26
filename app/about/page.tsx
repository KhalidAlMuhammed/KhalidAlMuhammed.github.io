import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about/" },
};

export default function About() {
  return (
    <section className="shell-narrow page">
      <div className="page__prose">
        <p>
          I build AI systems that have to survive real users. Right now that is{" "}
          <a href="https://reem.chat" target="_blank" rel="noopener noreferrer">
            Reem
          </a>
          , a personal assistant that lives inside WhatsApp.
        </p>
        <p>Replace this paragraph with your own. Two or three sentences is plenty.</p>
        <p>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
      </div>
    </section>
  );
}

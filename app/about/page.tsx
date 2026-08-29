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
        <p>I&apos;m Khalid. Saudi, finishing my last year at Columbia.</p>
        <p>
          I like building whole things and running them for real people. The current
          obsession is{" "}
          <a href="https://reem.chat" target="_blank" rel="noopener noreferrer">
            Reem
          </a>
          , a personality that lives in WhatsApp, which in practice means I also run
          phone lines, deploys, ad campaigns, and a small fleet of AI agents that
          build alongside me.
        </p>
        <p>
          If you&apos;re building something and want to compare notes, or you think
          something I wrote here is wrong,{" "}
          <a href={SITE.x} target="_blank" rel="noopener noreferrer">
            message me on X
          </a>
          . I answer.
        </p>
      </div>
    </section>
  );
}

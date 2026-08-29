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
        <p>
          I&apos;m a senior at Columbia. Reem&apos;s users are in Saudi Arabia, which
          means every hard problem arrives in Arabic, on Riyadh time. An agent that
          books flights, takes payments, and talks to people at two in the morning
          teaches you quickly which parts of the demo were load-bearing.
        </p>
        <p>
          What I publish here are field notes from that machine: decisions written
          down the day they were made, and lessons published once they stopped
          changing.
        </p>
        <p>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
      </div>
    </section>
  );
}

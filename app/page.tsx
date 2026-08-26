import Link from "next/link";
import { SITE } from "@/lib/site";

/**
 * Name, one line, three links. Nothing else — no header, no footer, no badge,
 * no image, no button. The header and footer are hidden on this page because
 * they only repeated what is already here.
 */
export default function Home() {
  return (
    <section className="min">
      <div className="min__block">
        <h1 className="min__name">Khalid Al Muhammed</h1>
        <p className="min__line">
          This is where I keep what I think, build and learn.
          <br />
          Right now that&apos;s mostly Reem, a personality that lives in WhatsApp.
        </p>
        <nav className="min__links" aria-label="Primary">
          <Link href="/blog/">Writing</Link>
          <Link href="/about/">About</Link>
          <a href={SITE.x} target="_blank" rel="noopener noreferrer">
            X
          </a>
        </nav>
      </div>
    </section>
  );
}

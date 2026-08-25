import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Header() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="wordmark">
          <span className="dot" aria-hidden="true" />
          {SITE.shortName}
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/blog/">Writing</Link>
          <Link href="/about/">About</Link>
          <a href={SITE.x} target="_blank" rel="noopener noreferrer">
            X
          </a>
        </nav>
      </div>
    </header>
  );
}

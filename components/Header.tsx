import Link from "next/link";
import { SITE } from "@/lib/site";

/** Wordmark only. The nav links lived on the home page and nowhere else needed them. */
export default function Header() {
  return (
    <header className="site-header">
      <div className="shell-narrow site-header__inner">
        <Link href="/" className="wordmark">
          {SITE.shortName}
        </Link>
      </div>
    </header>
  );
}

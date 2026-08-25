import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <span>
          &copy; {new Date().getFullYear()} {SITE.name}
        </span>
        <div className="site-footer__links">
          <a href="/feed.xml">RSS</a>
          <a href={SITE.x} target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a href={SITE.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href={`mailto:${SITE.email}`}>Email</a>
        </div>
      </div>
    </footer>
  );
}

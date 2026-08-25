import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell-narrow" style={{ paddingBlock: "clamp(64px, 12vw, 130px)" }}>
      <p className="eyebrow">404</p>
      <h1
        style={{
          marginTop: 18,
          fontSize: "clamp(30px, 5vw, 44px)",
          lineHeight: 1.12,
          letterSpacing: "-0.03em",
          fontWeight: 600,
        }}
      >
        This one does not exist.
      </h1>
      <p style={{ marginTop: 20, color: "var(--ink-2)", maxWidth: "48ch" }}>
        The link is wrong, or the essay moved.
      </p>
      <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/" className="pill pill--solid">
          Home
        </Link>
        <Link href="/blog/" className="pill">
          All essays
        </Link>
      </div>
    </section>
  );
}

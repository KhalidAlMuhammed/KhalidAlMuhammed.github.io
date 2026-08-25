import Link from "next/link";

export default function Home() {
  return (
    <section className="shell home">
      <p className="eyebrow rise rise-1">Khalid Al Muhammed</p>
      <h1 className="rise rise-2">I build AI systems that have to survive real users.</h1>
      <p className="home__lede rise rise-3">
        Essays on the distance between what a model does on a benchmark and what it does to
        somebody&apos;s actual day.
      </p>
      <div className="home__actions rise rise-3">
        <Link href="/blog/" className="pill pill--solid">
          Writing
        </Link>
        <Link href="/about/" className="pill">
          About
        </Link>
      </div>
    </section>
  );
}

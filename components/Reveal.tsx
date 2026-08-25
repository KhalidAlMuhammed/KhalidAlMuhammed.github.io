"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered fade + un-blur, matching the landing's entrance motion.
 *
 * The landing scrubs its reveals continuously off a --p custom property, so
 * they reverse as you scroll back up. That is right for a marketing page you
 * scroll through once; it is wrong for a reading page, where scrolling back to
 * re-read a paragraph should not dissolve it. So this fires once and stays.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Anything already on screen at mount (or if the API is missing) shows
    // immediately rather than waiting for a scroll that may never come.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal${shown ? " is-in" : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

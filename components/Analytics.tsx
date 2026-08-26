"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reading analytics.
 *
 * Deliberately measures ENGAGED time, not wall-clock: the clock only advances
 * while the tab is visible and the reader has interacted in the last 30s.
 * A tab left open over lunch is not thirty minutes of reading.
 *
 * Cookieless. The session id lives in sessionStorage, so it dies with the tab
 * and never links two visits together.
 */

// trailingSlash: true redirects /api/collect -> /api/collect/ with a 308.
// Post to the canonical URL so a beacon never has to follow a redirect.
const ENDPOINT = "/api/collect/";

const IDLE_AFTER_MS = 30_000;
const TICK_MS = 1_000;
const FLUSH_EVERY_MS = 15_000;

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem("sid");
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Math.random()).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("sid", fresh);
    return fresh;
  } catch {
    // Private mode with storage disabled: fall back to a per-load id.
    return String(Math.random()).slice(2) + Date.now().toString(36);
  }
}

function send(payload: Record<string, unknown>, useBeacon: boolean) {
  const body = JSON.stringify(payload);
  try {
    // sendBeacon survives the page being torn down; fetch does not.
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the page */
  }
}

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Respect an explicit opt-out.
    if (navigator.doNotTrack === "1") return;

    const sid = sessionId();
    const slug = pathname.startsWith("/blog/") ? pathname.split("/").filter(Boolean)[1] ?? null : null;

    let engagedMs = 0;
    let maxScrollPct = 0;
    let lastHeading: string | null = null;
    let reachedEnd = false;
    let lastActivity = Date.now();
    let dirty = true;

    const markActive = () => {
      lastActivity = Date.now();
    };

    const tick = window.setInterval(() => {
      const visible = document.visibilityState === "visible";
      const active = Date.now() - lastActivity < IDLE_AFTER_MS;
      if (visible && active) {
        engagedMs += TICK_MS;
        dirty = true;
      }
    }, TICK_MS);

    // Headings are the anchors for "where did they stop reading".
    const headings = Array.from(document.querySelectorAll<HTMLElement>("h2, h3"));

    const onScroll = () => {
      markActive();
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 100;
      if (pct > maxScrollPct) {
        maxScrollPct = Math.min(100, pct);
        dirty = true;
      }
      if (maxScrollPct >= 95) reachedEnd = true;

      // The last heading whose top has passed the middle of the viewport.
      const mid = window.innerHeight / 2;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= mid) {
          const text = (h.textContent || "").trim().slice(0, 200);
          if (text && text !== lastHeading) {
            lastHeading = text;
            dirty = true;
          }
        }
      }
    };

    const flush = (useBeacon: boolean) => {
      if (!dirty) return;
      dirty = false;
      send(
        {
          type: "read",
          sid,
          path: pathname,
          slug,
          engagedMs,
          maxScrollPct,
          lastHeading,
          reachedEnd,
          referrer: document.referrer || null,
          viewportW: window.innerWidth,
        },
        useBeacon,
      );
    };

    const onClick = (event: MouseEvent) => {
      markActive();
      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      let kind: string;
      if (href.startsWith("#")) kind = "anchor";
      else if (href.startsWith("mailto:")) kind = "mailto";
      else if (anchor.hasAttribute("download")) kind = "download";
      else if (href.startsWith("/")) kind = "internal";
      else {
        try {
          kind = new URL(href, location.href).host === location.host ? "internal" : "outbound";
        } catch {
          return;
        }
      }

      send(
        {
          type: "click",
          sid,
          path: pathname,
          href: new URL(href, location.href).href,
          kind,
          text: (anchor.textContent || "").trim().slice(0, 120),
        },
        // A click that navigates away tears the page down; beacon survives it.
        kind === "outbound" || kind === "internal",
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush(true);
      else markActive();
    };

    const periodic = window.setInterval(() => flush(false), FLUSH_EVERY_MS);

    // First beacon immediately, so a reader who leaves in two seconds still counts.
    flush(false);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", () => flush(true));
    for (const evt of ["keydown", "mousemove", "touchstart"]) {
      window.addEventListener(evt, markActive, { passive: true });
    }

    onScroll();

    return () => {
      flush(true);
      window.clearInterval(tick);
      window.clearInterval(periodic);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const evt of ["keydown", "mousemove", "touchstart"]) {
        window.removeEventListener(evt, markActive);
      }
    };
  }, [pathname]);

  return null;
}

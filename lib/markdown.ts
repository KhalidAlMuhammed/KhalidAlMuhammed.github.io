import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings, { type Options as AutolinkOptions } from "rehype-autolink-headings";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import GithubSlugger from "github-slugger";
import type { Reference } from "./types";

export type Heading = { depth: 2 | 3; text: string; slug: string };

// Wrap the heading text in its own anchor so the whole heading is the link.
const AUTOLINK: AutolinkOptions = {
  behavior: "wrap",
  properties: { className: ["heading-anchor"] },
};

type MdNode = {
  type: string;
  value?: string;
  depth?: number;
  children?: MdNode[];
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

const CITE_RE = /\[@([^\]]+)\]/g;

/**
 * Pandoc-style inline citations: `[@vaswani2017]`, `[@a; @b]`.
 *
 * Each key resolves against the post's ordered `references` array, so the
 * number rendered in the prose is always that entry's position in the
 * bibliography. Hand-typed numbers drift the moment you insert a source in the
 * middle; derived numbers cannot.
 *
 * An unknown key renders a visible marker and warns during the build instead of
 * failing it — a typo should not block a deploy, but it must not vanish either.
 */
function remarkCitations({ references }: { references: Reference[] }) {
  const numberOf = new Map<string, number>();
  references.forEach((ref, i) => numberOf.set(ref.id, i + 1));

  return (tree: MdNode) => {
    if (references.length === 0) return;

    const walk = (node: MdNode, parent: MdNode | null, index: number): number => {
      if (node.type === "text" && parent && typeof node.value === "string") {
        const value = node.value;
        if (!value.includes("[@")) return 0;

        const out: MdNode[] = [];
        let last = 0;
        let match: RegExpExecArray | null;
        CITE_RE.lastIndex = 0;

        while ((match = CITE_RE.exec(value)) !== null) {
          if (match.index > last) out.push({ type: "text", value: value.slice(last, match.index) });

          const keys = match[1]
            .split(";")
            .map((k) => k.trim().replace(/^@/, ""))
            .filter(Boolean);

          const links = keys.map((key) => {
            const n = numberOf.get(key);
            if (!n) {
              console.warn(`[citations] unknown reference key "${key}"`);
              return `<span class="cite-missing" title="unknown reference: ${escapeHtml(key)}">?</span>`;
            }
            return `<a href="#ref-${escapeHtml(key)}">${n}</a>`;
          });

          out.push({ type: "html", value: `<sup class="cite">[${links.join(", ")}]</sup>` });
          last = match.index + match[0].length;
        }

        if (last === 0) return 0;
        if (last < value.length) out.push({ type: "text", value: value.slice(last) });

        parent.children!.splice(index, 1, ...out);
        return out.length - 1;
      }

      if (Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          i += walk(node.children[i], node, i);
        }
      }
      return 0;
    };

    walk(tree, null, 0);
  };
}

/** Plain text of an mdast node, for building the table of contents. */
function nodeText(node: MdNode): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
  if (!Array.isArray(node.children)) return "";
  return node.children.map(nodeText).join("");
}

/**
 * Table of contents. Slugs are generated with the same github-slugger that
 * rehype-slug uses, including its duplicate-heading counter, so every TOC link
 * matches the id actually emitted on the heading.
 */
function extractHeadings(tree: MdNode): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  const walk = (node: MdNode) => {
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
      const text = nodeText(node);
      headings.push({ depth: node.depth as 2 | 3, text, slug: slugger.slug(text) });
    }
    node.children?.forEach(walk);
  };

  walk(tree);
  return headings;
}

export async function renderMarkdown(
  markdown: string,
  references: Reference[] = [],
): Promise<{ html: string; headings: Heading[] }> {
  const parser = unified().use(remarkParse).use(remarkGfm);
  const tree = parser.parse(markdown) as MdNode;
  const headings = extractHeadings(tree);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkCitations, { references })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, AUTOLINK)
    .use(rehypeShiki, { theme: "github-light" })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return { html: String(file), headings };
}

/** Reading time, computed once here so every surface shows the same number. */
export function readingTime(markdown: string): string {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]/g, " ");
  const words = prose.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

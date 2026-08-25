/**
 * Prose lint for essays.
 *
 * This exists because of a specific failure: the first post published on this
 * site was essay-SHAPED and hollow. It cited seven papers without engaging a
 * single method, contained three numbers (two of which were a timestamp) while
 * arguing that the field measures the wrong things, and was written in the
 * cadence of every LLM-drafted blog post on the internet.
 *
 * A linter cannot detect vacancy. It can detect the surface symptoms that
 * reliably accompany it, and refusing a push on those forces the rewrite where
 * the actual thinking happens.
 *
 * ERRORS block the push. WARNINGS print and let it through.
 */

const ANNOUNCE = [
  // Sentences whose only job is to announce the next sentence.
  // \b + a not-"t" guard so "There is" does not match "here is".
  { re: /(^|[^t])\bhere is\b/gi, label: '"here is"' },
  { re: /\bthis is where\b/gi, label: '"this is where"' },
  { re: /\bwhat follows is\b/gi, label: '"what follows is"' },
  { re: /\blet me (explain|be clear|say)\b/gi, label: '"let me explain/be clear"' },
  { re: /\bstated plainly\b/gi, label: '"stated plainly"' },
  { re: /\bthe (honest )?ledger\b/gi, label: '"the ledger"' },
  { re: /\bin (this|the following) section\b/gi, label: '"in this section"' },
];

const NEGATION_CORRECTION =
  /\b(?:it|that|this|the \w+)\s+is\s+not\s+[^.;:]{3,60}[.;,]\s*(?:it|that|this)\s+is\b|\bnot\s+(?:just|merely|only)\s+[^.;:]{3,60}\s+but\b/gi;

const HEDGE_CLICHE = [
  { re: /\bit'?s worth noting\b/gi, label: '"it\'s worth noting"' },
  { re: /\bat the end of the day\b/gi, label: '"at the end of the day"' },
  { re: /\bthe reality is\b/gi, label: '"the reality is"' },
  { re: /\bmake no mistake\b/gi, label: '"make no mistake"' },
  { re: /\bin today'?s (world|landscape)\b/gi, label: '"in today\'s world"' },
  { re: /\bdelve into\b/gi, label: '"delve into"' },
];

/** Words that suggest a citation is being engaged rather than name-dropped. */
const ENGAGEMENT = /\b(method|methods|dataset|benchmark|corpus|sample|baseline|ablation|F1|accuracy|precision|recall|score[sd]?|measured|trained|evaluated|found|reports?|showed?|defines?|abstain|\d)\b/i;

function stripCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "\n").replace(/`[^`]*`/g, " ");
}

/** Split into paragraphs, keeping only prose (no headings, no fences). */
function paragraphs(markdown) {
  return stripCode(markdown)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith(">"));
}

export function lintPost({ body, references = [], description = "" }) {
  const errors = [];
  const warnings = [];

  const prose = stripCode(body);
  const words = prose.split(/\s+/).filter(Boolean).length;
  const haystack = `${description}\n${prose}`;

  // ── substance ───────────────────────────────────────────────────

  if (words < 1200) {
    errors.push(`${words} words. An argued essay with sources needs at least 1200; below that you are asserting, not arguing.`);
  }

  // Numbers are the cheapest proxy for "did you measure anything".
  const numbers = new Set((prose.match(/\b\d[\d,.]*%?\b/g) || []).map((n) => n.replace(/[.,]$/, "")));
  if (numbers.size < 8) {
    errors.push(
      `only ${numbers.size} distinct numbers in the prose. An essay that critiques how something is measured has to measure something. Report counts WITH denominators.`,
    );
  }

  // ── citations must be engaged, not name-dropped ─────────────────

  const paras = paragraphs(body);
  for (const ref of references) {
    const key = ref.id;
    const cited = new RegExp(`\\[@[^\\]]*\\b${key}\\b[^\\]]*\\]`).test(body);
    if (!cited) {
      errors.push(`reference "${key}" is in the bibliography but never cited in the prose. Cut it or use it.`);
      continue;
    }
    const hosts = paras.filter((p) => new RegExp(`\\[@[^\\]]*\\b${key}\\b`).test(p));
    if (hosts.length && !hosts.some((p) => ENGAGEMENT.test(p))) {
      warnings.push(
        `"${key}" is cited but the surrounding paragraph names no method, number or finding. Naming a paper is not citing it — say what it did.`,
      );
    }
  }

  if (references.length && !/\b(objection|counterargument|the other side|argued out of|disagree|it retires|correct, and)\b/i.test(prose)) {
    warnings.push(
      "no passage takes the opposing view seriously. An essay that only agrees with itself has not made an argument.",
    );
  }

  // ── cadence ─────────────────────────────────────────────────────

  const emDashes = (prose.match(/—/g) || []).length;
  const per1k = (emDashes / words) * 1000;
  if (per1k > 5) {
    warnings.push(`${emDashes} em-dashes (${per1k.toFixed(1)} per 1000 words). Above ~5 it reads as machine cadence.`);
  }

  for (const { re, label } of ANNOUNCE) {
    const hits = (haystack.match(re) || []).length;
    if (hits) {
      errors.push(`${label} x${hits}: a sentence that only announces the next sentence. Delete it and start with the point.`);
    }
  }

  const negations = (prose.match(NEGATION_CORRECTION) || []).length;
  if (negations > 1) {
    warnings.push(`${negations} "it is not X, it is Y" constructions. One is a rhetorical move; several is a tic.`);
  }

  for (const { re, label } of HEDGE_CLICHE) {
    if (re.test(haystack)) warnings.push(`${label}: filler.`);
  }

  // Three consecutive sentences opening with the same word is the LLM tricolon.
  // matchAll, not match: with /g, String.match returns whole matches and the
  // leading ". " would end up in the "opener".
  const openers = [...prose.matchAll(/(?:^|[.!?]\s+)([A-Z][a-z]+)/g)].map((m) => m[1].toLowerCase());
  for (let i = 0; i + 2 < openers.length; i++) {
    if (openers[i] === openers[i + 1] && openers[i] === openers[i + 2]) {
      warnings.push(`three consecutive sentences open with "${openers[i]}". Break the pattern.`);
      break;
    }
  }

  return { errors, warnings };
}

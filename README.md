# kalmuhammed.com

Engineering essays. Next.js static export on GitHub Pages, content in AWS RDS.

House style for the writing itself: [`docs/VOICE.md`](docs/VOICE.md).

## How it fits together

```
content/*.md  ──push──>  AWS RDS (blog)  ──build──>  out/  ──deploy──>  GitHub Pages
   working copy          SOURCE OF TRUTH             static             kalmuhammed.com
                               │
                               └──syndicate──>  dev.to · Hashnode · Substack · LinkedIn · X
```

The database is the source of truth. Markdown files under `content/` are working
copies you edit in a real editor — `pull` brings a post down, `push` sends it
back. The build reads the DB and emits a fully static site, so **the published
site has no runtime dependency on the database**: an RDS outage cannot take
kalmuhammed.com down, it can only block the next build.

## Writing a post

```bash
npm run post:new     -- the-slug        # scaffold content/the-slug.md
# ... write ...
npm run post:push    -- content/the-slug.md
npm run post:publish -- the-slug        # flips status to published
```

`post:push` validates before it writes: every post needs a title and a
description, every reference needs an id/authors/title, and every `[@key]` in
the prose must resolve to a reference. A published post must have a date.

It then runs the **prose lint** (`scripts/lint.mjs`), which blocks the push on a
post under 1,200 words, fewer than 8 distinct numbers in the prose, a reference
that is never cited, or a sentence whose only job is to announce the next one.
It warns on citations whose surrounding paragraph names no method or number, on
machine cadence (em-dash density, repeated "it is not X, it is Y"), and on an
essay with sources but no passage conceding anything to the other side. Override
with `--no-lint`. Rationale and the full rule set: [`docs/VOICE.md`](docs/VOICE.md).

Then deploy — publishing to the DB does not by itself change the site:

```bash
gh workflow run "Build and deploy"
# or: gh api repos/KhalidAlMuhammed/KhalidAlMuhammed.github.io/dispatches -f event_type=publish
```

## Citations

Inline `[@key]` resolves against the ordered `references:` block in frontmatter
and renders as a superscript link into the References section. Numbering is
derived from bibliography order, so it can never drift out of sync. See
`docs/VOICE.md`.

## Syndicating

```bash
npm run syndicate -- the-slug --dry-run
npm run syndicate -- the-slug
npm run syndicate -- the-slug --to devto,x
```

| Target | Automated? | Notes |
|---|---|---|
| dev.to | yes | Forem API. Sets `canonical_url` back here. Needs `DEVTO_API_KEY`. |
| Hashnode | yes | GraphQL. Sets `originalArticleURL`. Needs `HASHNODE_TOKEN`. |
| Substack | no | **No public write API exists.** The script prepares the post and prints Substack's import-from-URL flow. |
| LinkedIn | no | No article API. Generates announcement copy to paste. |
| X | no | No article API. Generates a single-post announcement. |

Re-running updates the existing dev.to/Hashnode copy rather than duplicating it
— the remote ids live in the `syndications` table. For the manual targets,
record where the copy landed so the post page can link to it:

```bash
npm run syndicate:record -- the-slug substack https://...
```

Every syndicated copy has its `[@key]` citations flattened to plain `[n]` and a
Markdown References list appended, because the in-page anchors those citations
point to only exist here.

## Environment

`.env.local` (gitignored), and the same values as GitHub Actions secrets:

```
DATABASE_URL=postgresql://...@reem-db.<...>.us-east-1.rds.amazonaws.com:5432/blog
DEVTO_API_KEY=...          # optional, https://dev.to/settings/extensions
HASHNODE_TOKEN=...         # optional, https://hashnode.com/settings/developer
HASHNODE_PUBLICATION_ID=   # optional, auto-detected from your account
```

TLS to RDS is verified against Amazon's CA bundle (`db/rds-global-bundle.pem`),
not disabled. `pg` >= 8.16 reads `sslmode=require` as `verify-full`, which fails
against RDS's chain — the code strips `sslmode` and passes the bundle instead.
Refresh the bundle from
`https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem` if it expires.

## Local development

```bash
npm install
npm run db:migrate     # idempotent
npm run dev            # http://localhost:3000
npm run build          # -> out/
```

## Design

Palette is lifted from the reem.chat landing (`landing-v2/landing.css`): the
warm off-white ground `#fefffc`, slate ink `#1f2937`, hairline rules and soft
lifted cards. Typography departs from it deliberately — reem.chat is a marketing
page set in a pixel display face; this is a reading site, so body copy is
Source Serif 4 at an essay measure, with Poppins for headings and UI. No colour
accent: like reem.chat, the palette is monochrome, and links and citations are
marked by underline and weight rather than by hue.

## Hosting and analytics

The site runs on **Vercel**, not GitHub Pages. It needs a runtime for the
analytics endpoint, and GitHub's runners cannot reach the RDS instance at build
time (see below).

### Reading analytics

Cookieless, self-hosted, in the same `blog` database as the posts.
`components/Analytics.tsx` beacons to `/api/collect/`, which writes to
`page_reads` and `link_clicks`.

```bash
npm run stats -- 30    # last 30 days
```

What it records, and the reasoning:

- **engaged_ms** — time the tab was *visible* and the reader active in the last
  30s. Wall-clock since load counts a tab left open over lunch as deep reading.
- **last_heading** — the last h2/h3 scrolled past, i.e. where they stopped. On a
  long essay this is the most useful number available.
- **max_scroll_pct**, **reached_end**, **referrer_host**, **country/region/city**,
  **device**, **viewport_w**.
- **link_clicks** — every click, classified outbound / internal / anchor /
  mailto / download.

No cookies. No IP is stored: Vercel resolves geo at the edge and the address
stays in the request. `session_id` is random per tab in `sessionStorage`, so it
dies with the tab and never links two visits. `navigator.doNotTrack` is honoured.
Together that keeps this outside consent-banner territory in the EU and UK.

The endpoint is public and unauthenticated by necessity, so it treats every
field as hostile: type-checked, length-capped, clamped, non-same-site paths
rejected. Monotonic columns merge with `GREATEST`, since beacons arrive late and
out of order.

### Database access

The app connects as **`blog_app`**, not `reemadmin`. That role can only reach
the `blog` database — `reem`, `zillow` and `scrapers` refuse it — and has
SELECT/INSERT/UPDATE but **no DELETE**, so a public endpoint cannot destroy
data. Admin scripts (`db:migrate`, `post:*`) still run as `reemadmin` from
`.env.local`.

`reem-db-sg` allows 5432 from `0.0.0.0/0` because Vercel's egress IPs are
dynamic. The exposure is bounded by the scoped role above, a 40-character
random password and enforced TLS against Amazon's CA bundle.

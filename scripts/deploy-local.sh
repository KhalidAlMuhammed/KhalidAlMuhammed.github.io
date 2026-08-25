#!/usr/bin/env bash
# Fallback deploy: build here, publish the static output to the `gh-pages`
# branch, and let GitHub Pages serve that branch directly.
#
# Use this when the GitHub Actions build cannot reach AWS RDS — GitHub-hosted
# runners have dynamic egress IPs, so if the RDS security group is restricted to
# an allowlist rather than open, the Actions build will fail at connect time.
# This path builds where the database is already reachable and ships only the
# finished HTML, so the runner never needs database access at all.
#
#   ./scripts/deploy-local.sh
#
# Then set Pages source to: branch `gh-pages`, folder `/`.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "error: .env.local with DATABASE_URL is required" >&2
  exit 1
fi

echo "building..."
npm run build

count=$(find out/blog -mindepth 1 -maxdepth 1 -type d | wc -l)
echo "built $count post page(s)"
if [ "$count" -eq 0 ]; then
  echo "error: no post pages generated — refusing to publish an empty site" >&2
  exit 1
fi

# Pages needs .nojekyll or it will drop _next/ (underscore-prefixed paths).
touch out/.nojekyll

tmp=$(mktemp -d)
cp -r out/. "$tmp/"

worktree=$(mktemp -d)
git worktree add --force "$worktree" gh-pages 2>/dev/null \
  || git worktree add --force -b gh-pages "$worktree"

find "$worktree" -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} +
cp -r "$tmp/." "$worktree/"

git -C "$worktree" add -A
if git -C "$worktree" diff --cached --quiet; then
  echo "no changes to publish"
else
  git -C "$worktree" commit -m "Publish site $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  git -C "$worktree" push origin gh-pages
  echo "pushed to gh-pages"
fi

git worktree remove --force "$worktree"
rm -rf "$tmp"

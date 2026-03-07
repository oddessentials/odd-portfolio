#!/usr/bin/env bash
# investigate-repo.sh — Collect repo metadata, metrics, README, and file tree
# Usage: ./scripts/investigate-repo.sh <owner/repo> [branch]
# Example: ./scripts/investigate-repo.sh coneyislandpottsville/coney-website main
# Requires: gh CLI (authenticated), node

set -euo pipefail

REPO="${1:?Usage: $0 <owner/repo> [branch]}"
BRANCH="${2:-main}"
NAME="${REPO#*/}"
OUT_DIR="scripts/repo-reports"
OUT_FILE="${OUT_DIR}/${NAME}.json"
TMP_DIR=$(mktemp -d)

mkdir -p "$OUT_DIR"

echo "=== Investigating ${REPO} (branch: ${BRANCH}) ==="

# 1. Core metadata
echo "[1/8] Fetching repo metadata..."
gh repo view "$REPO" --json name,description,createdAt,pushedAt,primaryLanguage,diskUsage,licenseInfo,repositoryTopics,stargazerCount,forkCount,isArchived,visibility > "${TMP_DIR}/meta.json" 2>/dev/null || echo '{"error":"repo not found"}' > "${TMP_DIR}/meta.json"

# 2. Commit count (paginated — extract last page from Link header)
echo "[2/8] Counting commits..."
COMMIT_COUNT=$(gh api "repos/${REPO}/commits?per_page=1" -i 2>&1 | grep -i '^link:' | sed -n 's/.*page=\([0-9]*\)>; rel="last".*/\1/p')
COMMIT_COUNT="${COMMIT_COUNT:-0}"
if [ "$COMMIT_COUNT" = "0" ]; then
  COMMIT_COUNT=$(gh api "repos/${REPO}/commits?per_page=100" --jq 'length' 2>/dev/null || echo "0")
fi

# 3. Contributors
echo "[3/8] Fetching contributors..."
gh api "repos/${REPO}/contributors" --jq '[.[] | {login, contributions}]' > "${TMP_DIR}/contributors.json" 2>/dev/null || echo '[]' > "${TMP_DIR}/contributors.json"

# 4. Releases
echo "[4/8] Fetching releases..."
gh api "repos/${REPO}/releases" --jq '[.[] | {tag_name, published_at, name}]' > "${TMP_DIR}/releases.json" 2>/dev/null || echo '[]' > "${TMP_DIR}/releases.json"

# 5. PR count
echo "[5/8] Counting PRs..."
PR_COUNT=$(gh pr list -R "$REPO" --state all --limit 1000 --json number --jq 'length' 2>/dev/null || echo "0")

# 6. Issue count
echo "[6/8] Counting issues..."
ISSUE_COUNT=$(gh issue list -R "$REPO" --state all --limit 1000 --json number --jq 'length' 2>/dev/null || echo "0")

# 7. README
echo "[7/8] Fetching README..."
gh api "repos/${REPO}/readme" --jq '.content' 2>/dev/null | base64 -d > "${TMP_DIR}/readme.txt" 2>/dev/null || echo "No README found" > "${TMP_DIR}/readme.txt"

# 8. File tree
echo "[8/8] Fetching file tree..."
gh api "repos/${REPO}/git/trees/${BRANCH}?recursive=1" --jq '[.tree[] | select(.type=="blob") | .path]' > "${TMP_DIR}/tree.json" 2>/dev/null || echo '[]' > "${TMP_DIR}/tree.json"

# Assemble JSON report using Node.js
node -e "
const fs = require('fs');
const read = f => fs.readFileSync(f, 'utf8');
const readJSON = f => { try { return JSON.parse(read(f)); } catch { return []; } };

const data = {
  repo: process.argv[1],
  branch: process.argv[2],
  metadata: readJSON(process.argv[5] + '/meta.json'),
  metrics: {
    commit_count: parseInt(process.argv[3]) || 0,
    pr_count: parseInt(process.argv[4]) || 0,
    issue_count: parseInt(process.argv[6]) || 0,
  },
  contributors: readJSON(process.argv[5] + '/contributors.json'),
  releases: readJSON(process.argv[5] + '/releases.json'),
  readme_preview: read(process.argv[5] + '/readme.txt').slice(0, 5000),
  file_tree: readJSON(process.argv[5] + '/tree.json')
};
data.metrics.contributor_count = data.contributors.length;
data.metrics.release_count = data.releases.length;

fs.writeFileSync(process.argv[7], JSON.stringify(data, null, 2));
console.log('');
console.log('=== Report saved to ' + process.argv[7] + ' ===');
console.log('Summary:', JSON.stringify({
  repo: data.repo,
  metrics: data.metrics,
  files: data.file_tree.length
}, null, 2));
" "$REPO" "$BRANCH" "$COMMIT_COUNT" "$PR_COUNT" "$TMP_DIR" "$ISSUE_COUNT" "$OUT_FILE"

# Cleanup
rm -rf "$TMP_DIR"

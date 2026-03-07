#!/usr/bin/env python3
"""Build-time pipeline: collect GitHub metrics and output assets/repo-metrics.json.

Usage:
    python scripts/build-metrics.py                    # Generate metrics with tiers
    python scripts/build-metrics.py --dry-run          # Print without writing
    python scripts/build-metrics.py --validate-keys K  # Cross-check against comma-separated repoKeys

Requires: gh CLI (authenticated), Python 3.x
"""

import json
import math
import subprocess
import sys
import re
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUT_FILE = PROJECT_ROOT / "assets" / "repo-metrics.json"

# Authoritative manifest — all active repos to collect metrics for.
# repoKey MUST match the key used in data.js and repo-metrics.json.
REPO_MANIFEST = [
    {"repoKey": "odd-ai-reviewers",            "repo": "oddessentials/odd-ai-reviewers",            "branch": "main"},
    {"repoKey": "ado-git-repo-insights",       "repo": "oddessentials/ado-git-repo-insights",       "branch": "main"},
    {"repoKey": "ado-git-repo-seeder",         "repo": "oddessentials/ado-git-repo-seeder",         "branch": "main"},
    {"repoKey": "repo-standards",              "repo": "oddessentials/repo-standards",              "branch": "main"},
    {"repoKey": "odd-self-hosted-ci-runtime",  "repo": "oddessentials/odd-self-hosted-ci-runtime",  "branch": "main"},
    {"repoKey": "odd-map",                     "repo": "oddessentials/odd-map",                     "branch": "main"},
    {"repoKey": "odd-fintech",                 "repo": "oddessentials/odd-fintech",                 "branch": "main"},
    {"repoKey": "socialmedia-syndicator",      "repo": "oddessentials/socialmedia-syndicator",      "branch": "main"},
    {"repoKey": "oddessentials-splash",        "repo": "oddessentials/oddessentials-splash",        "branch": "main"},
    {"repoKey": "odd-portfolio",               "repo": "oddessentials/odd-portfolio",               "branch": "main"},
    {"repoKey": "oddessentials-platform",      "repo": "oddessentials/oddessentials-platform",      "branch": "main"},
    {"repoKey": "odd-demonstration",           "repo": "oddessentials/odd-demonstration",           "branch": "main"},
    # Coney Island repos (originals under oddessentials, will migrate to coneyislandpottsville)
    {"repoKey": "coney-website",               "repo": "oddessentials/coney-website",               "branch": "main"},
    {"repoKey": "yo-coney-bot",                "repo": "oddessentials/yo-coney-bot",                "branch": "main"},
    {"repoKey": "yo-coney-mobile",             "repo": "oddessentials/yo-coney-mobile",             "branch": "main"},
]

# Fixed score boundaries for planet tier classification.
# A repo's tier changes only when its own score crosses a boundary.
TIER_THRESHOLDS = [
    (280,  0.55, "dwarf"),
    (480,  0.89, "minor"),
    (780,  1.00, "standard"),
    (1100, 1.44, "major"),
    (None, 2.33, "giant"),   # 1100+
]

# Test file patterns for counting (matched against full path).
# Covers JS/TS (*.test.*, *.spec.*, __tests__/), Python (test_*), Go (*_test.go).
TEST_FILE_PATTERNS = [
    re.compile(r'\.(?:test|spec)\.[^.]+$'),
    re.compile(r'(?:^|/)test_[^/]+$'),
    re.compile(r'_test\.[^.]+$'),
    re.compile(r'(?:^|/)(?:__tests__|tests)/[^/]+\.[^.]+$'),
]

MIN_RATE_LIMIT = 100


def gh(*args, fallback=None):
    """Run a gh CLI command and return stdout."""
    try:
        result = subprocess.run(
            ["gh", *args],
            capture_output=True, text=True, timeout=30
        )
        return result.stdout.strip() if result.returncode == 0 else fallback
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return fallback


def gh_json(*args, fallback=None):
    """Run a gh CLI command and parse JSON output."""
    raw = gh(*args, fallback=None)
    if raw is None:
        return fallback
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return fallback


def check_rate_limit():
    """Check GitHub API rate limit. Abort if below minimum."""
    data = gh_json("api", "rate_limit", "--jq", ".rate", fallback={})
    if not data:
        print("WARNING: Could not check rate limit")
        return
    remaining = data.get("remaining", 0)
    limit = data.get("limit", 0)
    print(f"Rate limit: {remaining}/{limit} remaining")
    if remaining < MIN_RATE_LIMIT:
        print(f"ERROR: Rate limit below minimum ({MIN_RATE_LIMIT}). Aborting.")
        sys.exit(1)


def get_commit_count(repo):
    """Get total commit count using Link header pagination trick."""
    try:
        result = subprocess.run(
            ["gh", "api", f"repos/{repo}/commits?per_page=1", "-i"],
            capture_output=True, text=True, timeout=30
        )
        for line in result.stdout.splitlines():
            if line.lower().startswith("link:"):
                match = re.search(r'page=(\d+)>; rel="last"', line)
                if match:
                    return int(match.group(1))
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    # Fallback: count single page (repos with < 100 commits have no Link header)
    count = gh_json("api", f"repos/{repo}/commits?per_page=100", "--jq", "length", fallback=0)
    return int(count) if count else 0


def get_pr_and_issue_counts(owner, name):
    """Get exact PR and issue counts via GraphQL totalCount (no pagination limits)."""
    query = """
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        pullRequests { totalCount }
        issues { totalCount }
      }
    }
    """
    raw = gh(
        "api", "graphql",
        "-f", f"query={query}",
        "-f", f"owner={owner}",
        "-f", f"name={name}",
        "--jq", ".data.repository",
        fallback=None
    )
    if raw is None:
        return None, None
    try:
        data = json.loads(raw)
        if data is None:
            return None, None
        return (
            data.get("pullRequests", {}).get("totalCount", 0),
            data.get("issues", {}).get("totalCount", 0),
        )
    except (json.JSONDecodeError, AttributeError):
        return None, None


def get_commit_dates(repo, branch):
    """Get first and latest commit dates on the default branch."""
    # Latest commit (first page, newest first)
    latest_commit_date = gh(
        "api", f"repos/{repo}/commits?per_page=1&sha={branch}",
        "--jq", ".[0].commit.committer.date",
        fallback=None
    )
    # Oldest commit (last page)
    oldest_commit_date = None
    try:
        result = subprocess.run(
            ["gh", "api", f"repos/{repo}/commits?per_page=1&sha={branch}", "-i"],
            capture_output=True, text=True, timeout=30
        )
        last_page = None
        for line in result.stdout.splitlines():
            if line.lower().startswith("link:"):
                match = re.search(r'page=(\d+)>; rel="last"', line)
                if match:
                    last_page = int(match.group(1))
        if last_page:
            oldest_commit_date = gh(
                "api", f"repos/{repo}/commits?per_page=1&sha={branch}&page={last_page}",
                "--jq", ".[0].commit.committer.date",
                fallback=None
            )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass

    return oldest_commit_date, latest_commit_date


def get_language_bytes(repo):
    """Get total source code bytes via GitHub Languages API."""
    data = gh_json("api", f"repos/{repo}/languages", fallback={})
    if not data or not isinstance(data, dict):
        return 0
    return sum(data.values())


def get_test_file_count(repo, branch):
    """Count unique test files via Git Trees API (recursive).

    Returns int, or None if the tree was truncated (undercount risk).
    """
    data = gh_json(
        "api", f"repos/{repo}/git/trees/{branch}?recursive=1",
        fallback=None
    )
    if data is None:
        return 0
    if data.get("truncated"):
        print(f"    WARNING: Git tree truncated for {repo}, test count may be low")
        return None
    tree = data.get("tree", [])
    matched = set()
    for entry in tree:
        if entry.get("type") != "blob":
            continue
        path = entry.get("path", "")
        for pattern in TEST_FILE_PATTERNS:
            if pattern.search(path):
                matched.add(path)
                break
    return len(matched)


def collect_repo_metrics(repo_slug, branch):
    """Collect metrics for a single repo. Returns dict or None on failure."""
    owner, name = repo_slug.split("/")
    print(f"  Collecting {repo_slug}...")

    meta = gh_json(
        "repo", "view", repo_slug, "--json",
        "name,description,createdAt,pushedAt,primaryLanguage,diskUsage,"
        "licenseInfo,repositoryTopics,stargazerCount,forkCount,isArchived,visibility",
        fallback=None
    )
    if meta is None:
        print(f"    ERROR: Could not access {repo_slug}")
        return None

    commit_count = get_commit_count(repo_slug)
    pr_count, issue_count = get_pr_and_issue_counts(owner, name)
    if pr_count is None or issue_count is None:
        print(f"    ERROR: GraphQL query returned null for {repo_slug}")
        return None

    contributors = gh_json(
        "api", f"repos/{repo_slug}/contributors",
        "--jq", '[.[] | {login, contributions}]',
        fallback=[]
    )

    releases = gh_json(
        "api", f"repos/{repo_slug}/releases",
        "--jq", '[.[] | {tag_name, published_at, name}]',
        fallback=[]
    )

    # Code volume and test file count
    total_code_bytes = get_language_bytes(repo_slug)
    loc_estimate = total_code_bytes // 50 if total_code_bytes else 0
    test_file_count = get_test_file_count(repo_slug, branch)

    # Commit dates for repo lifetime
    oldest_commit_date, latest_commit_date = get_commit_dates(repo_slug, branch)

    created_at = meta.get("createdAt", "")
    pushed_at = meta.get("pushedAt", "")

    # Repo lifetime: first commit to latest commit
    repo_lifetime_days = 0
    first_commit_iso = oldest_commit_date or created_at
    latest_commit_iso = latest_commit_date or pushed_at
    if first_commit_iso and latest_commit_iso:
        try:
            first = datetime.fromisoformat(first_commit_iso.replace("Z", "+00:00"))
            latest = datetime.fromisoformat(latest_commit_iso.replace("Z", "+00:00"))
            repo_lifetime_days = max((latest - first).days, 0)
        except ValueError:
            pass

    # Dev duration: repo creation to now (fallback)
    dev_duration_days = 0
    if created_at:
        try:
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            dev_duration_days = (now - created).days
        except ValueError:
            pass

    latest_release = releases[0]["tag_name"] if releases else None
    lang = meta.get("primaryLanguage", {})

    return {
        "commit_count": commit_count,
        "pr_count": pr_count,
        "issue_count": issue_count,
        "contributor_count": len(contributors) if contributors else 0,
        "release_count": len(releases) if releases else 0,
        "created_at": created_at,
        "pushed_at": pushed_at,
        "first_commit_date": oldest_commit_date,
        "latest_commit_date": latest_commit_date,
        "repo_lifetime_days": repo_lifetime_days,
        "primary_language": lang.get("name") if isinstance(lang, dict) else lang,
        "disk_usage_kb": meta.get("diskUsage", 0),
        "stars": meta.get("stargazerCount", 0),
        "forks": meta.get("forkCount", 0),
        "license": meta.get("licenseInfo", {}).get("name") if meta.get("licenseInfo") else None,
        "visibility": meta.get("visibility", "UNKNOWN"),
        "latest_release": latest_release,
        "dev_duration_days": dev_duration_days,
        "total_code_bytes": total_code_bytes,
        "loc_estimate": loc_estimate,
        "test_file_count": test_file_count,
    }


def calculate_activity_score(m):
    """Weighted composite score for planet tier classification.

    LOC uses log10 of loc_estimate (bytes/50) for better spread across repos.
    Test count uses sqrt for a graduated curve that rewards breadth without capping early.
    """
    lifetime = m.get("repo_lifetime_days")
    if lifetime is None:
        lifetime = m.get("dev_duration_days", 0)
    loc_est = m.get("loc_estimate") or 0
    loc_factor = min(math.log10(max(loc_est, 1)) * 15, 100)
    test_count = m.get("test_file_count") or 0
    test_factor = min(math.sqrt(test_count) * 10, 100)
    return (
        m["commit_count"] * 1.0 +
        m["pr_count"] * 2.0 +
        m["issue_count"] * 1.5 +
        m["release_count"] * 5.0 +
        m["contributor_count"] * 10.0 +
        min(lifetime * 0.67, 20) +
        loc_factor +
        test_factor
    )


def assign_tier(score):
    """Assign tier using fixed score boundaries (not relative normalization)."""
    for threshold, star_size, label in TIER_THRESHOLDS:
        if threshold is None or score < threshold:
            return star_size, label
    return 2.33, "giant"


def assign_tiers(repos):
    """Calculate scores and assign fixed-threshold tiers to all repos."""
    for name, m in repos.items():
        score = calculate_activity_score(m)
        star_size, tier_label = assign_tier(score)
        m["activity_score"] = round(score, 1)
        m["calculated_star_size"] = star_size
        m["tier_label"] = tier_label


def validate_keys(repos, expected_keys):
    """Cross-check repo metrics keys against expected repoKeys from data.js."""
    errors = []
    metric_keys = set(repos.keys())
    expected = set(expected_keys)

    for key in expected - metric_keys:
        errors.append(f"Orphan project: '{key}' expected in data.js but missing from metrics")
    for key in metric_keys - expected:
        errors.append(f"Orphan metrics: '{key}' in metrics but not expected by data.js")

    if errors:
        print("\n=== Validation Errors ===")
        for e in errors:
            print(f"  ERROR: {e}")
        sys.exit(1)
    else:
        print(f"\nValidation OK: {len(expected)} keys matched")


def main():
    dry_run = "--dry-run" in sys.argv

    # Parse --validate-keys arg
    validate_arg = None
    for i, arg in enumerate(sys.argv):
        if arg == "--validate-keys" and i + 1 < len(sys.argv):
            validate_arg = [k.strip() for k in sys.argv[i + 1].split(",") if k.strip()]

    print("=== Build Metrics Pipeline ===")
    check_rate_limit()

    repos = {}
    errors = []

    for entry in REPO_MANIFEST:
        repo_slug = entry["repo"]
        branch = entry["branch"]
        repo_key = entry["repoKey"]
        metrics = collect_repo_metrics(repo_slug, branch)
        if metrics:
            repos[repo_key] = metrics
        else:
            errors.append(repo_slug)

    if errors:
        print(f"\nERROR: Failed to collect metrics for: {', '.join(errors)}")
        print("All manifest repos must be reachable. Aborting.")
        sys.exit(1)

    print("\nCalculating planet tiers...")
    assign_tiers(repos)
    for name, m in sorted(repos.items(), key=lambda x: x[1].get("activity_score", 0), reverse=True):
        print(f"  {name}: score={m.get('activity_score', 0)}, "
              f"tier={m.get('tier_label', '?')}, "
              f"starSize={m.get('calculated_star_size', '?')}")

    # Mandatory internal validation: manifest keys must match output keys
    manifest_keys = [entry["repoKey"] for entry in REPO_MANIFEST]
    validate_keys(repos, manifest_keys)

    # Optional external validation: cross-check against data.js repoKeys
    if validate_arg:
        validate_keys(repos, validate_arg)

    output = {
        "generated_at": datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        "repo_count": len(repos),
        "repos": repos,
    }

    if dry_run:
        print("\n[DRY RUN] Would write to:", OUT_FILE)
        print(json.dumps(output, indent=2)[:2000], "...")
    else:
        OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        OUT_FILE.write_text(json.dumps(output, indent=2), encoding="utf-8")
        print(f"\n=== Wrote {OUT_FILE} ({len(repos)} repos) ===")


if __name__ == "__main__":
    main()

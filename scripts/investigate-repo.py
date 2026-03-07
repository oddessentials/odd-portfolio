#!/usr/bin/env python3
"""Collect GitHub repo metadata, metrics, README, and file tree.

Usage:
    python scripts/investigate-repo.py <owner/repo> [branch]
    python scripts/investigate-repo.py --all              # Run all repos from manifest
    python scripts/investigate-repo.py --manifest          # Show manifest only

Outputs JSON to scripts/repo-reports/<name>.json
"""

import json
import subprocess
import sys
import os
from pathlib import Path

OUT_DIR = Path(__file__).parent / "repo-reports"

# Manifest of all active repos to investigate at build time
REPO_MANIFEST = [
    {"repo": "oddessentials/odd-ai-reviewers", "branch": "main"},
    {"repo": "oddessentials/ado-git-repo-insights", "branch": "main"},
    {"repo": "oddessentials/ado-git-repo-seeder", "branch": "main"},
    {"repo": "oddessentials/repo-standards", "branch": "main"},
    {"repo": "oddessentials/odd-self-hosted-ci-runtime", "branch": "main"},
    {"repo": "oddessentials/odd-map", "branch": "main"},
    {"repo": "oddessentials/odd-fintech", "branch": "main"},
    {"repo": "oddessentials/socialmedia-syndicator", "branch": "main"},
    {"repo": "oddessentials/oddessentials-splash", "branch": "main"},
    {"repo": "oddessentials/odd-portfolio", "branch": "main"},
    {"repo": "oddessentials/oddessentials-platform", "branch": "main"},
    {"repo": "oddessentials/odd-demonstration", "branch": "main"},
    # Coney Island repos (originals under oddessentials, will migrate to coneyislandpottsville)
    {"repo": "oddessentials/coney-website", "branch": "main"},
    {"repo": "oddessentials/yo-coney-bot", "branch": "main"},
    {"repo": "oddessentials/yo-coney-mobile", "branch": "main"},
]


def gh(*args, fallback=None):
    """Run a gh CLI command and return stdout. Returns fallback on failure."""
    try:
        result = subprocess.run(
            ["gh", *args],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return result.stdout.strip()
        return fallback
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


def get_commit_count(repo):
    """Get total commit count using Link header pagination trick."""
    result = subprocess.run(
        ["gh", "api", f"repos/{repo}/commits?per_page=1", "-i"],
        capture_output=True, text=True, timeout=30
    )
    for line in result.stdout.splitlines():
        if line.lower().startswith("link:"):
            import re
            match = re.search(r'page=(\d+)>; rel="last"', line)
            if match:
                return int(match.group(1))
    # Fallback: count single page
    count = gh_json("api", f"repos/{repo}/commits?per_page=100", "--jq", "length", fallback=0)
    return int(count) if count else 0


def get_readme(repo):
    """Fetch and decode README content."""
    import base64
    raw = gh("api", f"repos/{repo}/readme", "--jq", ".content", fallback=None)
    if raw is None:
        return "No README found"
    try:
        decoded = base64.b64decode(raw).decode("utf-8", errors="replace")
        # Truncate to first 200 lines
        lines = decoded.splitlines()[:200]
        return "\n".join(lines)
    except Exception:
        return "No README found"


def investigate(repo, branch="main"):
    """Investigate a single repository and return structured data."""
    name = repo.split("/")[-1]
    print(f"=== Investigating {repo} (branch: {branch}) ===")

    # 1. Core metadata
    print(f"  [1/8] Metadata...")
    metadata = gh_json(
        "repo", "view", repo, "--json",
        "name,description,createdAt,pushedAt,primaryLanguage,diskUsage,"
        "licenseInfo,repositoryTopics,stargazerCount,forkCount,isArchived,visibility",
        fallback={"error": "repo not found"}
    )

    # 2. Commit count
    print(f"  [2/8] Commits...")
    commit_count = get_commit_count(repo)

    # 3. Contributors
    print(f"  [3/8] Contributors...")
    contributors = gh_json(
        "api", f"repos/{repo}/contributors",
        "--jq", '[.[] | {login, contributions}]',
        fallback=[]
    )

    # 4. Releases
    print(f"  [4/8] Releases...")
    releases = gh_json(
        "api", f"repos/{repo}/releases",
        "--jq", '[.[] | {tag_name, published_at, name}]',
        fallback=[]
    )

    # 5. PR count
    print(f"  [5/8] PRs...")
    pr_count = gh_json(
        "pr", "list", "-R", repo,
        "--state", "all", "--limit", "1000",
        "--json", "number", "--jq", "length",
        fallback=0
    )

    # 6. Issue count
    print(f"  [6/8] Issues...")
    issue_count = gh_json(
        "issue", "list", "-R", repo,
        "--state", "all", "--limit", "1000",
        "--json", "number", "--jq", "length",
        fallback=0
    )

    # 7. README
    print(f"  [7/8] README...")
    readme = get_readme(repo)

    # 8. File tree
    print(f"  [8/8] File tree...")
    file_tree = gh_json(
        "api", f"repos/{repo}/git/trees/{branch}?recursive=1",
        "--jq", '[.tree[] | select(.type=="blob") | .path]',
        fallback=[]
    )

    report = {
        "repo": repo,
        "branch": branch,
        "metadata": metadata,
        "metrics": {
            "commit_count": commit_count,
            "pr_count": int(pr_count) if pr_count else 0,
            "issue_count": int(issue_count) if issue_count else 0,
            "contributor_count": len(contributors) if contributors else 0,
            "release_count": len(releases) if releases else 0,
        },
        "contributors": contributors or [],
        "releases": releases or [],
        "readme_preview": readme,
        "file_tree": file_tree or [],
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / f"{name}.json"
    out_file.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"  => Saved to {out_file}")
    print(f"  => Metrics: {json.dumps(report['metrics'], indent=2)}")
    print(f"  => Files: {len(report['file_tree'])}")
    print()
    return report


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    if sys.argv[1] == "--manifest":
        for entry in REPO_MANIFEST:
            print(f"  {entry['repo']} ({entry['branch']})")
        sys.exit(0)

    if sys.argv[1] == "--all":
        results = {}
        for entry in REPO_MANIFEST:
            try:
                report = investigate(entry["repo"], entry["branch"])
                results[entry["repo"]] = report["metrics"]
            except Exception as e:
                print(f"  ERROR: {e}")
                results[entry["repo"]] = {"error": str(e)}
        # Write combined summary
        summary_file = OUT_DIR / "_summary.json"
        summary_file.write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(f"=== Combined summary saved to {summary_file} ===")
        sys.exit(0)

    # Single repo mode
    repo = sys.argv[1]
    branch = sys.argv[2] if len(sys.argv) > 2 else "main"
    investigate(repo, branch)


if __name__ == "__main__":
    main()

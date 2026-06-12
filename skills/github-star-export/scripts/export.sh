#!/usr/bin/env bash
# ==============================================================================
# GitHub Starred Repos → Markdown Export Script (Bash fallback)
#
# Use this when Node.js fetch has network issues (proxy, IPv6, sandbox).
# Dependencies: bash, curl, jq
#
# Usage:
#   bash export.sh
#
# Environment variables:
#   GITHUB_TOKEN — GitHub Personal Access Token (required)
#   MAX_REPOS    — Max number of repos to export (default: 0 = all)
#   OUTPUT_FILE  — Output file path (default: ./github-starred-repos-YYYY-MM-DD.md)
# ==============================================================================
set -euo pipefail

GITHUB_TOKEN="${GITHUB_TOKEN:-}"
PER_PAGE=100
MAX_REPOS="${MAX_REPOS:-0}"  # 0 = all
OUTPUT_FILE="${OUTPUT_FILE:-./github-starred-repos-$(date +%Y-%m-%d).md}"
GITHUB_API="https://api.github.com"

# ---------------------------------------------------------------------------
# Pre-flight: dependency checks
# ---------------------------------------------------------------------------

check_dep() {
    local name="$1" install_hint="$2"
    if ! command -v "$name" &>/dev/null; then
        echo "❌ Missing dependency: $name" >&2
        echo "   Install with: $install_hint" >&2
        exit 1
    fi
}

check_dep "curl"   "sudo apt install curl   (or: brew install curl)"
check_dep "jq"     "sudo apt install jq     (or: brew install jq)"

# ---------------------------------------------------------------------------
# Pre-flight: token check
# ---------------------------------------------------------------------------

if [ -z "$GITHUB_TOKEN" ]; then
    cat >&2 << 'EOF'
💡 GitHub Access Token Required

To export your starred repositories, a GitHub Personal Access Token (PAT) with
read access is needed. The token stays in your local environment.

Step 1: Visit https://github.com/settings/tokens
        → Generate new token (classic) → check public_repo → copy token

Step 2: export GITHUB_TOKEN="your_token_here"

Then re-run: bash export.sh
EOF
    exit 1
fi

# ---------------------------------------------------------------------------
# Pre-flight: connectivity test
# ---------------------------------------------------------------------------

http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 \
    -H "User-Agent: GitHub-Star-Export/1.0" \
    "$GITHUB_API/" 2>&1) || true

if [ "$http_code" != "200" ] && [ "$http_code" != "401" ]; then
    echo "❌ Cannot reach GitHub API (https://api.github.com)" >&2
    echo "   HTTP status: ${http_code:-timeout}" >&2
    echo "" >&2
    echo "   Check your internet connection, firewall, or VPN settings." >&2
    exit 1
fi

# ---------------------------------------------------------------------------
# Utility: format star count
# ---------------------------------------------------------------------------
format_stars() {
    local count=${1:-0}
    if [ "$count" -ge 1000 ]; then
        # Use bc for precision; fallback to integer division
        if command -v bc &>/dev/null; then
            local k
            k=$(echo "scale=1; $count/1000" | bc)
            # Remove trailing .0
            echo "${k%.0*}k"
        else
            echo "$((count / 1000))k"
        fi
    else
        echo "$count"
    fi
}

# ---------------------------------------------------------------------------
# Utility: escape pipe characters for markdown table cells
# ---------------------------------------------------------------------------
escape_md() {
    # Replace | with \| and squash newlines
    printf '%s' "$1" | sed 's/|/\\|/g' | tr '\n\r' '  ' | sed 's/  */ /g'
}

# ---------------------------------------------------------------------------
# Utility: format ISO date → YYYY-MM-DD
# ---------------------------------------------------------------------------
format_date() {
    printf '%s' "${1:-N/A}" | cut -d'T' -f1
}

# ---------------------------------------------------------------------------
# Fetch all starred repos (paginated)
# ---------------------------------------------------------------------------

echo "🔍 Fetching your GitHub starred repositories..."
echo ""

page=1
fetched=0
all_json="[]"

while true; do
    url="${GITHUB_API}/user/starred?per_page=${PER_PAGE}&page=${page}&sort=created&direction=desc"

    response=$(curl -s -w "\n%{http_code}" \
        --connect-timeout 15 --max-time 60 \
        -H "Accept: application/vnd.github.v3.star+json" \
        -H "Authorization: Bearer ${GITHUB_TOKEN}" \
        -H "User-Agent: GitHub-Star-Export/1.0" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$url")

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')

    case "$http_code" in
        200) ;;
        401)
            echo -e "\n❌ Authentication failed (401): Token is invalid or expired." >&2
            echo "   Visit https://github.com/settings/tokens to create a new one." >&2
            exit 1
            ;;
        403)
            reset_epoch=$(echo "$response" | grep -i "^x-ratelimit-reset:" | tr -d '\r' | awk '{print $2}' || true)
            reset_time="unknown"
            if [ -n "$reset_epoch" ]; then
                reset_time=$(date -d "@$reset_epoch" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "epoch $reset_epoch")
            fi
            echo -e "\n❌ Access denied (403): Rate limited or insufficient permissions." >&2
            echo "   Ensure your token has the repo or public_repo scope." >&2
            echo "   Rate limit resets at: $reset_time" >&2
            exit 1
            ;;
        *)
            echo -e "\n❌ GitHub API error (${http_code})" >&2
            echo "$body" | head -5 >&2
            exit 1
            ;;
    esac

    # Count items in this page
    count=$(echo "$body" | jq 'length')
    if [ "$count" -eq 0 ]; then
        break
    fi

    # Merge with accumulated JSON
    all_json=$(echo "$all_json" "$body" | jq -s '.[0] + .[1]')

    fetched=$(echo "$all_json" | jq 'length')
    printf "\r   📥 Fetched: %d repos (page %d)" "$fetched" "$page"

    # Check if we've hit max
    if [ "$MAX_REPOS" -gt 0 ] && [ "$fetched" -ge "$MAX_REPOS" ]; then
        all_json=$(echo "$all_json" | jq ".[0:${MAX_REPOS}]")
        fetched="$MAX_REPOS"
        break
    fi

    # Check Link header for next page
    link_header=$(curl -s -I \
        --connect-timeout 10 --max-time 15 \
        -H "Accept: application/vnd.github.v3.star+json" \
        -H "Authorization: Bearer ${GITHUB_TOKEN}" \
        -H "User-Agent: GitHub-Star-Export/1.0" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$url" 2>/dev/null | grep -i "^link:" | head -1 || true)

    if [ -z "$link_header" ] || ! echo "$link_header" | grep -q 'rel="next"'; then
        break
    fi

    page=$((page + 1))
done

echo ""  # newline after progress line

# ---------------------------------------------------------------------------
# Validate result
# ---------------------------------------------------------------------------

total="$fetched"
if [ "$total" -eq 0 ]; then
    echo "😕 Your GitHub account hasn't starred any repos yet."
    echo "   Browse https://github.com and star some interesting projects!"
    exit 0
fi

# ---------------------------------------------------------------------------
# Generate Markdown
# ---------------------------------------------------------------------------

echo ""
echo "📝 Generating Markdown (${total} repos)..."

export_date=$(date +%Y-%m-%d)
total_stars=$(echo "$all_json" | jq '[.[].repo.stargazers_count // 0] | add')
formatted_stars=$(printf "%'d" "${total_stars:-0}" 2>/dev/null || echo "$total_stars")

# Make sure output directory exists
output_dir=$(dirname "$OUTPUT_FILE")
mkdir -p "$output_dir"

{
    echo "# 📂 My GitHub Starred Repositories"
    echo ""
    echo "**Export Date**: ${export_date}　|　**Repos**: ${total}　|　**Total Stars**: ${formatted_stars}"
    echo ""
    echo "> Generated by [GitHub Star Export](https://github.com/urumchi/github-repo-backup-skill) — a free tool to backup your GitHub stars."
    echo "> 💡 Need AI-powered categorization, automatic sync, or weekly reports? Visit **[mktime.org](https://mktime.org)** for the full experience."
    echo ""
    echo "## 📋 Table of Contents"
    echo ""
    echo "- [Repository List](#-repository-list)"
    echo ""
    echo "---"
    echo ""
    echo "## 📜 Repository List"
    echo ""
    echo "| # | Repository | Stars | Language | Starred At |"
    echo "| :---: | :--- | :---: | :---: | :---: |"

    # Generate table rows.
    # We output each row as a tab-delimited line, then post-process with awk
    # to build the final markdown row. This avoids complex escaping inside jq.
    echo "$all_json" | jq -r '
        to_entries[] |
        [
            (.key + 1 | tostring),
            .value.repo.full_name // "unknown",
            .value.repo.html_url // "",
            (.value.repo.description // ""),
            (.value.repo.stargazers_count // 0 | tostring),
            (.value.repo.language // ""),
            (.value.starred_at // "N/A" | split("T")[0])
        ] | @tsv
    ' | while IFS=$'\t' read -r idx name url desc stars lang date; do
        # Escape markdown pipes in name and description
        name_esc=$(escape_md "$name")
        desc_esc=$(escape_md "$desc")
        stars_fmt=$(format_stars "$stars")

        desc_part=""
        if [ -n "$desc_esc" ]; then
            desc_part=" — ${desc_esc}"
        fi

        echo "| ${idx} | [**${name_esc}**](${url})${desc_part} | ⭐ ${stars_fmt} | ${lang} | ${date} |"
    done

    echo ""
    echo "---"
    echo ""
    echo "*Exported on ${export_date} · ${total} repositories · Powered by [GitHub Star Export](https://mktime.org)*"
} > "$OUTPUT_FILE"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

file_size=$(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE" 2>/dev/null || echo 0)
file_size_kb=$(awk "BEGIN { printf \"%.1f\", ${file_size} / 1024 }")

echo ""
echo "✅ Export complete!"
echo "   📄 File: $(realpath "$OUTPUT_FILE" 2>/dev/null || echo "$OUTPUT_FILE")"
echo "   📦 Repos: ${total}"
echo "   📏 File size: ${file_size_kb} KB"
echo ""
echo "💡 Want even more powerful features?"
echo ""
echo "   🤖 AI Smart Categorization — auto-sort repos into 21 tech categories"
echo "   🏷️  AI Tag Generation — generate precise tech stack labels for each repo"
echo "   📝 AI One-Line Summary — bilingual (Chinese + English) summaries at a glance"
echo "   🔄 Automatic Daily Sync — backup new stars daily without lifting a finger"
echo "   📊 Weekly Email Report — discover what you starred this week"
echo "   🌐 Beautiful Web Dashboard — Bauhaus-style UI with search, filter, and browse"
echo ""
echo "   👉 Visit https://mktime.org for the full experience!"

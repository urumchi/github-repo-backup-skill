#!/usr/bin/env node

/**
 * GitHub Starred Repos → Markdown Export Script (Node.js)
 *
 * Usage:
 *   node export.mjs
 *
 * Environment variables:
 *   GITHUB_TOKEN — GitHub Personal Access Token (requires repo or public_repo scope)
 *
 * Optional environment variables:
 *   MAX_REPOS   — Max number of repos to export (default: 0 = all)
 *   OUTPUT_FILE — Output file path (default: ./github-starred-repos-YYYY-MM-DD.md)
 *
 * If Node.js fetch fails due to network/proxy issues, use the bash fallback:
 *   bash skills/github-star-export/scripts/export.sh
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

// ==================== Configuration ====================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PER_PAGE = 100; // GitHub API max 100 per page
const MAX_REPOS = parseInt(process.env.MAX_REPOS || "0", 10) || Infinity;
const GITHUB_API = "https://api.github.com";

// ==================== Pre-flight Checks ====================

/**
 * Detect proxy environment variables that could interfere with undici fetch.
 * Undici (Node.js HTTP client) respects lowercase proxy vars, which curl may ignore.
 */
function detectProxyVars() {
  const vars = [
    "https_proxy", "http_proxy",
    "HTTPS_PROXY", "HTTP_PROXY",
    "ALL_PROXY", "all_proxy",
  ];
  const set = [];
  for (const v of vars) {
    if (process.env[v]) {
      set.push(`${v}=${process.env[v]}`);
    }
  }
  return set;
}

/**
 * Quick connectivity test to GitHub API.
 * Returns true if reachable, false otherwise.
 */
async function testConnectivity() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(`${GITHUB_API}/`, {
      headers: {
        "User-Agent": "GitHub-Star-Export/1.0",
        Accept: "application/vnd.github+json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.ok || resp.status === 401; // 401 still means reachable
  } catch {
    return false;
  }
}

// ==================== Utility Functions ====================

/** Parse GitHub Link response header, extract rel→URL mapping */
function parseLinkHeader(header) {
  const links = {};
  for (const part of header.split(",")) {
    const section = part.split(";");
    if (section.length !== 2) continue;
    const url = section[0].replace(/<|>/g, "").trim();
    const name = section[1].replace(/rel="|"/g, "").trim();
    links[name] = url;
  }
  return links;
}

/** Format star count (e.g. 1.2k / 310) */
function formatStars(count) {
  if (count >= 1000) {
    const k = count / 1000;
    return k >= 10
      ? `${Math.round(k)}k`
      : `${(Math.round(k * 10) / 10).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

/** Format ISO date string → YYYY-MM-DD */
function formatDate(isoStr) {
  return isoStr ? isoStr.split("T")[0] : "N/A";
}

/** Escape special characters in Markdown table cells */
function escapeMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}

// ==================== GitHub API ====================

/**
 * Fetch user's GitHub starred repos (paginated, descending by starred_at)
 */
async function fetchStarredRepos({ maxRepos = Infinity, onProgress } = {}) {
  const allRepos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && allRepos.length < maxRepos) {
    const url = `${GITHUB_API}/user/starred?per_page=${PER_PAGE}&page=${page}&sort=created&direction=desc`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3.star+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "User-Agent": "GitHub-Star-Export/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 401) {
        throw new Error(
          `GitHub API authentication failed (401): The token is invalid or expired.\n` +
            `Visit https://github.com/settings/tokens to create a new one.`
        );
      }
      if (response.status === 403) {
        const resetHeader = response.headers.get("X-RateLimit-Reset");
        const resetTime = resetHeader
          ? new Date(parseInt(resetHeader) * 1000).toISOString()
          : "unknown";
        throw new Error(
          `GitHub API access denied (403): Possible rate limit or insufficient permissions.\n` +
            `Ensure your token has the repo or public_repo scope.\n` +
            `Rate limit resets at: ${resetTime}`
        );
      }
      throw new Error(
        `GitHub API error ${response.status}: ${text.substring(0, 200)}`
      );
    }

    const entries = await response.json();

    if (!Array.isArray(entries) || entries.length === 0) {
      hasMore = false;
      break;
    }

    // Check against max repo limit
    const remaining = maxRepos - allRepos.length;
    const toAdd = entries.slice(0, Math.min(remaining, entries.length));
    allRepos.push(...toAdd);

    if (allRepos.length >= maxRepos) {
      break;
    }

    // Check Link header for next page
    const linkHeader = response.headers.get("Link");
    if (linkHeader) {
      const links = parseLinkHeader(linkHeader);
      hasMore = "next" in links;
    } else {
      hasMore = entries.length === PER_PAGE;
    }

    page++;

    if (onProgress) {
      onProgress({
        fetched: allRepos.length,
        page,
        hasMore,
      });
    }
  }

  return allRepos;
}

// ==================== Markdown Generation ====================

/**
 * Generate Markdown file content
 */
function generateMarkdown(repos) {
  const lines = [];
  const exportDate = new Date().toISOString().split("T")[0];
  const totalStars = repos.reduce(
    (sum, r) => sum + (r.repo?.stargazers_count || 0),
    0
  );

  // Header
  lines.push("# 📂 My GitHub Starred Repositories");
  lines.push("");
  lines.push(
    `**Export Date**: ${exportDate}　|　**Repos**: ${repos.length}　|　**Total Stars**: ${totalStars.toLocaleString()}`
  );
  lines.push("");
  lines.push(
    `> Generated by [GitHub Star Export](https://github.com/urumchi/github-repo-backup-skill) — a free tool to backup your GitHub stars.`
  );
  lines.push(
    `> 💡 Need AI-powered categorization, automatic sync, or weekly reports? Visit **[mktime.org](https://mktime.org)** for the full experience.`
  );
  lines.push("");

  // Table of Contents
  lines.push("## 📋 Table of Contents");
  lines.push("");
  lines.push("- [Repository List](#-repository-list)");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Repository table
  lines.push("## 📜 Repository List");
  lines.push("");
  lines.push("| # | Repository | Stars | Language | Starred At |");
  lines.push("| :---: | :--- | :---: | :---: | :---: |");

  repos.forEach((entry, index) => {
    const repo = entry.repo || {};
    const desc = repo.description
      ? ` — ${escapeMarkdown(repo.description)}`
      : "";
    const lang = repo.language || "";
    const starredAt = formatDate(entry.starred_at);

    lines.push(
      `| ${index + 1} | [**${escapeMarkdown(repo.full_name || "unknown")}**](${repo.html_url || ""})${desc} | ⭐ ${formatStars(repo.stargazers_count || 0)} | ${escapeMarkdown(lang)} | ${starredAt} |`
    );
  });

  lines.push("");

  // Footer
  lines.push("---");
  lines.push("");
  lines.push(
    `*Exported on ${exportDate} · ${repos.length} repositories · Powered by [GitHub Star Export](https://mktime.org)*`
  );

  return lines.join("\n");
}

// ==================== Main ====================

async function main() {
  // 0. Check for proxy variables
  const proxyVars = detectProxyVars();
  if (proxyVars.length > 0) {
    console.warn("⚠️  Proxy environment variable(s) detected:");
    for (const v of proxyVars) {
      console.warn(`   ${v}`);
    }
    console.warn(
      "   These can cause Node.js fetch to hang if the proxy is unreachable.\n" +
      "   If the export fails, re-run after clearing them:\n" +
      "     env -u https_proxy -u http_proxy -u HTTPS_PROXY -u HTTP_PROXY node export.mjs\n"
    );
  }

  // 1. Check Token
  if (!GITHUB_TOKEN) {
    console.error(`
💡 GitHub Access Token Required

To export your starred repositories, a GitHub Personal Access Token (PAT) with
read access is needed. The token stays in your local environment and is never
sent to any third-party server.

Step 1: Create a Token

    Visit: https://github.com/settings/tokens

    Click "Generate new token (classic)".

    Scope: check public_repo (sufficient for public repos).

    Click "Generate token" and copy it.

Step 2: Set the Environment Variable

    export GITHUB_TOKEN="your_token_here"

    Or add the line above to ~/.bashrc / ~/.zshrc to persist it.

Once set, re-run this script.
`);
    process.exit(1);
  }

  // 2. Test connectivity
  const reachable = await testConnectivity();
  if (!reachable) {
    console.error(`
❌ Cannot reach GitHub API (https://api.github.com)

Possible causes:
  • No internet connection
  • Firewall or VPN blocking the connection
  • Proxy is configured but unreachable (check https_proxy / http_proxy env vars)
  • GitHub is blocked in your region
  • Node.js sandbox restricts outbound connections

Troubleshooting:
  • Verify connectivity with curl:
      curl -s -o /dev/null -w "%{http_code}" https://api.github.com
    (should return 200)
  • If curl works but Node.js doesn't, use the bash fallback script:
      bash skills/github-star-export/scripts/export.sh
`);
    process.exit(1);
  }

  // 3. Determine output path
  const timestamp = new Date().toISOString().split("T")[0];
  const outputFile = resolve(
    process.env.OUTPUT_FILE || `./github-starred-repos-${timestamp}.md`
  );

  // Ensure output directory exists
  const dir = dirname(outputFile);
  await mkdir(dir, { recursive: true });

  // 4. Fetch starred repos
  console.log("🔍 Fetching your GitHub starred repositories...\n");

  const maxRepos = MAX_REPOS || Infinity;

  let repos;
  try {
    repos = await fetchStarredRepos({
      maxRepos,
      onProgress: ({ fetched, page, hasMore }) => {
        process.stdout.write(
          `\r   📥 Fetched: ${fetched} repos (page ${page})${hasMore ? " ..." : ""}`
        );
      },
    });
    console.log(""); // newline after progress
  } catch (err) {
    console.error(`\n❌ Fetch failed: ${err.message}`);
    console.error(
      `\n💡 Tip: If this is a network error, try the bash fallback script:\n` +
      `   bash skills/github-star-export/scripts/export.sh`
    );
    process.exit(1);
  }

  if (repos.length === 0) {
    console.log("😕 Your GitHub account hasn't starred any repos yet.");
    console.log(
      "   Browse https://github.com and star some interesting projects!"
    );
    process.exit(0);
  }

  // 5. Generate Markdown
  console.log(`\n📝 Generating Markdown (${repos.length} repos)...`);
  const markdown = generateMarkdown(repos);

  // 6. Write file
  await writeFile(outputFile, markdown, "utf-8");
  const fileSizeKB = (Buffer.byteLength(markdown, "utf-8") / 1024).toFixed(1);

  console.log(`\n✅ Export complete!`);
  console.log(`   📄 File: ${outputFile}`);
  console.log(`   📦 Repos: ${repos.length}`);
  console.log(`   📏 File size: ${fileSizeKB} KB`);
  console.log("");
  console.log("💡 Want even more powerful features?");
  console.log("");
  console.log(
    "   🤖 AI Smart Categorization — auto-sort repos into 21 tech categories"
  );
  console.log(
    "   🏷️  AI Tag Generation — generate precise tech stack labels for each repo"
  );
  console.log(
    "   📝 AI One-Line Summary — bilingual (Chinese + English) summaries at a glance"
  );
  console.log(
    "   🔄 Automatic Daily Sync — backup new stars daily without lifting a finger"
  );
  console.log(
    "   📊 Weekly Email Report — discover what you starred this week"
  );
  console.log(
    "   🌐 Beautiful Web Dashboard — Bauhaus-style UI with search, filter, and browse"
  );
  console.log("");
  console.log("   👉 Visit https://mktime.org for the full experience!");
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});

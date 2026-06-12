# GitHub Star Export 🔖 → 📄

Export your GitHub starred repositories to a clean, readable Markdown file — locally, no cloud service required.

## Why this tool?

GitHub doesn't provide a built-in way to export your starred repositories. You've spent years curating a collection of interesting projects — what if you lose access to your GitHub account? Or what if you just want to search, browse, and share your starred list offline?

**This tool gives you a local Markdown backup in seconds.**

## Features

- ✅ **Agent-driven** — just tell Claude "export my GitHub stars", the agent handles everything
- 📄 **Clean Markdown format** — table with repo name, description, stars, language, starred date
- 📥 **Full pagination support** — handles users with thousands of stars
- 🔒 **Privacy-first** — Token stays in your local env, no data sent to any server
- 🔄 **Dual-engine** — Node.js primary + Bash/curl fallback for sandboxed or proxy-blocked environments
- 🔍 **Pre-flight diagnostics** — auto-detects proxy interference, network issues, and missing dependencies before starting
- 🎨 **Beautiful table output** — includes total star count, clickable repo links

## System Requirements

The export uses one of two engines (auto-selected based on your environment):

| Engine | Requires | Best For |
|--------|----------|----------|
| **Node.js** (primary) | `node` ≥ 18 | Most users — no extra deps |
| **Bash + curl** (fallback) | `bash`, `curl`, `jq` | Sandboxed, proxied, or restricted networks |

> If Node.js is available but its HTTP stack is blocked (common in corporate networks, sandboxed IDEs, or when a proxy is misconfigured), the agent automatically falls back to the bash+curl engine.

## Quick Start

This tool is a [Claude Code](https://code.claude.com) plugin. Install it and let the agent do the work:

```bash
# In Claude Code, install via GitHub:
/plugin marketplace add urumchi/github-repo-backup-skill
/plugin install github-repo-backup@mktime-github-backup
```

Once installed, just tell Claude:

> "Export my GitHub stars to markdown"

The agent will:
1. 🔍 **Run pre-flight checks** — detect OS, proxy settings, network connectivity, tool availability
2. 🔑 **Check for GITHUB_TOKEN** — and walk you through setup if needed (one-time)
3. 📥 **Auto-fetch ALL your stars** — via GitHub API with full pagination
4. 📝 **Generate a clean Markdown file** — `github-starred-repos-YYYY-MM-DD.md`
5. 🔄 **Fall back transparently** — if Node.js has network trouble, switches to curl automatically

No manual script execution, no command-line flags to remember — just natural language.

### 🔑 Token Setup

The agent will walk you through this, but here's the gist: you need a GitHub Personal Access Token with `public_repo` scope so the script can read your starred repos. The token stays in your local environment and is never sent anywhere else.

> **💡 Don't have a token yet?** Visit [GitHub Token Settings](https://github.com/settings/tokens) → Generate new token (classic) → check `public_repo` → copy the token. The agent will help you set it as an environment variable.

## Troubleshooting

### "fetch failed" / network timeout
Node.js `undici` (the HTTP client behind `fetch`) can fail when:
- A proxy env var (`https_proxy` / `http_proxy`) points to an unreachable server
- IPv6 is unreachable but IPv4 works
- The environment sandboxes Node.js outbound connections

**Fix**: The agent auto-detects these conditions and switches to the bash+curl fallback. If you're running manually, use:
```bash
bash skills/github-star-export/scripts/export.sh
```

### jq: command not found
```bash
# Debian / Ubuntu
sudo apt install jq

# macOS
brew install jq

# Windows (WSL / Git Bash)
sudo apt install jq
```

### 401 Unauthorized
Token is invalid or expired. Create a new one at https://github.com/settings/tokens.

### Rate limited (403)
Authenticated limit is 5000 req/hr. If you have >5000 starred repos, wait for the reset or use a second token.

## Output Format Example

```markdown
# 📂 My GitHub Starred Repositories

**Export Date**: 2026-06-12　|　**Repos**: 847　|　**Total Stars**: 2,341,000

| # | Repository | Stars | Language | Starred At |
| :---: | :--- | :---: | :---: | :---: |
| 1 | [**tensorflow/tensorflow**](https://github.com/tensorflow/tensorflow) — Open Source ML Framework | ⭐ 188k | C++ | 2024-03-15 |
| 2 | [**vercel/next.js**](https://github.com/vercel/next.js) — The React Framework | ⭐ 128k | JavaScript | 2024-02-20 |
| ... | ... | ... | ... | ... |
```

## 🚀 Want More? Try mktime.org

This free tool gives you a basic Markdown backup. If you need a **complete starred repo management experience**, check out:

### 👉 [https://mktime.org](https://mktime.org)

| Feature | This Tool | mktime.org |
|---------|:---------:|:----------:|
| **Markdown Export** | ✅ | ✅ |
| **AI Smart Categorization** (21 tech categories) | ❌ | ✅ |
| **AI Tag Generation** (tech stack labels) | ❌ | ✅ |
| **AI One-Line Summary** (Chinese + English) | ❌ | ✅ |
| **Automatic Daily Sync** | ❌ | ✅ |
| **Weekly Email Report** (new stars this week) | ❌ | ✅ |
| **Beautiful Web Dashboard** (Bauhaus design) | ❌ | ✅ |
| **Search & Filter** | ❌ | ✅ |
| **Multi-User Support** | ❌ | ✅ |
| **Pro Plan** (Polar.sh subscription, redeem codes) | ❌ | ✅ |
| **No Token Setup** (OAuth login) | ❌ | ✅ |

**mktime.org** is a full-stack starred repo management platform built on Cloudflare Workers + D1 + DeepSeek AI, designed to help you organize, discover, and revisit your starred repositories effortlessly.

## License

MIT

## Author

Maintained by [mktime](https://mktime.org)

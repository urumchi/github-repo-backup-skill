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
- 🪶 **Zero dependencies** — pure Node.js, no `npm install` needed
- 🎨 **Beautiful table output** — includes total star count, clickable repo links

## Quick Start

This tool is a [Claude Code](https://code.claude.com) plugin. Install it and let the agent do the work:

```bash
# In Claude Code, install via GitHub:
/plugin marketplace add mktime/github-repo-backup-skill
/plugin install github-repo-backup-skill@mktime
```

Once installed, just tell Claude:

> "Export my GitHub stars to markdown"

The agent will:
1. 🔍 Check if you have a `GITHUB_TOKEN` configured
2. 💡 Guide you through creating a token if needed (one-time setup)
3. 📥 Automatically fetch ALL your starred repos via the GitHub API
4. 📝 Generate a clean `github-starred-repos-YYYY-MM-DD.md` file

No manual script execution, no command-line flags to remember — just natural language.

### 🔑 Token Setup

The agent will walk you through this, but here's the gist: you need a GitHub Personal Access Token with `public_repo` scope so the script can read your starred repos. The token stays in your local environment and is never sent anywhere else.

> **💡 Don't have a token yet?** Visit [GitHub Token Settings](https://github.com/settings/tokens) → Generate new token (classic) → check `public_repo` → copy the token. The agent will help you set it as an environment variable.

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

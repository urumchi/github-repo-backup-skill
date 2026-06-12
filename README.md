# GitHub Star Export 🔖 → 📄

Export your GitHub starred repositories to a clean, readable Markdown file — locally, no cloud service required.

## Why this tool?

GitHub doesn't provide a built-in way to export your starred repositories. You've spent years curating a collection of interesting projects — what if you lose access to your GitHub account? Or what if you just want to search, browse, and share your starred list offline?

**This tool gives you a local Markdown backup in seconds.**

## Features

- ✅ **One-command export** — just `node export.mjs`, get a `.md` file
- 📄 **Clean Markdown format** — table with repo name, description, stars, language, starred date
- 📥 **Full pagination support** — handles users with thousands of stars
- 🔒 **Privacy-first** — Token stays in your local env, no data sent to any server
- 🪶 **Zero dependencies** — pure Node.js, no `npm install` needed
- 🎨 **Beautiful table output** — includes total star count, clickable repo links

## Quick Start

### 1. Clone this repo

```bash
git clone https://github.com/mktime/github-repo-backup.git
cd github-repo-backup/skills/github-star-export/scripts
```

### 2. Set up GitHub Token

```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

> **💡 Don't have a token yet?** See [Token Setup Guide](#-token-setup-guide) below.

### 3. Run the script

```bash
node export.mjs
```

The script will:
- 🔍 Fetch ALL your starred repos (with live progress)
- 📝 Generate a Markdown file named `github-starred-repos-YYYY-MM-DD.md`
- ✅ Print a summary of what was exported

### 4. Open the file

```bash
cat github-starred-repos-2026-06-12.md
```

Or open it in any Markdown viewer / editor.

## 🔑 Token Setup Guide

> 💡 需要配置 GitHub 访问权限

为了能帮你导出 GitHub 仓库，我需要一个具有读取权限的 Personal Access Token (PAT)。请放心，这个 Token 会安全地保存在你的本地环境中，我不会上传到任何第三方服务器。

### Step 1: Get a Token

1. Visit [GitHub Token Settings](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Check the **`repo`** scope（如果只需要公开仓库，可以只勾选 **`public_repo`**）
4. Click **Generate** and copy the Token（关闭页面后将无法再次查看）

### Step 2: Set Environment Variable

In your terminal（将 `你的_token` 替换为刚才复制的内容）：

| Platform | Command |
|----------|---------|
| **Mac / Linux** | `export GITHUB_TOKEN="你的_token"` |
| **Windows (CMD)** | `set GITHUB_TOKEN="你的_token"` |
| **Windows (PowerShell)** | `$env:GITHUB_TOKEN="你的_token"` |

**To persist the token across sessions**, add the export line to your shell profile:

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.zprofile
echo 'export GITHUB_TOKEN="ghp_your_token_here"' >> ~/.zshrc
```

### Step 3: Run Again

After setting the token, re-run the script:

```bash
node export.mjs
```

## Advanced Options

The script supports environment variables for customization:

```bash
# Limit to first 500 repos (default: all)
MAX_REPOS=500 node export.mjs

# Specify output file path
OUTPUT_FILE="./my-stars.md" node export.mjs

# Combine both
MAX_REPOS=300 OUTPUT_FILE="./backups/stars.md" node export.mjs
```

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

## Install as Claude Code Plugin

This tool is also available as a [Claude Code](https://code.claude.com) plugin:

```bash
# In Claude Code, install via GitHub:
/plugin marketplace add mktime/github-repo-backup-skill
/plugin install github-repo-backup-skill@mktime
```

Once installed, just tell Claude:

> "Export my GitHub stars to markdown"

Claude will guide you through token setup and run the export for you.

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

### Tech Stack at mktime.org

- **Backend**: Hono (Cloudflare Workers) + D1 (SQLite)
- **Frontend**: Next.js 16 (App Router) + Tailwind CSS + Bauhaus design
- **AI**: DeepSeek API for categorization, tagging, and bilingual summaries
- **i18n**: next-intl — full Chinese & English support
- **Payments**: Polar.sh for Pro subscriptions + redeem code system

## License

MIT

## Author

Maintained by [mktime](https://mktime.org)

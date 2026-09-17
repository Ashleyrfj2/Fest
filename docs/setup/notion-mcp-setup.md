# Connecting Notion to Claude Code via MCP

This guide lets Claude Code access your FestNest Notion workspace directly — so it can pull live specs, update pages, and stay in sync without you manually copying content.

## What This Gives You

- Claude Code can **read** any FestNest Notion page (specs, data model, feature ideas)
- Claude Code can **search** your workspace for specific content
- Claude Code can **create and update** pages (e.g. add new feature ideas, update status)
- No manual copy-paste between Notion and your codebase

## Setup Steps

### 1. Get your Notion integration token

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it something like "Claude Code - FestNest"
4. Select your workspace
5. Under Capabilities, enable: Read content, Update content, Insert content
6. Click Submit → copy the **Internal Integration Secret** (starts with `ntn_`)

### 2. Share your FestNest pages with the integration

1. Open your FestNest hub page: https://www.notion.so/322349e899af812c8776d5cd5aa72ed8
2. Click the `...` menu (top right) → "Connections" → find your integration → "Connect"
3. When prompted, select "Include all sub-pages" — this shares the entire project tree

### 3. Add the Notion MCP server to Claude Code

Open your Claude Code settings file. The location depends on your setup:

**Global settings** (applies to all projects):
```
~/.claude/settings.json
```

**Project settings** (FestNest only):
```
/path/to/festnest/.claude/settings.json
```

Add the Notion MCP server configuration:

```json
{
  "mcpServers": {
    "notion": {
      "type": "url",
      "url": "https://mcp.notion.com/mcp",
      "headers": {
        "Authorization": "Bearer ntn_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Replace `ntn_YOUR_TOKEN_HERE` with your actual integration token from step 1.

**Important:** If using project-level settings, add `.claude/settings.json` to your `.gitignore` to avoid committing your token.

### 4. Verify it works

Start a new Claude Code session and try:

```
Can you read my FestNest project hub from Notion?
```

Claude Code should be able to fetch the page and show you the content.

## Key Notion Page IDs

These are the pages Claude Code can access:

| Page | ID |
|---|---|
| Project Hub | `322349e899af812c8776d5cd5aa72ed8` |
| Design Specification | `322349e899af81548654d43906f7da6f` |
| Data Model | `322349e899af818fa1cce2d61f856d5a` |
| Onboarding Flow | `322349e899af813a8628e67f11000174` |
| Feature Ideas | `322349e899af81279ff7dcf6c570c3c8` |
| UI Ideas | `322349e899af816e91f6d89d5244c004` |
| Claude Context | `322349e899af819fb35dce1fce187ac1` |

## When to Use Notion vs Local Docs

- **Use local docs (@docs/)** for: stable specs that rarely change, build commands, coding conventions — things Claude Code needs every session
- **Use Notion (via MCP)** for: feature ideas that evolve, open questions, session notes, status updates — things that change between sessions and benefit from the latest version

The CLAUDE.md file references both, so Claude Code knows where to look for what.

## Alternative: Notion API Key as Environment Variable

If you prefer not to store the token in a config file:

```bash
export NOTION_TOKEN="ntn_YOUR_TOKEN_HERE"
```

Then reference it in your MCP config:

```json
{
  "mcpServers": {
    "notion": {
      "type": "url",
      "url": "https://mcp.notion.com/mcp",
      "headers": {
        "Authorization": "Bearer ${NOTION_TOKEN}"
      }
    }
  }
}
```

Note: Environment variable substitution support depends on your Claude Code version.

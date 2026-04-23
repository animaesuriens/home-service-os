<!-- GSD:project-start source:PROJECT.md -->
## Project

**LinkedIn Automation Portfolio**

A content generation project that transforms real Prismatic integration YAML exports from a home service company's operational pipeline into a series of self-contained LinkedIn posts. Each post showcases a specific automation process as if it were built exclusively in Make, Zapier, or n8n — creating a digital portfolio that demonstrates automation expertise to both potential clients and fellow builders.

**Core Value:** Every post must be a standalone, compelling showcase of a real automation process that makes the reader think "I need something like this" or "this person really knows automation."

### Constraints

- **Tool genericization**: Only Make/Zapier/n8n/HubSpot/Airtable named explicitly — everything else gets generic labels
- **Self-contained posts**: Zero cross-references between posts
- **Platform versions**: Same narrative structure, swap the automation tool — not unique angles per platform
- **Diagram generation**: Bespoke HTML/CSS rendered via Playwright to 1080×1350 PNG. Platform-themed (Make cream/pink, Zapier cream/orange, n8n dark/mint-green).
- **Sub-project isolation**: All artifacts live in `linkedin-posts/` folder
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

### Runtime & Core

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | Runtime (CommonJS) |
| yaml | ^2.8.3 | Parse Prismatic YAML flow exports |
| fs-extra | ^11.x | File ops with promises + recursive helpers |

### Content Generation (AI)

| Technology | Version | Purpose |
|---|---|---|
| @anthropic-ai/sdk | ^0.88 | Claude API client; `tool_use` for structured JSON output |
| dotenv | ^17.x | Load `ANTHROPIC_API_KEY` from `linkedin-posts/_pipeline/.env` |

Two Claude-powered stages:
- `lib/storybeat-generator.js` — one call per bundle → `data/storybeats.json` (14 entries)
- `lib/post-generator.js` — one call per bundle returns all 3 platform posts (`generateBundlePosts`) via tool_use schema; voice stays consistent across Make/Zapier/n8n by construction. Per-platform `generatePost` is used for targeted single-post regens.

Both generators share a hardened anti-hallucination prompt with explicit FORBIDDEN INVENTIONS list + retry-and-steer loops that reject outputs containing forbidden terms and re-prompt with targeted corrections.

### Diagram Rendering

| Technology | Version | Purpose |
|---|---|---|
| playwright | ^1.59 | Headless Chromium for HTML → PNG screenshot |

`lib/diagram-renderer.js` generates HTML/CSS inline (Fraunces serif display + Inter body via Google Fonts), compiles it with platform-specific theme tokens, and screenshots to 1080×1350 @2× DPR. `PLATFORM_THEMES` carries full per-platform palettes:
- **make** — cream mode, pink accent (#E13FA3), dark-purple trigger gradient
- **zapier** — cream mode, orange accent (#FF4A00), warm-brown trigger gradient
- **n8n** — dark mode, mint-green accent (#14E098), subtle dot grid, dark-green trigger gradient

Mermaid was evaluated early and rejected for aesthetic reasons — the default Mermaid render is the visual signature of AI-generated LinkedIn flowcharts and doesn't sell. The bespoke HTML/CSS path is the only renderer in the production pipeline.

### Data Pipeline

The process-grouper (`lib/process-grouper.js`) assigns unique IDs via an explicit `SYSTEM_TOKENS` map (`acct`, `mktg`, `sales`, `prod`, `comm`, `jobs`, `time`, `report`) — throws on unknown source YAMLs. `bundle-curator.js` throws on duplicate process IDs or unresolved bundle references. These guards are load-bearing; they prevent the silent ID-collision bug that poisoned every downstream artifact in the pre-15-04 state.

### Pipeline Orchestration

```
npm run pipeline
  = stage1:bundles          # data/bundles.json  (clean, data-layer guards)
  → stage2:storybeats       # 14 Claude calls → data/storybeats.json
  → stage2:posts            # 14 Claude calls → posts/<slug>/*.md (42 files)
  → stage3:diagrams         # 42 Playwright renders → posts/<slug>/*.png (42 files)
```

Single call per bundle for posts (returns all 3 platform variants together) means 28 total Claude calls per full pipeline run, not 56.

### LinkedIn Post Constraints

- Max 2,800 chars per post (3,000 LinkedIn limit, leave buffer)
- First line under 215 chars (mobile preview cutoff)
- No markdown syntax — LinkedIn doesn't render it, asterisks display literal
- BAB framework implicit (never write `BEFORE:` / `AFTER:` / `BRIDGE:` labels)
- 3 hashtags: `#Automation`, one journey-stage tag, `#Make` | `#Zapier` | `#n8n`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

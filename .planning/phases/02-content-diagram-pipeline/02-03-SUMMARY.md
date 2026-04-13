---
phase: 02-content-diagram-pipeline
plan: 03
subsystem: content-generation
tags: [anthropic-sdk, playwright, mermaid, diagram-generation, post-generation]

# Dependency graph
requires:
  - phase: 02-content-diagram-pipeline
    plan: 01
    provides: "bundles.json with 12 curated bundles"
  - phase: 02-content-diagram-pipeline
    plan: 02
    provides: "Playwright rendering infrastructure"
provides:
  - "36 LinkedIn posts (12 bundles x 3 platforms) as markdown files"
  - "36 platform-themed PNG diagrams via Mermaid + Playwright"
  - "generate-mmd.js script for .mmd file generation from bundles.json"
  - "render-diagrams.js script for batch PNG rendering"
  - "3 Mermaid theme configs (make.json, zapier.json, n8n.json)"
affects: [03-organization-index]

# Tech tracking
tech-stack:
  added: []
  removed: ["elkjs"]
  patterns: ["Mermaid flowchart DSL with Playwright rendering", "Platform-specific diagram styles (branching vs linear)", "Per-bundle decision config for curated branch labels"]

key-files:
  created:
    - linkedin-posts/scripts/generate-mmd.js
    - linkedin-posts/scripts/render-diagrams.js
    - linkedin-posts/mermaid/configs/make.json
    - linkedin-posts/mermaid/configs/zapier.json
    - linkedin-posts/mermaid/configs/n8n.json
    - linkedin-posts/mermaid/diagrams/*.mmd (36 files)
    - linkedin-posts/posts/*/make.png (12 files)
    - linkedin-posts/posts/*/zapier.png (12 files)
    - linkedin-posts/posts/*/n8n.png (12 files)
  deleted:
    - linkedin-posts/lib/diagram-renderer.js
    - linkedin-posts/lib/elk-layout.js
    - linkedin-posts/scripts/generate-diagrams.js
    - linkedin-posts/scripts/test-elk-poc.js
    - linkedin-posts/templates/diagram.html
    - linkedin-posts/templates/elk-diagram.html
  modified:
    - linkedin-posts/package.json
---

# Plan 03 Summary: Content & Diagram Generation

## What Was Done

### Task 1: Post Generation (completed in prior session)
- Created `post-generator.js` with Claude API integration and BAB framework system prompt
- Created `generate-posts.js` Stage 2 script
- Generated 36 LinkedIn posts (12 bundles x 3 platforms) via Claude Sonnet API
- All posts validated: 300-500 words, correct tool naming, 3 hashtags, BAB structure

### Task 2: Diagram Generation (pivoted approach)
**Original plan:** Use `diagram-renderer.js` with custom HTML templates and Playwright
**What happened:** Initial Playwright/HTML approach produced diagrams but lacked visual polish. ELK.js layout engine was explored as an alternative (quick-01) but added complexity. Pivoted to **Mermaid flowchart DSL** rendered via Playwright for simpler authoring and better maintainability.

**Final pipeline:**
1. `generate-mmd.js` reads `bundles.json` and produces 36 `.mmd` files with platform-specific styles:
   - **Make**: Circle triggers, diamond decision nodes, branching flows, purple theme
   - **Zapier**: All rectangles, flat linear chains, orange theme
   - **n8n**: Rectangle triggers, diamond decisions, branching flows, green theme
2. `render-diagrams.js` loads Mermaid CDN in Playwright, applies theme configs, renders at 2x retina scale (1080x1350px)
3. Per-bundle decision configs provide curated branch labels for narrative clarity

### Task 3: Quality Verification
- Visual inspection confirmed all 36 PNGs render correctly
- Fixed Mermaid syntax error (unescaped quotes in contract-lifecycle)
- Fixed empty merge nodes for short bundles (reporting-sync)
- Fixed duplicate labels between regular nodes and decision diamonds
- All 12 bundles x 3 platforms verified visually

## Deliverables

| Artifact | Count | Location |
|----------|-------|----------|
| Markdown posts | 36 | `linkedin-posts/posts/{slug}/{platform}.md` |
| PNG diagrams | 36 | `linkedin-posts/posts/{slug}/{platform}.png` |
| Mermaid definitions | 36 | `linkedin-posts/mermaid/diagrams/{slug}-{platform}.mmd` |
| Theme configs | 3 | `linkedin-posts/mermaid/configs/{platform}.json` |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Pivot from HTML templates to Mermaid | Simpler DSL, easier to maintain, native theming via config files |
| Remove ELK.js dependency | Added complexity without proportional visual improvement |
| Per-bundle decision configs | Generic "Yes/No" branches looked artificial; curated labels improve narrative |
| 3-line label wrapping | Prevents truncation of longer step descriptions |

## Verification

- 36/36 posts generated and validated
- 36/36 PNGs rendered without errors
- Each bundle directory contains 6 files (3 .md + 3 .png)
- Platform themes visually confirmed (purple/orange/green)

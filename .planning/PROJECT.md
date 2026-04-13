# LinkedIn Automation Portfolio

## What This Is

A content generation project that transformed 8 real Prismatic integration YAML exports from a home service company's operational pipeline into 36 self-contained LinkedIn posts (12 bundles x 3 platform versions). Each post showcases a specific automation process as if built exclusively in Make, Zapier, or n8n, with matching platform-themed flowchart diagrams. The complete portfolio is organized in `linkedin-posts/` with a navigable README.

## Core Value

Every post must be a standalone, compelling showcase of a real automation process that makes the reader think "I need something like this" or "this person really knows automation."

## Requirements

### Validated

- Process mapping: Parse 8 YAML files, trace cross-file connections, group sub-flows, filter infrastructure, order by journey -- v1.0
- Content generation: 36 posts with BAB framework, 300-500 words, casual expert tone, self-contained, tool genericization -- v1.0
- Diagram generation: 36 platform-themed PNGs (purple/orange/green) at 1080x1350px via Mermaid + Playwright -- v1.0
- Output organization: Numbered directories, slug-prefixed files, README with inline previews -- v1.0

### Active

(No active requirements -- start next milestone with `/gsd-new-milestone`)

### Out of Scope

- Actual LinkedIn posting/scheduling -- manual posting by user
- Video content -- posts only with static flowchart diagrams
- Posts about infrastructure flows (webhook registration, connection setup, instance deployment)
- Posts that reference each other or form a "series"
- Mentioning Prismatic, PaintScout, CompanyCam, YouCanBook.Me, RingCentral, QuickBooks Time by name
- Mobile app or web UI -- content is markdown files + PNG images
- Real-time sync with YAML changes -- one-time generation from current YAML state

## Context

Shipped v1.0 with 25,558 LOC across 147 files in 2 days.
Tech stack: Node.js, yaml, Handlebars-style templates, Mermaid flowcharts, Playwright PNG rendering, Claude API (Sonnet) for post generation.

**Deliverables:**
- 12 post bundles x 6 files each = 72 portfolio files
- 8 pipeline scripts + 9 library modules in `linkedin-posts/_pipeline/`
- Portfolio README with inline diagram previews at `linkedin-posts/README.md`

**Known blindspots:** Posts are generated but not manually reviewed for quality. Diagram visual quality is programmatically verified but not human-audited.

## Constraints

- **Tool genericization**: Only Make/Zapier/n8n/HubSpot/Airtable named explicitly -- everything else gets generic labels
- **Self-contained posts**: Zero cross-references between posts
- **Platform versions**: Same narrative structure, swap the automation tool -- not unique angles per platform
- **Diagram generation**: Mermaid flowchart DSL rendered via Playwright for PNG output
- **Sub-project isolation**: All artifacts live in `linkedin-posts/` folder

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One post per logical process (group sub-flows) | More insightful than granular sub-flow posts | Good -- 12 bundles from 76 processes |
| Platform-themed diagrams (Make purple, Zapier orange, n8n green) | Visual brand association makes posts more recognizable | Good -- consistent visual identity |
| Fix inefficiencies in original pipeline for posts | Portfolio should show best work, not inherited tech debt | Good -- idealized steps in all bundles |
| Same story / swap tools (not unique angles per platform) | Consistency across versions, lower complexity | Good -- 36 posts in one batch |
| Internal process map (no user approval gate) | User trusts judgment, will flag issues during post review | Good -- 76 processes mapped without friction |
| Generic app names except HubSpot/Airtable | Broader appeal while keeping CRM/database specificity | Good -- substring matching handled all variants |
| Pipeline-ordered posts (lead to invoice) | Tells a coherent story of the full business operation | Good -- 12-stage journey order |
| Pivot from HTML templates to Mermaid for diagrams | Simpler DSL, easier to maintain, native theming via config | Good -- cleaner pipeline after removing ELK.js |
| 12 bundles (not 10) covering full journey | Communication Hub needed as cross-cutting catch-all | Good -- complete coverage |
| Claude API (Sonnet) for post generation | Consistent quality, BAB framework in system prompt | Good -- all 36 posts validated |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-04-13 after v1.0 milestone*

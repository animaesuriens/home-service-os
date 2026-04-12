# LinkedIn Automation Portfolio

## What This Is

A content generation project that transforms real Prismatic integration YAML exports from a home service company's operational pipeline into a series of self-contained LinkedIn posts. Each post showcases a specific automation process as if it were built exclusively in Make, Zapier, or n8n — creating a digital portfolio that demonstrates automation expertise to both potential clients and fellow builders.

## Core Value

Every post must be a standalone, compelling showcase of a real automation process that makes the reader think "I need something like this" or "this person really knows automation."

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Map all logical processes across 8 YAML files, tracing cross-file connections
- [ ] Generate 3 post versions per process (Make, Zapier, n8n) — same story, swap the tool
- [ ] Generate platform-themed flowchart diagrams (Make purple, Zapier orange, n8n green)
- [ ] Posts are 300-500 words, casual expert tone, self-contained
- [ ] Each post includes hashtags and mixed CTAs (engagement bait + soft sell)
- [ ] Explicitly name only: Make/Zapier/n8n, HubSpot, Airtable
- [ ] Genericize all other tools: "estimating tool", "photo storage", "appointment scheduler", "your calendar", "your email", "your spreadsheet"
- [ ] No mention of Prismatic anywhere
- [ ] Fix inefficiencies found in the original YAML — present idealized processes
- [ ] Skip infrastructure/setup flows (register, webhook management, etc.)
- [ ] Group sub-flows into logical parent processes (one post per logical process)
- [ ] Order posts following the customer journey: lead → estimate → sale → job → invoice
- [ ] Each post is fully self-contained — no references to other posts
- [ ] All output lives in `linkedin-posts/` sub-project folder
- [ ] Each process gets one `.md` file per platform version + one `.png` diagram per version
- [ ] Internal process map created for reference (not user-facing)

### Out of Scope

- Actual LinkedIn posting/scheduling — manual posting by user
- Video content — posts only with static flowchart diagrams
- Posts about infrastructure flows (webhook registration, connection setup, instance deployment)
- Posts that reference each other or form a "series"
- Mentioning Prismatic, PaintScout, CompanyCam, YouCanBook.Me, RingCentral, QuickBooks Time by name
- Reviewing/approving the process map — trust Claude's judgment, fix issues in post review

## Context

**Source material:** 8 Prismatic integration YAML export files that together form a complete home service company operational pipeline:

| YAML File | Domain | Key Integrations |
|-----------|--------|------------------|
| boolean-accounting-system | Invoicing, expenses, vendor payments | QuickBooks Online ↔ Airtable |
| boolean-marketing-integration | Lead intake, follow-ups, appointments, booking links | HubSpot ↔ Airtable ↔ appointment scheduler |
| boolean-sales-integration | Estimating, deal sync, change orders, contracts | HubSpot ↔ estimating tool ↔ photo storage |
| daily-production-data | Daily crew production tracking | Airtable internal |
| gmail-and-ring-central-communicator | Email, SMS, calendar automation | Email ↔ SMS ↔ calendar |
| job-management-integration | Deal processing, contracts, eSignatures, contact sync | HubSpot ↔ Airtable |
| quick-books-time-tracking-system | Time tracking sync | Time tracking app ↔ Airtable |
| sales-and-marketing-reporting | Deal reporting dashboard | HubSpot → spreadsheet |

**App naming rules:**
- Explicitly name: Make, Zapier, n8n, HubSpot, Airtable
- Generic names for: PaintScout → "estimating tool", CompanyCam → "photo storage", YouCanBook.Me → "appointment scheduler", RingCentral → "SMS platform", QuickBooks Time → "time tracking app", Google Calendar → "your calendar", Gmail → "your email", Google Sheets → "your spreadsheet", QuickBooks Online → "accounting software"

**Known blindspots:** HubSpot custom property configuration, Airtable field/view configuration details. Posts don't need to be highly specific — focus on the "what" and "why" rather than exact field names.

**Cross-file connections:** Integrations communicate via webhooks. Marketing integration calls the communicator for emails/texts. Sales integration triggers job management flows. Accounting reads from Airtable tables populated by other integrations. The process map must trace these connections.

## Constraints

- **Tool genericization**: Only Make/Zapier/n8n/HubSpot/Airtable named explicitly — everything else gets generic labels
- **Self-contained posts**: Zero cross-references between posts
- **Platform versions**: Same narrative structure, swap the automation tool — not unique angles per platform
- **Diagram generation**: Must use an automated tool (Playwright + HTML/Mermaid rendering) for flowchart images
- **Sub-project isolation**: All artifacts live in `linkedin-posts/` folder

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One post per logical process (group sub-flows) | More insightful than granular sub-flow posts | — Pending |
| Platform-themed diagrams (Make purple, Zapier orange, n8n green) | Visual brand association makes posts more recognizable | — Pending |
| Fix inefficiencies in original pipeline for posts | Portfolio should show best work, not inherited tech debt | — Pending |
| Same story / swap tools (not unique angles per platform) | Consistency across versions, lower complexity | — Pending |
| Internal process map (no user approval gate) | User trusts judgment, will flag issues during post review | — Pending |
| Generic app names except HubSpot/Airtable | Broader appeal while keeping CRM/database specificity | — Pending |
| Pipeline-ordered posts (lead → invoice) | Tells a coherent story of the full business operation | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after initialization*

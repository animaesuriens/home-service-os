# Requirements: LinkedIn Automation Portfolio

**Defined:** 2026-04-12
**Core Value:** Every post must be a standalone, compelling showcase of a real automation process that makes the reader think "I need something like this" or "this person really knows automation."

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Process Mapping

- [x] **PMAP-01**: System parses all 8 Prismatic YAML export files and extracts flow definitions with steps
- [x] **PMAP-02**: System traces cross-file webhook connections to identify how integrations link together
- [x] **PMAP-03**: System groups sub-flows into logical parent processes (one process per post)
- [x] **PMAP-04**: System filters out infrastructure/setup flows (register, webhook management, instance deploy)
- [x] **PMAP-05**: System orders processes following the customer journey (lead → estimate → sale → job → invoice)
- [x] **PMAP-06**: System produces an internal process map document for reference during content generation

### Content Generation

- [ ] **CONT-01**: Each post is 300-500 words with casual expert tone
- [ ] **CONT-02**: Each post uses Before-After-Bridge (BAB) storytelling framework with a clear problem hook in the first 210 characters
- [ ] **CONT-03**: Each process generates 3 platform versions (Make, Zapier, n8n) with same narrative, swapped tool references
- [ ] **CONT-04**: Posts explicitly name only Make/Zapier/n8n, HubSpot, and Airtable — all other tools use generic names (estimating tool, photo storage, appointment scheduler, your calendar, your email, your spreadsheet, accounting software, time tracking app, SMS platform)
- [ ] **CONT-05**: Each post is fully self-contained with no references to other posts
- [ ] **CONT-06**: Each post ends with a mixed CTA — engagement prompt + soft sell, varied across posts
- [ ] **CONT-07**: Each post includes 3-5 relevant hashtags at the end
- [ ] **CONT-08**: Posts present idealized processes — fix inefficiencies and design issues found in source YAML
- [ ] **CONT-09**: Posts frame processes as "home service company" (not painting-specific)

### Diagram Generation

- [ ] **DIAG-01**: Each post includes a platform-themed flowchart diagram (Make = purple, Zapier = orange, n8n = green)
- [ ] **DIAG-02**: Diagrams are 1080x1350px PNG format optimized for LinkedIn mobile viewing
- [ ] **DIAG-03**: Diagrams contain 8-10 steps maximum for readability on mobile
- [ ] **DIAG-04**: Multi-actor processes use swimlane layout showing who owns each step
- [ ] **DIAG-05**: Diagrams are generated programmatically (Mermaid + Playwright or equivalent)

### Output Organization

- [ ] **OUTP-01**: All artifacts live in `linkedin-posts/` sub-project folder
- [ ] **OUTP-02**: Each process has one `.md` file per platform version (3 markdown files per process)
- [ ] **OUTP-03**: Each process has one `.png` diagram per platform version (3 diagrams per process)
- [ ] **OUTP-04**: Files are named consistently with process order and platform identifier
- [ ] **OUTP-05**: A README or index file lists all posts in customer journey order

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Enhancement

- **CENH-01**: Quantified time/cost savings estimates in each post
- **CENH-02**: Educational "how-to" angle framing beyond showcase
- **CENH-03**: A/B test BAB vs PAS storytelling frameworks
- **CENH-04**: Platform-specific audience tuning (adjust technical depth per platform)

### Distribution

- **DIST-01**: LinkedIn posting schedule recommendations
- **DIST-02**: Hashtag performance tracking and optimization
- **DIST-03**: Engagement analytics dashboard

## Out of Scope

| Feature | Reason |
|---------|--------|
| Actual LinkedIn posting/scheduling | Manual posting by user; automation adds unnecessary complexity |
| Video content | Static flowcharts sufficient for portfolio; video is separate effort |
| Carousel/document posts | Research shows single image + text optimal for 300-500 word process showcases |
| Posts about infrastructure flows | Webhook registration, connection setup not insightful for audience |
| Series/cross-referenced posts | Algorithm penalizes; self-contained required |
| Naming Prismatic, PaintScout, CompanyCam, YouCanBook.Me, RingCentral, QuickBooks Time | Broader appeal with generic names |
| Mobile app or web UI | Content is markdown files + PNG images, consumed directly |
| Real-time sync with YAML changes | One-time generation from current YAML state |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PMAP-01 | Phase 1 | Complete |
| PMAP-02 | Phase 1 | Complete |
| PMAP-03 | Phase 1 | Complete |
| PMAP-04 | Phase 1 | Complete |
| PMAP-05 | Phase 1 | Complete |
| PMAP-06 | Phase 1 | Complete |
| CONT-01 | Phase 2 | Pending |
| CONT-02 | Phase 2 | Pending |
| CONT-03 | Phase 2 | Pending |
| CONT-04 | Phase 2 | Pending |
| CONT-05 | Phase 2 | Pending |
| CONT-06 | Phase 2 | Pending |
| CONT-07 | Phase 2 | Pending |
| CONT-08 | Phase 2 | Pending |
| CONT-09 | Phase 2 | Pending |
| DIAG-01 | Phase 2 | Pending |
| DIAG-02 | Phase 2 | Pending |
| DIAG-03 | Phase 2 | Pending |
| DIAG-04 | Phase 2 | Pending |
| DIAG-05 | Phase 2 | Pending |
| OUTP-01 | Phase 3 | Pending |
| OUTP-02 | Phase 3 | Pending |
| OUTP-03 | Phase 3 | Pending |
| OUTP-04 | Phase 3 | Pending |
| OUTP-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after roadmap creation*

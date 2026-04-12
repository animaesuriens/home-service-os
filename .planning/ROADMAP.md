# Roadmap: LinkedIn Automation Portfolio

**Project:** LinkedIn Automation Portfolio
**Created:** 2026-04-12
**Granularity:** Coarse (3-5 phases)
**Mode:** YOLO (auto-approve, ship fast)

## Purpose

This roadmap transforms 8 Prismatic YAML export files into a portfolio of LinkedIn posts. Each post showcases a real automation process as if built exclusively in Make, Zapier, or n8n — creating a digital portfolio that demonstrates automation expertise.

## Phases

- [ ] **Phase 1: Process Mapping** - Extract and organize logical processes from YAML files
- [ ] **Phase 2: Content & Diagram Pipeline** - Generate posts and platform-themed flowcharts
- [ ] **Phase 3: Organization & Index** - Structure output folder and create navigation

## Phase Details

### Phase 1: Process Mapping
**Goal**: Identify all logical automation processes across 8 YAML files that will become LinkedIn posts

**Depends on**: Nothing (first phase)

**Requirements**: PMAP-01, PMAP-02, PMAP-03, PMAP-04, PMAP-05, PMAP-06

**Success Criteria** (what must be TRUE):
1. All 8 YAML files are parsed and flow definitions with steps are extracted
2. Cross-file webhook connections are traced showing how integrations link together
3. Sub-flows are grouped into logical parent processes (one process per post)
4. Infrastructure/setup flows (register, webhook management, instance deploy) are filtered out
5. Processes are ordered following customer journey (lead → estimate → sale → job → invoice)
6. An internal process map document exists listing all identified processes with descriptions

**Plans:** 1/2 plans executed

Plans:
- [x] 01-01-PLAN.md — Parse all 8 YAML files, extract flow structures, filter infrastructure flows
- [ ] 01-02-PLAN.md — Trace connections, group processes, order by journey, generate PROCESS-MAP.md

### Phase 2: Content & Diagram Pipeline
**Goal**: Generate 3 platform versions of posts and diagrams for each identified process

**Depends on**: Phase 1

**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, CONT-09, DIAG-01, DIAG-02, DIAG-03, DIAG-04, DIAG-05

**Success Criteria** (what must be TRUE):
1. Each process has 3 markdown post versions (Make, Zapier, n8n) with 300-500 words and casual expert tone
2. Each post uses Before-After-Bridge framework with problem hook in first 210 characters
3. Posts explicitly name only Make/Zapier/n8n, HubSpot, Airtable and use generic names for all other tools
4. Each post is fully self-contained with no cross-references, ends with mixed CTA, includes 3-5 hashtags
5. Posts present idealized processes fixing inefficiencies from source YAML
6. Each process has 3 platform-themed PNG diagrams (Make purple, Zapier orange, n8n green) at 1080x1350px
7. Diagrams contain 8-10 steps maximum with swimlane layout for multi-actor processes
8. Diagrams are generated programmatically using automated tooling

**Plans**: TBD

**UI hint**: yes

### Phase 3: Organization & Index
**Goal**: All artifacts are properly organized in linkedin-posts/ folder with navigation

**Depends on**: Phase 2

**Requirements**: OUTP-01, OUTP-02, OUTP-03, OUTP-04, OUTP-05

**Success Criteria** (what must be TRUE):
1. All posts and diagrams live in linkedin-posts/ sub-project folder
2. Each process has 3 .md files (one per platform) and 3 .png diagrams (one per platform)
3. Files follow consistent naming convention with process order and platform identifier
4. A README or index file lists all posts in customer journey order with descriptions
5. Folder structure is navigable and self-documenting

**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Process Mapping | 1/2 | In Progress|  |
| 2. Content & Diagram Pipeline | 0/0 | Not started | - |
| 3. Organization & Index | 0/0 | Not started | - |

## Notes

**Phase ordering rationale:**
- Process mapping first: Can't write posts without understanding logical process boundaries from YAML
- Content & diagram together: Same process creates both artifacts, no value in separating
- Organization last: Clean-up phase once all content exists

**Coarse granularity applied:**
- Combined "template development" and "content generation" into one phase (no MVP testing cycle needed in YOLO mode)
- Skipped measurement/iteration phase (research-suggested but out of scope for content generation project)
- Merged output organization requirements into single delivery phase

**Coverage:**
- All 25 v1 requirements mapped
- 0 orphaned requirements
- 3 phases deliver complete portfolio

---
*Last updated: 2026-04-12 after Phase 1 planning*

# Roadmap: LinkedIn Automation Portfolio

## Milestones

- **v1.0 LinkedIn Automation Portfolio** -- Phases 1-3 (shipped 2026-04-13) | [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Per-YAML Accuracy Pass** -- Phases 4-13 (abandoned after Phase 5)
- **v2.0 Pipeline Rebuild from Split Sources** -- Phases 14-15 (current)

## Phases

<details>
<summary>v1.0 LinkedIn Automation Portfolio (Phases 1-3) -- SHIPPED 2026-04-13</summary>

- [x] Phase 1: Process Mapping (2/2 plans) -- completed 2026-04-12
- [x] Phase 2: Content & Diagram Pipeline (3/3 plans) -- completed 2026-04-13
- [x] Phase 3: Organization & Index (2/2 plans) -- completed 2026-04-13

</details>

<details>
<summary>v1.1 Per-YAML Accuracy Pass (Phases 4-13) -- ABANDONED 2026-04-14</summary>

- [x] Phase 4: Pipeline Enhancement (3/3 plans) -- completed 2026-04-14
- [ ] Phase 5: YAML 1 Accuracy Pass (1/2 plans) -- abandoned
- [ ] Phase 6: YAML 2 Accuracy Pass -- not started
- [ ] Phase 7: YAML 3 Accuracy Pass -- not started
- [ ] Phase 8: YAML 4 Accuracy Pass -- not started
- [ ] Phase 9: YAML 5 Accuracy Pass -- not started
- [ ] Phase 10: YAML 6 Accuracy Pass -- not started
- [ ] Phase 11: YAML 7 Accuracy Pass -- not started
- [ ] Phase 12: YAML 8 Accuracy Pass -- not started
- [ ] Phase 13: Portfolio Update -- not started

**Reason abandoned:** Per-YAML accuracy pass was circular (fixing AI hallucinations with more AI). Monolithic YAMLs too large to read accurately.

</details>

### v2.0 Pipeline Rebuild from Split Sources

- [x] **Phase 14: YAML Split & Pipeline Rebuild** - Split monolithic YAMLs into per-flow files and rebuild pipeline to derive data from clean source (completed 2026-04-14)
- [ ] **Phase 15: Full Content Rebuild & Verification** - Regenerate all posts and diagrams from rebuilt bundles and verify against split sources

## Phase Details

### Phase 14: YAML Split & Pipeline Rebuild
**Goal**: Pipeline reads from split per-flow files with deterministic IDs and clean bundle definitions

**Depends on**: Nothing (first phase of v2.0)

**Requirements**: SPLIT-01, SPLIT-02, PIPE-01, PIPE-02, PIPE-03, PIPE-04

**Success Criteria** (what must be TRUE):
1. Each of 8 monolithic YAMLs is split into per-flow files with one file per flow and a `_meta.yml` per integration
2. Split output is verifiably identical to monolithic parse (zero data loss confirmed)
3. Pipeline reads from split flow files and produces process data identical to monolithic source
4. Process IDs are deterministic based on source file + flow number (not index-based)
5. Bundle definitions contain zero AI-generated step data (idealizedSteps and verifiedSteps removed)

**Plans:** 3/3 plans complete

Plans:
- [x] 14-01-PLAN.md -- Split monolithic YAMLs into per-flow files with loadFromFlowDir() and verify zero data loss
- [x] 14-02-PLAN.md -- Deterministic process IDs, strip AI-generated steps, externalize DECISION_CONFIG
- [x] 14-03-PLAN.md -- Wire pipeline to read from split source and reconcile bundle processIds

### Phase 15: Full Content Rebuild & Verification
**Goal**: All posts and diagrams regenerated from clean source with verified output

**Depends on**: Phase 14

**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04

**Success Criteria** (what must be TRUE):
1. Pipeline produces bundles.json from split source files with steps derived from actual process data (not AI-generated)
2. All 42 posts regenerated from rebuilt bundles using Claude API
3. All 42 diagrams regenerated from rebuilt bundles with platform theming
4. Output verified against split flow files with zero hallucinated content

**Plans:** 1/3 plans executed

Plans:
- [x] 15-01-PLAN.md -- Derive real automation steps from process data and rebuild bundles.json
- [ ] 15-02-PLAN.md -- Regenerate all 42 posts and 42 diagrams from rebuilt bundles
- [ ] 15-03-PLAN.md -- Automated verification of output against source data (zero hallucinations)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Process Mapping | v1.0 | 2/2 | Complete | 2026-04-12 |
| 2. Content & Diagram Pipeline | v1.0 | 3/3 | Complete | 2026-04-13 |
| 3. Organization & Index | v1.0 | 2/2 | Complete | 2026-04-13 |
| 4. Pipeline Enhancement | v1.1 | 3/3 | Complete | 2026-04-14 |
| 5. YAML 1 Accuracy Pass | v1.1 | 1/2 | Abandoned | - |
| 14. YAML Split & Pipeline Rebuild | v2.0 | 3/3 | Complete    | 2026-04-14 |
| 15. Full Content Rebuild & Verification | v2.0 | 1/3 | In Progress|  |

---
*Last updated: 2026-04-14 for v2.0 Phase 15 planning*

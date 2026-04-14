# Roadmap: LinkedIn Automation Portfolio

## Milestones

- **v1.0 LinkedIn Automation Portfolio** -- Phases 1-3 (shipped 2026-04-13) | [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Per-YAML Accuracy Pass** -- Phases 4-13 (current)

## Phases

<details>
<summary>v1.0 LinkedIn Automation Portfolio (Phases 1-3) -- SHIPPED 2026-04-13</summary>

- [x] Phase 1: Process Mapping (2/2 plans) -- completed 2026-04-12
- [x] Phase 2: Content & Diagram Pipeline (3/3 plans) -- completed 2026-04-13
- [x] Phase 3: Organization & Index (2/2 plans) -- completed 2026-04-13

</details>

### v1.1 Per-YAML Accuracy Pass

- [ ] **Phase 4: Pipeline Enhancement** - Add per-YAML processing mode and audit tooling
- [ ] **Phase 5: YAML 1 Accuracy Pass** - boolean-marketing-integration-export.yml
- [ ] **Phase 6: YAML 2 Accuracy Pass** - boolean-sales-integration-export.yml
- [ ] **Phase 7: YAML 3 Accuracy Pass** - boolean-accounting-system-export.yml
- [ ] **Phase 8: YAML 4 Accuracy Pass** - job-management-integration-export.yml
- [ ] **Phase 9: YAML 5 Accuracy Pass** - daily-production-data-export.yml
- [ ] **Phase 10: YAML 6 Accuracy Pass** - quick-books-time-tracking-system-export.yml
- [ ] **Phase 11: YAML 7 Accuracy Pass** - gmail-and-ring-central-communicator-export.yml
- [ ] **Phase 12: YAML 8 Accuracy Pass** - sales-and-marketing-reporting-export.yml
- [ ] **Phase 13: Portfolio Update** - Regenerate portfolio README with updated content

## Phase Details

### Phase 4: Pipeline Enhancement
**Goal**: Pipeline can process YAMLs individually with audit logging and hallucination detection
**Depends on**: v1.0 Phase 3
**Requirements**: AUDIT-01 (partial - tooling only)
**Plans:** 3 plans
Plans:
- [x] 04-01-PLAN.md -- Per-YAML filtering (--yaml flag on pipeline scripts)
- [x] 04-02-PLAN.md -- Bundle externalization (BUNDLE_DEFINITIONS to JSON, type + verifiedSteps fields)
- [x] 04-03-PLAN.md -- Audit tooling (flow mapping, hallucination detection, JSON + Markdown reports)
**Success Criteria** (what must be TRUE):
  1. Pipeline accepts --yaml flag to process single file
  2. Pipeline logs flow-by-flow tracing for audit trails
  3. Pipeline can diff existing bundle definitions against YAML source
  4. Pipeline can detect missing processes in existing bundle coverage

### Phase 5: YAML 1 Accuracy Pass
**Goal**: boolean-marketing-integration-export.yml posts reflect actual workflows without hallucination
**Depends on**: Phase 4
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, BNDL-01, BNDL-02, BNDL-03, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. All flows in YAML 1 are traced and mapped to bundles
  2. Existing bundles (lead-capture-qualification, appointment-booking-scheduling) have hallucinations corrected
  3. New bundles created for any missed showcase-worthy processes
  4. All posts for YAML 1 bundles regenerated with accurate steps
  5. All diagrams for YAML 1 bundles reflect actual workflow from source
  6. User verifies all YAML 1 posts match source truth
**Plans**: TBD

### Phase 6: YAML 2 Accuracy Pass
**Goal**: boolean-sales-integration-export.yml posts reflect actual workflows without hallucination
**Depends on**: Phase 5
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, BNDL-01, BNDL-02, BNDL-03, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. All flows in YAML 2 are traced and mapped to bundles
  2. Existing bundles corrected for any hallucinations found
  3. New bundles created for any missed showcase-worthy processes
  4. All posts for YAML 2 bundles regenerated with accurate steps
  5. All diagrams for YAML 2 bundles reflect actual workflow from source
  6. User verifies all YAML 2 posts match source truth
**Plans**: TBD

### Phase 7: YAML 3 Accuracy Pass
**Goal**: boolean-accounting-system-export.yml posts reflect actual workflows without hallucination
**Depends on**: Phase 6
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, BNDL-01, BNDL-02, BNDL-03, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. All flows in YAML 3 are traced and mapped to bundles
  2. Existing bundles corrected for any hallucinations found
  3. New bundles created for any missed showcase-worthy processes
  4. All posts for YAML 3 bundles regenerated with accurate steps
  5. All diagrams for YAML 3 bundles reflect actual workflow from source
  6. User verifies all YAML 3 posts match source truth
**Plans**: TBD

### Phase 8: YAML 4 Accuracy Pass
**Goal**: job-management-integration-export.yml posts reflect actual workflows without hallucination
**Depends on**: Phase 7
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, BNDL-01, BNDL-02, BNDL-03, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. All flows in YAML 4 are traced and mapped to bundles
  2. Existing bundles corrected for any hallucinations found
  3. New bundles created for any missed showcase-worthy processes
  4. All posts for YAML 4 bundles regenerated with accurate steps
  5. All diagrams for YAML 4 bundles reflect actual workflow from source
  6. User verifies all YAML 4 posts match source truth
**Plans**: TBD

### Phase 9: YAML 5 Accuracy Pass
**Goal**: daily-production-data-export.yml posts reflect actual workflows without hallucination
**Depends on**: Phase 8
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, BNDL-01, BNDL-02, BNDL-03, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. All flows in YAML 5 are traced and mapped to bundles
  2. Existing bundles corrected for any hallucinations found
  3. New bundles created for any missed showcase-worthy processes
  4. All posts for YAML 5 bundles regenerated with accurate steps
  5. All diagrams for YAML 5 bundles reflect actual workflow from source
  6. User verifies all YAML 5 posts match source truth
**Plans**: TBD

### Phase 10: YAML 6 Accuracy Pass
**Goal**: quick-books-time-tracking-system-export.yml posts reflect actual workflows without hallucination
**Depends on**: Phase 9
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, BNDL-01, BNDL-02, BNDL-03, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. All flows in YAML 6 are traced and mapped to bundles
  2. Existing bundles corrected for any hallucinations found
  3. New bundles created for any missed showcase-worthy processes
  4. All posts for YAML 6 bundles regenerated with accurate steps
  5. All diagrams for YAML 6 bundles reflect actual workflow from source
  6. User verifies all YAML 6 posts match source truth
**Plans**: TBD

### Phase 11: YAML 7 Accuracy Pass
**Goal**: gmail-and-ring-central-communicator-export.yml posts reflect actual workflows without hallucination
**Depends on**: Phase 10
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, BNDL-01, BNDL-02, BNDL-03, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. All flows in YAML 7 are traced and mapped to bundles
  2. Existing bundles corrected for any hallucinations found
  3. New bundles created for any missed showcase-worthy processes
  4. All posts for YAML 7 bundles regenerated with accurate steps
  5. All diagrams for YAML 7 bundles reflect actual workflow from source
  6. User verifies all YAML 7 posts match source truth
**Plans**: TBD

### Phase 12: YAML 8 Accuracy Pass
**Goal**: sales-and-marketing-reporting-export.yml posts reflect actual workflows without hallucination
**Depends on**: Phase 11
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, BNDL-01, BNDL-02, BNDL-03, CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. All flows in YAML 8 are traced and mapped to bundles
  2. Existing bundles corrected for any hallucinations found
  3. New bundles created for any missed showcase-worthy processes
  4. All posts for YAML 8 bundles regenerated with accurate steps
  5. All diagrams for YAML 8 bundles reflect actual workflow from source
  6. User verifies all YAML 8 posts match source truth
**Plans**: TBD

### Phase 13: Portfolio Update
**Goal**: Portfolio README reflects all updated and new bundles from v1.1 accuracy pass
**Depends on**: Phase 12
**Requirements**: CONT-01 (partial - README regeneration only)
**Success Criteria** (what must be TRUE):
  1. Portfolio README regenerated with all current bundles
  2. README includes inline previews for all new bundles
  3. Bundle count and journey order updated
  4. All portfolio links functional and pointing to current files
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Process Mapping | v1.0 | 2/2 | Complete | 2026-04-12 |
| 2. Content & Diagram Pipeline | v1.0 | 3/3 | Complete | 2026-04-13 |
| 3. Organization & Index | v1.0 | 2/2 | Complete | 2026-04-13 |
| 4. Pipeline Enhancement | v1.1 | 0/3 | Planned | - |
| 5. YAML 1 Accuracy Pass | v1.1 | 0/0 | Not started | - |
| 6. YAML 2 Accuracy Pass | v1.1 | 0/0 | Not started | - |
| 7. YAML 3 Accuracy Pass | v1.1 | 0/0 | Not started | - |
| 8. YAML 4 Accuracy Pass | v1.1 | 0/0 | Not started | - |
| 9. YAML 5 Accuracy Pass | v1.1 | 0/0 | Not started | - |
| 10. YAML 6 Accuracy Pass | v1.1 | 0/0 | Not started | - |
| 11. YAML 7 Accuracy Pass | v1.1 | 0/0 | Not started | - |
| 12. YAML 8 Accuracy Pass | v1.1 | 0/0 | Not started | - |
| 13. Portfolio Update | v1.1 | 0/0 | Not started | - |

---
*Last updated: 2026-04-14 after Phase 4 planning*

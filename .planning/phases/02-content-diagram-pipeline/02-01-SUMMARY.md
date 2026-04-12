---
phase: 02-content-diagram-pipeline
plan: 01
subsystem: content-pipeline
tags: [node, anthropic-sdk, playwright, bundle-curation, processes-json]

# Dependency graph
requires:
  - phase: 01-process-mapping
    provides: "processes.json with 76 mapped processes"
provides:
  - "bundles.json with 12 curated business capability bundles"
  - "bundle-curator.js library with curateBundles() function"
  - "Stage 1 pipeline script (generate-bundles.js)"
  - "@anthropic-ai/sdk and playwright dependencies installed"
  - "3-stage npm pipeline scripts configured"
affects: [02-02, 02-03, 03-final-assembly]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk@0.88.0", "playwright@1.59.1"]
  patterns: ["3-stage npm pipeline (stage1:bundles, stage2:posts, stage3:diagrams)", "curated bundle definitions with hardcoded process-to-bundle mapping"]

key-files:
  created:
    - linkedin-posts/lib/bundle-curator.js
    - linkedin-posts/scripts/generate-bundles.js
    - linkedin-posts/data/bundles.json
  modified:
    - linkedin-posts/package.json

key-decisions:
  - "12 bundles covering full customer journey from Lead Capture through Communication Hub"
  - "Hardcoded BUNDLE_DEFINITIONS array for curated control over bundle composition"
  - "52 of 76 processes included in bundles (24 infrastructure/utility processes excluded)"
  - "Duplicate P-40/P-64 resolved by including only P-40 per D-04"

patterns-established:
  - "Bundle curator pattern: hardcoded definitions with runtime process lookups for dynamic data"
  - "Stage scripts pattern: npm run stage1:bundles as pipeline entry point"
  - "Bundle shape: id, title, journeyStage, journeySlug, processIds, constituentProcesses, idealizedSteps, pain, solution, layout"

requirements-completed: [CONT-08, DIAG-03]

# Metrics
duration: 6min
completed: 2026-04-12
---

# Phase 02 Plan 01: Bundle Curation & Dependencies Summary

**12 curated business capability bundles generated from 76 processes with Anthropic SDK and Playwright installed for the 3-stage content pipeline**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-12T16:59:16Z
- **Completed:** 2026-04-12T17:05:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed @anthropic-ai/sdk@0.88.0 and playwright@1.59.1 with Chromium browser binary
- Configured 5 new npm scripts including 3-stage pipeline and diagrams-only shortcut
- Created bundle-curator.js mapping 76 granular processes into 12 cohesive business capability bundles
- Generated bundles.json as single source of truth (per D-24) covering full customer journey

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and add npm pipeline scripts** - `5f78732` (chore)
2. **Task 2: Create bundle curator and generate bundles.json** - `faab405` (feat)

## Files Created/Modified
- `linkedin-posts/package.json` - Added @anthropic-ai/sdk, playwright deps; 5 new npm scripts
- `linkedin-posts/package-lock.json` - Lock file with new dependency tree
- `linkedin-posts/lib/bundle-curator.js` - Bundle curation logic with BUNDLE_DEFINITIONS and curateBundles()
- `linkedin-posts/scripts/generate-bundles.js` - Stage 1 pipeline entry point
- `linkedin-posts/data/bundles.json` - 12 curated bundles with idealized steps, pain/solution, layouts

## Decisions Made
- **12 bundles (not 10):** Full customer journey coverage required 12 distinct bundles including a Communication Hub for cross-cutting email/SMS/calendar processes
- **52/76 process coverage:** 24 processes excluded as infrastructure utilities (webhook registration, data converters, fetch helpers) that don't tell compelling LinkedIn stories
- **8 steps per bundle (6 for Reporting):** Consistent step counts within the 4-10 range, optimized for diagram readability on mobile
- **Hardcoded definitions:** Bundle composition is curated, not auto-generated, giving full editorial control per D-24
- **Communication Hub as catch-all:** Cherry-picked best uncategorized processes (Error Notification, Email Sender, Text Sender, SMS Logger, Estimate Calendar) into a cross-cutting communication bundle per D-03

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected process ID references from plan**
- **Found during:** Task 2 (bundle definition creation)
- **Issue:** Plan referenced process IDs by approximate sequence numbers from CONTEXT.md (e.g., "processes 25-28" for Production Tracking) which don't map to actual P-XX IDs. Actual IDs needed careful mapping from processes.json.
- **Fix:** Mapped each bundle to verified P-XX IDs from processes.json data. For example, Production Tracking uses P-49, P-50, P-51, P-52 (not "P-25 through P-28" which are Lead Capture/Appointment processes).
- **Files modified:** linkedin-posts/lib/bundle-curator.js
- **Verification:** All processIds in bundles.json resolve to existing processes in processes.json
- **Committed in:** faab405

**2. [Rule 1 - Bug] Corrected P-08 miscategorization noted in plan**
- **Found during:** Task 2 (Appointment Booking bundle)
- **Issue:** Plan correctly noted P-08 ("accounting software Bills") is miscategorized under Appointment Booking. Excluded from Appointment Booking bundle as instructed.
- **Fix:** Appointment Booking bundle uses P-27, P-31, P-28 only
- **Files modified:** linkedin-posts/lib/bundle-curator.js
- **Committed in:** faab405

---

**Total deviations:** 2 auto-fixed (2 bug corrections)
**Impact on plan:** Both fixes were necessary to produce correct bundle definitions from actual data. No scope creep.

## Issues Encountered
- Windows bash shell escapes `!` characters in node -e commands, preventing inline verification scripts. Resolved by writing temporary .js verification file instead.

## User Setup Required

None for this plan. Note: ANTHROPIC_API_KEY will be required for Plan 03 (content generation). See plan frontmatter user_setup section.

## Next Phase Readiness
- bundles.json is ready as input for Plan 02 (diagram template) and Plan 03 (post generation)
- All npm dependencies installed for the full pipeline
- Pipeline scripts configured: `npm run stage1:bundles` regenerates bundles.json from processes.json

## Self-Check: PASSED

- [x] linkedin-posts/lib/bundle-curator.js - FOUND
- [x] linkedin-posts/scripts/generate-bundles.js - FOUND
- [x] linkedin-posts/data/bundles.json - FOUND
- [x] linkedin-posts/package.json - FOUND
- [x] Commit 5f78732 - FOUND
- [x] Commit faab405 - FOUND

---
*Phase: 02-content-diagram-pipeline*
*Completed: 2026-04-12*

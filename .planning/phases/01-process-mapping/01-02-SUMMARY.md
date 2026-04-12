---
phase: 01-process-mapping
plan: 02
subsystem: linkedin-posts
tags:
  - webhook-tracing
  - process-grouping
  - journey-tagging
  - tool-genericization
dependency_graph:
  requires:
    - parsed-flows.json (from Plan 01-01)
  provides:
    - processes.json
    - PROCESS-MAP.md
  affects:
    - Phase 2 (content generation)
tech_stack:
  added: []
  patterns:
    - Multi-pass analysis pipeline
    - Cross-file webhook connection tracing (one level deep)
    - Sub-flow grouping with parent flows
    - Heuristic journey stage tagging
    - Tool name genericization via pattern matching
key_files:
  created:
    - linkedin-posts/lib/webhook-tracer.js
    - linkedin-posts/lib/process-grouper.js
    - linkedin-posts/lib/journey-tagger.js
    - linkedin-posts/lib/tool-genericizer.js
    - linkedin-posts/scripts/analyze-processes.js
    - linkedin-posts/scripts/generate-map.js
    - linkedin-posts/data/processes.json
    - linkedin-posts/PROCESS-MAP.md
  modified:
    - linkedin-posts/lib/tool-genericizer.js (bug fix during execution)
decisions:
  - Tool genericization uses substring matching to handle camelCase component keys (paintScoutApi)
  - 24 processes tagged as "Uncategorized" - mostly utility/support flows that may not warrant standalone posts
  - Journey tagging uses multi-signal heuristics: file name + process name + description + component keys
metrics:
  duration_minutes: 9
  completed_at: "2026-04-12T15:44:00Z"
  tasks_completed: 2
  files_created: 8
  commits: 2
---

# Phase 01 Plan 02: Process Analysis and Mapping Summary

**One-liner:** Analysis pipeline identifies 76 logical processes (52 categorized, 24 utility) with cross-file webhook tracing, journey stage ordering, and complete tool name genericization producing PROCESS-MAP.md for Phase 2.

## Objective Achieved

Created complete analysis pipeline that transforms parsed flow data into organized process map. Pipeline traces cross-file webhook connections one level deep, groups sub-flows with parents, tags processes with customer journey stages (Lead Capture through Reporting), genericizes all tool names per PROJECT.md rules, and generates final PROCESS-MAP.md document with summary table and detailed sections for each process.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create webhook tracer, process grouper, journey tagger, and tool genericizer libraries | 3ce08a1 | ✓ Complete |
| 2 | Create analysis pipeline and PROCESS-MAP.md generator | 52412e1 | ✓ Complete |

## Key Outputs

### `linkedin-posts/PROCESS-MAP.md`

The canonical Phase 1 deliverable - complete process map for Phase 2 content generation:

- **76 total processes** identified from 108 business flows
- **Journey stage distribution:** Lead Capture (3), Lead Qualification (1), Appointment Booking (4), Estimating (1), Sales/Proposal (11), Contract Management (3), Job Setup (1), Production Tracking (4), Time Tracking (7), Invoicing (8), Expense Management (7), Reporting (2), Uncategorized (24)
- **Summary table** with process name, journey stage, source files, step count, multi-file flag
- **Detailed sections** per process: description, key steps, apps involved, cross-file connections, inefficiencies

All tool names genericized:
- ✓ PaintScout → estimating tool
- ✓ CompanyCam → photo storage
- ✓ RingCentral → SMS platform
- ✓ QuickBooks Time → time tracking app
- ✓ Google Calendar → your calendar
- ✓ Gmail → your email
- ✓ Google Sheets → your spreadsheet
- ✓ QuickBooks Online → accounting software
- ✓ HubSpot, Airtable kept explicit

### `linkedin-posts/data/processes.json`

Intermediate data consumed by generate-map.js:

```json
{
  "generatedAt": "2026-04-12T15:43:54.862Z",
  "totalProcesses": 76,
  "journeyStages": {...},
  "crossFileConnections": [1 connection found],
  "processes": [array of 76 process objects]
}
```

Each process includes:
- id, name, journeyStage, sourceFiles
- parentFlow, subFlows, crossFileConnections
- totalStepCount, apps (genericized), isMultiFile
- description (genericized), keySteps (genericized), inefficiencies

### Library Modules

**webhook-tracer.js**
- `traceConnections(businessFlows, configVarsByFile)` - traces cross-file webhook connections one level deep
- `buildWebhookMap(configVarsByFile)` - maps webhook config var names to target files
- Found 1 cross-file connection: Error Notification Sender → gmail-and-ring-central-communicator via "Email Sender Webhook URL"

**process-grouper.js**
- `groupIntoProcesses(businessFlows, connections)` - groups sub-flows with parents and merges cross-file processes
- Groups 108 flows into 76 logical processes (25 sub-flows merged with parents, 7 flows grouped)

**journey-tagger.js**
- `tagAndOrder(processes)` - tags with 12 journey stages and orders by customer journey sequence
- Exports `JOURNEY_STAGES` constant (Lead Capture through Reporting)
- 52 processes categorized across 12 stages, 24 flagged as Uncategorized for review

**tool-genericizer.js**
- `genericizeTools(componentKeys)` - converts component keys to genericized display names
- `genericizeText(text)` - replaces tool names in text with generic equivalents
- Exports `TOOL_MAP` and `EXPLICIT_TOOLS` for inspection
- Uses substring matching to handle camelCase variants (paintScoutApi, companyCamApi)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed tool genericization to handle camelCase component keys**
- **Found during:** Task 2 verification (PaintScout still appearing in PROCESS-MAP.md)
- **Issue:** Component keys use camelCase (paintScoutApi, companyCamApi) but TOOL_MAP only had lowercase keys. Title-casing unknown tools preserved the original tool names.
- **Fix:** Updated genericizeTools() to use substring matching instead of exact key lookup. If keyLower includes any TOOL_MAP key, return the generic name. Also added camelCase variants to TOOL_MAP.
- **Files modified:** linkedin-posts/lib/tool-genericizer.js
- **Commit:** 52412e1 (included in Task 2 commit)
- **Impact:** All tool names now properly genericized in PROCESS-MAP.md (Apps Involved, process names, key steps, descriptions)

**2. [Rule 1 - Bug] Applied tool genericization to process names and key steps**
- **Found during:** Task 2 verification (process names contained "PaintScout > HubSpot")
- **Issue:** genericizeText() was only applied to descriptions, not to process names or key steps
- **Fix:** Added `genericizeText(process.name)` and mapped `keySteps` through `genericizeText()`
- **Files modified:** linkedin-posts/scripts/analyze-processes.js
- **Commit:** 52412e1 (same commit as fix #1)
- **Impact:** Process names like "PaintScout > HubSpot" → "estimating tool > HubSpot", key steps genericized

## Validation Results

✓ All 4 library modules load without errors and export expected functions
✓ JOURNEY_STAGES has exactly 12 stages (Lead Capture first, Reporting last)
✓ genericizeTools(['paintscout', 'hubspot']) returns ['estimating tool', 'HubSpot']
✓ analyze-processes.js runs without errors and produces processes.json
✓ generate-map.js runs without errors and produces PROCESS-MAP.md
✓ processes.json contains 76 processes (>5 threshold)
✓ PROCESS-MAP.md contains "## Summary" section with markdown table
✓ PROCESS-MAP.md contains detailed sections for each process ("### " headers)
✓ PROCESS-MAP.md does NOT contain "PaintScout", "CompanyCam", "RingCentral" (all genericized)
✓ PROCESS-MAP.md processes ordered by customer journey (Lead Capture before Invoicing)
✓ PROCESS-MAP.md contains "Apps Involved:" with genericized tool names
✓ PROCESS-MAP.md contains "Cross-File Connections:" for multi-file process

## Requirements Fulfilled

- **PMAP-02:** System traces cross-file webhook connections one level deep ✓
- **PMAP-03:** System groups sub-flows into logical parent processes; cross-file flows merged ✓
- **PMAP-04:** Infrastructure flows excluded from final process map (completed in Plan 01) ✓
- **PMAP-05:** Processes ordered by 12-stage customer journey sequence ✓
- **PMAP-06:** PROCESS-MAP.md exists with summary table and detailed sections ✓

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Substring matching for tool genericization | Handles camelCase variants (paintScoutApi) and API suffixes without enumerating all combinations |
| Multi-signal journey stage tagging | File name alone insufficient - combines with process name, description, and component keys for accuracy |
| Uncategorized tag for utility flows | 24 processes (email senders, data sync, error handlers) don't fit customer journey - flagged for Phase 2 review |
| One-level webhook tracing | Per D-04 - prevents mega-processes from chaining 3+ files together |
| Inefficiency flagging during analysis | Identifies optimization opportunities (complex flows, excessive code, sync sub-flows) for fixing in posts |

## Known Issues

### Uncategorized Processes (24 total)

Many are utility/support flows that may not warrant standalone LinkedIn posts:
- Message Transpiler (boolean-marketing-integration)
- Error Notification Sender (job-management-integration)
- Gmail Sender, Create Available Event Calendar (gmail-and-ring-central-communicator)
- Customer-Selected Project Type Converter (boolean-sales-integration)
- Fetch customers/departments/tax codes from QBO (boolean-accounting-system)
- HubSpot mapper utilities (job-management-integration)

**Recommendation for Phase 2:** Review Uncategorized processes during post selection. Many are infrastructure glue that shouldn't be standalone posts (combine with parent processes or skip).

## Next Steps

Phase 2 will consume `PROCESS-MAP.md` to:
- Select processes for LinkedIn post generation (likely 15-25 posts from 52 categorized processes)
- Generate 3 versions per process (Make, Zapier, n8n)
- Create platform-themed flowchart diagrams (purple/orange/green)
- Skip or combine utility flows in Uncategorized

## Known Stubs

None - all analysis logic is fully implemented and tested.

## Self-Check: PASSED

**Files created:**
```bash
FOUND: linkedin-posts/lib/webhook-tracer.js
FOUND: linkedin-posts/lib/process-grouper.js
FOUND: linkedin-posts/lib/journey-tagger.js
FOUND: linkedin-posts/lib/tool-genericizer.js
FOUND: linkedin-posts/scripts/analyze-processes.js
FOUND: linkedin-posts/scripts/generate-map.js
FOUND: linkedin-posts/data/processes.json
FOUND: linkedin-posts/PROCESS-MAP.md
```

**Commits exist:**
```bash
FOUND: 3ce08a1 (Task 1 - four library modules)
FOUND: 52412e1 (Task 2 - analysis pipeline and PROCESS-MAP.md)
```

**Data validation:**
```bash
FOUND: 76 total processes in processes.json
FOUND: 12 journey stages + Uncategorized
FOUND: 1 cross-file connection traced
FOUND: 33382 characters in PROCESS-MAP.md
FOUND: Summary table with "| # | Process Name" header
FOUND: Detailed sections with "### " headers
FOUND: NO occurrences of "paintscout" (case-insensitive)
FOUND: NO occurrences of "companycam" (case-insensitive)
FOUND: NO occurrences of "ringcentral" (case-insensitive)
```

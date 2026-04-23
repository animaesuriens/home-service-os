---
name: ingest-yaml
description: Use when the user asks to check the "To Process" folder, ingest new Prismatic YAMLs, or add a new integration to the LinkedIn Automation Portfolio pipeline. Handles the mechanical ingestion automatically, then coordinates the judgment calls (bundle curation, pain/solution copy) with the user before running content generation.
---

# Ingest New Prismatic YAML

Triggers: "check To Process", "ingest new YAML", "add new integration", "there's a new YAML in To Process" — any variation where the user points at the `To Process/` folder as containing something to add.

## What's mechanical vs. what needs judgment

**Mechanical (script does it):**
- Scan `To Process/*.yml`
- Derive a unique token for each new file (first 5 chars of first word, collision-checked against existing `SYSTEM_TOKENS`)
- Register the token in `linkedin-posts/_pipeline/lib/process-grouper.js`
- Move the file from `To Process/` → `Processed/`
- Run `parse-yaml` + `analyze-processes` + `generate-bundles` to surface what's new
- Emit a JSON report listing new process IDs that aren't yet in any bundle

**Needs judgment (Claude + user do together):**
- Does each new process belong in an existing bundle, or does it need a new bundle?
- For new bundles: title, journey stage, pain statement, solution statement
- Which flows from the new YAML are post-worthy and which are pure plumbing

## Execution plan

When the user asks to ingest:

### 1. Run the mechanical script

```bash
cd linkedin-posts/_pipeline
node scripts/ingest-yaml.js
```

Read the JSON report. Three possible outcomes:

- `status: nothing-to-ingest` — `To Process/` is empty. Tell the user.
- `status: ingested, unassignedCount: 0` — everything landed in existing bundles. Skip to step 4.
- `status: ingested, unassignedCount > 0` — new processes exist that don't map to any bundle. Go to step 2.

### 2. Propose bundle placements

For each item in `unassigned[]`, decide one of:

**(a) Fits an existing bundle.** Match by `journeyStage` first, then by semantic content (process name, top components). If the fit is clear, propose adding the processId to that bundle's `processIds` array in `data/bundle-definitions.json`.

**(b) Needs a new bundle.** If the process is for a capability no existing bundle covers, propose a new bundle with:
- `id` — kebab-case capability name (e.g. `inventory-tracking`)
- `title` — short human title
- `journeyStage` — pick from existing stages in `ROADMAP.md` or add a new one
- `journeySlug` — kebab-case short form for directory names
- `processIds` — the new process ID(s)
- `pain` — the customer's before-state in the reader's language (grounded in what the actual flow does)
- `solution` — the automated after-state (no forbidden terms; read `lib/post-generator.js` SYSTEM_PROMPT for the list)
- `layout: "swimlane"` or `"vertical"`
- `type: "process"`

**(c) Skip.** If the new flow is clearly plumbing (e.g. an auth refresh subflow), note it and don't assign it anywhere. The `bundle-curator.js` guards allow unassigned processes in `processes.json` — they just won't appear in content.

Present the proposed placements as a table and ask the user to confirm or adjust.

### 3. Apply bundle changes

Once the user approves:
- Edit `data/bundle-definitions.json` with the approved changes
- Run `node scripts/derive-steps.js` to regenerate step data from the new source
- Run `npm run stage1:bundles` to rebuild `bundles.json`
- Sanity-check: `node -e "const b=require('./data/bundles.json').bundles; b.forEach(x=>console.log(x.id, x.processIds.length, 'procs'))"` — every affected bundle should have the expected process count

### 4. Generate content for affected bundles

Only regenerate what changed. For each affected `bundle-slug`:

```bash
npm run stage2:storybeats -- --bundle <bundle-slug>
npm run stage2:posts -- --bundle <bundle-slug>
npm run stage3:diagrams -- --bundle <bundle-slug>
```

Do NOT re-run the full pipeline unless the user explicitly asks — regenerating unaffected bundles wastes API calls and may subtly change existing content.

### 5. Verify and commit

Grep the new posts for forbidden terms:

```bash
for t in "real-time" "lead scoring" "audit trail" "crew dispatch" "drip campaign" "paintscout" "companycam" "youcanbook" "ycbm" "quickbooks" "ringcentral"; do
  count=$(grep -riI "$t" linkedin-posts/_pipeline/posts/ 2>/dev/null | wc -l)
  [ $count -gt 0 ] && echo "  '$t': $count hits"
done
```

If any hits, regenerate those specific posts via `--bundle <slug> --platform <platform>`. The post-generator's retry gate should have caught them, but grep as a final check.

Commit per-bundle:
- `feat(ingest): add <bundle-slug> bundle from <source-yaml>` — if a new bundle was created
- `feat(ingest): extend <bundle-slug> with new processes from <source-yaml>` — if processes were added to an existing bundle

## Failure modes to watch for

- **Token collision with something the user intended to override.** If the user says "use token X" but X collides, surface the collision; don't silently pick a different token.
- **New YAML from an existing vendor.** If a v2 export lands alongside the v1 (e.g. `boolean-marketing-integration-v2-export.yml`), the script will happily register a new token. Ask the user whether the new YAML REPLACES the old or coexists with it — collision at the token level is detected, but overlap at the flow-number level within the same system is not.
- **Forbidden terms in user-proposed pain/solution.** Pass proposed pain/solution through the forbidden-terms filter before writing to bundle-definitions.json. The same list that's in `lib/post-generator.js:FORBIDDEN_IN_POST` applies.

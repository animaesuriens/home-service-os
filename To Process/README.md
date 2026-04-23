# To Process

Drop new Prismatic YAML exports here as a staging step before they enter the pipeline. The pipeline does NOT read from this folder — only from `../Processed/`. Moving a YAML here is safe; it won't affect any existing runs.

## Quick path (recommended): ask Claude

In a Claude Code session, just say "check the To Process folder" (or any variation like "ingest the new YAML"). Claude follows `.claude/skills/ingest-yaml/SKILL.md`, which:

- Runs the mechanical ingestion script (register token, move file, parse, detect new processes)
- Proposes which bundle each new process belongs in — existing vs. new
- Asks you to confirm/adjust before touching bundle definitions
- Regenerates content for only the affected bundles
- Verifies no forbidden terms landed in the new posts
- Commits per-bundle

## Manual path (if you'd rather run it yourself)

From `linkedin-posts/_pipeline/`:

```bash
npm run ingest:dry    # preview what would happen
npm run ingest        # register tokens, move files, run parse + bundle analysis
```

The script emits a JSON report listing new processes that aren't in any bundle. You then:

1. Edit `data/bundle-definitions.json` to add the new process IDs to existing bundles or create new bundle definitions (required fields: `id`, `title`, `journeyStage`, `journeySlug`, `processIds`, `pain`, `solution`, `layout`, `type`).
2. Run `node scripts/derive-steps.js && npm run stage1:bundles` to rebuild.
3. Run `npm run stage2:storybeats -- --bundle <slug>` then `stage2:posts` then `stage3:diagrams` (per affected bundle) to generate content.

See `../Processed/README.md` for deeper context on why the registration step exists.

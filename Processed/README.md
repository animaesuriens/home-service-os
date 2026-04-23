# Processed Prismatic YAMLs

Raw Prismatic integration exports that have been registered with the pipeline and are actively consumed by `linkedin-posts/_pipeline/`.

The pipeline reads every `.yml` in this folder at run time (`lib/yaml-loader.js:getYamlFileList`) — no hardcoded list. Drop a file here only after completing the registration steps below.

## Adding a new Prismatic YAML

1. Drop the new export into `../To Process/` first — keeps it out of the pipeline until you're ready.
2. Open `linkedin-posts/_pipeline/lib/process-grouper.js` and add an entry to `SYSTEM_TOKENS` mapping the exact filename to a unique short token:
   ```js
   'new-integration-export.yml': 'newint',
   ```
   The token must be unique across all source files — it becomes the prefix of every process ID from that YAML (e.g. `P-newint-05`). Collisions are detected by the bundle-curator guards and will throw loudly; they don't silently merge.
3. Move the YAML from `../To Process/` into this folder (`Processed/`).
4. Run `npm run parse` (from `linkedin-posts/_pipeline/`) to verify the pipeline accepts it.
5. If the new YAML introduces flows that should become their own narrative bundles, add entries to `linkedin-posts/_pipeline/data/bundle-definitions.json` — minimum fields: `id`, `title`, `journeyStage`, `journeySlug`, `processIds`, `pain`, `solution`, `layout`, `type`. Otherwise, add the new process IDs to the `processIds` array of whichever existing bundle(s) they fit.
6. Run `npm run pipeline` to regenerate storyBeats, posts, and diagrams from the updated source.

## Why this split exists

The pipeline fails loud on unknown source files (by design, see 15-04 SUMMARY). That guard is good — it prevents the silent process-ID collision bug that poisoned 9 of 14 bundles in an earlier version. The `Processed/` + `To Process/` split makes the registration step visible and deliberate: you can't accidentally run the pipeline against a YAML you haven't wired up.

# To Process

Drop new Prismatic YAML exports here as a staging step before they enter the pipeline.

The pipeline does NOT read from this folder — only from `../Processed/`. Moving a YAML here is safe; it won't affect any existing runs.

## Workflow

1. Drop the new Prismatic export here.
2. Follow the registration steps in `../Processed/README.md` (add SYSTEM_TOKENS entry, optionally add bundle definitions).
3. Move the YAML from this folder to `../Processed/`.
4. Run the pipeline.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**LinkedIn Automation Portfolio**

A content generation project that transforms real Prismatic integration YAML exports from a home service company's operational pipeline into a series of self-contained LinkedIn posts. Each post showcases a specific automation process as if it were built exclusively in Make, Zapier, or n8n — creating a digital portfolio that demonstrates automation expertise to both potential clients and fellow builders.

**Core Value:** Every post must be a standalone, compelling showcase of a real automation process that makes the reader think "I need something like this" or "this person really knows automation."

### Constraints

- **Tool genericization**: Only Make/Zapier/n8n/HubSpot/Airtable named explicitly — everything else gets generic labels
- **Self-contained posts**: Zero cross-references between posts
- **Platform versions**: Same narrative structure, swap the automation tool — not unique angles per platform
- **Diagram generation**: Must use an automated tool (Playwright + HTML/Mermaid rendering) for flowchart images
- **Sub-project isolation**: All artifacts live in `linkedin-posts/` folder
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 20.x LTS | Runtime environment | Long-term support, stable for CLI tools, widespread ecosystem for diagram/template tooling |
### Diagram Generation (PRIMARY DECISION)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @mermaid-js/mermaid-cli | ^11.12.0 | Flowchart PNG generation | **RECOMMENDED**: Native color theming via config files, battle-tested CLI, no external binary dependencies, 300+ plugins, fast iteration. Uses headless browser (Puppeteer) for rendering which ensures pixel-perfect output. |
- Create 3 config files (make.config.json, zapier.config.json, n8n.config.json)
- Use `theme: "base"` with `themeVariables` for custom colors
- Set `primaryColor` (purple for Make, orange for Zapier, green for n8n)
- Mermaid auto-adjusts `primaryBorderColor` and related colors
- CLI command: `mmdc --configFile make.config.json -i flow.mmd -o flow.png`
- PNG format: lossless, perfect for text-heavy diagrams
- Use `-s 2` or `-s 3` scale flag for retina-quality output
- Quality option NOT available for PNG (only JPEG/WebP)
### YAML Parsing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| yaml | ^2.8.3 | Parse Prismatic YAML exports | **RECOMMENDED**: Modern, standards-compliant YAML 1.2 parser. Better TypeScript support than js-yaml, preserves comments/formatting (useful for debugging), zero external dependencies. 16M+ weekly downloads, preferred for greenfield projects. |
- js-yaml is legacy choice (100M+ downloads but older architecture)
- yaml has better error messages, cleaner TypeScript types
- Both are battle-tested; yaml is modernized successor
### Markdown Templating
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| handlebars | ^4.7.9 | LinkedIn post template engine | **RECOMMENDED**: Logic-less templates perfect for non-developers maintaining templates, precompilation support (5-7x faster than Mustache), helper functions for date formatting/conditionals, widely adopted for email/CMS templating. 16K+ projects depend on it. |
| gray-matter | ^4.0.3 | YAML front matter extraction | **RECOMMENDED**: Industry standard for front matter parsing (used by Gatsby, Astro, Eleventy, TinaCMS). Handles YAML/JSON/TOML front matter, simple API, battle-tested. |
- EJS: 25M weekly downloads but mixes logic with markup (harder for template maintenance)
- Mustache: Simple but too limited (no helpers, slower than compiled Handlebars)
- Handlebars: Balance of power and safety, precompilation = production performance
### File System Operations
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| fs-extra | ^11.x | Enhanced file operations | Drop-in replacement for native fs with promise support, recursive copy/remove/mkdir, better error messages, graceful-fs integration prevents EMFILE errors. Standard choice for CLI tools. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| playwright | ^1.59.1 | Optional: Alternative to mermaid-cli for custom rendering | ONLY if mermaid-cli theming proves insufficient. Can render custom HTML/CSS diagrams to PNG with deviceScaleFactor for retina quality. Higher complexity but unlimited styling freedom. |
| markdown-it | ^14.x | Optional: Markdown validation/preview | ONLY if we need to validate generated markdown before writing. Pluggable, CommonMark compliant. Likely unnecessary for simple templating. |
## Alternatives Considered
### Diagram Generation
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Flowcharts | @mermaid-js/mermaid-cli | D2 (@terrastruct/d2) | D2 requires Go binary installation (not pure Node.js), WASM wrapper exists but adds complexity. Mermaid has better flowchart syntax for simple automation flows. D2 better for architecture diagrams. |
| Flowcharts | @mermaid-js/mermaid-cli | Graphviz | DOT syntax is arcane compared to Mermaid, better for algorithmic graphs than human-readable automation flows. Requires external binary. |
| Flowcharts | @mermaid-js/mermaid-cli | Excalidraw (@swiftlysingh/excalidraw-cli) | Hand-drawn aesthetic inappropriate for professional portfolio. CLI is nascent (Node >=20.19.0 requirement). Mermaid cleaner for automation diagrams. |
| Flowcharts | @mermaid-js/mermaid-cli | Playwright custom rendering | Overkill for this use case. Only needed if Mermaid theming proves insufficient. Adds browser automation complexity. |
- Mermaid: Best syntax for automation flowcharts, native color theming, pure Node.js (no binaries)
- D2: Overkill for flowcharts, requires Go binary or WASM complexity
- Graphviz: Too low-level, DOT syntax harder to maintain
- Excalidraw: Wrong visual style, immature CLI tooling
- Playwright: Last resort fallback if mermaid-cli theming fails
### YAML Parsing
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| YAML | yaml | js-yaml | js-yaml is legacy standard (100M+ downloads) but yaml is modernized successor with better TypeScript support, better error messages, comment preservation. For greenfield project, yaml is preferred. |
### Templating
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Templates | handlebars | EJS | EJS mixes JavaScript logic with HTML (25M downloads, popular with Express). Harder for non-developers to edit templates. Handlebars precompilation is 5-7x faster. |
| Templates | handlebars | Mustache | Mustache too limited (no helpers, no precompilation performance). Handlebars is Mustache-compatible superset. |
| Templates | handlebars | Nunjucks | Nunjucks powerful but overkill for simple post templates. Handlebars simpler, more focused on content templating. |
## LinkedIn Post Optimization
- Manual hashtag strategy: 3-5 hashtags per post
- Use broad industry tags (#Automation, #WorkflowAutomation, #BusinessAutomation)
- 2026 LinkedIn algorithm (360Brew AI) treats hashtags as SEO signals, not feed discovery
- Hashtag placement: Mix of broad (industry) + specific (tool names)
- LinkedIn API doesn't provide hashtag suggestion endpoints for programmatic use
- Hashtag optimization is content-dependent (better done manually/per-template)
- No battle-tested npm packages for LinkedIn hashtag generation found in ecosystem
## Installation
# Core dependencies
# Diagram generation
# OR as dev dependency
# Optional: only if mermaid-cli proves insufficient
## Project Structure Recommendation
## Configuration Examples
### Mermaid Theme Config (make.config.json)
### Handlebars Post Template (post.hbs)
# {{title}}
## The Workflow
## Why This Matters
## Tech Stack
- {{platform_name}}
- {{#each integrations}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
## Validation Checklist
- [ ] Mermaid color theming produces acceptable purple/orange/green outputs (create test diagrams)
- [ ] Mermaid flowchart syntax can represent all Prismatic action types (HTTP, transformation, branching)
- [ ] Handlebars helpers cover all template needs (date formatting, pluralization, conditionals)
- [ ] YAML parser handles Prismatic export format (test with actual YAML files)
- [ ] PNG export quality acceptable for LinkedIn (test with `-s 2` scale flag)
## Sources
- [Mermaid CLI npm package](https://www.npmjs.com/package/@mermaid-js/mermaid-cli)
- [Mermaid Theme Configuration](https://mermaid.ai/open-source/config/theming.html)
- [Mermaid vs D2 Comparison](https://aaronjbecker.com/posts/mermaid-vs-d2-comparing-text-to-diagram-tools/)
- [Text to Diagram Tools Comparison 2025](https://text-to-diagram.com/?example=text)
- [D2 Language Documentation](https://d2lang.com/)
- [@terrastruct/d2 npm package](https://www.npmjs.com/package/@terrastruct/d2)
- [Graphviz Color Documentation](https://graphviz.org/doc/info/colors.html)
- [Excalidraw CLI GitHub](https://github.com/swiftlysingh/excalidraw-cli)
- [yaml npm package](https://www.npmjs.com/package/yaml)
- [js-yaml npm package](https://www.npmjs.com/package/js-yaml)
- [npm-compare: js-yaml vs yaml](https://npm-compare.com/js-yaml,yaml,yamljs)
- [yaml version 2.8.3 release](https://ithile.com/micro-tools/npm-version-checker/yaml/)
- [handlebars npm package](https://www.npmjs.com/package/handlebars)
- [gray-matter npm package](https://www.npmjs.com/package/gray-matter)
- [Handlebars vs EJS vs Mustache Comparison](https://npm-compare.com/ejs,handlebars,mustache,pug)
- [JavaScript Templating Engines 2026](https://colorlib.com/wp/top-templating-engines-for-javascript/)
- [gray-matter GitHub](https://github.com/jonschlinkert/gray-matter)
- [fs-extra npm package](https://www.npmjs.com/package/fs-extra)
- [fs-extra vs native fs comparison](https://npm-compare.com/fs,fs-extra,fs-extra-promise)
- [Playwright npm package](https://www.npmjs.com/package/playwright)
- [Playwright Screenshots Documentation](https://playwright.dev/docs/screenshots)
- [Playwright Screenshot Quality Guide](https://www.zenrows.com/blog/playwright-screenshot)
- [LinkedIn Hashtags 2026 Guide](https://connectsafely.ai/articles/linkedin-hashtags)
- [LinkedIn Post Optimization 2026](https://blog.linkboost.co/linkedin-post-optimization-guide-2026/)
- [Do LinkedIn Hashtags Work in 2026](https://contentin.io/blog/do-hashtags-work-on-linkedin/)
- [Best LinkedIn Hashtags 2026](https://blog.linkboost.co/best-linkedin-hashtags-engagement-2026/)
- [Mermaid CLI with Playwright](https://github.com/remcohaszing/remark-mermaidjs)
- [Mermaid PNG Export Guide 2026](https://conceptviz.app/blog/how-to-convert-mermaid-diagram-to-image-guide)
- [Mermaid Custom Theme Colors](https://github.com/Gordonby/MermaidTheming)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

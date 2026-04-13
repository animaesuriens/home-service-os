#!/usr/bin/env node
/**
 * Generate linkedin-posts/README.md as a portfolio showcase
 *
 * Reads bundles.json and creates a professional README with:
 * - Portfolio introduction
 * - Journey-ordered post table with inline n8n previews
 * - Usage instructions
 * - Methodology section
 */

const fs = require('fs-extra');
const path = require('path');

// Journey order mapping (per 03-CONTEXT.md D-10)
const JOURNEY_ORDER = [
  'lead-capture',
  'appointment-booking',
  'estimate-to-deal',
  'change-orders',
  'contract-lifecycle',
  'deal-to-job',
  'production-tracking',
  'time-tracking',
  'invoice-lifecycle',
  'expense-management',
  'reporting-sync',
  'communication-hub'
];

async function main() {
  const projectRoot = path.resolve(__dirname, '../..');
  const bundlesPath = path.join(projectRoot, '_pipeline/data/bundles.json');
  const readmePath = path.join(projectRoot, 'README.md');

  // Read bundles.json
  const bundlesData = await fs.readJson(bundlesPath);
  const { bundles } = bundlesData;

  // Sort bundles by journey order
  const sortedBundles = JOURNEY_ORDER.map(slug => {
    const bundle = bundles.find(b => b.journeySlug === slug);
    if (!bundle) {
      throw new Error(`Bundle not found for journey slug: ${slug}`);
    }
    return bundle;
  });

  // Generate README content
  const readme = generateReadme(sortedBundles);

  // Write README.md
  await fs.writeFile(readmePath, readme, 'utf8');
  console.log(`✓ Generated README.md at ${readmePath}`);
}

function generateReadme(bundles) {
  const sections = [];

  // Section 1: Portfolio Introduction
  sections.push(`# LinkedIn Automation Portfolio

This portfolio showcases real home service operational processes reimagined as modern automation workflows. Each post demonstrates how complex business processes can be streamlined using Make, Zapier, or n8n — transforming manual operations into automated systems that run 24/7.

**Core Value:** Every post is a standalone, compelling showcase of a real automation process that makes you think "I need something like this" or "this person really knows automation."

Each process is presented in three platform versions (Make, Zapier, n8n) — same narrative structure and business logic, just swapping the automation tool to demonstrate platform flexibility.
`);

  // Section 2: Posts Table
  sections.push(`## Portfolio Posts

The posts are organized following the customer journey from lead to completed job:
`);

  // Generate table
  const tableHeader = `| Journey Stage | Post | Preview | Platforms | Description |
|---------------|------|---------|-----------|-------------|`;

  const tableRows = bundles.map((bundle, index) => {
    const num = String(index + 1).padStart(2, '0');
    const slug = bundle.journeySlug;

    // n8n preview image
    const preview = `![${bundle.title}](posts/${num}-${slug}/${slug}-n8n.png)`;

    // Platform links
    const platforms = [
      `[Make](posts/${num}-${slug}/${slug}-make.md)`,
      `[Zapier](posts/${num}-${slug}/${slug}-zapier.md)`,
      `[n8n](posts/${num}-${slug}/${slug}-n8n.md)`
    ].join(' · ');

    // Description (combine pain + solution)
    const description = `${bundle.pain} ${bundle.solution}`;

    return `| **${bundle.journeyStage}** | ${bundle.title} | ${preview} | ${platforms} | ${description} |`;
  });

  sections.push([tableHeader, ...tableRows].join('\n'));

  // Section 3: Usage Instructions
  sections.push(`
## How to Use This Portfolio

**Viewing Posts:** Each post is written in markdown format and can be viewed in any markdown reader, GitHub, VS Code, or your preferred text editor. The posts are fully self-contained — read any one independently.

**Platform Versions:** Each workflow is presented in three platform versions (Make, Zapier, n8n). The narrative and business logic are identical; only the automation tool changes. Choose the platform version that matches your preferred automation tool.

**Diagrams:** Each post includes a flowchart diagram showing the automation workflow. The PNG diagrams can be downloaded and used in presentations, documentation, or LinkedIn posts. Diagrams are color-coded by platform:
- **Make:** Purple theme
- **Zapier:** Orange theme
- **n8n:** Green theme

**Sharing:** All posts are standalone and shareable. Link directly to individual markdown files or share the entire portfolio.
`);

  // Section 4: Methodology
  sections.push(`
## Methodology

**Source Material:** These workflows are based on real Prismatic integration YAML exports from an operational home service company. The processes represent actual business operations that ran in production.

**Curation Process:** Raw YAML workflows were analyzed, logical boundaries identified, cross-file connections traced, and processes curated into meaningful business bundles. Each bundle represents a complete business capability (e.g., "Lead Capture & Qualification" or "Invoice Lifecycle").

**Content Generation:** Posts and diagrams were generated programmatically via Claude API using Anthropic's templating system. Each post follows a consistent structure: business context, workflow steps, pain points solved, and technical implementation.

**Diagram Generation:** Flowcharts are generated using Mermaid with platform-specific theming. The diagram generation pipeline lives in the \`_pipeline/\` subfolder and uses:
- Mermaid syntax for flowchart definitions
- Platform-specific config files for color theming (purple/orange/green)
- mermaid-cli for PNG rendering at retina resolution

**Tool Naming:** Only Make, Zapier, n8n, HubSpot, and Airtable are named explicitly. All other tools use generic labels (e.g., "estimating tool", "time tracking app", "accounting software") to keep posts broadly applicable.

All generation code, templates, and configuration files are preserved in the \`_pipeline/\` subfolder for reference and reproducibility.
`);

  // Footer
  sections.push(`---

*Generated from real operational workflows | Portfolio showcase by [Your Name]*
`);

  return sections.join('\n');
}

main().catch(err => {
  console.error('Error generating README:', err);
  process.exit(1);
});

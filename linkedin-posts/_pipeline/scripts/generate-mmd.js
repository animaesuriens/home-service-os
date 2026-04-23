'use strict';

const fs = require('fs-extra');
const path = require('path');

const MERMAID_DIR = path.join(__dirname, '..', 'mermaid', 'diagrams');

// Platform-specific diagram styles
// Make: circle trigger, diamond decision at midpoint, branching
// Zapier: all rectangles, flat linear chain
// n8n: rectangle trigger, diamond decision at midpoint, branching

function wrapLabel(label) {
  // Strip quotes that break Mermaid syntax
  const clean = label.replace(/"/g, "'");
  // Word-wrap to 2 lines, ~20 chars each, keeping meaning intact
  const words = clean.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line.length + w.length + 1 > 20 && line.length > 0) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) lines.push(line);

  if (lines.length <= 2) return lines.join('\\n');

  // If 3+ lines, try again with wider limit and allow 3 lines
  const wide = [];
  let wline = '';
  for (const w of words) {
    if (wline.length + w.length + 1 > 26 && wline.length > 0) {
      wide.push(wline);
      wline = w;
    } else {
      wline = wline ? wline + ' ' + w : w;
    }
  }
  if (wline) wide.push(wline);
  return wide.slice(0, 3).join('\\n');
}

function buildBranchingDiagram(bundle, platform) {
  const steps = bundle.idealizedSteps;
  const title = bundle.title;
  const slug = bundle.journeySlug;
  const config = bundle.diagramConfig;

  if (!config) {
    console.warn(`No diagramConfig for bundle ${slug}, skipping branching diagram`);
    return null;
  }

  const mid = config.decisionIdx;

  const isMake = platform === 'make';
  const lines = ['---', `title: ${title} — ${isMake ? 'Make' : 'n8n'}`, '---', 'flowchart TD'];
  // Support up to 676 nodes (A-Z, then AA-ZZ). Post-15-04 clean data has
  // bundles up to 47 steps, well past the old 16-letter alphabet.
  const ids = [];
  for (let i = 0; i < 26; i++) ids.push(String.fromCharCode(65 + i));
  for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) ids.push(String.fromCharCode(65 + i) + String.fromCharCode(65 + j));

  // Trigger node
  if (isMake) {
    lines.push(`    ${ids[0]}(("${wrapLabel(steps[0].label)}")):::trigger`);
  } else {
    lines.push(`    ${ids[0]}["${wrapLabel(steps[0].label)}"]:::trigger`);
  }

  // Nodes before decision
  for (let i = 1; i < mid; i++) {
    lines.push(`    ${ids[i]}["${wrapLabel(steps[i].label)}"]`);
  }

  // Decision node (diamond) with curated label
  lines.push(`    ${ids[mid]}{"${config.decisionLabel}"}`);

  const leftIdx = mid + 1;
  const rightIdx = mid + 2;
  const mergeIdx = mid + 3;

  if (rightIdx < steps.length && mergeIdx < steps.length) {
    // Full branching with merge
    lines.push(`    ${ids[leftIdx]}["${wrapLabel(steps[leftIdx].label)}"]`);
    lines.push(`    ${ids[rightIdx]}["${wrapLabel(steps[rightIdx].label)}"]`);

    for (let i = mergeIdx; i < steps.length; i++) {
      lines.push(`    ${ids[i]}["${wrapLabel(steps[i].label)}"]`);
    }

    lines.push('');

    for (let i = 0; i < mid; i++) {
      lines.push(`    ${ids[i]} --> ${ids[i + 1]}`);
    }

    lines.push(`    ${ids[mid]} -->|${config.leftLabel}| ${ids[leftIdx]}`);
    lines.push(`    ${ids[mid]} -->|${config.rightLabel}| ${ids[rightIdx]}`);
    lines.push(`    ${ids[leftIdx]} --> ${ids[mergeIdx]}`);
    lines.push(`    ${ids[rightIdx]} --> ${ids[mergeIdx]}`);

    for (let i = mergeIdx; i < steps.length - 1; i++) {
      lines.push(`    ${ids[i]} --> ${ids[i + 1]}`);
    }
  } else if (rightIdx < steps.length) {
    // Branching without merge — both branches are terminal
    lines.push(`    ${ids[leftIdx]}["${wrapLabel(steps[leftIdx].label)}"]`);
    lines.push(`    ${ids[rightIdx]}["${wrapLabel(steps[rightIdx].label)}"]`);

    lines.push('');

    for (let i = 0; i < mid; i++) {
      lines.push(`    ${ids[i]} --> ${ids[i + 1]}`);
    }

    lines.push(`    ${ids[mid]} -->|${config.leftLabel}| ${ids[leftIdx]}`);
    lines.push(`    ${ids[mid]} -->|${config.rightLabel}| ${ids[rightIdx]}`);
  } else {
    // Fallback: linear
    for (let i = mid + 1; i < steps.length; i++) {
      lines.push(`    ${ids[i]}["${wrapLabel(steps[i].label)}"]`);
    }
    lines.push('');
    for (let i = 0; i < steps.length - 1; i++) {
      lines.push(`    ${ids[i]} --> ${ids[i + 1]}`);
    }
  }

  lines.push('');
  if (isMake) {
    lines.push('    classDef trigger fill:#9b3dae,stroke:#fff,stroke-width:3px,color:#fff');
  } else {
    lines.push('    classDef trigger fill:#2E7D32,stroke:#4CAF50,stroke-width:3px,color:#fff');
  }
  lines.push('');
  return lines.join('\n');
}

function generateMake(bundle) {
  return buildBranchingDiagram(bundle, 'make');
}

function generateZapier(bundle) {
  const steps = bundle.idealizedSteps;
  const title = bundle.title;
  const lines = ['---', `title: ${title} — Zapier`, '---', 'flowchart TD'];

  const nodeIds = [];
  for (let i = 0; i < steps.length; i++) {
    const id = i === 0 ? 'T' : `A${i}`;
    nodeIds.push(id);
    const suffix = i === 0 ? ':::trigger' : '';
    lines.push(`    ${id}["${wrapLabel(steps[i].label)}"]${suffix}`);
  }

  lines.push('');
  lines.push('    ' + nodeIds.join(' --> '));
  lines.push('');
  lines.push('    classDef trigger fill:#FF4A00,stroke:#cc3b00,stroke-width:3px,color:#fff');
  lines.push('');
  return lines.join('\n');
}

function generateN8n(bundle) {
  return buildBranchingDiagram(bundle, 'n8n');
}

async function main() {
  const bundlesPath = path.join(__dirname, '..', 'data', 'bundles.json');
  const { bundles } = JSON.parse(await fs.readFile(bundlesPath, 'utf-8'));

  await fs.ensureDir(MERMAID_DIR);

  // Clean existing .mmd files
  const oldFiles = await fs.readdir(MERMAID_DIR);
  for (const f of oldFiles) {
    if (f.endsWith('.mmd')) {
      await fs.remove(path.join(MERMAID_DIR, f));
    }
  }

  let count = 0;
  for (const bundle of bundles) {
    const slug = bundle.journeySlug;
    const generators = { make: generateMake, zapier: generateZapier, n8n: generateN8n };

    for (const [platform, gen] of Object.entries(generators)) {
      const mmd = gen(bundle);
      if (mmd === null) {
        console.log(`Skipped: ${slug}-${platform}.mmd (no diagramConfig)`);
        continue;
      }
      const outPath = path.join(MERMAID_DIR, `${slug}-${platform}.mmd`);
      await fs.writeFile(outPath, mmd, 'utf-8');
      count++;
      console.log(`Created: ${slug}-${platform}.mmd`);
    }
  }

  console.log(`\nGenerated ${count} .mmd files for ${bundles.length} bundles`);
}

main().catch(err => { console.error(err); process.exit(1); });

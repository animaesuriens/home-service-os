#!/usr/bin/env node
'use strict';

/**
 * generate-storybeats.js
 *
 * Drives the storyBeats generator across all bundles (or a single --bundle).
 * Writes data/storybeats.json — keyed by bundleId, validated per bundle.
 *
 * Usage:
 *   node scripts/generate-storybeats.js                  # all 14 bundles
 *   node scripts/generate-storybeats.js --bundle lead-capture-qualification
 *   node scripts/generate-storybeats.js --dry-run        # don't write, just report
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const fs = require('fs-extra');
const { generateStoryBeats } = require('../lib/storybeat-generator');
const { validateStoryBeats } = require('../lib/storybeat-validator');

const BUNDLES_PATH = path.join(__dirname, '..', 'data', 'bundles.json');
const OUT_PATH = path.join(__dirname, '..', 'data', 'storybeats.json');

function parseArgs(argv) {
  const args = { bundle: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--bundle') args.bundle = argv[++i];
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY is not set. Export it or add to linkedin-posts/_pipeline/.env');
    process.exit(2);
  }

  const { bundles } = await fs.readJson(BUNDLES_PATH);
  const existing = (await fs.pathExists(OUT_PATH)) ? await fs.readJson(OUT_PATH) : { generatedAt: null, byBundle: {} };

  const targets = args.bundle
    ? bundles.filter(b => b.id === args.bundle || b.journeySlug === args.bundle)
    : bundles;

  if (targets.length === 0) {
    console.error(`No bundles matched --bundle="${args.bundle}"`);
    process.exit(2);
  }

  const results = { ...existing.byBundle };
  const report = [];

  for (const bundle of targets) {
    process.stderr.write(`[${bundle.id}] generating storyBeats... `);
    try {
      const { storyBeats, warnings } = await generateStoryBeats(bundle);
      results[bundle.id] = storyBeats;
      report.push({ id: bundle.id, status: 'ok', warnings });
      process.stderr.write(`✓ (${storyBeats.beats.length} beats, ${warnings.length} warnings)\n`);
    } catch (err) {
      report.push({ id: bundle.id, status: 'fail', error: err.message });
      process.stderr.write(`✗ ${err.message}\n`);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    byBundle: results,
  };

  if (args.dryRun) {
    console.log(JSON.stringify({ report, summary: { total: targets.length, ok: report.filter(r => r.status === 'ok').length, fail: report.filter(r => r.status === 'fail').length } }, null, 2));
    console.error('[DRY RUN — no write]');
  } else {
    await fs.writeJson(OUT_PATH, output, { spaces: 2 });
    console.error(`\nWrote ${OUT_PATH}`);
    console.error(`Summary: ${report.filter(r => r.status === 'ok').length} ok, ${report.filter(r => r.status === 'fail').length} fail`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

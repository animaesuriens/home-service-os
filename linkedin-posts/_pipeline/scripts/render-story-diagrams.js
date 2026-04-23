#!/usr/bin/env node
'use strict';

/**
 * render-story-diagrams.js
 *
 * Renders storyBeats-driven diagrams for all (bundle × platform) combinations.
 * Writes posts/<journeySlug>/<platform>.png.
 *
 * Usage:
 *   node scripts/render-story-diagrams.js
 *   node scripts/render-story-diagrams.js --bundle appointment-booking
 *   node scripts/render-story-diagrams.js --platform make
 *   node scripts/render-story-diagrams.js --bundle appointment-booking --platform make
 */

const path = require('path');
const fs = require('fs-extra');
const { renderStoryDiagram, PLATFORM_THEMES } = require('../lib/diagram-renderer');

const BUNDLES_PATH = path.join(__dirname, '..', 'data', 'bundles.json');
const STORYBEATS_PATH = path.join(__dirname, '..', 'data', 'storybeats.json');
const POSTS_DIR = path.join(__dirname, '..', 'posts');

function parseArgs(argv) {
  const args = { bundle: null, platform: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--bundle') args.bundle = argv[++i];
    else if (argv[i] === '--platform') args.platform = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const { bundles } = await fs.readJson(BUNDLES_PATH);

  if (!(await fs.pathExists(STORYBEATS_PATH))) {
    console.error(`ERROR: ${STORYBEATS_PATH} not found. Run scripts/generate-storybeats.js first.`);
    process.exit(2);
  }
  const storybeatsFile = await fs.readJson(STORYBEATS_PATH);
  const storybeatsByBundle = storybeatsFile.byBundle || {};

  const targetBundles = args.bundle
    ? bundles.filter(b => b.id === args.bundle || b.journeySlug === args.bundle)
    : bundles;

  const platforms = args.platform
    ? [args.platform]
    : Object.keys(PLATFORM_THEMES);

  if (targetBundles.length === 0) {
    console.error(`No bundles matched --bundle="${args.bundle}"`);
    process.exit(2);
  }

  let count = 0;
  let skipped = 0;
  for (const bundle of targetBundles) {
    const sb = storybeatsByBundle[bundle.id];
    if (!sb) {
      console.warn(`[${bundle.id}] no storyBeats — skipped`);
      skipped += platforms.length;
      continue;
    }
    for (const platform of platforms) {
      const out = path.join(POSTS_DIR, bundle.journeySlug, `${platform}.png`);
      process.stderr.write(`rendering ${bundle.id} · ${platform}... `);
      await renderStoryDiagram(sb, platform, out);
      process.stderr.write('✓\n');
      count++;
    }
  }

  console.error(`\nRendered ${count} diagram${count === 1 ? '' : 's'} (${skipped} skipped)`);
}

main().catch(err => { console.error(err); process.exit(1); });

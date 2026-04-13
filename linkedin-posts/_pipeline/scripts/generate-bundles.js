/**
 * generate-bundles.js
 * Stage 1: Create bundles.json from processes.json
 *
 * Per D-22: Stage 1 of the 3-stage npm script pipeline.
 * Per D-24: bundles.json is the single source of truth for posts and diagrams.
 *
 * Usage: npm run stage1:bundles
 */

const fs = require('fs-extra');
const path = require('path');
const { curateBundles } = require('../lib/bundle-curator');

async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const processesPath = path.join(dataDir, 'processes.json');
  const bundlesPath = path.join(dataDir, 'bundles.json');

  // Read processes.json (Phase 1 output)
  const processesData = await fs.readJSON(processesPath);
  console.log(`Read ${processesData.totalProcesses} processes from processes.json`);

  // Curate bundles
  const bundles = curateBundles(processesData.processes);

  // Build output
  const output = {
    generatedAt: new Date().toISOString(),
    totalBundles: bundles.length,
    bundles: bundles
  };

  // Write bundles.json
  await fs.writeJSON(bundlesPath, output, { spaces: 2 });
  console.log(`\nGenerated ${bundles.length} bundles in data/bundles.json`);

  // Print summary
  console.log('\nBundle Summary:');
  console.log('=' .repeat(80));
  bundles.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.title} (${b.idealizedSteps.length} steps, ${b.layout} layout, ${b.processIds.length} processes)`);
  });
  console.log('=' .repeat(80));

  // Print coverage stats
  const allProcessIds = new Set();
  bundles.forEach(b => b.processIds.forEach(id => allProcessIds.add(id)));
  console.log(`\nCoverage: ${allProcessIds.size}/${processesData.totalProcesses} processes included in bundles`);

  // Identify journey stage coverage
  const stages = new Set(bundles.map(b => b.journeyStage));
  console.log(`Journey stages covered: ${[...stages].join(', ')}`);
}

main().catch(err => {
  console.error('Error generating bundles:', err);
  process.exit(1);
});

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

function parseArgs() {
  const args = process.argv.slice(2);
  let yamlFilter = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--yaml' && args[i + 1]) yamlFilter = args[i + 1];
    if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node generate-bundles.js [--yaml <filename>]');
      console.log('');
      console.log('Options:');
      console.log('  --yaml <filename>   Generate bundles for flows from one YAML file only');
      console.log('  --help, -h          Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node generate-bundles.js                                           # All bundles');
      console.log('  node generate-bundles.js --yaml boolean-marketing-integration-export.yml  # Filtered bundles');
      process.exit(0);
    }
  }
  return { yamlFilter };
}

async function main() {
  // Parse args first
  const { yamlFilter } = parseArgs();

  const dataDir = path.join(__dirname, '..', 'data');
  const processesPath = path.join(dataDir, 'processes.json');
  const bundlesPath = path.join(dataDir, 'bundles.json');

  // Read processes.json (Phase 1 output)
  const processesData = await fs.readJSON(processesPath);
  console.log(`Read ${processesData.totalProcesses} processes from processes.json`);

  // Curate bundles from all processes
  const bundles = curateBundles(processesData.processes);

  // Filter bundles if --yaml flag provided
  let filteredBundles = bundles;
  if (yamlFilter) {
    console.log(`Filtering bundles to those containing flows from: ${yamlFilter}`);

    // Build a map of processId -> sourceFiles
    const processSourceMap = {};
    processesData.processes.forEach(p => {
      processSourceMap[p.id] = p.sourceFiles || [];
    });

    // Filter bundles to only include those whose processIds have the yamlFilter in their sourceFiles
    filteredBundles = bundles.filter(bundle => {
      return bundle.processIds.some(processId => {
        const sourceFiles = processSourceMap[processId] || [];
        return sourceFiles.includes(yamlFilter);
      });
    });

    console.log(`Filtered from ${bundles.length} bundles to ${filteredBundles.length} bundles`);
  }

  // Build output using filtered bundles
  const output = {
    generatedAt: new Date().toISOString(),
    totalBundles: filteredBundles.length,
    bundles: filteredBundles
  };

  // Write bundles.json
  await fs.writeJSON(bundlesPath, output, { spaces: 2 });
  console.log(`\nGenerated ${filteredBundles.length} bundles in data/bundles.json`);

  // Print summary
  console.log('\nBundle Summary:');
  console.log('=' .repeat(80));
  filteredBundles.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.title} (${b.idealizedSteps.length} steps, ${b.type}, ${b.layout} layout, ${b.processIds.length} processes)`);
  });
  console.log('=' .repeat(80));

  // Print coverage stats
  const allProcessIds = new Set();
  filteredBundles.forEach(b => b.processIds.forEach(id => allProcessIds.add(id)));
  console.log(`\nCoverage: ${allProcessIds.size}/${processesData.totalProcesses} processes included in bundles`);

  // Identify journey stage coverage
  const stages = new Set(filteredBundles.map(b => b.journeyStage));
  console.log(`Journey stages covered: ${[...stages].join(', ')}`);
}

main().catch(err => {
  console.error('Error generating bundles:', err);
  process.exit(1);
});

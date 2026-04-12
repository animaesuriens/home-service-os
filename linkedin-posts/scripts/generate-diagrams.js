'use strict';

const fs = require('fs-extra');
const path = require('path');
const { renderAllDiagrams } = require('../lib/diagram-renderer');

async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const postsDir = path.join(__dirname, '..', 'posts');

  const bundlesData = await fs.readJSON(path.join(dataDir, 'bundles.json'));
  console.log(`Generating diagrams for ${bundlesData.totalBundles} bundles x 3 platforms = ${bundlesData.totalBundles * 3} diagrams`);

  const results = await renderAllDiagrams(bundlesData.bundles, postsDir);

  const successes = results.filter(r => !r.error);
  const failures = results.filter(r => r.error);

  console.log('\n--- Summary ---');
  console.log(`Generated: ${successes.length} diagrams`);
  if (failures.length > 0) {
    console.log(`Failed: ${failures.length}`);
    failures.forEach(f => console.log(`  ${f.bundleId}/${f.platform}: ${f.error}`));
  }

  // Verify file sizes (sanity check per Pitfall 6)
  let oversized = 0;
  for (const result of successes) {
    const stats = await fs.stat(result.outputPath);
    const sizeKB = Math.round(stats.size / 1024);
    if (sizeKB > 1024) {
      console.log(`WARNING: ${result.outputPath} is ${sizeKB}KB (>1MB)`);
      oversized++;
    }
  }
  if (oversized > 0) {
    console.log(`${oversized} diagram(s) exceed 1MB — may need optimization`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

'use strict';

const fs = require('fs-extra');
const path = require('path');
const { generateAllPosts } = require('../lib/post-generator');

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable not set');
    console.error('Get your key from: https://console.anthropic.com/');
    process.exit(1);
  }

  const dataDir = path.join(__dirname, '..', 'data');
  const postsDir = path.join(__dirname, '..', 'posts');

  const bundlesData = await fs.readJSON(path.join(dataDir, 'bundles.json'));
  console.log(`Generating posts for ${bundlesData.totalBundles} bundles x 3 platforms = ${bundlesData.totalBundles * 3} posts`);

  const result = await generateAllPosts(bundlesData.bundles, postsDir);

  console.log('\n--- Summary ---');
  console.log(`Total: ${result.total}`);
  console.log(`Passed validation: ${result.passed}`);
  console.log(`Warnings: ${result.warnings}`);
  if (result.errors > 0) {
    console.log(`Errors: ${result.errors}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

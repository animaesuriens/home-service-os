'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs-extra');
const path = require('path');
const { generateAllPosts, generatePost, generateBundlePosts, validatePost } = require('../lib/post-generator');

function parseArgs() {
  const args = process.argv.slice(2);
  let bundle = null;
  let platform = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bundle' && args[i + 1]) bundle = args[i + 1];
    if (args[i] === '--platform' && args[i + 1]) platform = args[i + 1];
    if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node generate-posts.js [--bundle <slug>] [--platform <make|zapier|n8n>]');
      console.log('');
      console.log('Options:');
      console.log('  --bundle <slug>     Generate for one bundle only (by journeySlug)');
      console.log('  --platform <name>   Generate for one platform only (make, zapier, or n8n)');
      console.log('  --help, -h          Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node generate-posts.js                              # All 36 posts');
      console.log('  node generate-posts.js --bundle lead-capture        # 3 posts for lead-capture');
      console.log('  node generate-posts.js --bundle lead-capture --platform make  # 1 post');
      process.exit(0);
    }
  }
  return { bundle, platform };
}

async function main() {
  // Parse args first (--help should work without API key)
  const { bundle: bundleArg, platform: platformArg } = parseArgs();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable not set');
    console.error('Get your key from: https://console.anthropic.com/');
    process.exit(1);
  }

  const dataDir = path.join(__dirname, '..', 'data');
  const postsDir = path.join(__dirname, '..', 'posts');

  const bundlesData = await fs.readJSON(path.join(dataDir, 'bundles.json'));

  // Load storyBeats if present — they become the shared narrative spine for
  // post + diagram. Absent is not fatal (allows running posts alone for smoke tests).
  const storybeatsPath = path.join(dataDir, 'storybeats.json');
  let storyBeatsByBundle = null;
  if (await fs.pathExists(storybeatsPath)) {
    const sbFile = await fs.readJSON(storybeatsPath);
    storyBeatsByBundle = sbFile.byBundle || null;
    const sbCount = storyBeatsByBundle ? Object.keys(storyBeatsByBundle).length : 0;
    console.log(`Loaded storyBeats for ${sbCount} bundle(s) from storybeats.json`);
  } else {
    console.warn('storybeats.json not found — posts will generate without narrative spine (consider running npm run stage2:storybeats first)');
  }

  // Validate bundle if provided
  let targetBundle = null;
  if (bundleArg) {
    targetBundle = bundlesData.bundles.find(b => b.journeySlug === bundleArg);
    if (!targetBundle) {
      console.error(`ERROR: Bundle "${bundleArg}" not found.`);
      console.error('Valid bundle slugs:');
      bundlesData.bundles.forEach(b => console.error(`  - ${b.journeySlug}`));
      process.exit(1);
    }
  }

  // Validate platform if provided
  const validPlatforms = ['make', 'zapier', 'n8n'];
  if (platformArg && !validPlatforms.includes(platformArg)) {
    console.error(`ERROR: Platform "${platformArg}" not valid.`);
    console.error('Valid platforms: make, zapier, n8n');
    process.exit(1);
  }

  // Execution modes:
  //   --platform X (with/without --bundle): per-platform path (single-post generatePost per platform)
  //   --bundle X (no platform) or no filters at all: bundle-level path (one generateBundlePosts
  //     call returns all 3 platform posts at once, keeps voice consistent)
  const targetBundles = bundleArg ? [targetBundle] : bundlesData.bundles;
  const usePerPlatform = !!platformArg;

  let total = 0;
  let passed = 0;
  let warnings = 0;
  let errorCount = 0;

  if (usePerPlatform) {
    const targetPlatforms = [platformArg];
    const totalPosts = targetBundles.length * targetPlatforms.length;
    console.log(`Generating ${totalPosts} post(s) — per-platform path (${bundleArg || 'all bundles'} x ${platformArg})`);

    for (const bundle of targetBundles) {
      for (const platform of targetPlatforms) {
        total++;
        try {
          const sb = storyBeatsByBundle ? storyBeatsByBundle[bundle.id] : null;
          const content = await generatePost(bundle, platform, sb);
          const validation = validatePost(content, platform, bundle.journeyStage);
          const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
          const outputPath = path.join(postsDir, bundle.journeySlug, `${platform}.md`);
          await fs.ensureDir(path.dirname(outputPath));
          await fs.writeFile(outputPath, content, 'utf-8');
          if (validation.valid) { passed++; console.log(`Generated: posts/${bundle.journeySlug}/${platform}.md (${wordCount} words, PASS)`); }
          else { warnings++; console.log(`Generated: posts/${bundle.journeySlug}/${platform}.md (${wordCount} words, WARN: ${validation.errors.join(', ')})`); }
          await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
          errorCount++;
          console.error(`ERROR generating ${bundle.journeySlug}/${platform}.md: ${err.message}`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
  } else {
    // Bundle-level path: one Claude call per bundle returns all 3 platform posts.
    // Voice stays consistent because the model sees its own Make post while writing Zapier and n8n.
    console.log(`Generating ${targetBundles.length * 3} post(s) — bundle-level path (${targetBundles.length} bundles x 3 platforms, 1 API call each)`);

    for (const bundle of targetBundles) {
      try {
        const sb = storyBeatsByBundle ? storyBeatsByBundle[bundle.id] : null;
        const posts = await generateBundlePosts(bundle, sb);
        for (const platform of ['make', 'zapier', 'n8n']) {
          total++;
          const content = posts[platform];
          const validation = validatePost(content, platform, bundle.journeyStage);
          const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
          const outputPath = path.join(postsDir, bundle.journeySlug, `${platform}.md`);
          await fs.ensureDir(path.dirname(outputPath));
          await fs.writeFile(outputPath, content, 'utf-8');
          if (validation.valid) { passed++; console.log(`Generated: posts/${bundle.journeySlug}/${platform}.md (${wordCount} words, PASS)`); }
          else { warnings++; console.log(`Generated: posts/${bundle.journeySlug}/${platform}.md (${wordCount} words, WARN: ${validation.errors.join(', ')})`); }
        }
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        errorCount += 3;
        console.error(`ERROR generating bundle ${bundle.journeySlug}: ${err.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total: ${total}`);
  console.log(`Passed validation: ${passed}`);
  console.log(`Warnings: ${warnings}`);
  if (errorCount > 0) console.log(`Errors: ${errorCount}`);
}

main().catch(err => { console.error(err); process.exit(1); });

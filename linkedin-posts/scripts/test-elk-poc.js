'use strict';

const path = require('path');
const fs = require('fs-extra');
const { chromium } = require('playwright');
const { computeLayout } = require('../lib/elk-layout');

const BUNDLES_PATH = path.join(__dirname, '..', 'data', 'bundles.json');
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'elk-diagram.html');
const OUTPUT_DIR = path.join(__dirname, '..', 'posts', 'elk-poc');

const PLATFORM_COLORS = {
  make:   { primary: '#7B2D8E', name: 'Make' },
  zapier: { primary: '#FF4A00', name: 'Zapier' },
  n8n:    { primary: '#9FD7A0', name: 'n8n' }
};

const VP = { width: 1080, height: 1350 };

async function main() {
  console.log('=== ELK.js Diagram POC ===\n');

  // Load test data (first bundle = lead-capture)
  const bundlesData = await fs.readJson(BUNDLES_PATH);
  const bundle = bundlesData.bundles[0];
  console.log('Bundle: ' + bundle.title);
  console.log('Steps: ' + bundle.idealizedSteps.length);
  console.log('Layout: ' + bundle.layout);

  // Compute ELK layout
  console.log('\nComputing ELK layout...');
  const layout = await computeLayout({
    steps: bundle.idealizedSteps,
    layout: bundle.layout
  });

  console.log('  Nodes: ' + layout.nodes.length);
  console.log('  Edges: ' + layout.edges.length);
  console.log('  Actors: ' + layout.actors.length + ' (' + layout.actors.map(function(a) { return a.name; }).join(', ') + ')');
  console.log('  Graph dimensions: ' + layout.graphWidth + 'x' + layout.graphHeight);

  // Load template
  const template = await fs.readFile(TEMPLATE_PATH, 'utf-8');

  // Ensure output directory
  await fs.ensureDir(OUTPUT_DIR);

  // Launch browser once
  console.log('\nLaunching Playwright browser...');
  const browser = await chromium.launch({ headless: true });

  const platforms = ['make', 'zapier', 'n8n'];
  const results = [];

  try {
    for (const platformKey of platforms) {
      const platform = PLATFORM_COLORS[platformKey];
      console.log('\nRendering ' + platform.name + ' (' + platform.primary + ')...');

      // Replace template placeholders
      const html = template
        .replace(/\{\{PRIMARY_COLOR\}\}/g, platform.primary)
        .replace(/\{\{PLATFORM_NAME\}\}/g, platform.name)
        .replace(/\{\{TITLE\}\}/g, bundle.title)
        .replace(/\{\{NODES_JSON\}\}/g, JSON.stringify(layout.nodes))
        .replace(/\{\{EDGES_JSON\}\}/g, JSON.stringify(layout.edges))
        .replace(/\{\{ACTORS_JSON\}\}/g, JSON.stringify(layout.actors))
        .replace(/\{\{GRAPH_WIDTH\}\}/g, String(layout.graphWidth))
        .replace(/\{\{GRAPH_HEIGHT\}\}/g, String(layout.graphHeight));

      // Render via Playwright
      const page = await browser.newPage({
        viewport: VP,
        deviceScaleFactor: 2
      });

      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const outputPath = path.join(OUTPUT_DIR, platformKey + '.png');
      await page.screenshot({
        path: outputPath,
        type: 'png',
        fullPage: false
      });

      await page.close();

      const stat = await fs.stat(outputPath);
      results.push({
        platform: platformKey,
        path: outputPath,
        size: stat.size
      });

      console.log('  Saved: ' + outputPath + ' (' + Math.round(stat.size / 1024) + ' KB)');
    }
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n=== POC Summary ===');
  console.log('Bundle: ' + bundle.title);
  console.log('Steps: ' + layout.nodes.length + ' nodes, ' + layout.edges.length + ' edges');
  console.log('Actors: ' + layout.actors.map(function(a) { return a.name; }).join(', '));
  console.log('Graph: ' + layout.graphWidth + 'x' + layout.graphHeight + ' (ELK coordinates)');
  console.log('Output: ' + VP.width + 'x' + VP.height + ' @ 2x = ' + (VP.width * 2) + 'x' + (VP.height * 2) + ' pixels');
  console.log('\nGenerated files:');
  results.forEach(function(r) {
    console.log('  ' + r.platform + ': ' + Math.round(r.size / 1024) + ' KB');
  });
  console.log('\nDone.');
}

main().catch(function(err) {
  console.error('ERROR:', err);
  process.exit(1);
});

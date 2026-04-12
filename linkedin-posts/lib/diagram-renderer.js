'use strict';

const path = require('path');
const fs = require('fs-extra');
const { chromium } = require('playwright');

// ---------------------------------------------------------------------------
// Platform color constants (D-17)
// ---------------------------------------------------------------------------
const PLATFORM_COLORS = {
  make:   { primary: '#7B2D8E', name: 'Make' },
  zapier: { primary: '#FF4A00', name: 'Zapier' },
  n8n:    { primary: '#9FD7A0', name: 'n8n' }
};

// Path to the reusable HTML diagram template
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'diagram.html');

// Viewport settings per D-18: 1080x1350 at deviceScaleFactor 2 (2160x2700 actual pixels)
const VIEWPORT = { width: 1080, height: 1350 };
const DEVICE_SCALE_FACTOR = 2;

// ---------------------------------------------------------------------------
// renderDiagram(config, outputPath)
//
// Renders a single diagram to PNG.
//
// @param {object} config
//   @param {string} config.platform  - 'make' | 'zapier' | 'n8n'
//   @param {string} config.title     - Diagram title
//   @param {Array}  config.steps     - [{ label: string, actor: string }]
//   @param {string} config.layout    - 'vertical' | 'swimlane'
// @param {string} outputPath         - File path for output PNG
// @param {object} [options]
//   @param {object} [options.browser] - Reuse an existing Playwright browser
//   @param {string} [options.template] - Pre-loaded template HTML string
// @returns {Promise<object>} { outputPath, platform, width, height }
// ---------------------------------------------------------------------------
async function renderDiagram(config, outputPath, options) {
  const opts = options || {};
  const platform = PLATFORM_COLORS[config.platform];
  if (!platform) {
    throw new Error('Unknown platform: ' + config.platform + '. Expected make, zapier, or n8n.');
  }

  // Load template (or reuse pre-loaded copy)
  const template = opts.template || await fs.readFile(TEMPLATE_PATH, 'utf-8');

  // Replace placeholders
  const html = template
    .replace(/\{\{PRIMARY_COLOR\}\}/g, platform.primary)
    .replace(/\{\{PLATFORM_NAME\}\}/g, platform.name)
    .replace(/\{\{TITLE\}\}/g, config.title)
    .replace(/\{\{STEPS_JSON\}\}/g, JSON.stringify(config.steps))
    .replace(/\{\{LAYOUT\}\}/g, config.layout);

  // Launch browser or reuse provided one
  const ownBrowser = !opts.browser;
  const browser = opts.browser || await chromium.launch({ headless: true });

  let page;
  try {
    // Each diagram gets its own page (prevents state leakage - T-02-04 mitigation)
    page = await browser.newPage({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR
    });

    await page.setContent(html, { waitUntil: 'networkidle' });

    // Allow fonts and rendering to settle
    await page.waitForTimeout(500);

    // Ensure output directory exists
    await fs.ensureDir(path.dirname(outputPath));

    // Screenshot at exact viewport dimensions
    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: false
    });
  } finally {
    // Always close the page to free memory (T-02-04 mitigation)
    if (page) {
      await page.close();
    }
    // Only close browser if we launched it ourselves
    if (ownBrowser && browser) {
      await browser.close();
    }
  }

  return {
    outputPath: outputPath,
    platform: config.platform,
    width: VIEWPORT.width,
    height: VIEWPORT.height
  };
}

// ---------------------------------------------------------------------------
// renderAllDiagrams(bundles, outputDir)
//
// Renders diagrams for all bundles across all 3 platforms.
// Launches browser ONCE and reuses for all renders.
//
// @param {Array}  bundles   - Array of bundle objects from bundles.json
// @param {string} outputDir - Base output directory (e.g. 'linkedin-posts/posts')
// @returns {Promise<Array>} Array of { bundleId, platform, outputPath, error? }
// ---------------------------------------------------------------------------
async function renderAllDiagrams(bundles, outputDir) {
  const results = [];

  // Launch browser ONCE for all renders
  const browser = await chromium.launch({ headless: true });

  // Read template ONCE into memory
  const template = await fs.readFile(TEMPLATE_PATH, 'utf-8');

  const platforms = ['make', 'zapier', 'n8n'];

  try {
    for (const bundle of bundles) {
      for (const platform of platforms) {
        const journeySlug = bundle.journeySlug || bundle.id;
        const outputPath = path.join(outputDir, journeySlug, platform + '.png');

        try {
          await renderDiagram(
            {
              platform: platform,
              title: bundle.title,
              steps: bundle.idealizedSteps || bundle.steps || [],
              layout: bundle.layout || 'vertical'
            },
            outputPath,
            { browser: browser, template: template }
          );

          console.log('Generated: ' + outputPath);
          results.push({
            bundleId: bundle.id,
            platform: platform,
            outputPath: outputPath
          });
        } catch (err) {
          console.error('Failed to render ' + (bundle.id || 'unknown') + '/' + platform + ': ' + err.message);
          results.push({
            bundleId: bundle.id,
            platform: platform,
            outputPath: outputPath,
            error: err.message
          });
        }
      }
    }
  } finally {
    // Close browser after ALL diagrams are done (T-02-04 mitigation)
    await browser.close();
  }

  return results;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  renderDiagram,
  renderAllDiagrams,
  PLATFORM_COLORS
};

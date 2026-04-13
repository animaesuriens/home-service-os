'use strict';

const path = require('path');
const fs = require('fs-extra');
const { chromium } = require('playwright');

const MERMAID_DIR = path.join(__dirname, '..', 'mermaid');
const POSTS_DIR = path.join(__dirname, '..', 'posts');

const VP = { width: 1080, height: 1350 };

// Platform visual configs
const PLATFORMS = {
  make: {
    name: 'Make',
    config: 'make.json',
    background: 'linear-gradient(160deg, #1a0e26 0%, #2a1541 40%, #1e1035 100%)',
    badgeBg: '#7B2D8E',
    badgeColor: '#fff',
    titleColor: '#fff'
  },
  zapier: {
    name: 'Zapier',
    config: 'zapier.json',
    background: '#fef7f2',
    badgeBg: '#FF4A00',
    badgeColor: '#fff',
    titleColor: '#2d2d2d'
  },
  n8n: {
    name: 'n8n',
    config: 'n8n.json',
    background: '#232323',
    badgeBg: '#9FD7A0',
    badgeColor: '#1a1a1a',
    titleColor: '#fff'
  }
};

function stripFrontmatter(mermaidDef) {
  const lines = mermaidDef.split('\n');
  let startIdx = 0;
  if (lines[0].trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        startIdx = i + 1;
        break;
      }
    }
  }
  return lines.slice(startIdx).join('\n').trim();
}

function buildHTML(mermaidDef, mermaidConfig, platform, title) {
  const cleanDef = stripFrontmatter(mermaidDef);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${VP.width}px;
      height: ${VP.height}px;
      background: ${platform.background};
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 40px 60px 20px;
    }
    .platform-badge {
      display: inline-block;
      background: ${platform.badgeBg};
      color: ${platform.badgeColor};
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 20px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      color: ${platform.titleColor};
      line-height: 1.2;
    }
    .diagram-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 20px 20px;
      overflow: hidden;
      position: relative;
    }
    .mermaid {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mermaid svg {
      width: 100% !important;
      height: 100% !important;
    }
    /* Thick arrows */
    .mermaid .flowchart-link {
      stroke-width: 5px !important;
      opacity: 1 !important;
    }
    .mermaid .edgeLabel {
      font-size: 18px !important;
      font-weight: 700 !important;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="platform-badge">${platform.name}</div>
    <div class="title">${title}</div>
  </div>
  <div class="diagram-container">
    <pre class="mermaid">
${cleanDef}
    </pre>
  </div>
  <script>
    var lineColor = '${mermaidConfig.themeVariables.lineColor}';
    mermaid.initialize(${JSON.stringify(mermaidConfig)});
    mermaid.run().then(function() {
      var svg = document.querySelector('.mermaid svg');
      if (!svg) return;
      // Replace arrowhead markers with larger custom triangles
      var markers = svg.querySelectorAll('marker');
      markers.forEach(function(m) {
        m.setAttribute('viewBox', '0 0 10 10');
        m.setAttribute('markerWidth', '15');
        m.setAttribute('markerHeight', '15');
        m.setAttribute('refX', '9');
        m.setAttribute('refY', '5');
        m.setAttribute('orient', 'auto-start-reverse');
        m.innerHTML = '';
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        path.setAttribute('fill', lineColor);
        m.appendChild(path);
      });
      // Scale SVG to fill container
      var bbox = svg.getBBox();
      var svgW = bbox.width + bbox.x * 2;
      var svgH = bbox.height + bbox.y * 2;
      svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + svgH);
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.style.width = '100%';
      svg.style.height = '100%';
      document.body.setAttribute('data-ready', 'true');
    });
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// renderDiagram(mermaidDef, title, platformKey, outputPath, options)
//
// Renders a single Mermaid diagram to a platform-themed PNG.
// ---------------------------------------------------------------------------
async function renderDiagram(mermaidDef, title, platformKey, outputPath, options) {
  const opts = options || {};
  const platform = PLATFORMS[platformKey];
  if (!platform) throw new Error('Unknown platform: ' + platformKey);

  const configPath = path.join(MERMAID_DIR, 'configs', platform.config);
  const mermaidConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
  const html = buildHTML(mermaidDef, mermaidConfig, platform, title);

  const ownBrowser = !opts.browser;
  const browser = opts.browser || await chromium.launch({ headless: true });

  let page;
  try {
    page = await browser.newPage({ viewport: VP, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.waitForSelector('body[data-ready="true"]', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);

    await fs.ensureDir(path.dirname(outputPath));
    await page.screenshot({ path: outputPath, type: 'png', fullPage: false });
  } finally {
    if (page) await page.close();
    if (ownBrowser && browser) await browser.close();
  }

  return { outputPath, platform: platformKey, width: VP.width, height: VP.height };
}

// ---------------------------------------------------------------------------
// renderAllDiagrams(bundles, outputDir)
//
// For each bundle, reads its .mmd files and renders 3 platform PNGs.
// Expects .mmd files at: mermaid/diagrams/{journeySlug}-{platform}.mmd
// ---------------------------------------------------------------------------
async function renderAllDiagrams(bundles, outputDir) {
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const platformKeys = ['make', 'zapier', 'n8n'];

  try {
    for (const bundle of bundles) {
      for (const platformKey of platformKeys) {
        const mmdPath = path.join(MERMAID_DIR, 'diagrams', bundle.journeySlug + '-' + platformKey + '.mmd');

        if (!await fs.pathExists(mmdPath)) {
          console.log('SKIP: ' + mmdPath + ' not found');
          results.push({ bundleId: bundle.id, platform: platformKey, error: 'mmd not found' });
          continue;
        }

        const mermaidDef = await fs.readFile(mmdPath, 'utf-8');
        const outputPath = path.join(outputDir, bundle.journeySlug, platformKey + '.png');

        try {
          await renderDiagram(mermaidDef, bundle.title, platformKey, outputPath, { browser });
          console.log('Generated: ' + outputPath);
          results.push({ bundleId: bundle.id, platform: platformKey, outputPath });
        } catch (err) {
          console.error('Failed: ' + bundle.id + '/' + platformKey + ': ' + err.message);
          results.push({ bundleId: bundle.id, platform: platformKey, error: err.message });
        }
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}

// ---------------------------------------------------------------------------
// CLI: render all bundles when run directly
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const bundlesPath = path.join(__dirname, '..', 'data', 'bundles.json');
    const bundles = JSON.parse(await fs.readFile(bundlesPath, 'utf-8')).bundles;

    console.log('Rendering diagrams for ' + bundles.length + ' bundles x 3 platforms\n');

    const results = await renderAllDiagrams(bundles, POSTS_DIR);

    const successes = results.filter(function(r) { return !r.error; });
    const failures = results.filter(function(r) { return r.error; });

    console.log('\n--- Summary ---');
    console.log('Generated: ' + successes.length + ' diagrams');
    if (failures.length > 0) {
      console.log('Failed: ' + failures.length);
      failures.forEach(function(f) { console.log('  ' + f.bundleId + '/' + f.platform + ': ' + f.error); });
    }
  })().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { renderDiagram, renderAllDiagrams, PLATFORMS };

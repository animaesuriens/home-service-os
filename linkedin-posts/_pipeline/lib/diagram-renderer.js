'use strict';

/**
 * diagram-renderer.js
 *
 * Renders a storyBeats object to a 1080x1350 PNG via HTML/CSS/Playwright.
 * Deterministic given storyBeats + platform theme — no AI in the render path.
 *
 * Design: editorial product-marketing aesthetic (Fraunces serif display,
 * Inter sans body, cream background, accent-color italic in headline,
 * card-based beat layout with trigger as dark hero, decision as dashed accent).
 * See prototypes/path1 for the visual reference that was user-approved.
 */

const path = require('path');
const fs = require('fs-extra');
const { chromium } = require('playwright');

// Light palette (shared by cream-mode platforms Make and Zapier)
const LIGHT_TOKENS = {
  bodyBg: '#faf6f1',
  dotGrid: null,
  textPrimary: '#18121e',
  textSecondary: 'rgba(24, 18, 30, 0.65)',
  textMuted: 'rgba(24, 18, 30, 0.55)',
  textSubtle: 'rgba(24, 18, 30, 0.40)',
  cardBg: '#ffffff',
  cardBorder: 'rgba(24, 18, 30, 0.08)',
  cardShadow: '0 2px 0 rgba(24, 18, 30, 0.04), 0 10px 24px -14px rgba(24, 18, 30, 0.12)',
  divider: 'rgba(24, 18, 30, 0.08)',
  dividerStrong: 'rgba(24, 18, 30, 0.12)',
  kindColor: 'rgba(24, 18, 30, 0.45)',
  triggerTextPrimary: '#faf6f1',
  triggerTextSecondary: 'rgba(250, 246, 241, 0.7)',
  triggerTextMuted: 'rgba(250, 246, 241, 0.6)',
};

// Dark palette (used by n8n — black background, dot grid, green accents,
// mirrors the n8n workflow editor aesthetic without copying it literally).
const DARK_TOKENS = {
  bodyBg: '#13131a',
  dotGrid: 'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px) 0 0 / 22px 22px',
  textPrimary: '#f1f1f5',
  textSecondary: 'rgba(241, 241, 245, 0.72)',
  textMuted: 'rgba(241, 241, 245, 0.55)',
  textSubtle: 'rgba(241, 241, 245, 0.38)',
  cardBg: '#1f1f2a',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  cardShadow: '0 2px 0 rgba(0, 0, 0, 0.2), 0 14px 32px -16px rgba(0, 0, 0, 0.55)',
  divider: 'rgba(255, 255, 255, 0.08)',
  dividerStrong: 'rgba(255, 255, 255, 0.12)',
  kindColor: 'rgba(241, 241, 245, 0.45)',
  triggerTextPrimary: '#f1f1f5',
  triggerTextSecondary: 'rgba(241, 241, 245, 0.75)',
  triggerTextMuted: 'rgba(241, 241, 245, 0.55)',
};

const PLATFORM_THEMES = {
  make: {
    name: 'Make',
    wordmark: 'Built with Make',
    accent: '#E13FA3',
    accentShadow: 'rgba(225, 63, 163, 0.18)',
    accentTint: 'rgba(225, 63, 163, 0.06)',
    accentTintDeep: 'rgba(110, 53, 179, 0.06)',
    triggerGradientStart: '#18121e',
    triggerGradientEnd: '#2a1338',
    ...LIGHT_TOKENS,
  },
  zapier: {
    name: 'Zapier',
    wordmark: 'Built with Zapier',
    accent: '#FF4A00',
    accentShadow: 'rgba(255, 74, 0, 0.18)',
    accentTint: 'rgba(255, 74, 0, 0.06)',
    accentTintDeep: 'rgba(204, 60, 0, 0.05)',
    triggerGradientStart: '#1e1410',
    triggerGradientEnd: '#331a0a',
    ...LIGHT_TOKENS,
  },
  n8n: {
    name: 'n8n',
    wordmark: 'Built with n8n',
    accent: '#14E098',                              // n8n-style bright mint-green
    accentShadow: 'rgba(20, 224, 152, 0.28)',
    accentTint: 'rgba(20, 224, 152, 0.07)',
    accentTintDeep: 'rgba(20, 224, 152, 0.03)',
    triggerGradientStart: '#0d2a20',                // dark green panel
    triggerGradientEnd: '#124534',                  // brighter green-black
    ...DARK_TOKENS,
  },
};

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function applyHeadlineAccent(headline, accentText) {
  if (!accentText) return escapeHtml(headline);
  const escaped = escapeHtml(headline);
  const accentEscaped = escapeHtml(accentText);
  // Replace first occurrence with em wrap
  const idx = escaped.indexOf(accentEscaped);
  if (idx === -1) return escaped;
  return escaped.slice(0, idx) + `<em>${accentEscaped}</em>` + escaped.slice(idx + accentEscaped.length);
}

function layoutBeats(beats) {
  // Group beats into layout rows:
  //  - trigger + one non-trigger non-decision → row-1 (two-up)
  //  - decision → full-width row (dashed accent)
  //  - branch-* pair → two-up row
  //  - merge / output / downstream / step → full-width row
  const rows = [];
  let i = 0;
  while (i < beats.length) {
    const b = beats[i];
    const next = beats[i + 1];
    // Pair trigger with following non-decision, non-branch beat for row-1
    if (b.kind === 'trigger' && next && !['decision', 'branch-new', 'branch-reschedule', 'branch-left', 'branch-right'].includes(next.kind)) {
      rows.push({ type: 'pair', beats: [b, next] });
      i += 2;
      continue;
    }
    if (b.kind === 'decision') {
      rows.push({ type: 'decision', beats: [b] });
      i += 1;
      continue;
    }
    if (['branch-new', 'branch-left'].includes(b.kind) && next && ['branch-reschedule', 'branch-right'].includes(next.kind)) {
      rows.push({ type: 'pair', beats: [b, next] });
      i += 2;
      continue;
    }
    rows.push({ type: 'full', beats: [b] });
    i += 1;
  }
  return rows;
}

function renderBeatCard(beat, theme, { isTrigger = false, isDecision = false } = {}) {
  const classes = ['node'];
  if (isTrigger) classes.push('trigger');
  if (isDecision) classes.push('decision');
  const triggerDot = isTrigger ? '<span class="trigger-dot"></span>' : '';
  return `<div class="${classes.join(' ')}">
    <div class="kind">${escapeHtml(beat.kind.replace(/-/g, ' · ').replace(/\b\w/g, c => c.toUpperCase()))}</div>
    <div class="label">${triggerDot}${escapeHtml(beat.label)}</div>
    <div class="detail">${escapeHtml(beat.detail)}</div>
  </div>`;
}

function buildHtml(storyBeats, theme) {
  const { headline, headlineAccent, dek, beats, metrics } = storyBeats;
  const rows = layoutBeats(beats);

  const rowsHtml = rows.map(row => {
    const cols = row.type === 'pair' ? '1fr 1fr' : '1fr';
    const beatsHtml = row.beats.map(b => renderBeatCard(b, theme, {
      isTrigger: b.kind === 'trigger',
      isDecision: row.type === 'decision',
    })).join('\n');
    return `<div class="row" style="grid-template-columns: ${cols};">\n${beatsHtml}\n</div>`;
  }).join('\n');

  const stepsLabel = metrics.stepCount === 1 ? 'Step' : 'Steps';
  const flowsLabel = metrics.processCount === 1 ? 'Source Flow' : 'Source Flows';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: 1350px; overflow: hidden; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background:
      radial-gradient(ellipse 80% 60% at 20% 10%, ${theme.accentTint}, transparent 60%),
      radial-gradient(ellipse 60% 50% at 90% 90%, ${theme.accentTintDeep}, transparent 60%),
      ${theme.dotGrid ? theme.dotGrid + ', ' : ''}${theme.bodyBg};
    color: ${theme.textPrimary};
    padding: 56px 78px 48px;
    display: flex;
    flex-direction: column;
  }
  .masthead {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 1px solid ${theme.dividerStrong};
    padding-bottom: 16px; margin-bottom: 28px;
  }
  .eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: ${theme.textMuted}; }
  .wordmark { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${theme.accent}; display: flex; align-items: center; gap: 10px; }
  .wordmark::before {
    content: ''; width: 8px; height: 8px; border-radius: 50%;
    background: ${theme.accent}; box-shadow: 0 0 0 4px ${theme.accentShadow};
  }
  h1 {
    font-family: 'Fraunces', serif; font-weight: 600; font-size: 48px;
    line-height: 1.05; letter-spacing: -0.025em; color: ${theme.textPrimary};
    margin-top: 6px; max-width: 820px;
  }
  h1 em { font-style: italic; color: ${theme.accent}; font-weight: 600; }
  .dek {
    font-family: 'Fraunces', serif; font-style: italic; font-weight: 400;
    font-size: 19px; line-height: 1.38; color: ${theme.textSecondary};
    margin-top: 14px; max-width: 760px;
  }
  .flow { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 28px; }
  .row { display: grid; gap: 18px; align-items: stretch; }
  .node {
    background: ${theme.cardBg}; border: 1px solid ${theme.cardBorder}; border-radius: 12px;
    padding: 16px 22px; display: flex; flex-direction: column; gap: 4px;
    box-shadow: ${theme.cardShadow};
  }
  .node .kind { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${theme.kindColor}; margin-bottom: 2px; }
  .node .label { font-family: 'Fraunces', serif; font-weight: 600; font-size: 22px; line-height: 1.2; color: ${theme.textPrimary}; letter-spacing: -0.01em; }
  .node .detail { font-size: 13px; color: ${theme.textSecondary}; margin-top: 4px; line-height: 1.45; }
  .node.trigger { background: linear-gradient(135deg, ${theme.triggerGradientStart} 0%, ${theme.triggerGradientEnd} 100%); border-color: ${theme.triggerGradientEnd}; color: ${theme.triggerTextPrimary}; }
  .node.trigger .kind { color: ${theme.triggerTextMuted}; }
  .node.trigger .label { color: ${theme.triggerTextPrimary}; }
  .node.trigger .detail { color: ${theme.triggerTextSecondary}; }
  .trigger-dot { display: inline-block; width: 10px; height: 10px; margin-right: 10px; border-radius: 50%; background: ${theme.accent}; vertical-align: 2px; box-shadow: 0 0 0 4px ${theme.accentShadow}; }
  .node.decision { border: 1.5px dashed ${theme.accent}; background: ${theme.accentTint}; }
  .node.decision .kind { color: ${theme.accent}; }
  .colophon {
    margin-top: 22px; display: flex; justify-content: space-between;
    font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
    color: ${theme.textSubtle}; padding-top: 14px; border-top: 1px solid ${theme.divider};
  }
</style></head>
<body>
  <div class="masthead">
    <div class="eyebrow">Customer Journey · ${escapeHtml(storyBeats.bundleId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}</div>
    <div class="wordmark">${escapeHtml(theme.wordmark)}</div>
  </div>
  <h1>${applyHeadlineAccent(headline, headlineAccent)}</h1>
  <div class="dek">${escapeHtml(dek)}</div>
  <div class="flow">${rowsHtml}</div>
  <div class="colophon">
    <span>Home Service Automation Portfolio</span>
    <span>${metrics.stepCount} ${stepsLabel} · ${metrics.processCount} ${flowsLabel} · Zero Copy-Paste</span>
  </div>
</body></html>`;
}

async function renderStoryDiagram(storyBeats, platform, outPath) {
  const theme = PLATFORM_THEMES[platform];
  if (!theme) throw new Error(`Unknown platform: ${platform}`);
  const html = buildHtml(storyBeats, theme);

  const tmpDir = path.join(__dirname, '..', '.render-tmp');
  await fs.ensureDir(tmpDir);
  const tmpHtml = path.join(tmpDir, `${storyBeats.bundleId}-${platform}.html`);
  await fs.writeFile(tmpHtml, html, 'utf-8');

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1080, height: 1350 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto('file://' + tmpHtml.replace(/\\/g, '/'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    await fs.ensureDir(path.dirname(outPath));
    await page.screenshot({ path: outPath, type: 'png', fullPage: false });
  } finally {
    await browser.close();
  }
}

module.exports = {
  renderStoryDiagram,
  buildHtml,
  PLATFORM_THEMES,
};

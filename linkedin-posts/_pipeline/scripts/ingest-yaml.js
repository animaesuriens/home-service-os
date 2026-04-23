#!/usr/bin/env node
'use strict';

/**
 * ingest-yaml.js
 *
 * Mechanical ingestion step for new Prismatic YAMLs.
 * Handles:
 *   1. Detect .yml files in "To Process/"
 *   2. Derive a unique system token from each filename
 *   3. Register it in lib/process-grouper.js SYSTEM_TOKENS map
 *   4. Move the file from "To Process/" to "Processed/"
 *   5. Run parse + bundle generation to surface new processes
 *   6. Emit a JSON report describing what changed + what still needs human judgment
 *      (which bundle(s) each new process belongs to — a decision a Claude
 *       session can make with context, but not a script).
 *
 * Does NOT: curate bundle definitions, write pain/solution, or run content
 * generation. Those require judgment — see .claude/skills/ingest-yaml/SKILL.md.
 *
 * Usage:
 *   node scripts/ingest-yaml.js             # ingest all files in To Process/
 *   node scripts/ingest-yaml.js --dry-run   # detect + propose tokens, don't mutate
 *   node scripts/ingest-yaml.js --token foo # override auto-derived token (single-file mode only)
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const TO_PROCESS = path.join(ROOT, 'To Process');
const PROCESSED = path.join(ROOT, 'Processed');
const PROCESS_GROUPER = path.join(__dirname, '..', 'lib', 'process-grouper.js');

function parseArgs() {
  const args = { dryRun: false, tokenOverride: null };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--dry-run') args.dryRun = true;
    else if (process.argv[i] === '--token') args.tokenOverride = process.argv[++i];
  }
  return args;
}

function deriveToken(fileName, existingTokens) {
  // Strip -export.yml, split on dash, pick first word, take first 5 chars.
  // If still colliding, fall back to first 6 chars of first two words joined.
  const stem = fileName.replace(/-export\.yml$/, '').replace(/\.yml$/, '');
  const words = stem.split('-').filter(Boolean);
  const candidates = [];

  if (words.length > 0) candidates.push(words[0].slice(0, 5).toLowerCase());
  if (words.length > 0) candidates.push(words[0].slice(0, 4).toLowerCase());
  if (words.length > 1) candidates.push((words[0] + words[1]).slice(0, 6).toLowerCase());
  if (words.length > 1) candidates.push(words.map(w => w[0]).join('').slice(0, 5).toLowerCase());

  for (const c of candidates) {
    if (c && !existingTokens.has(c)) return c;
  }

  // Last resort: append incrementing digits
  let base = (words[0] || 'ext').slice(0, 4).toLowerCase();
  for (let i = 2; i < 100; i++) {
    const t = base + i;
    if (!existingTokens.has(t)) return t;
  }
  throw new Error(`Could not derive unique token for ${fileName}`);
}

function readSystemTokens() {
  const source = fs.readFileSync(PROCESS_GROUPER, 'utf-8');
  const match = source.match(/const SYSTEM_TOKENS = \{([\s\S]*?)\};/);
  if (!match) throw new Error('Could not locate SYSTEM_TOKENS in process-grouper.js');
  const body = match[1];
  const map = {};
  const entryRe = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    map[m[1]] = m[2];
  }
  return { raw: source, mapBody: body, map };
}

function registerToken(fileName, token) {
  const { raw, map } = readSystemTokens();
  if (map[fileName]) {
    if (map[fileName] === token) return { added: false, existing: true };
    throw new Error(`SYSTEM_TOKENS already has "${fileName}" → "${map[fileName]}", refusing to overwrite with "${token}"`);
  }
  const newLine = `  '${fileName}': '${token}',`;
  // Insert right before the closing brace of the map
  const updated = raw.replace(/(const SYSTEM_TOKENS = \{[\s\S]*?)(\};)/, (_, head, tail) => {
    // Ensure the last existing line ends with a comma
    const withComma = head.replace(/([^,\s])(\s*)$/, '$1,$2');
    return `${withComma}${newLine}\n${tail}`;
  });
  fs.writeFileSync(PROCESS_GROUPER, updated, 'utf-8');
  return { added: true, existing: false };
}

function ensureFolders() {
  if (!fs.existsSync(TO_PROCESS)) fs.mkdirSync(TO_PROCESS);
  if (!fs.existsSync(PROCESSED)) fs.mkdirSync(PROCESSED);
}

function detectIncomingYamls() {
  if (!fs.existsSync(TO_PROCESS)) return [];
  return fs.readdirSync(TO_PROCESS).filter(f => f.endsWith('.yml'));
}

function runPipeline() {
  // Runs parse + bundle generation so new processes appear in processes.json
  // and we can diff against the old state to see what's new.
  const cwd = path.join(__dirname, '..');
  execSync('node scripts/parse-yaml.js', { cwd, stdio: 'pipe' });
  execSync('node scripts/analyze-processes.js', { cwd, stdio: 'pipe' });
  execSync('node scripts/generate-bundles.js', { cwd, stdio: 'pipe' });
}

function main() {
  const args = parseArgs();
  ensureFolders();

  const incoming = detectIncomingYamls();
  if (incoming.length === 0) {
    console.log(JSON.stringify({
      status: 'nothing-to-ingest',
      message: `No .yml files in "${TO_PROCESS}". Drop new Prismatic exports there.`,
    }, null, 2));
    return;
  }

  const { map: existingMap } = readSystemTokens();
  const existingTokens = new Set(Object.values(existingMap));
  const existingFileNames = new Set(Object.keys(existingMap));

  // Plan: derive tokens, check for collisions
  const plan = [];
  for (const fileName of incoming) {
    if (existingFileNames.has(fileName)) {
      plan.push({ fileName, status: 'already-registered', token: existingMap[fileName] });
      continue;
    }
    let token;
    if (args.tokenOverride) {
      if (incoming.length > 1) {
        throw new Error('--token override only allowed with a single file in "To Process/"');
      }
      token = args.tokenOverride;
      if (existingTokens.has(token)) {
        throw new Error(`Token "${token}" collides with existing entry`);
      }
    } else {
      token = deriveToken(fileName, existingTokens);
    }
    plan.push({ fileName, status: 'new', token });
    existingTokens.add(token);
  }

  if (args.dryRun) {
    console.log(JSON.stringify({ status: 'dry-run', plan }, null, 2));
    return;
  }

  // Execute plan: register token, move file
  const applied = [];
  for (const item of plan) {
    if (item.status === 'new') {
      registerToken(item.fileName, item.token);
      const src = path.join(TO_PROCESS, item.fileName);
      const dst = path.join(PROCESSED, item.fileName);
      fs.moveSync(src, dst, { overwrite: false });
      applied.push({ ...item, action: 'registered-and-moved' });
    } else if (item.status === 'already-registered') {
      // File may still need moving
      const src = path.join(TO_PROCESS, item.fileName);
      const dst = path.join(PROCESSED, item.fileName);
      if (fs.existsSync(src)) {
        fs.moveSync(src, dst, { overwrite: false });
        applied.push({ ...item, action: 'moved-already-registered' });
      } else {
        applied.push({ ...item, action: 'nothing-to-do' });
      }
    }
  }

  // Snapshot process ids before re-running pipeline
  const processesPath = path.join(__dirname, '..', 'data', 'processes.json');
  const bundlesPath = path.join(__dirname, '..', 'data', 'bundles.json');
  const before = fs.existsSync(processesPath)
    ? new Set((fs.readJsonSync(processesPath).processes || []).map(p => p.id))
    : new Set();

  runPipeline();

  // Diff — surface new processes not yet assigned to any bundle
  const procsAfter = fs.readJsonSync(processesPath).processes || [];
  const after = new Set(procsAfter.map(p => p.id));
  const newProcessIds = [...after].filter(id => !before.has(id));
  const bundles = fs.readJsonSync(bundlesPath).bundles || [];
  const allBundleProcessIds = new Set(bundles.flatMap(b => b.processIds || []));
  const unassigned = newProcessIds.filter(id => !allBundleProcessIds.has(id));

  const unassignedDetails = unassigned.map(id => {
    const p = procsAfter.find(x => x.id === id);
    return {
      id,
      name: p && p.name,
      sourceFile: p && p.sourceFiles && p.sourceFiles[0],
      journeyStage: p && p.journeyStage,
      totalStepCount: p && p.totalStepCount,
      topComponents: p && p.componentKeys && p.componentKeys.slice(0, 6),
    };
  });

  console.log(JSON.stringify({
    status: 'ingested',
    applied,
    newProcessCount: newProcessIds.length,
    unassignedCount: unassigned.length,
    unassigned: unassignedDetails,
    nextStep: unassigned.length > 0
      ? 'These processes are not yet in any bundle. Either add their ids to existing bundles in data/bundle-definitions.json, or write new bundle definitions for them. See .claude/skills/ingest-yaml/SKILL.md for the decision checklist.'
      : 'All new processes were auto-covered by existing bundles. Run `npm run stage2:storybeats`, `stage2:posts`, `stage3:diagrams` to produce content for any affected bundles.',
  }, null, 2));
}

main();

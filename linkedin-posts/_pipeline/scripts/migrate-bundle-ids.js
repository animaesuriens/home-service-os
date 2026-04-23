'use strict';
/**
 * 15-04 migration: remap bundle-definitions.json processIds to unique ids.
 *
 * Heuristic: preserve flow number, infer system from journeyStage.
 * The old P-boo-XX ids encoded intent as (file-abbrev, flow-number) but the
 * file-abbrev collapsed three YAMLs to 'boo'. The FLOW NUMBER is still the
 * correct signal for what the author meant; we just need to re-attach the
 * right system token.
 *
 * Algorithm per old processId:
 *   - Split into (token, flowNum)
 *   - If token != 'boo' and != 'job', translate directly (e.g. 'boo' was
 *     ambiguous; 'job' → 'jobs', 'daily' → 'prod', 'gmail' → 'comm', etc.)
 *   - If token == 'boo' or 'job' (ambiguous), try primary system for bundle's
 *     journey, then secondary, else flag unresolvable
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFS_PATH = path.join(ROOT, 'data', 'bundle-definitions.json');
const PROCS_PATH = path.join(ROOT, 'data', 'processes.json');

// Maps each journey to primary system token(s), in order of preference.
const JOURNEY_TO_TOKENS = {
  'Lead Capture':         ['mktg'],
  'Lead Qualification':   ['mktg'],
  'Appointment Booking':  ['mktg'],
  'Estimating':           ['sales'],
  'Sales/Proposal':       ['sales', 'jobs'],
  'Contract Management':  ['sales'],
  'Job Setup':            ['sales', 'jobs'],
  'Production Tracking':  ['prod', 'jobs'],
  'Time Tracking':        ['time'],
  'Invoicing':            ['acct'],
  'Expense Management':   ['acct'],
  'Reporting':            ['report'],
  'Uncategorized':        ['comm', 'mktg', 'sales', 'acct', 'jobs', 'prod', 'time', 'report'],
};

// Direct token translation (old abbrev → new token). 'boo' is intentionally
// absent — it's the ambiguous case that needs journey-based resolution.
const DIRECT_TOKEN_MAP = {
  acct: 'acct',
  mktg: 'mktg',
  sales: 'sales',
  prod: 'prod',
  comm: 'comm',
  time: 'time',
  report: 'report',
  jobs: 'jobs',
  // Old abbreviations from the broken scheme
  dai: 'prod',      // daily-production-data
  gma: 'comm',      // gmail-and-ring-central
  job: 'jobs',      // job-management-integration
  qui: 'time',      // quick-books-time-tracking
  sal: 'report',    // sales-and-marketing-reporting (conflicts with sales! see note)
};

// Note: 'sal' collides with sales in the old scheme too (both sales-* and
// sales-and-marketing-reporting-export.yml truncate to 'sal'). In the new
// processes.json, sales → 'sales', reporting → 'report'. Old ids with 'sal'
// are unlikely but if encountered need disambiguation.

function parseOldId(oldId) {
  // Format: P-{token}-{flowPart}  (flowPart can be "10", "10-1", "xx", etc.)
  const m = oldId.match(/^P-([a-z]+)-(.+)$/);
  if (!m) return null;
  return { token: m[1], flowPart: m[2] };
}

function main() {
  const apply = process.argv.includes('--write');
  const defs = JSON.parse(fs.readFileSync(DEFS_PATH, 'utf-8'));
  const newProcs = JSON.parse(fs.readFileSync(PROCS_PATH, 'utf-8'));
  const procArr = newProcs.processes || newProcs;

  const byId = new Map();
  procArr.forEach(p => byId.set(p.id, p));

  const report = [];

  defs.definitions.forEach(def => {
    const journey = def.journeyStage;
    const allowedTokens = JOURNEY_TO_TOKENS[journey] || [];
    const remaps = [];
    const dropped = [];

    for (const oldId of def.processIds) {
      const parsed = parseOldId(oldId);
      if (!parsed) {
        dropped.push({ oldId, reason: 'unparseable' });
        continue;
      }
      const { token, flowPart } = parsed;

      // Try direct token translation first (old token is unambiguous)
      if (DIRECT_TOKEN_MAP[token]) {
        const newId = `P-${DIRECT_TOKEN_MAP[token]}-${flowPart}`;
        if (byId.has(newId)) {
          const p = byId.get(newId);
          remaps.push({ oldId, newId, name: p.name, via: 'direct' });
          continue;
        }
        dropped.push({ oldId, reason: `direct translation ${newId} not found in processes.json` });
        continue;
      }

      // Ambiguous token ('boo'): try journey-primary systems in order
      if (token === 'boo') {
        let matched = null;
        for (const candidateToken of allowedTokens) {
          const candidateId = `P-${candidateToken}-${flowPart}`;
          if (byId.has(candidateId)) {
            matched = { id: candidateId, name: byId.get(candidateId).name, via: `journey (${candidateToken})` };
            break;
          }
        }
        if (matched) {
          remaps.push({ oldId, newId: matched.id, name: matched.name, via: matched.via });
        } else {
          dropped.push({ oldId, reason: `flow ${flowPart} not found in any journey-allowed system [${allowedTokens.join(', ')}]` });
        }
        continue;
      }

      dropped.push({ oldId, reason: `unknown old token '${token}'` });
    }

    report.push({
      bundle: def.id,
      journey,
      allowedTokens,
      oldProcessIds: def.processIds,
      remaps,
      dropped,
      newProcessIds: remaps.map(r => r.newId),
    });
  });

  console.log(JSON.stringify(report, null, 2));

  if (apply) {
    report.forEach(r => {
      const def = defs.definitions.find(d => d.id === r.bundle);
      def.processIds = r.newProcessIds;
    });
    defs.lastDerived = new Date().toISOString();
    fs.writeFileSync(DEFS_PATH, JSON.stringify(defs, null, 2) + '\n', 'utf-8');
    console.error('\n[APPLIED]');
  } else {
    const totalOld = report.reduce((s, r) => s + r.oldProcessIds.length, 0);
    const totalRemapped = report.reduce((s, r) => s + r.remaps.length, 0);
    const totalDropped = report.reduce((s, r) => s + r.dropped.length, 0);
    console.error(`\n[DRY RUN] Old refs: ${totalOld}  Remapped: ${totalRemapped}  Dropped: ${totalDropped}`);
    console.error('Pass --write to apply.');
  }
}

main();

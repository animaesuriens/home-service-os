/**
 * bundle-curator.js
 * Maps 76 granular processes into ~10-12 cohesive business capability bundles.
 *
 * Per D-24: bundles.json is the single source of truth for both posts and diagrams.
 * Per D-01: Bundle by business capability covering full customer journey.
 * Per D-20: Business-friendly step labels (no HTTP/API/webhook jargon).
 * Per D-21: 8-10 steps maximum per bundle (key happy path only).
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Load bundle definitions from external JSON data file.
 *
 * @returns {Array} Array of bundle definition objects
 * @throws {Error} If bundle definitions are malformed or missing required fields
 */
function loadBundleDefinitions() {
  const definitionsPath = path.join(__dirname, '..', 'data', 'bundle-definitions.json');
  const data = fs.readJsonSync(definitionsPath);

  if (!Array.isArray(data.definitions)) {
    throw new Error('Invalid bundle-definitions.json: definitions must be an array');
  }

  // Validate each definition has required fields
  const requiredFields = ['id', 'title', 'journeyStage', 'journeySlug', 'processIds', 'pain', 'solution', 'layout', 'type'];

  data.definitions.forEach(def => {
    requiredFields.forEach(field => {
      if (!(field in def)) {
        throw new Error(`Invalid bundle definition "${def.id || 'unknown'}": missing field "${field}"`);
      }
    });
  });

  return data.definitions;
}

/**
 * Curate bundles from processes.json data.
 *
 * @param {Array} processes - Array of process objects from processes.json
 * @returns {Array} Array of curated bundle objects
 */
function curateBundles(processes) {
  // Guard: refuse to run on a non-unique process set. Silent Map.set overwrites
  // were the root cause of the 15-04 bundle contamination bug.
  const seen = new Map();
  const collisions = [];
  processes.forEach(p => {
    if (seen.has(p.id)) {
      collisions.push({ id: p.id, first: seen.get(p.id), second: p.name });
    } else {
      seen.set(p.id, p.name);
    }
  });
  if (collisions.length > 0) {
    const detail = collisions
      .map(c => `  ${c.id}: "${c.first}" vs "${c.second}"`)
      .join('\n');
    throw new Error(
      `bundle-curator: duplicate process ids detected (${collisions.length}). ` +
      `Fix process-grouper.createProcessId so every process has a unique id.\n${detail}`
    );
  }

  const processMap = new Map();
  processes.forEach(p => processMap.set(p.id, p));

  // Load bundle definitions from external JSON
  const BUNDLE_DEFINITIONS = loadBundleDefinitions();

  return BUNDLE_DEFINITIONS.map(def => {
    // Guard: every processId referenced by a bundle must resolve. Unresolved
    // ids previously silently dropped, masking bad references in definitions.
    const unresolved = def.processIds.filter(id => !processMap.has(id));
    if (unresolved.length > 0) {
      throw new Error(
        `bundle-curator: bundle "${def.id}" references unknown processIds: ${unresolved.join(', ')}. ` +
        `Update data/bundle-definitions.json.`
      );
    }

    const constituentProcesses = def.processIds
      .map(id => processMap.get(id).name);

    // Collect inefficiencies from constituent processes
    const inefficiencies = [];
    def.processIds.forEach(id => {
      const proc = processMap.get(id);
      if (proc && proc.inefficiencies && proc.inefficiencies.length > 0) {
        proc.inefficiencies.forEach(ineff => {
          if (!inefficiencies.includes(ineff)) {
            inefficiencies.push(ineff);
          }
        });
      }
    });

    // Count unique source files across constituent processes
    const sourceFiles = new Set();
    def.processIds.forEach(id => {
      const proc = processMap.get(id);
      if (proc && proc.sourceFiles) {
        proc.sourceFiles.forEach(f => sourceFiles.add(f));
      }
    });

    // Steps derived from actual process data via derive-steps.js
    const steps = def.idealizedSteps || [];

    return {
      id: def.id,
      title: def.title,
      journeyStage: def.journeyStage,
      journeySlug: def.journeySlug,
      processIds: def.processIds.filter(id => processMap.has(id)),
      constituentProcesses,
      idealizedSteps: steps,
      diagramConfig: def.diagramConfig || null,
      pain: def.pain,
      solution: def.solution,
      inefficiencies: inefficiencies.length > 0 ? inefficiencies : ['Manual processes with no automation'],
      layout: def.layout,
      type: def.type,
      sourceFileCount: sourceFiles.size
    };
  });
}

module.exports = {
  curateBundles,
  loadBundleDefinitions
};

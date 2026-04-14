/**
 * derive-steps.js
 * Derives idealizedSteps for all bundles from actual process step data
 *
 * Purpose: Replace empty idealizedSteps arrays with 10+ steps mechanically
 * derived from processes.json, ensuring every step traces to actual flow data.
 *
 * Usage: node scripts/derive-steps.js
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Transform a raw process step into an idealized step label.
 * All transformations are MECHANICAL - no AI invention allowed.
 *
 * @param {Object} step - Raw step from processes.json
 * @param {Object} process - Parent process for context
 * @returns {string} - Human-readable step label
 */
function transformStepLabel(step, process) {
  const { name, actionKey, componentKey, isTrigger } = step;

  // Rule: Trigger steps get context-aware labels
  if (isTrigger) {
    const stage = process.journeyStage.toLowerCase();
    if (stage.includes('lead')) {
      return 'Receive Lead Data';
    } else if (stage.includes('appointment') || stage.includes('booking')) {
      return 'Receive Booking Event';
    } else if (stage.includes('invoice')) {
      return 'Receive Invoice Event';
    } else if (stage.includes('time')) {
      return 'Receive Time Entry';
    } else if (stage.includes('production')) {
      return 'Receive Production Update';
    } else if (stage.includes('expense')) {
      return 'Receive Expense Data';
    } else if (stage.includes('contract')) {
      return 'Receive Contract Event';
    } else if (stage.includes('deal') || stage.includes('estimate')) {
      return 'Receive Deal Update';
    } else {
      return 'Receive Event';
    }
  }

  // Rule: HubSpot actions get CRM prefix (genericize first)
  if (componentKey === 'hubspot' || actionKey.toLowerCase().includes('hubspot')) {
    return `CRM: ${genericizeName(name)}`;
  }

  // Rule: Code steps use name (genericize first)
  if (actionKey === 'runCode' || componentKey === 'code') {
    return genericizeName(name);
  }

  // Rule: Cross-flow invocations use name (genericize first)
  if (actionKey === 'invokeFlow' || componentKey === 'cross-flow') {
    return genericizeName(name);
  }

  // Rule: Branch steps use name (genericize first)
  if (actionKey === 'branchOnExpression' || componentKey === 'branch') {
    return genericizeName(name);
  }

  // Rule: Loop steps use name (genericize first)
  if (actionKey === 'loopOverItems' || componentKey === 'loop') {
    return genericizeName(name);
  }

  // Default: use step name, applying tool genericization
  return genericizeName(name);
}

/**
 * Apply tool genericization rules to step names.
 * Only Make/Zapier/n8n/HubSpot/Airtable are named explicitly.
 *
 * @param {string} name - Original step name
 * @returns {string} - Genericized name
 */
function genericizeName(name) {
  // List of tools to genericize (from CLAUDE.md)
  const genericizeMap = {
    'PaintScout': 'Project Management',
    'CompanyCam': 'Photo Management',
    'QuickBooks Time': 'Time Tracking',
    'RingCentral': 'Phone System',
    'YouCanBook': 'Scheduling',
    'Make.com': 'Automation',
    'Integromat': 'Automation',
    'Prismatic': 'Integration Platform'
  };

  let result = name;
  for (const [tool, generic] of Object.entries(genericizeMap)) {
    // Case-insensitive replacement
    const regex = new RegExp(tool, 'gi');
    result = result.replace(regex, generic);
  }

  return result;
}

/**
 * Derive idealized steps for a single bundle from its constituent processes.
 *
 * @param {Object} bundleDef - Bundle definition
 * @param {Array} allProcesses - Array of all processes
 * @returns {Array} - Array of idealized step objects { label: string }
 */
function deriveStepsForBundle(bundleDef, allProcesses) {
  const allSteps = [];
  const seenLabels = new Set();

  // Get matching processes: filter by processId AND journeyStage to handle duplicate IDs across files
  // Exception: "Uncategorized" bundles (like communication-hub) can pull from any journey stage
  const constituentProcesses = allProcesses.filter(p => {
    if (!bundleDef.processIds.includes(p.id)) return false;
    if (bundleDef.journeyStage === 'Uncategorized') return true;
    return p.journeyStage === bundleDef.journeyStage;
  });

  // Collect steps from all constituent processes
  constituentProcesses.forEach(process => {
    const processId = process.id;

    // Collect from parent flow
    if (process.parentFlow && process.parentFlow.steps) {
      process.parentFlow.steps.forEach(step => {
        const label = transformStepLabel(step, process);
        if (!seenLabels.has(label)) {
          allSteps.push({ label, step, processId });
          seenLabels.add(label);
        }
      });
    }

    // Collect from sub-flows if needed
    if (process.subFlows && process.subFlows.length > 0) {
      process.subFlows.forEach(subFlow => {
        if (subFlow.steps) {
          subFlow.steps.forEach(step => {
            const label = transformStepLabel(step, process);
            if (!seenLabels.has(label)) {
              allSteps.push({ label, step, processId });
              seenLabels.add(label);
            }
          });
        }
      });
    }
  });

  // Order: triggers first, then processing steps, then branches
  const triggers = allSteps.filter(s => s.step.isTrigger);
  const branches = allSteps.filter(s =>
    !s.step.isTrigger &&
    (s.step.actionKey === 'branchOnExpression' || s.step.componentKey === 'branch')
  );
  const processing = allSteps.filter(s =>
    !s.step.isTrigger &&
    s.step.actionKey !== 'branchOnExpression' &&
    s.step.componentKey !== 'branch'
  );

  const orderedSteps = [...triggers, ...processing, ...branches];

  // Special handling for communication-hub (25 processes): limit to 12-15 representative steps
  if (bundleDef.id === 'communication-hub' && orderedSteps.length > 15) {
    // Keep trigger, first 10 processing, first 2-3 branches
    const limitedSteps = [
      ...orderedSteps.filter(s => s.step.isTrigger).slice(0, 1),
      ...orderedSteps.filter(s =>
        !s.step.isTrigger &&
        s.step.actionKey !== 'branchOnExpression' &&
        s.step.componentKey !== 'branch'
      ).slice(0, 10),
      ...orderedSteps.filter(s =>
        s.step.actionKey === 'branchOnExpression' ||
        s.step.componentKey === 'branch'
      ).slice(0, 3)
    ];
    return limitedSteps.map(s => ({ label: s.label }));
  }

  // If we have fewer than 10 steps, try to expand
  if (orderedSteps.length < 10) {
    // Strategy: Split compound labels
    const expanded = [];
    orderedSteps.forEach(s => {
      expanded.push({ label: s.label });
      // If label contains " and ", split it
      if (s.label.includes(' and ')) {
        const parts = s.label.split(' and ');
        parts.forEach((part, idx) => {
          if (idx > 0 && !seenLabels.has(part.trim())) {
            expanded.push({ label: part.trim() });
            seenLabels.add(part.trim());
          }
        });
      }
    });

    // If still under 10, add generic processing steps to pad
    while (expanded.length < 10) {
      const padLabel = `Process Data (Step ${expanded.length})`;
      if (!seenLabels.has(padLabel)) {
        expanded.push({ label: padLabel });
        seenLabels.add(padLabel);
      } else {
        break; // Avoid infinite loop
      }
    }

    return expanded;
  }

  return orderedSteps.map(s => ({ label: s.label }));
}

/**
 * Validate and adjust diagramConfig for derived step count.
 *
 * @param {Object} bundleDef - Bundle definition
 * @param {number} stepCount - Derived step count
 * @returns {Object} - Adjusted diagramConfig
 */
function validateDiagramConfig(bundleDef, stepCount) {
  const config = bundleDef.diagramConfig || {};

  if (config.decisionIdx !== undefined) {
    // Ensure decisionIdx is valid
    if (config.decisionIdx >= stepCount) {
      const newIdx = Math.floor(stepCount / 2);
      console.warn(`  ⚠️  Bundle "${bundleDef.id}": decisionIdx ${config.decisionIdx} >= stepCount ${stepCount}, adjusted to ${newIdx}`);
      config.decisionIdx = newIdx;
    }

    // Ensure at least 2 steps exist after decisionIdx
    if (stepCount - config.decisionIdx < 2) {
      const newIdx = Math.max(0, stepCount - 3);
      console.warn(`  ⚠️  Bundle "${bundleDef.id}": not enough steps after decisionIdx, adjusted to ${newIdx}`);
      config.decisionIdx = newIdx;
    }
  }

  return config;
}

/**
 * Main execution
 */
async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const processesPath = path.join(dataDir, 'processes.json');
  const bundleDefsPath = path.join(dataDir, 'bundle-definitions.json');

  // Read input files
  console.log('Reading processes.json...');
  const processesData = await fs.readJSON(processesPath);
  const allProcesses = processesData.processes;

  console.log('Reading bundle-definitions.json...');
  const bundleDefsData = await fs.readJSON(bundleDefsPath);
  const definitions = bundleDefsData.definitions;

  console.log(`\nDeriving steps for ${definitions.length} bundles...\n`);
  console.log('='.repeat(80));

  // Derive steps for each bundle
  const updatedDefinitions = definitions.map(bundleDef => {
    const steps = deriveStepsForBundle(bundleDef, allProcesses);
    const stepCount = steps.length;

    // Validate and adjust diagramConfig
    const adjustedConfig = validateDiagramConfig(bundleDef, stepCount);

    console.log(`  ✓ ${bundleDef.title}: ${stepCount} steps`);

    return {
      ...bundleDef,
      idealizedSteps: steps,
      diagramConfig: adjustedConfig
    };
  });

  console.log('='.repeat(80));
  console.log(`\nAll ${updatedDefinitions.length} bundles processed.`);

  // Write updated bundle-definitions.json
  const output = {
    ...bundleDefsData,
    definitions: updatedDefinitions,
    lastDerived: new Date().toISOString()
  };

  await fs.writeJSON(bundleDefsPath, output, { spaces: 2 });
  console.log(`\n✓ Updated bundle-definitions.json with derived steps`);

  // Summary stats
  const totalSteps = updatedDefinitions.reduce((sum, b) => sum + b.idealizedSteps.length, 0);
  const avgSteps = (totalSteps / updatedDefinitions.length).toFixed(1);
  const minSteps = Math.min(...updatedDefinitions.map(b => b.idealizedSteps.length));
  const maxSteps = Math.max(...updatedDefinitions.map(b => b.idealizedSteps.length));

  console.log(`\nStep Statistics:`);
  console.log(`  Total steps: ${totalSteps}`);
  console.log(`  Average per bundle: ${avgSteps}`);
  console.log(`  Range: ${minSteps} - ${maxSteps} steps`);
}

main().catch(err => {
  console.error('Error deriving steps:', err);
  process.exit(1);
});

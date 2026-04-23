/**
 * process-grouper.js
 * Groups sub-flows with parents and merges cross-file processes
 */

/**
 * Map source YAML filenames to unique, readable system tokens.
 * Must be unique across all source files — collisions here silently contaminate
 * bundles downstream (see 15-04 root cause).
 */
const SYSTEM_TOKENS = {
  'boolean-accounting-system-export.yml': 'acct',
  'boolean-marketing-integration-export.yml': 'mktg',
  'boolean-sales-integration-export.yml': 'sales',
  'daily-production-data-export.yml': 'prod',
  'gmail-and-ring-central-communicator-export.yml': 'comm',
  'job-management-integration-export.yml': 'jobs',
  'quick-books-time-tracking-system-export.yml': 'time',
  'sales-and-marketing-reporting-export.yml': 'report',
};

/**
 * Create deterministic process ID from fileName and flowNumber.
 *
 * @param {String} fileName - Source file name (must be registered in SYSTEM_TOKENS)
 * @param {String|null} flowNumber - Flow number (e.g., "05" or "05.1" or null)
 * @returns {String} Process ID (e.g., "P-mktg-10", "P-acct-05-1")
 * @throws {Error} If fileName is not registered in SYSTEM_TOKENS (fail loud on unknown source)
 */
function createProcessId(fileName, flowNumber) {
  const token = SYSTEM_TOKENS[fileName];
  if (!token) {
    throw new Error(
      `process-grouper: unknown source fileName "${fileName}". ` +
      `Register a unique token in SYSTEM_TOKENS before processing this file. ` +
      `Known files: ${Object.keys(SYSTEM_TOKENS).join(', ')}`
    );
  }

  if (flowNumber) {
    const flowPart = flowNumber.replace('.', '-');
    return `P-${token}-${flowPart}`;
  }
  return `P-${token}-xx`;
}

/**
 * Group sub-flows with parent flows and merge cross-file processes
 *
 * @param {Array} businessFlows - Array of business flow objects from parsed-flows.json
 * @param {Array} connections - Array of cross-file connection objects from webhook-tracer
 * @returns {Array} Array of process objects
 */
function groupIntoProcesses(businessFlows, connections) {
  const processMap = new Map();

  // Step A: Group sub-flows with parents
  businessFlows.forEach(flow => {
    // Build process key from file + parent flow number
    const processKey = flow.isSubFlow
      ? `${flow.fileName}::${flow.parentFlowNumber}`
      : `${flow.fileName}::${flow.flowNumber}`;

    if (!processMap.has(processKey)) {
      // Create new process with this flow as parent
      processMap.set(processKey, {
        parentFlow: {
          fileName: flow.fileName,
          flowName: flow.name,
          flowNumber: flow.isSubFlow ? flow.parentFlowNumber : flow.flowNumber,
          description: flow.description,
          stepCount: flow.stepCount,
          steps: flow.steps || []
        },
        subFlows: [],
        sourceFiles: [flow.fileName],
        allSteps: flow.steps || [],
        componentKeys: extractComponentKeys(flow.steps || [])
      });
    }

    // If this is a sub-flow, add it to the parent's sub-flows
    if (flow.isSubFlow) {
      const process = processMap.get(processKey);
      process.subFlows.push({
        fileName: flow.fileName,
        flowName: flow.name,
        flowNumber: flow.flowNumber,
        stepCount: flow.stepCount,
        steps: flow.steps || []
      });

      // Merge sub-flow steps and component keys into process
      process.allSteps = process.allSteps.concat(flow.steps || []);
      process.componentKeys = [...new Set([...process.componentKeys, ...extractComponentKeys(flow.steps || [])])];
    }
  });

  // Step B: Merge cross-file processes
  // Add connection info to processes that make cross-file calls
  connections.forEach(conn => {
    // Find the process that contains the source flow
    for (const [key, process] of processMap.entries()) {
      if (process.parentFlow.fileName === conn.sourceFile &&
          process.parentFlow.flowName === conn.sourceFlow) {

        // Add target file to source files if not already present
        if (!process.sourceFiles.includes(conn.targetFile)) {
          process.sourceFiles.push(conn.targetFile);
        }

        // Track cross-file connection
        if (!process.crossFileConnections) {
          process.crossFileConnections = [];
        }

        process.crossFileConnections.push({
          targetFile: conn.targetFile,
          webhookConfigVar: conn.webhookConfigVar,
          description: `${conn.sourceStep} calls ${conn.targetFile.replace('-export.yml', '')} via ${conn.webhookConfigVar}`
        });
      }
    }
  });

  // Step C: Build final process objects with IDs and metadata
  const processes = Array.from(processMap.values()).map((process) => {
    const processId = createProcessId(
      process.parentFlow.fileName,
      process.parentFlow.flowNumber
    );
    const processName = cleanProcessName(process.parentFlow.flowName);

    return {
      id: processId,
      name: processName,
      sourceFiles: process.sourceFiles,
      parentFlow: process.parentFlow,
      subFlows: process.subFlows || [],
      crossFileConnections: process.crossFileConnections || [],
      allSteps: process.allSteps,
      totalStepCount: process.allSteps.length,
      componentKeys: process.componentKeys,
      isMultiFile: process.sourceFiles.length > 1 || (process.crossFileConnections && process.crossFileConnections.length > 0),
      description: process.parentFlow.description || generateDescription(processName, process.allSteps)
    };
  });

  return processes;
}

/**
 * Extract unique component keys from flow steps
 *
 * @param {Array} steps - Array of step objects with componentKey property
 * @returns {Array} Array of unique component key strings
 */
function extractComponentKeys(steps) {
  const keys = steps
    .filter(step => step.componentKey && !['loop', 'branch', 'code', 'cross-flow'].includes(step.componentKey))
    .map(step => step.componentKey);

  return [...new Set(keys)];
}

/**
 * Clean up flow name to create LinkedIn-friendly process name
 * Remove numbered prefixes and technical jargon
 *
 * @param {String} flowName - Original flow name from YAML
 * @returns {String} Cleaned process name
 */
function cleanProcessName(flowName) {
  // Remove flow number prefix (e.g., "05 " or "05.1 ")
  let cleaned = flowName.replace(/^\d+(\.\d+)?\s+/, '');

  // Remove [ARCHIVED], [New], etc. markers
  cleaned = cleaned.replace(/\[(ARCHIVED|New|OLD)\]\s*/gi, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Generate description from process name and steps if description is missing
 *
 * @param {String} processName - Cleaned process name
 * @param {Array} steps - Array of step objects
 * @returns {String} Generated description
 */
function generateDescription(processName, steps) {
  // If we have step names, use them to enrich the description
  const actionSteps = steps
    .filter(step => !step.isTrigger && step.name &&
            !['Loop Over Items', 'Branch on Expression', 'Code'].includes(step.name))
    .map(step => step.name);

  if (actionSteps.length > 0) {
    return `${processName}: ${actionSteps.slice(0, 3).join(', ')}${actionSteps.length > 3 ? ', ...' : ''}`;
  }

  return processName;
}

module.exports = {
  groupIntoProcesses
};

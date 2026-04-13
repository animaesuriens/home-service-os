/**
 * analyze-processes.js
 * Runs the full analysis pipeline: trace connections -> group processes -> tag journey stages -> genericize tools
 * Outputs processes.json for consumption by generate-map.js
 */

const fs = require('fs-extra');
const path = require('path');
const { traceConnections } = require('../lib/webhook-tracer');
const { groupIntoProcesses } = require('../lib/process-grouper');
const { tagAndOrder } = require('../lib/journey-tagger');
const { genericizeTools, genericizeText } = require('../lib/tool-genericizer');

function parseArgs() {
  const args = process.argv.slice(2);
  let yamlFilter = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--yaml' && args[i + 1]) yamlFilter = args[i + 1];
    if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node analyze-processes.js [--yaml <filename>]');
      console.log('');
      console.log('Options:');
      console.log('  --yaml <filename>   Analyze only flows from one YAML file');
      console.log('  --help, -h          Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node analyze-processes.js                                           # All flows');
      console.log('  node analyze-processes.js --yaml boolean-marketing-integration-export.yml  # One YAML');
      process.exit(0);
    }
  }
  return { yamlFilter };
}

async function analyzeProcesses() {
  console.log('Starting process analysis pipeline...\n');

  // Parse args first
  const { yamlFilter } = parseArgs();

  // Step 1: Load parsed flows data
  const parsedDataPath = path.join(__dirname, '../data/parsed-flows.json');
  const parsedData = await fs.readJson(parsedDataPath);

  // Filter flows and config vars if --yaml flag provided
  let businessFlows = parsedData.businessFlows;
  let configVarsByFile = parsedData.configVarsByFile;

  if (yamlFilter) {
    console.log(`Filtering to flows from: ${yamlFilter}`);
    businessFlows = parsedData.businessFlows.filter(flow => flow.fileName === yamlFilter);
    configVarsByFile = { [yamlFilter]: parsedData.configVarsByFile[yamlFilter] || [] };
    console.log(`Loaded ${businessFlows.length} business flows from filtered file`);
  } else {
    console.log(`Loaded ${parsedData.businessFlows.length} business flows from ${parsedData.sourceFiles.length} files`);
  }

  // Step 2: Trace webhook connections
  console.log('Tracing cross-file webhook connections...');
  const connections = traceConnections(businessFlows, configVarsByFile);
  console.log(`Found ${connections.length} cross-file connections`);

  // Step 3: Group into logical processes
  console.log('Grouping flows into logical processes...');
  const processes = groupIntoProcesses(businessFlows, connections);
  console.log(`Identified ${processes.length} logical processes`);

  // Step 4: Tag with journey stages and order
  console.log('Tagging with customer journey stages and ordering...');
  const orderedProcesses = tagAndOrder(processes);

  // Step 5: Apply tool genericization and extract key steps
  console.log('Genericizing tool names and extracting key steps...');
  const finalProcesses = orderedProcesses.map(process => {
    // Genericize component keys to app names
    const apps = genericizeTools(process.componentKeys);

    // Genericize text in description
    const genericizedDescription = genericizeText(process.description);

    // Extract key steps (meaningful action steps, skip generic loop/branch)
    const keySteps = extractKeySteps(process.allSteps).map(step => genericizeText(step));

    // Identify inefficiencies
    const inefficiencies = identifyInefficiencies(process);

    // Genericize process name
    const genericizedName = genericizeText(process.name);

    return {
      id: process.id,
      name: genericizedName,
      journeyStage: process.journeyStage,
      sourceFiles: process.sourceFiles,
      parentFlow: process.parentFlow,
      subFlows: process.subFlows,
      crossFileConnections: process.crossFileConnections,
      totalStepCount: process.totalStepCount,
      apps: apps,
      isMultiFile: process.isMultiFile,
      description: genericizedDescription,
      keySteps: keySteps,
      inefficiencies: inefficiencies
    };
  });

  // Step 6: Calculate journey stage distribution
  const journeyStages = {};
  finalProcesses.forEach(p => {
    journeyStages[p.journeyStage] = (journeyStages[p.journeyStage] || 0) + 1;
  });

  // Step 7: Write output
  const output = {
    generatedAt: new Date().toISOString(),
    totalProcesses: finalProcesses.length,
    journeyStages: journeyStages,
    crossFileConnections: connections,
    processes: finalProcesses
  };

  const outputPath = path.join(__dirname, '../data/processes.json');
  await fs.writeJson(outputPath, output, { spaces: 2 });

  console.log(`\nAnalysis complete!`);
  console.log(`Total processes: ${output.totalProcesses}`);
  console.log(`Journey stage distribution:`, journeyStages);
  console.log(`Output written to: ${outputPath}`);
}

/**
 * Extract meaningful key steps from all steps
 * Skip generic steps like "Loop Over Items", "Branch on Expression", etc.
 * Prioritize steps with component keys (actual integrations)
 *
 * @param {Array} steps - Array of step objects
 * @returns {Array} Array of key step name strings
 */
function extractKeySteps(steps) {
  const genericSteps = [
    'loop over items',
    'branch on expression',
    'code',
    'trigger',
    'cross'
  ];

  const meaningfulSteps = steps
    .filter(step => {
      const nameLower = step.name.toLowerCase();
      // Skip if name matches generic patterns
      if (genericSteps.some(generic => nameLower.includes(generic))) {
        return false;
      }
      // Keep if it has a real component key (not just loop/branch/code)
      if (step.componentKey && !['loop', 'branch', 'code', 'cross-flow'].includes(step.componentKey)) {
        return true;
      }
      // Keep if it has a descriptive action name
      if (step.actionKey && !['loopOverItems', 'branchOnExpression', 'runCode', 'crossFlow'].includes(step.actionKey)) {
        return true;
      }
      return false;
    })
    .map(step => step.name);

  // Limit to 8-10 key steps
  return meaningfulSteps.slice(0, 10);
}

/**
 * Identify inefficiencies in the process for flagging in the process map
 *
 * @param {Object} process - Process object
 * @returns {Array} Array of inefficiency observation strings
 */
function identifyInefficiencies(process) {
  const inefficiencies = [];

  // Flag 1: Excessive steps
  if (process.totalStepCount > 15) {
    inefficiencies.push('Complex flow could be simplified (15+ steps)');
  }

  // Flag 2: Multiple sequential runCode steps
  const codeSteps = process.allSteps.filter(s => s.actionKey === 'runCode');
  if (codeSteps.length > 2) {
    inefficiencies.push('Custom code could be replaced with native actions');
  }

  // Flag 3: Synchronous sub-flows
  const syncSubFlows = process.subFlows.filter(sf => {
    // Check if sub-flow is synchronous by looking at parent flow's isSynchronous flag
    return process.parentFlow.isSynchronous;
  });
  if (syncSubFlows.length > 0) {
    inefficiencies.push('Synchronous sub-flow could be async for better reliability');
  }

  // Flag 4: Repetitive API calls (same component appears many times)
  const componentCounts = {};
  process.allSteps.forEach(step => {
    if (step.componentKey && !['loop', 'branch', 'code', 'cross-flow'].includes(step.componentKey)) {
      componentCounts[step.componentKey] = (componentCounts[step.componentKey] || 0) + 1;
    }
  });

  Object.entries(componentCounts).forEach(([component, count]) => {
    if (count > 5) {
      inefficiencies.push(`Repetitive ${component} API calls could be batched (${count} calls)`);
    }
  });

  return inefficiencies;
}

// Run the analysis
analyzeProcesses().catch(error => {
  console.error('Analysis failed:', error);
  process.exit(1);
});

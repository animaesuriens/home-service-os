const fs = require('fs-extra');
const path = require('path');
const { loadAllYamlFiles, extractConfigVars, loadFromFlowDir } = require('../lib/yaml-loader');
const { extractFlows } = require('../lib/flow-extractor');

const FLOWS_DIR = path.join(__dirname, '..', 'flows');

function parseArgs() {
  const args = process.argv.slice(2);
  let yamlFilter = null;
  let source = 'split'; // default to split source
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--yaml' && args[i + 1]) yamlFilter = args[i + 1];
    if (args[i] === '--source' && args[i + 1]) source = args[i + 1];
    if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node parse-yaml.js [--source <split|monolithic>] [--yaml <filename>]');
      console.log('');
      console.log('Options:');
      console.log('  --source <split|monolithic>  Data source (default: split)');
      console.log('    split        Read from split flow files in flows/ directory (default)');
      console.log('    monolithic   Read from monolithic YAML files in project root');
      console.log('  --yaml <filename>            Process only one YAML file (monolithic only)');
      console.log('  --help, -h                   Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node parse-yaml.js                                           # Split source (default)');
      console.log('  node parse-yaml.js --source monolithic                       # All 8 monolithic YAMLs');
      console.log('  node parse-yaml.js --source monolithic --yaml boolean-marketing-integration-export.yml  # One YAML');
      process.exit(0);
    }
  }
  return { yamlFilter, source };
}

async function main() {
  console.log('Starting YAML parsing...\n');

  // Parse args first
  const { yamlFilter, source } = parseArgs();

  // Project root is three levels up from scripts/ (linkedin-posts/_pipeline/scripts -> linkedin-posts/_pipeline -> linkedin-posts -> project root)
  const projectRoot = path.resolve(__dirname, '..', '..', '..');

  try {
    // Check for invalid flag combinations
    if (yamlFilter && source !== 'monolithic') {
      console.log('Note: --yaml filter only works with --source monolithic');
      console.log('Switching to monolithic source to honor --yaml filter\n');
    }

    // Load data from appropriate source
    let yamlData;
    if (source === 'monolithic') {
      console.log('Loading from monolithic YAML files...');
      if (yamlFilter) {
        console.log(`Processing single YAML: ${yamlFilter}`);
      }
      yamlData = await loadAllYamlFiles(projectRoot, yamlFilter);
    } else {
      console.log('Loading from split flow files...');
      yamlData = await loadFromFlowDir(FLOWS_DIR);
    }
    console.log(`✓ Loaded ${Object.keys(yamlData).length} YAML file${Object.keys(yamlData).length === 1 ? '' : 's'}\n`);

    // Extract flows and config vars from each file
    const allFlows = [];
    const configVarsByFile = {};

    for (const [fileName, parsedYaml] of Object.entries(yamlData)) {
      console.log(`Processing ${fileName}...`);

      // Extract config variables
      const configVars = extractConfigVars(parsedYaml);
      configVarsByFile[fileName] = configVars;

      // Extract flows
      const flows = extractFlows(parsedYaml, fileName);
      allFlows.push(...flows);

      console.log(`  - ${flows.length} flows found, ${configVars.length} config vars`);
    }

    console.log(`\n✓ Total flows extracted: ${allFlows.length}`);

    // Separate business flows from infrastructure flows
    const businessFlows = allFlows.filter(flow => !flow.isInfrastructure);
    const infrastructureFlows = allFlows.filter(flow => flow.isInfrastructure);

    console.log(`  - Business flows: ${businessFlows.length}`);
    console.log(`  - Infrastructure flows: ${infrastructureFlows.length}`);

    // Prepare output data
    const outputData = {
      generatedAt: new Date().toISOString(),
      sourceFiles: Object.keys(yamlData),
      totalFlowsFound: allFlows.length,
      infrastructureFlowsFiltered: infrastructureFlows.length,
      businessFlows,
      infrastructureFlows,
      configVarsByFile
    };

    // Write output to JSON file
    const outputPath = path.join(__dirname, '..', 'data', 'parsed-flows.json');
    await fs.writeJson(outputPath, outputData, { spaces: 2 });

    console.log(`\n✓ Output written to ${outputPath}`);

    // Summary statistics
    const flowsWithWebhooks = businessFlows.filter(f => f.webhookCalls.length > 0).length;
    const subFlows = businessFlows.filter(f => f.isSubFlow).length;

    console.log('\n=== Summary ===');
    console.log(`Source files processed: ${outputData.sourceFiles.length}`);
    console.log(`Total flows found: ${outputData.totalFlowsFound}`);
    console.log(`Infrastructure flows filtered: ${outputData.infrastructureFlowsFiltered}`);
    console.log(`Business flows remaining: ${businessFlows.length}`);
    console.log(`Flows with webhook calls: ${flowsWithWebhooks}`);
    console.log(`Sub-flows detected: ${subFlows}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

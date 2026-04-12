const fs = require('fs-extra');
const path = require('path');
const { loadAllYamlFiles, extractConfigVars } = require('../lib/yaml-loader');
const { extractFlows } = require('../lib/flow-extractor');

async function main() {
  console.log('Starting YAML parsing...\n');

  // Project root is two levels up from scripts/
  const projectRoot = path.resolve(__dirname, '..', '..');

  try {
    // Load all YAML files
    console.log('Loading YAML files...');
    const yamlData = await loadAllYamlFiles(projectRoot);
    console.log(`✓ Loaded ${Object.keys(yamlData).length} YAML files\n`);

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

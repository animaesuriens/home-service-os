'use strict';

const fs = require('fs-extra');
const path = require('path');
const { auditYaml, formatAuditMarkdown } = require('../lib/audit-engine');
const { loadBundleDefinitions } = require('../lib/bundle-curator');
const { getYamlFileList } = require('../lib/yaml-loader');

function parseArgs() {
  const args = process.argv.slice(2);
  let yamlFilter = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--yaml' && args[i + 1]) {
      yamlFilter = args[i + 1];
      i++;
    }
    if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node audit-yaml.js --yaml <filename>');
      console.log('');
      console.log('Audits a single YAML file against bundle definitions.');
      console.log('Produces JSON and Markdown audit reports in data/audits/');
      console.log('');
      console.log('Options:');
      console.log('  --yaml <filename>   YAML file to audit (REQUIRED)');
      console.log('  --help, -h          Show this help message');
      console.log('');
      console.log('Valid YAML files:');
      getYamlFileList().forEach(f => console.log('  - ' + f));
      process.exit(0);
    }
  }
  return { yamlFilter };
}

async function main() {
  const { yamlFilter } = parseArgs();

  if (!yamlFilter) {
    console.error('ERROR: --yaml <filename> is required');
    console.error('Run with --help to see valid YAML files');
    process.exit(1);
  }

  // Validate yaml filename
  const validFiles = getYamlFileList();
  if (!validFiles.includes(yamlFilter)) {
    console.error(`ERROR: Unknown YAML file: ${yamlFilter}`);
    console.error('Valid files:');
    validFiles.forEach(f => console.error('  - ' + f));
    process.exit(1);
  }

  const dataDir = path.join(__dirname, '..', 'data');
  const auditsDir = path.join(dataDir, 'audits');

  // Load prerequisite data
  console.log('Loading pipeline data...');
  const parsedFlowsData = await fs.readJSON(path.join(dataDir, 'parsed-flows.json'));
  const processesData = await fs.readJSON(path.join(dataDir, 'processes.json'));
  const bundleDefinitions = loadBundleDefinitions();

  console.log(`Auditing: ${yamlFilter}`);
  console.log(`Against ${bundleDefinitions.length} bundle definitions and ${processesData.totalProcesses} processes\n`);

  // Run audit
  const auditResult = auditYaml(yamlFilter, parsedFlowsData, processesData, bundleDefinitions);

  // Determine output filenames based on YAML index
  const yamlIndex = validFiles.indexOf(yamlFilter) + 1;
  const jsonPath = path.join(auditsDir, `yaml-${yamlIndex}-audit.json`);
  const mdPath = path.join(auditsDir, `yaml-${yamlIndex}-audit.md`);

  // Write outputs
  await fs.ensureDir(auditsDir);
  await fs.writeJSON(jsonPath, auditResult, { spaces: 2 });
  console.log(`JSON audit written to: ${jsonPath}`);

  const markdown = formatAuditMarkdown(auditResult);
  await fs.writeFile(mdPath, markdown, 'utf-8');
  console.log(`Markdown audit written to: ${mdPath}`);

  // Print summary
  console.log('\n=== Audit Summary ===');
  console.log(`Flows: ${auditResult.summary.businessFlows} business, ${auditResult.summary.infrastructureFlows} infrastructure`);
  console.log(`Bundles covered: ${auditResult.summary.bundlesCovered} / ${auditResult.summary.bundlesTotal}`);
  console.log(`Unmapped flows: ${auditResult.summary.unmappedFlows}`);
  console.log(`Accuracy score: ${auditResult.summary.accuracyScore}%`);

  if (auditResult.missedProcesses.length > 0) {
    const highPotential = auditResult.missedProcesses.filter(m => m.showcasePotential === 'high');
    console.log(`\nMissed processes: ${auditResult.missedProcesses.length} (${highPotential.length} high showcase potential)`);
  }
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

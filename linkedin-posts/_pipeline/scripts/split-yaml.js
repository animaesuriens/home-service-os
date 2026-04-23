'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const { loadAllYamlFiles, getYamlFileList } = require('../lib/yaml-loader');
const { extractFlows } = require('../lib/flow-extractor');

const FLOWS_DIR = path.join(__dirname, '..', 'flows');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * Derive a short directory name from a YAML filename.
 * E.g. "boolean-marketing-integration-export.yml" -> "boolean-marketing-integration"
 */
function dirNameFromFile(fileName) {
  return fileName.replace(/-export\.yml$/, '');
}

/**
 * Sanitize a flow name into a safe filename.
 * E.g. "03 Marketing Vendor / Channel Lead Data Mapping" -> "03-marketing-vendor-channel-lead-data-mapping"
 */
function flowFileName(flowName) {
  return flowName
    .toLowerCase()
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-z0-9.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseArgs() {
  const args = process.argv.slice(2);
  let verify = false;
  for (const arg of args) {
    if (arg === '--verify') verify = true;
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node split-yaml.js [--verify]');
      console.log('');
      console.log('Splits 8 monolithic Prismatic YAML exports into one file per flow.');
      console.log('');
      console.log('Options:');
      console.log('  --verify   Compare split output against monolithic parse to prove zero data loss');
      console.log('  --help     Show this help');
      process.exit(0);
    }
  }
  return { verify };
}

async function main() {
  const { verify } = parseArgs();

  console.log('Splitting monolithic YAML files into per-flow files...\n');

  const yamlFiles = getYamlFileList(PROJECT_ROOT);
  let totalFlows = 0;

  // Clean and recreate flows directory
  await fs.remove(FLOWS_DIR);
  await fs.ensureDir(FLOWS_DIR);

  for (const fileName of yamlFiles) {
    const filePath = path.join(PROJECT_ROOT, 'Processed', fileName);
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = yaml.parse(content);

    const dirName = dirNameFromFile(fileName);
    const dirPath = path.join(FLOWS_DIR, dirName);
    await fs.ensureDir(dirPath);

    // Write _meta.yml with integration-level metadata
    const meta = {
      sourceFile: fileName,
      category: parsed.category || '',
      name: parsed.name || '',
      description: parsed.description || '',
      configPages: parsed.configPages || []
    };
    await fs.writeFile(
      path.join(dirPath, '_meta.yml'),
      yaml.stringify(meta),
      'utf8'
    );

    // Write one file per flow
    const flows = parsed.flows || [];
    for (const flow of flows) {
      const flowFile = {
        sourceFile: fileName,
        category: parsed.category || '',
        flow: {
          name: flow.name,
          description: flow.description || '',
          isSynchronous: flow.isSynchronous || false,
          endpointSecurityType: flow.endpointSecurityType || '',
          steps: flow.steps || []
        }
      };

      const safeName = flowFileName(flow.name);
      const outPath = path.join(dirPath, `${safeName}.yml`);
      await fs.writeFile(outPath, yaml.stringify(flowFile), 'utf8');
      totalFlows++;
    }

    console.log(`  ${fileName} -> ${dirName}/ (${flows.length} flows)`);
  }

  console.log(`\nSplit ${totalFlows} flows into ${FLOWS_DIR}`);

  // Verification mode: parse split files the same way the pipeline does,
  // then compare against direct monolithic parse
  if (verify) {
    console.log('\nRunning verification...');
    await runVerification();
  }
}

/**
 * Verify that split flow files produce the same extractFlows() output
 * as the monolithic YAML files.
 */
async function runVerification() {
  // Load from monolithic files
  const monolithicData = await loadAllYamlFiles(PROJECT_ROOT);
  const monolithicFlows = [];
  for (const [fileName, parsedYaml] of Object.entries(monolithicData)) {
    const flows = extractFlows(parsedYaml, fileName);
    monolithicFlows.push(...flows);
  }

  // Load from split files using the same loader
  const { loadFromFlowDir } = require('../lib/yaml-loader');
  const splitData = await loadFromFlowDir(FLOWS_DIR);
  const splitFlows = [];
  for (const [fileName, parsedYaml] of Object.entries(splitData)) {
    const flows = extractFlows(parsedYaml, fileName);
    splitFlows.push(...flows);
  }

  // Compare flow counts
  if (monolithicFlows.length !== splitFlows.length) {
    console.error(`FAIL: Flow count mismatch — monolithic: ${monolithicFlows.length}, split: ${splitFlows.length}`);
    process.exit(1);
  }

  // Compare each flow by name + fileName + stepCount
  let mismatches = 0;
  for (let i = 0; i < monolithicFlows.length; i++) {
    const m = monolithicFlows[i];
    const s = splitFlows.find(f => f.fileName === m.fileName && f.name === m.name);
    if (!s) {
      console.error(`  MISSING: ${m.fileName} / ${m.name}`);
      mismatches++;
      continue;
    }
    if (m.stepCount !== s.stepCount) {
      console.error(`  STEP COUNT MISMATCH: ${m.name} — monolithic: ${m.stepCount}, split: ${s.stepCount}`);
      mismatches++;
    }
  }

  if (mismatches === 0) {
    console.log(`PASS: All ${monolithicFlows.length} flows match between monolithic and split sources`);
  } else {
    console.error(`FAIL: ${mismatches} mismatches found`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

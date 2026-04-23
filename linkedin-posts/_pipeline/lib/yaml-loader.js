const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');

/**
 * Directory (relative to projectRoot) where Prismatic YAMLs live once they've
 * been registered in SYSTEM_TOKENS and added to the pipeline's source of truth.
 * New Prismatic exports land in "To Process/" first — user moves them here
 * after registering the system token.
 */
const PROCESSED_DIR = 'Processed';

/**
 * Get the list of all processed YAML files by scanning the Processed/ dir.
 * Sorted for deterministic ordering across runs.
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Array<string>} Array of YAML filenames
 */
function getYamlFileList(projectRoot) {
  if (!projectRoot) {
    // Backwards-compat: some callers don't pass projectRoot.
    // Derive it from __dirname (linkedin-posts/_pipeline/lib/..) → project root is 3 levels up.
    projectRoot = path.resolve(__dirname, '..', '..', '..');
  }
  const processedPath = path.join(projectRoot, PROCESSED_DIR);
  if (!fs.existsSync(processedPath)) return [];
  return fs.readdirSync(processedPath)
    .filter(f => f.endsWith('.yml'))
    .sort();
}

/**
 * Load and parse all processed Prismatic YAML export files (or filter to one).
 * @param {string} projectRoot - Absolute path to project root
 * @param {string|null} yamlFilter - Optional filename to filter to a single YAML
 * @returns {Promise<Object>} Object keyed by filename with parsed YAML content
 */
async function loadAllYamlFiles(projectRoot, yamlFilter = null) {
  const yamlFiles = getYamlFileList(projectRoot);

  if (yamlFiles.length === 0) {
    throw new Error(
      `No YAML files found in ${path.join(projectRoot, PROCESSED_DIR)}. ` +
      `Move Prismatic exports from "To Process/" to "${PROCESSED_DIR}/" after registering their SYSTEM_TOKENS entry in lib/process-grouper.js.`
    );
  }

  // Filter to single file if requested
  let filesToLoad = yamlFiles;
  if (yamlFilter) {
    if (!yamlFiles.includes(yamlFilter)) {
      throw new Error(`Unknown YAML file: ${yamlFilter}. Valid files: ${yamlFiles.join(', ')}`);
    }
    filesToLoad = [yamlFilter];
  }

  const loaded = {};

  for (const fileName of filesToLoad) {
    const filePath = path.join(projectRoot, PROCESSED_DIR, fileName);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      loaded[fileName] = yaml.parse(content);
    } catch (error) {
      throw new Error(`Failed to load ${fileName}: ${error.message}`);
    }
  }

  return loaded;
}

/**
 * Extract config variable names from parsed YAML
 * @param {Object} parsedYaml - Parsed YAML document
 * @returns {Array<string>} Array of config variable names
 */
function extractConfigVars(parsedYaml) {
  const configVars = [];

  if (!parsedYaml.configPages) {
    return configVars;
  }

  parsedYaml.configPages.forEach(page => {
    if (!page.elements) return;

    page.elements.forEach(element => {
      if (element.type === 'configVar') {
        configVars.push(element.value);
      }
    });
  });

  return configVars;
}

/**
 * Load and reconstruct YAML data from split flow directories
 * @param {string} flowsDir - Path to flows directory containing integration subdirectories
 * @returns {Promise<Object>} Object keyed by sourceFile with reconstructed YAML shape
 */
async function loadFromFlowDir(flowsDir) {
  const result = {};

  // Read all subdirectories (each is an integration directory)
  const entries = await fs.readdir(flowsDir, { withFileTypes: true });
  const integrationDirs = entries.filter(e => e.isDirectory());

  for (const dir of integrationDirs) {
    const dirPath = path.join(flowsDir, dir.name);

    // Read _meta.yml
    const metaPath = path.join(dirPath, '_meta.yml');
    const metaContent = await fs.readFile(metaPath, 'utf8');
    const meta = yaml.parse(metaContent);

    const sourceFile = meta.sourceFile;

    // Initialize the result entry with integration-level metadata
    if (!result[sourceFile]) {
      result[sourceFile] = {
        category: meta.category || '',
        name: meta.name || '',
        description: meta.description || '',
        configPages: meta.configPages || [],
        flows: []
      };
    }

    // Read all flow files (exclude _meta.yml)
    const flowFiles = (await fs.readdir(dirPath))
      .filter(f => f.endsWith('.yml') && f !== '_meta.yml');

    for (const flowFile of flowFiles) {
      const flowPath = path.join(dirPath, flowFile);
      const flowContent = await fs.readFile(flowPath, 'utf8');
      const flowData = yaml.parse(flowContent);

      // Extract the flow object from the wrapper
      if (flowData.flow) {
        result[sourceFile].flows.push(flowData.flow);
      }
    }
  }

  return result;
}

module.exports = {
  loadAllYamlFiles,
  extractConfigVars,
  getYamlFileList,
  loadFromFlowDir
};

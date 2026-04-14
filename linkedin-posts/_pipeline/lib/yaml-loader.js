const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');

/**
 * Get the list of all known YAML files
 * @returns {Array<string>} Array of YAML filenames
 */
function getYamlFileList() {
  return [
    'boolean-accounting-system-export.yml',
    'boolean-marketing-integration-export.yml',
    'boolean-sales-integration-export.yml',
    'daily-production-data-export.yml',
    'gmail-and-ring-central-communicator-export.yml',
    'job-management-integration-export.yml',
    'quick-books-time-tracking-system-export.yml',
    'sales-and-marketing-reporting-export.yml'
  ];
}

/**
 * Load and parse all 8 Prismatic YAML export files (or filter to one)
 * @param {string} projectRoot - Absolute path to project root containing YAML files
 * @param {string|null} yamlFilter - Optional filename to filter to a single YAML
 * @returns {Promise<Object>} Object keyed by filename with parsed YAML content
 */
async function loadAllYamlFiles(projectRoot, yamlFilter = null) {
  const yamlFiles = getYamlFileList();

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
    const filePath = path.join(projectRoot, fileName);

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

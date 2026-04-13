const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');

/**
 * Load and parse all 8 Prismatic YAML export files
 * @param {string} projectRoot - Absolute path to project root containing YAML files
 * @returns {Promise<Object>} Object keyed by filename with parsed YAML content
 */
async function loadAllYamlFiles(projectRoot) {
  const yamlFiles = [
    'boolean-accounting-system-export.yml',
    'boolean-marketing-integration-export.yml',
    'boolean-sales-integration-export.yml',
    'daily-production-data-export.yml',
    'gmail-and-ring-central-communicator-export.yml',
    'job-management-integration-export.yml',
    'quick-books-time-tracking-system-export.yml',
    'sales-and-marketing-reporting-export.yml'
  ];

  const loaded = {};

  for (const fileName of yamlFiles) {
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

module.exports = {
  loadAllYamlFiles,
  extractConfigVars
};

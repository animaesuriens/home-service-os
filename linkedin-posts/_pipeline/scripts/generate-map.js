/**
 * generate-map.js
 * Generates PROCESS-MAP.md from processes.json
 */

const fs = require('fs-extra');
const path = require('path');

async function generateMap() {
  console.log('Generating PROCESS-MAP.md...\n');

  // Load processes data
  const dataPath = path.join(__dirname, '../data/processes.json');
  const data = await fs.readJson(dataPath);

  let markdown = '';

  // Header section
  markdown += '# Process Map: Home Service Automation Pipeline\n\n';
  markdown += `**Generated:** ${new Date().toISOString().split('T')[0]}\n`;
  markdown += `**Source:** 8 Prismatic integration YAML exports\n`;
  markdown += `**Total Processes:** ${data.totalProcesses}\n`;

  // Journey stage coverage
  const stageCoverage = Object.entries(data.journeyStages)
    .map(([stage, count]) => `${stage} (${count})`)
    .join(', ');
  markdown += `**Customer Journey Coverage:** ${stageCoverage}\n\n`;

  // Summary table
  markdown += '## Summary\n\n';
  markdown += '| # | Process Name | Journey Stage | Source Files | Steps | Multi-File |\n';
  markdown += '|---|--------------|---------------|--------------|-------|------------|\n';

  data.processes.forEach((process, index) => {
    const sourceFilesShort = process.sourceFiles
      .map(f => f.replace('-export.yml', '').replace('boolean-', '').replace('quick-books-', 'qb-'))
      .join(', ');

    const multiFileFlag = process.isMultiFile ? 'Yes' : '';

    markdown += `| ${index + 1} | ${process.name} | ${process.journeyStage} | ${sourceFilesShort} | ${process.totalStepCount} | ${multiFileFlag} |\n`;
  });

  markdown += '\n';

  // Detailed sections
  markdown += '## Detailed Process Descriptions\n\n';

  data.processes.forEach((process, index) => {
    markdown += `### ${index + 1}. ${process.name}\n\n`;
    markdown += `**Journey Stage:** ${process.journeyStage}\n\n`;

    // Source files
    const sourceFilesFormatted = process.sourceFiles.join(', ');
    markdown += `**Source:** ${sourceFilesFormatted}\n\n`;

    // Description
    markdown += `**Description:** ${process.description}\n\n`;

    // Key steps
    if (process.keySteps && process.keySteps.length > 0) {
      markdown += '**Key Steps:**\n';
      process.keySteps.forEach((step, idx) => {
        markdown += `${idx + 1}. ${step}\n`;
      });
      markdown += '\n';
    }

    // Apps involved
    const appsFormatted = [...new Set(process.apps)].join(', ');
    markdown += `**Apps Involved:** ${appsFormatted}\n\n`;

    // Cross-file connections (if any)
    if (process.crossFileConnections && process.crossFileConnections.length > 0) {
      markdown += '**Cross-File Connections:**\n';
      process.crossFileConnections.forEach(conn => {
        markdown += `- ${conn.description}\n`;
      });
      markdown += '\n';
    }

    // Inefficiencies (if any)
    if (process.inefficiencies && process.inefficiencies.length > 0) {
      markdown += '**Inefficiencies to Fix in Posts:**\n';
      process.inefficiencies.forEach(issue => {
        markdown += `- ${issue}\n`;
      });
      markdown += '\n';
    }
  });

  // Write to file
  const outputPath = path.join(__dirname, '../PROCESS-MAP.md');
  await fs.writeFile(outputPath, markdown, 'utf8');

  console.log(`PROCESS-MAP.md generated with ${data.totalProcesses} processes across ${Object.keys(data.journeyStages).length} journey stages`);
  console.log(`Output written to: ${outputPath}`);
}

// Run the generator
generateMap().catch(error => {
  console.error('Generation failed:', error);
  process.exit(1);
});

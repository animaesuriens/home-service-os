/**
 * webhook-tracer.js
 * Traces cross-file webhook connections one level deep
 */

/**
 * Build a mapping of webhook config var names to their likely target files
 * Uses config var names and domain keywords to match vars to files
 *
 * @param {Object} configVarsByFile - Object with keys as file names, values as arrays of config var names
 * @returns {Object} Map of webhook config var name to target file name
 */
function buildWebhookMap(configVarsByFile) {
  const webhookMap = {};

  // For each file, check which webhook config vars it PROVIDES (defines)
  // A file provides a webhook if it has a config var with "Webhook" in its name
  for (const [fileName, configVars] of Object.entries(configVarsByFile)) {
    configVars.forEach(varName => {
      if (varName.includes('Webhook') || varName.includes('webhook')) {
        // Map keywords in webhook name to the file that provides it
        const varLower = varName.toLowerCase();

        // Email/Text/Calendar webhooks -> gmail-and-ring-central-communicator
        if (varLower.includes('email') || varLower.includes('text') ||
            varLower.includes('calendar') || varLower.includes('sms')) {
          webhookMap[varName] = 'gmail-and-ring-central-communicator-export.yml';
        }
        // Deal/PaintScout/Estimate webhooks -> boolean-sales-integration
        else if (varLower.includes('deal') || varLower.includes('paintscout') ||
                 varLower.includes('estimate')) {
          webhookMap[varName] = 'boolean-sales-integration-export.yml';
        }
        // HubSpot Route -> boolean-marketing-integration
        else if (varLower.includes('hubspot') && varLower.includes('route')) {
          webhookMap[varName] = 'boolean-marketing-integration-export.yml';
        }
        // Otherwise, the file that defines it is the provider
        else {
          webhookMap[varName] = fileName;
        }
      }
    });
  }

  return webhookMap;
}

/**
 * Trace cross-file webhook connections one level deep
 *
 * @param {Array} businessFlows - Array of business flow objects from parsed-flows.json
 * @param {Object} configVarsByFile - Object with keys as file names, values as arrays of config var names
 * @returns {Array} Array of connection objects with source/target file info
 */
function traceConnections(businessFlows, configVarsByFile) {
  const webhookMap = buildWebhookMap(configVarsByFile);
  const connections = [];

  // Iterate all business flows and check for webhook calls
  businessFlows.forEach(flow => {
    if (flow.webhookCalls && flow.webhookCalls.length > 0) {
      flow.webhookCalls.forEach(webhookCall => {
        // Only trace config var webhooks (not hardcoded URLs)
        if (webhookCall.externalUrlType === 'configVar') {
          const targetFile = webhookMap[webhookCall.externalUrlValue];

          // If target file is different from source file, it's a cross-file connection
          if (targetFile && targetFile !== flow.fileName) {
            connections.push({
              sourceFile: flow.fileName,
              sourceFlow: flow.name,
              sourceStep: webhookCall.stepName,
              targetFile: targetFile,
              webhookConfigVar: webhookCall.externalUrlValue,
              depth: 1 // Only one level deep per D-04
            });
          }
        }
      });
    }
  });

  return connections;
}

module.exports = {
  traceConnections,
  buildWebhookMap
};

const { isInfrastructureFlow } = require('./infra-filter');

/**
 * Extract flow number from flow name (e.g., "05" from "05 Create Invoice" or "05.1 Sub-process")
 * @param {string} flowName - Flow name
 * @returns {Object} Parsed flow number info: { flowNumber, subFlowNumber, isSubFlow, parentFlowNumber }
 */
function parseFlowNumber(flowName) {
  // Pattern 1: Decimal notation (e.g., "05.1 Sub-process")
  const decimalMatch = flowName.match(/^(\d+)\.(\d+)\s/);
  if (decimalMatch) {
    return {
      flowNumber: `${decimalMatch[1]}.${decimalMatch[2]}`,
      subFlowNumber: decimalMatch[2],
      isSubFlow: true,
      parentFlowNumber: decimalMatch[1]
    };
  }

  // Pattern 2: Simple number (e.g., "05 Create Invoice")
  const simpleMatch = flowName.match(/^(\d+)\s/);
  if (simpleMatch) {
    return {
      flowNumber: simpleMatch[1],
      subFlowNumber: null,
      isSubFlow: false,
      parentFlowNumber: null
    };
  }

  // Pattern 3: "Subflow" or "Sub Flow" prefix (case-insensitive)
  const subFlowMatch = flowName.match(/^(subflow|sub\s+flow)\s+-?\s*(.+)/i);
  if (subFlowMatch) {
    // Try to extract parent number from the remaining text
    const remainingText = subFlowMatch[2];
    const parentMatch = remainingText.match(/^(\d+)/);
    return {
      flowNumber: null,
      subFlowNumber: null,
      isSubFlow: true,
      parentFlowNumber: parentMatch ? parentMatch[1] : null
    };
  }

  // Pattern 4: [New] prefix (version indicator)
  const newMatch = flowName.match(/^\[New\]\s+(.+)/i);
  if (newMatch) {
    // Recursively parse the name without [New] prefix
    return parseFlowNumber(newMatch[1]);
  }

  // No flow number found
  return {
    flowNumber: null,
    subFlowNumber: null,
    isSubFlow: false,
    parentFlowNumber: null
  };
}

/**
 * Extract flows from parsed YAML document
 * @param {Object} parsedYaml - Parsed YAML document
 * @param {string} fileName - Source file name
 * @returns {Array<Object>} Array of flow objects with extracted metadata
 */
function extractFlows(parsedYaml, fileName) {
  if (!parsedYaml.flows || !Array.isArray(parsedYaml.flows)) {
    return [];
  }

  return parsedYaml.flows.map(flow => {
    const numberInfo = parseFlowNumber(flow.name);

    // Extract steps data
    const steps = (flow.steps || []).map(step => {
      // Check if this step calls an external webhook
      const isWebhookCall = step.action?.key === 'httpPost' &&
                           step.inputs?.url?.type === 'configVar' &&
                           typeof step.inputs?.url?.value === 'string' &&
                           step.inputs.url.value.includes('Webhook');

      return {
        name: step.name || '',
        actionKey: step.action?.key || null,
        componentKey: step.action?.component?.key || null,
        isTrigger: step.isTrigger || false,
        hasWebhookCall: isWebhookCall
      };
    });

    // Extract webhook calls (httpPost actions with webhook URL config vars)
    const webhookCalls = [];
    if (flow.steps) {
      flow.steps.forEach(step => {
        // Check for httpPost action with url input referencing a webhook config var
        if (step.action?.key === 'httpPost' && step.inputs?.url) {
          const urlInput = step.inputs.url;
          // Webhook URLs are config vars with names ending in "Webhook URL"
          if (urlInput.type === 'configVar' &&
              typeof urlInput.value === 'string' &&
              urlInput.value.includes('Webhook')) {
            webhookCalls.push({
              stepName: step.name || '',
              externalUrlType: urlInput.type,
              externalUrlValue: urlInput.value
            });
          }
        }
      });
    }

    // Get trigger type (first step's action key if it's a trigger)
    let triggerType = 'none';
    if (steps.length > 0 && steps[0].isTrigger) {
      triggerType = steps[0].actionKey || 'none';
    }

    return {
      fileName,
      name: flow.name,
      flowNumber: numberInfo.flowNumber,
      subFlowNumber: numberInfo.subFlowNumber,
      isSubFlow: numberInfo.isSubFlow,
      parentFlowNumber: numberInfo.parentFlowNumber,
      description: flow.description || '',
      isSynchronous: flow.isSynchronous || false,
      stepCount: steps.length,
      triggerType,
      isInfrastructure: isInfrastructureFlow(flow.name),
      steps,
      webhookCalls
    };
  });
}

module.exports = {
  extractFlows,
  parseFlowNumber
};

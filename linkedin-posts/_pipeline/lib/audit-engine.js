/**
 * audit-engine.js
 * Core audit logic: flow mapping, hallucination detection, missed process identification
 *
 * Per AUDIT-01: Audit single YAML against bundle definitions to catch hallucinated steps
 * and identify showcase-worthy processes missed in v1.0.
 */

'use strict';

/**
 * Audit a single YAML file against bundle definitions.
 *
 * @param {string} yamlFilename - e.g., "boolean-marketing-integration-export.yml"
 * @param {Object} parsedFlowsData - Full parsed-flows.json content
 * @param {Object} processesData - Full processes.json content
 * @param {Array} bundleDefinitions - Array from bundle-definitions.json
 * @returns {Object} Audit result with summary, flowMapping, hallucinations, missedProcesses
 */
function auditYaml(yamlFilename, parsedFlowsData, processesData, bundleDefinitions) {
  // Filter flows from this YAML
  const yamlFlows = parsedFlowsData.businessFlows.filter(f => f.fileName === yamlFilename);
  const totalFlows = yamlFlows.length + parsedFlowsData.businessFlows.filter(f =>
    f.fileName === yamlFilename && f.isInfrastructure
  ).length;

  // Count infrastructure flows for this YAML
  const infrastructureFlows = yamlFlows.filter(f => f.isInfrastructure).length;
  const businessFlows = yamlFlows.filter(f => !f.isInfrastructure);

  // Find processes that reference this YAML
  const yamlProcesses = processesData.processes.filter(p =>
    p.sourceFiles && p.sourceFiles.includes(yamlFilename)
  );

  // Create process lookup map
  const processMap = new Map();
  yamlProcesses.forEach(p => processMap.set(p.id, p));

  // Find bundles that include processes from this YAML
  const yamlBundles = bundleDefinitions.filter(bundle =>
    bundle.processIds.some(pid => processMap.has(pid))
  );

  // Build flow mapping
  const flowMapping = businessFlows.map(flow => {
    // Find process for this flow
    const process = yamlProcesses.find(p => {
      if (!p.parentFlow) return false;
      return p.parentFlow.flowName === flow.name ||
             (p.childFlows && p.childFlows.some(cf => cf.flowName === flow.name));
    });

    const bundle = process ? yamlBundles.find(b => b.processIds.includes(process.id)) : null;

    let status = 'unmapped';
    if (flow.isInfrastructure) {
      status = 'infrastructure';
    } else if (bundle) {
      status = 'mapped';
    }

    return {
      flowName: flow.name,
      flowNumber: flow.flowNumber,
      isSubFlow: flow.isSubFlow,
      stepCount: flow.stepCount,
      processId: process ? process.id : null,
      processName: process ? process.name : null,
      bundleId: bundle ? bundle.id : null,
      bundleTitle: bundle ? bundle.title : null,
      status
    };
  });

  // Build hallucination analysis
  const hallucinations = yamlBundles.map(bundle => {
    // Collect all flow steps from this bundle's processes
    const allFlowSteps = [];
    bundle.processIds.forEach(pid => {
      const process = processMap.get(pid);
      if (!process) return;

      // Collect from parent flow
      if (process.parentFlow && process.parentFlow.steps) {
        allFlowSteps.push(...process.parentFlow.steps);
      }

      // Collect from child flows
      if (process.childFlows) {
        process.childFlows.forEach(childFlow => {
          if (childFlow.steps) {
            allFlowSteps.push(...childFlow.steps);
          }
        });
      }
    });

    // Analyze each idealized step
    const analysis = bundle.idealizedSteps.map(idealStep => {
      const result = analyzeStepEvidence(idealStep, allFlowSteps);
      return {
        stepLabel: idealStep.label,
        actor: idealStep.actor,
        evidence: result.evidence,
        matchedFlowActions: result.matchedFlowActions,
        notes: result.notes
      };
    });

    const stepsFound = analysis.filter(a => a.evidence === 'found').length;
    const stepsPartial = analysis.filter(a => a.evidence === 'partial').length;
    const stepsNotFound = analysis.filter(a => a.evidence === 'not-found').length;
    const stepAccuracy = bundle.idealizedSteps.length > 0
      ? Math.round((stepsFound / bundle.idealizedSteps.length) * 100)
      : 0;

    return {
      bundleId: bundle.id,
      bundleTitle: bundle.title,
      idealizedStepCount: bundle.idealizedSteps.length,
      analysis,
      stepsFound,
      stepsNotFound,
      stepsPartial,
      stepAccuracy
    };
  });

  // Identify missed processes (flows not in any bundle)
  const unmappedFlows = flowMapping.filter(f => f.status === 'unmapped');
  const missedProcesses = unmappedFlows.map(flowMap => {
    const flow = businessFlows.find(f => f.name === flowMap.flowName);
    if (!flow) return null;

    // Extract unique component keys (apps used)
    const componentKeys = new Set();
    flow.steps.forEach(step => {
      if (step.componentKey && step.componentKey !== 'schedule-triggers' &&
          step.componentKey !== 'webhook-triggers' && step.componentKey !== 'loop') {
        componentKeys.add(step.componentKey);
      }
    });

    const keyActions = Array.from(componentKeys);

    // Determine showcase potential
    let showcasePotential = 'low';
    if (flow.stepCount >= 5 && keyActions.length >= 2) {
      showcasePotential = 'high';
    } else if (flow.stepCount >= 3 || keyActions.length >= 2) {
      showcasePotential = 'medium';
    }

    return {
      flowName: flow.name,
      flowNumber: flow.flowNumber,
      stepCount: flow.stepCount,
      description: flow.description,
      keyActions,
      showcasePotential
    };
  }).filter(m => m !== null);

  // Calculate overall accuracy score
  const totalIdealizedSteps = hallucinations.reduce((sum, h) => sum + h.idealizedStepCount, 0);
  const totalStepsWithEvidence = hallucinations.reduce((sum, h) => sum + h.stepsFound, 0);
  const accuracyScore = totalIdealizedSteps > 0
    ? Math.round((totalStepsWithEvidence / totalIdealizedSteps) * 100)
    : 100;

  return {
    yamlFile: yamlFilename,
    auditedAt: new Date().toISOString(),
    summary: {
      totalFlows,
      businessFlows: businessFlows.length,
      infrastructureFlows,
      processesMatched: yamlProcesses.length,
      bundlesCovered: yamlBundles.length,
      bundlesTotal: bundleDefinitions.length,
      unmappedFlows: unmappedFlows.length,
      accuracyScore
    },
    flowMapping,
    hallucinations,
    missedProcesses
  };
}

/**
 * Analyze evidence for a single idealized step against actual flow steps.
 *
 * @param {Object} idealStep - { label, actor }
 * @param {Array} flowSteps - Array of actual flow step objects
 * @returns {Object} { evidence, matchedFlowActions, notes }
 */
function analyzeStepEvidence(idealStep, flowSteps) {
  const label = idealStep.label.toLowerCase();
  const matchedFlowActions = [];

  // Extract key action words from the idealized step label
  const actionWords = extractActionWords(label);

  // Search flow steps for evidence
  let hasStrongMatch = false;
  let hasWeakMatch = false;

  flowSteps.forEach(step => {
    const stepName = (step.name || '').toLowerCase();
    const componentKey = (step.componentKey || '').toLowerCase();
    const actionKey = (step.actionKey || '').toLowerCase();

    // Check for strong matches (action words in step name)
    let matchCount = 0;
    actionWords.forEach(word => {
      if (stepName.includes(word) || componentKey.includes(word) || actionKey.includes(word)) {
        matchCount++;
      }
    });

    if (matchCount >= 2 || (matchCount >= 1 && actionWords.length <= 2)) {
      hasStrongMatch = true;
      matchedFlowActions.push(step.name);
    } else if (matchCount >= 1) {
      hasWeakMatch = true;
    }
  });

  // Determine evidence level
  let evidence = 'not-found';
  let notes = '';

  if (hasStrongMatch) {
    evidence = 'found';
    notes = `Found ${matchedFlowActions.length} matching step(s)`;
  } else if (hasWeakMatch) {
    evidence = 'partial';
    notes = `Partial match - related components found but action differs`;
  } else {
    evidence = 'not-found';
    notes = `No evidence for: ${actionWords.join(', ')}`;
  }

  return { evidence, matchedFlowActions, notes };
}

/**
 * Extract meaningful action words from an idealized step label.
 *
 * @param {string} label - Idealized step label (lowercase)
 * @returns {Array<string>} Array of key action words
 */
function extractActionWords(label) {
  // Common stop words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'from', 'by', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can'
  ]);

  const words = label.split(/\s+/).filter(word => {
    return word.length >= 3 && !stopWords.has(word);
  });

  // Prioritize action verbs and domain terms
  const actionVerbs = ['create', 'update', 'send', 'notify', 'assign', 'score', 'calculate',
                       'generate', 'sync', 'confirm', 'extract', 'standardize', 'link'];

  const domainTerms = ['contact', 'deal', 'lead', 'customer', 'email', 'appointment',
                       'calendar', 'reminder', 'checklist', 'estimate', 'invoice', 'contract'];

  const priorityWords = words.filter(w => actionVerbs.includes(w) || domainTerms.includes(w));

  if (priorityWords.length >= 2) {
    return priorityWords.slice(0, 3); // Top 3 priority words
  }

  return words.slice(0, 3); // First 3 meaningful words
}

/**
 * Format audit result as human-readable Markdown.
 *
 * @param {Object} auditResult - Result from auditYaml()
 * @returns {string} Markdown formatted audit report
 */
function formatAuditMarkdown(auditResult) {
  const lines = [];

  // Header
  lines.push(`# Audit: ${auditResult.yamlFile}`);
  lines.push(`Generated: ${auditResult.auditedAt}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push(`- Total flows: ${auditResult.summary.totalFlows} (${auditResult.summary.businessFlows} business, ${auditResult.summary.infrastructureFlows} infrastructure)`);
  lines.push(`- Processes matched: ${auditResult.summary.processesMatched}`);
  lines.push(`- Bundles covered: ${auditResult.summary.bundlesCovered} / ${auditResult.summary.bundlesTotal}`);
  lines.push(`- Unmapped flows: ${auditResult.summary.unmappedFlows}`);
  lines.push(`- Overall accuracy: ${auditResult.summary.accuracyScore}%`);
  lines.push('');

  // Flow Mapping
  lines.push('## Flow Mapping');
  lines.push('');
  lines.push('| Flow | # | Steps | Process | Bundle | Status |');
  lines.push('|------|---|-------|---------|--------|--------|');

  auditResult.flowMapping.forEach(fm => {
    const flowNum = fm.flowNumber || '-';
    const processId = fm.processId || '-';
    const bundleTitle = fm.bundleTitle || '-';
    lines.push(`| ${fm.flowName} | ${flowNum} | ${fm.stepCount} | ${processId} | ${bundleTitle} | ${fm.status} |`);
  });
  lines.push('');

  // Hallucination Analysis
  lines.push('## Hallucination Analysis');
  lines.push('');

  if (auditResult.hallucinations.length === 0) {
    lines.push('No bundles found for this YAML.');
    lines.push('');
  } else {
    auditResult.hallucinations.forEach(hall => {
      lines.push(`### ${hall.bundleTitle} (${hall.bundleId})`);
      lines.push(`Accuracy: ${hall.stepAccuracy}% (${hall.stepsFound} found, ${hall.stepsPartial} partial, ${hall.stepsNotFound} not found)`);
      lines.push('');
      lines.push('| Step | Actor | Evidence | Matched Actions | Notes |');
      lines.push('|------|-------|----------|-----------------|-------|');

      hall.analysis.forEach(step => {
        const matchedActions = step.matchedFlowActions.length > 0
          ? step.matchedFlowActions.join('; ')
          : '-';
        lines.push(`| ${step.stepLabel} | ${step.actor} | ${step.evidence} | ${matchedActions} | ${step.notes} |`);
      });
      lines.push('');
    });
  }

  // Missed Processes
  lines.push('## Missed Processes (Not in Any Bundle)');
  lines.push('');

  if (auditResult.missedProcesses.length === 0) {
    lines.push('All business flows are covered by existing bundles.');
    lines.push('');
  } else {
    lines.push('| Flow | Steps | Key Actions | Showcase Potential |');
    lines.push('|------|-------|-------------|-------------------|');

    auditResult.missedProcesses.forEach(mp => {
      const keyActions = mp.keyActions.join(', ') || '-';
      const flowNum = mp.flowNumber ? `[${mp.flowNumber}] ` : '';
      lines.push(`| ${flowNum}${mp.flowName} | ${mp.stepCount} | ${keyActions} | ${mp.showcasePotential} |`);
    });
    lines.push('');
  }

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');

  const recommendations = generateRecommendations(auditResult);
  if (recommendations.length === 0) {
    lines.push('- No issues found. All idealized steps have evidence in the YAML flows.');
  } else {
    recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate recommendations based on audit findings.
 *
 * @param {Object} auditResult - Result from auditYaml()
 * @returns {Array<string>} Array of recommendation strings
 */
function generateRecommendations(auditResult) {
  const recommendations = [];

  // Check for hallucinated steps
  auditResult.hallucinations.forEach(hall => {
    if (hall.stepsNotFound > 0) {
      recommendations.push(
        `Bundle '${hall.bundleTitle}' has ${hall.stepsNotFound} hallucinated step(s) that should be removed or replaced with verified actions`
      );
    }
  });

  // Check for high-potential missed processes
  const highPotentialMissed = auditResult.missedProcesses.filter(
    mp => mp.showcasePotential === 'high'
  );

  highPotentialMissed.forEach(mp => {
    recommendations.push(
      `Flow '${mp.flowName}' is a strong candidate for a new bundle (${mp.stepCount} steps, ${mp.keyActions.length} apps: ${mp.keyActions.join(', ')})`
    );
  });

  // Check for unmapped flows
  if (auditResult.summary.unmappedFlows > 0 && highPotentialMissed.length === 0) {
    recommendations.push(
      `${auditResult.summary.unmappedFlows} flow(s) are not covered by any bundle (mostly low complexity or infrastructure-related)`
    );
  }

  return recommendations;
}

module.exports = {
  auditYaml,
  formatAuditMarkdown
};

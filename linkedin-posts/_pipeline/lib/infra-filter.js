/**
 * Infrastructure flow identification patterns
 * Per D-06 and D-07 from CONTEXT.md
 */
const INFRA_PATTERNS = [
  { name: 'Starts with 00', regex: /^00\s/ },
  { name: 'Register Connection', regex: /register\s+connection/i },
  { name: 'Register Instance', regex: /register\s+instance/i },
  { name: 'Refresh Webhook', regex: /refresh\s+webhook/i },
  { name: 'Delete Webhook', regex: /delete\s+webhook/i },
  { name: 'Event Router', regex: /event\s+router/i },
  { name: 'Archived', regex: /^\[ARCHIVED\]/i }
];

/**
 * Determine if a flow is infrastructure/setup vs business process
 * @param {string} flowName - Flow name from YAML
 * @returns {boolean} True if infrastructure flow
 */
function isInfrastructureFlow(flowName) {
  return INFRA_PATTERNS.some(pattern => pattern.regex.test(flowName));
}

module.exports = {
  isInfrastructureFlow,
  INFRA_PATTERNS
};

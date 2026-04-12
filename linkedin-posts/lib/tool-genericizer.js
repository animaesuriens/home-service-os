/**
 * tool-genericizer.js
 * Genericizes tool names per PROJECT.md naming rules
 */

// Per PROJECT.md: Generic names for tools except HubSpot/Airtable
const TOOL_MAP = {
  'paintscout': 'estimating tool',
  'companycam': 'photo storage',
  'youcanbookme': 'appointment scheduler',
  'youcanbook.me': 'appointment scheduler',
  'ringcentral': 'SMS platform',
  'quickbooks-time': 'time tracking app',
  'quickbooks time': 'time tracking app',
  'google-calendar': 'your calendar',
  'google calendar': 'your calendar',
  'gmail': 'your email',
  'google-sheets': 'your spreadsheet',
  'google sheets': 'your spreadsheet',
  'quickbooks-online': 'accounting software',
  'quickbooks online': 'accounting software',
  'quickbooks': 'accounting software',
  'qbo': 'accounting software'
};

// Tools that should be explicitly named (not genericized)
const EXPLICIT_TOOLS = ['hubspot', 'airtable', 'make', 'zapier', 'n8n'];

/**
 * Genericize an array of component keys to display names
 *
 * @param {Array} componentKeys - Array of component key strings (e.g., ['hubspot', 'paintscout', 'airtable'])
 * @returns {Array} Array of genericized display names
 */
function genericizeTools(componentKeys) {
  if (!componentKeys || !Array.isArray(componentKeys)) {
    return [];
  }

  return componentKeys.map(key => {
    const keyLower = key.toLowerCase();

    // Keep explicit tools as-is (capitalize properly)
    if (EXPLICIT_TOOLS.includes(keyLower)) {
      return capitalizeExplicitTool(key);
    }

    // Map through TOOL_MAP
    if (TOOL_MAP[keyLower]) {
      return TOOL_MAP[keyLower];
    }

    // Unknown tool - title case it
    return titleCase(key);
  });
}

/**
 * Genericize tool names in text strings
 * Case-insensitive replacement
 *
 * @param {String} text - Text containing tool names
 * @returns {String} Text with tool names replaced by generic equivalents
 */
function genericizeText(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let result = text;

  // Replace specific tool names with generic equivalents
  // Use word boundaries to avoid partial matches
  Object.entries(TOOL_MAP).forEach(([specific, generic]) => {
    const pattern = new RegExp(`\\b${escapeRegex(specific)}\\b`, 'gi');
    result = result.replace(pattern, generic);
  });

  return result;
}

/**
 * Capitalize explicit tool names properly
 *
 * @param {String} toolKey - Tool component key
 * @returns {String} Properly capitalized tool name
 */
function capitalizeExplicitTool(toolKey) {
  const keyLower = toolKey.toLowerCase();

  switch (keyLower) {
    case 'hubspot':
      return 'HubSpot';
    case 'airtable':
      return 'Airtable';
    case 'make':
      return 'Make';
    case 'zapier':
      return 'Zapier';
    case 'n8n':
      return 'n8n';
    default:
      return titleCase(toolKey);
  }
}

/**
 * Title case a string (capitalize first letter of each word)
 *
 * @param {String} str - String to title case
 * @returns {String} Title cased string
 */
function titleCase(str) {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Escape special regex characters in a string
 *
 * @param {String} str - String to escape
 * @returns {String} Escaped string safe for regex
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  genericizeTools,
  genericizeText,
  TOOL_MAP,
  EXPLICIT_TOOLS
};

/**
 * journey-tagger.js
 * Tags processes with customer journey stages and orders them
 */

// Per D-09: Customer journey stages in order
const JOURNEY_STAGES = [
  'Lead Capture',
  'Lead Qualification',
  'Appointment Booking',
  'Estimating',
  'Sales/Proposal',
  'Contract Management',
  'Job Setup',
  'Production Tracking',
  'Time Tracking',
  'Invoicing',
  'Expense Management',
  'Reporting'
];

/**
 * Tag each process with a journey stage and sort by journey order
 *
 * @param {Array} processes - Array of process objects from process-grouper
 * @returns {Array} Sorted array with journeyStage field added to each process
 */
function tagAndOrder(processes) {
  // Tag each process with journey stage
  const tagged = processes.map(process => ({
    ...process,
    journeyStage: determineJourneyStage(process)
  }));

  // Sort by journey stage order, then alphabetically within stage
  return tagged.sort((a, b) => {
    const indexA = JOURNEY_STAGES.indexOf(a.journeyStage);
    const indexB = JOURNEY_STAGES.indexOf(b.journeyStage);

    // Handle "Uncategorized" (not in stages array)
    const finalIndexA = indexA === -1 ? 999 : indexA;
    const finalIndexB = indexB === -1 ? 999 : indexB;

    if (finalIndexA !== finalIndexB) {
      return finalIndexA - finalIndexB;
    }

    // Within same stage, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Determine customer journey stage for a process
 * Uses multiple signals: file name, process name, description, component keys
 *
 * @param {Object} process - Process object with name, sourceFiles, description, componentKeys
 * @returns {String} Journey stage name
 */
function determineJourneyStage(process) {
  const fileName = process.sourceFiles[0]?.toLowerCase() || '';
  const name = process.name.toLowerCase();
  const description = process.description.toLowerCase();
  const components = process.componentKeys || [];

  // Lead Capture: webform/form/lead from marketing files
  if (fileName.includes('marketing') && (name.includes('webform') || name.includes('form submission') || name.includes('lead'))) {
    return 'Lead Capture';
  }

  // Lead Qualification: follow-up, nurture, MQL from marketing files
  if (fileName.includes('marketing') && (name.includes('follow') || name.includes('nurture') || name.includes('mql') || name.includes('qualification'))) {
    return 'Lead Qualification';
  }

  // Appointment Booking: appointment/booking/calendar (not cancellation)
  if ((name.includes('appointment') || name.includes('booking') || name.includes('book')) && !name.includes('cancel')) {
    return 'Appointment Booking';
  }

  // Estimating: estimate/quote from sales files
  if (fileName.includes('sales') && (name.includes('estimate') || name.includes('quote') || name.includes('pricing'))) {
    return 'Estimating';
  }

  // Sales/Proposal: deal/proposal/change order
  if (name.includes('deal') || name.includes('proposal') || name.includes('change order') || name.includes('pricing')) {
    return 'Sales/Proposal';
  }

  // Contract Management: contract/esign/signature
  if (name.includes('contract') || name.includes('esign') || name.includes('signature') || name.includes('sign')) {
    return 'Contract Management';
  }

  // Job Setup: job management files with process/setup/create
  if (fileName.includes('job-management') && (name.includes('process') || name.includes('setup') || name.includes('create') || name.includes('job'))) {
    return 'Job Setup';
  }

  // Production Tracking: production data files
  if (fileName.includes('production') || name.includes('production') || name.includes('crew')) {
    return 'Production Tracking';
  }

  // Time Tracking: time tracking files
  if (fileName.includes('time-tracking') || name.includes('time') && (name.includes('track') || name.includes('hour'))) {
    return 'Time Tracking';
  }

  // Invoicing: invoice/billing
  if (name.includes('invoice') || name.includes('billing')) {
    return 'Invoicing';
  }

  // Expense Management: expense/bill/vendor/payment/accounting
  if (name.includes('expense') || name.includes('bill') || name.includes('vendor') || name.includes('payment') ||
      (fileName.includes('accounting') && (name.includes('sync') || name.includes('upsert')))) {
    return 'Expense Management';
  }

  // Reporting: reporting files
  if (fileName.includes('reporting') || name.includes('report') || name.includes('dashboard')) {
    return 'Reporting';
  }

  // Check component keys for additional hints
  if (components.includes('quickbooks-online') || components.includes('quickbooks')) {
    // QuickBooks involved - likely accounting related
    if (name.includes('customer') || name.includes('contact')) {
      return 'Expense Management';
    }
    if (name.includes('invoice')) {
      return 'Invoicing';
    }
  }

  // Default to Uncategorized for manual review
  return 'Uncategorized';
}

module.exports = {
  tagAndOrder,
  JOURNEY_STAGES
};

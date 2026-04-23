'use strict';

/**
 * storybeat-validator.js
 *
 * Validates storyBeats objects against schema and anti-hallucination rules.
 * Mirrors the post-generator's FORBIDDEN INVENTIONS gate so diagram content
 * can't invent what the post side already bans.
 */

const ALLOWED_KINDS = new Set([
  'trigger',
  'lookup',
  'decision',
  'branch-new',
  'branch-reschedule',
  'branch-left',
  'branch-right',
  'merge',
  'output',
  'downstream',
  'step',
]);

// Must stay in sync with post-generator.js SYSTEM_PROMPT forbidden list.
const FORBIDDEN_TERMS = [
  'lead scoring', 'scoring', 'ranked', 'ranking', 'prioritiz',
  'audit trail', 'audit log',
  'reminder', 'confirmation', 'notification', 'alert',
  'daily summar', 'categoriz',
  'materials ordered', 'material ordering', 'crew dispatch',
  'follow-up sequence', 'drip campaign', 'nurture',
  'completion %', 'completion percentage', 'percent complete',
  'on track', 'behind schedule', 'ahead of schedule',
  'collections', 'payment reminder',
  'sms delivery', 'text message', 'text notification',
  'photo linking', 'site visit photo', 'project photo',
  'high-value routing', 'priority routing', 'vip',
  'real-time',
  // Forbidden tool names
  'paintscout', 'companycam', 'youcanbook', 'ycbm', 'quickbooks', 'ringcentral',
];

const LABEL_MIN_WORDS = 2;
const LABEL_MAX_WORDS = 8;
const DETAIL_MIN_CHARS = 30;
const DETAIL_MAX_CHARS = 220;
const BEATS_MIN = 5;
const BEATS_MAX = 8;

function wordCount(s) {
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}

function hasForbiddenTerm(text) {
  const lower = (text || '').toLowerCase();
  return FORBIDDEN_TERMS.filter(t => lower.includes(t));
}

function validateStoryBeats(sb, bundle) {
  const errors = [];
  const warnings = [];

  if (!sb || typeof sb !== 'object') {
    return { valid: false, errors: ['storyBeats is not an object'], warnings };
  }

  // bundleId matches
  if (bundle && sb.bundleId !== bundle.id) {
    errors.push(`bundleId mismatch: storyBeats says "${sb.bundleId}", bundle says "${bundle.id}"`);
  }

  // Required top-level fields
  for (const field of ['headline', 'dek', 'beats', 'metrics']) {
    if (!(field in sb)) errors.push(`missing field: ${field}`);
  }

  // Headline
  if (sb.headline) {
    const words = wordCount(sb.headline);
    if (words < 5) errors.push(`headline too short (${words} words; min 5)`);
    if (words > 20) errors.push(`headline too long (${words} words; max 20)`);
    if (sb.headlineAccent && !sb.headline.toLowerCase().includes(sb.headlineAccent.toLowerCase())) {
      errors.push(`headlineAccent "${sb.headlineAccent}" not present in headline`);
    }
    const fb = hasForbiddenTerm(sb.headline);
    if (fb.length) errors.push(`headline contains forbidden terms: ${fb.join(', ')}`);
  }

  // Dek
  if (sb.dek) {
    if (sb.dek.length < 80) warnings.push(`dek is short (${sb.dek.length} chars; prefer 80-280)`);
    if (sb.dek.length > 320) errors.push(`dek too long (${sb.dek.length} chars; max 320)`);
    const fb = hasForbiddenTerm(sb.dek);
    if (fb.length) errors.push(`dek contains forbidden terms: ${fb.join(', ')}`);
  }

  // Beats
  if (Array.isArray(sb.beats)) {
    if (sb.beats.length < BEATS_MIN || sb.beats.length > BEATS_MAX) {
      errors.push(`beats count out of range: ${sb.beats.length} (must be ${BEATS_MIN}-${BEATS_MAX})`);
    }
    sb.beats.forEach((b, i) => {
      const ref = `beats[${i}]`;
      if (!b || typeof b !== 'object') { errors.push(`${ref}: not an object`); return; }
      if (!ALLOWED_KINDS.has(b.kind)) errors.push(`${ref}.kind "${b.kind}" not in allowed set`);
      if (!b.label) errors.push(`${ref}.label missing`);
      if (!b.detail) errors.push(`${ref}.detail missing`);
      if (b.label) {
        const w = wordCount(b.label);
        if (w < LABEL_MIN_WORDS || w > LABEL_MAX_WORDS) {
          errors.push(`${ref}.label word count ${w} out of range ${LABEL_MIN_WORDS}-${LABEL_MAX_WORDS}`);
        }
        const fb = hasForbiddenTerm(b.label);
        if (fb.length) errors.push(`${ref}.label contains forbidden terms: ${fb.join(', ')}`);
      }
      if (b.detail) {
        if (b.detail.length < DETAIL_MIN_CHARS) warnings.push(`${ref}.detail short (${b.detail.length} chars)`);
        if (b.detail.length > DETAIL_MAX_CHARS) errors.push(`${ref}.detail too long (${b.detail.length} chars; max ${DETAIL_MAX_CHARS})`);
        const fb = hasForbiddenTerm(b.detail);
        if (fb.length) errors.push(`${ref}.detail contains forbidden terms: ${fb.join(', ')}`);
      }
    });
    // Must contain at least one trigger
    const kinds = sb.beats.map(b => b.kind);
    if (!kinds.includes('trigger')) warnings.push('no beat marked as kind=trigger');
  }

  // Metrics sanity-check against bundle
  if (bundle && sb.metrics) {
    const realStepCount = (bundle.idealizedSteps || []).length;
    const realProcessCount = (bundle.constituentProcesses || []).length;
    if (sb.metrics.stepCount !== realStepCount) {
      errors.push(`metrics.stepCount ${sb.metrics.stepCount} does not match bundle ${realStepCount}`);
    }
    if (sb.metrics.processCount !== realProcessCount) {
      errors.push(`metrics.processCount ${sb.metrics.processCount} does not match bundle ${realProcessCount}`);
    }
  }

  // Soft groundedness: domain nouns in beat details should be traceable to bundle data
  if (bundle && sb.beats) {
    const corpus = [
      bundle.pain || '',
      bundle.solution || '',
      ...(bundle.constituentProcesses || []),
      ...((bundle.idealizedSteps || []).map(s => s.label || '')),
      ...(bundle.realSteps || []),
    ].join(' ').toLowerCase();

    // Pull proper-noun-looking tokens from beat text and check coverage
    const properNounRe = /\b(HubSpot|Airtable|Make|Zapier|n8n|CRM|YCBM|SMS|API)\b/g;
    sb.beats.forEach((b, i) => {
      const text = `${b.label || ''} ${b.detail || ''}`;
      let m;
      while ((m = properNounRe.exec(text)) !== null) {
        const token = m[0];
        if (!corpus.includes(token.toLowerCase())) {
          warnings.push(`beats[${i}] mentions "${token}" but token not in bundle data`);
        }
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

module.exports = {
  validateStoryBeats,
  ALLOWED_KINDS,
  FORBIDDEN_TERMS,
};

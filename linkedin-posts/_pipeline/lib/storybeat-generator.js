'use strict';

/**
 * storybeat-generator.js
 *
 * Generates a storyBeats object for a single bundle via Claude API, using
 * tool-use for structured output so the response matches the schema exactly.
 *
 * Downstream consumers:
 *   - post-generator reads storyBeats as narrative spine for post prose
 *   - diagram-renderer reads storyBeats to populate the HTML template
 * One source of truth = post and diagram guaranteed to share a story.
 */

const { validateStoryBeats, ALLOWED_KINDS } = require('./storybeat-validator');

const SYSTEM_PROMPT = `You write narrative spines for LinkedIn automation posts — short, specific, voice-driven copy that makes a 2-second scroller stop and read.

YOUR OUTPUT IS A STRUCTURED storyBeats OBJECT that feeds BOTH the post prose AND the diagram image. Post and diagram must tell the exact same story.

VOICE:
- Casual expert. Short verb-driven sentences. Specific domain nouns (HubSpot, deal stage, project type, booking link). No corporate BS ("streamline," "synergy," "unified").
- Labels are 2-6 words, punchy. Can be rhetorical ("Who is this, really?" beats "CRM Lookup").
- Details are 1-3 sentences that add concrete color — named systems, specific states, plausible examples like a customer name or time of day.

ACCURACY (ZERO TOLERANCE):
- Every noun and capability you mention must trace to something in the REAL BUNDLE DATA below. Do NOT invent features.
- FORBIDDEN INVENTIONS (never use):
  "lead scoring", "scoring", "ranking", "prioritizing",
  "audit trail", "audit log",
  "reminders", "confirmations", "notifications", "alerts",
  "daily summaries", "categorization", "categorized",
  "materials ordered", "crew dispatch",
  "follow-up sequences", "drip campaigns", "nurture",
  "completion %", "on track", "behind schedule",
  "collections", "payment reminders",
  "SMS delivery", "text notification",
  "photo linking", "site visit photos",
  "high-value routing", "priority routing", "VIP",
  "real-time" (use "on a schedule" or "automatically" instead).

TOOL NAMING RULES (STRICT):
- Name explicitly: HubSpot, Airtable, Make, Zapier, n8n.
- Generic names ONLY for everything else: "appointment scheduler" (not YouCanBook.Me / YCBM), "estimating tool" (not PaintScout), "photo storage" (not CompanyCam), "accounting software" (not QuickBooks), "time tracking app", "SMS platform", "calendar", "email", "spreadsheet".
- If a bundle's realSteps mention a forbidden name literally (e.g. "YCBM HS Contact Sync"), DO NOT echo that literal — rephrase using generic names.

STRUCTURE:
- 5-8 beats total.
- Use kinds: trigger, lookup, decision, branch-new, branch-reschedule, branch-left, branch-right, merge, output, downstream, step.
- Most flows fit: trigger → 1-2 lookup/step → decision → 2 branches → merge → output. Adjust to the actual flow shape — don't force a shape the data doesn't support.

HEADLINE:
- 5-20 words, rhythm-driven. A short "X. Y. Z." three-beat structure often works. Include ONE word to emphasize via "headlineAccent" — pick a verb or the most surprising word.
- Example: headline "Your scheduler talks. Your CRM listens. The data enters itself." accent "listens."

DEK:
- 80-280 chars. Specific, grounded. Mentions a concrete starting point and ending point if possible. Include the platform name and the step count when it helps sell the craft.

METRICS:
- stepCount = exactly bundle.idealizedSteps.length (you'll be told this number)
- processCount = exactly bundle.constituentProcesses.length (you'll be told this number)
`;

const TOOL_SCHEMA = {
  name: 'emit_storybeats',
  description: 'Emit the curated storyBeats spine for this bundle.',
  input_schema: {
    type: 'object',
    properties: {
      bundleId: { type: 'string' },
      headline: { type: 'string', description: '5-20 words, rhythm-driven headline. Will be displayed in serif display type.' },
      headlineAccent: { type: 'string', description: 'A single word or short phrase from the headline to render in pink italic. Must appear exactly in the headline.' },
      dek: { type: 'string', description: '80-280 char deck text (italic serif subhead)' },
      beats: {
        type: 'array',
        minItems: 5,
        maxItems: 8,
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: Array.from(ALLOWED_KINDS) },
            label: { type: 'string', description: '2-6 words, the bold serif card title' },
            detail: { type: 'string', description: '1-3 sentences, ~30-220 chars. Adds specific domain color.' },
          },
          required: ['kind', 'label', 'detail'],
        },
      },
      metrics: {
        type: 'object',
        properties: {
          stepCount: { type: 'integer' },
          processCount: { type: 'integer' },
        },
        required: ['stepCount', 'processCount'],
      },
    },
    required: ['bundleId', 'headline', 'headlineAccent', 'dek', 'beats', 'metrics'],
  },
};

function buildUserPrompt(bundle) {
  const realSteps = (bundle.idealizedSteps || []).map((s, i) => `${i + 1}. ${s.label}`).join('\n');
  const rawSteps = (bundle.realSteps || []).slice(0, 20).map((s, i) => `${i + 1}. ${s}`).join('\n');
  const constituents = (bundle.constituentProcesses || []).join(', ') || 'N/A';

  return `Build the storyBeats spine for this automation bundle.

BUNDLE
id: ${bundle.id}
title: ${bundle.title}
journeyStage: ${bundle.journeyStage}
constituentProcesses: ${constituents}
stepCount: ${(bundle.idealizedSteps || []).length}
processCount: ${(bundle.constituentProcesses || []).length}

PAIN (the reader's before-state):
${bundle.pain || 'N/A'}

SOLUTION (the after-state this automation delivers):
${bundle.solution || 'N/A'}

REAL STEPS (the actual flow — pick 5-8 beats that tell the most specific, craft-forward story; combine redundant steps; skip plumbing that doesn't help the reader):
${realSteps || '(none)'}

${rawSteps ? `RAW STEPS (for extra grounding):\n${rawSteps}\n` : ''}

OUTPUT: call emit_storybeats with the full storyBeats object. bundleId must equal "${bundle.id}". metrics.stepCount must equal ${(bundle.idealizedSteps || []).length}. metrics.processCount must equal ${(bundle.constituentProcesses || []).length}.`;
}

async function generateStoryBeats(bundle, opts = {}) {
  const AnthropicModule = require('@anthropic-ai/sdk');
  const Anthropic = AnthropicModule.default || AnthropicModule;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const model = opts.model || 'claude-sonnet-4-20250514';
  const maxRetries = opts.maxRetries || 2;

  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      tools: [TOOL_SCHEMA],
      tool_choice: { type: 'tool', name: 'emit_storybeats' },
      messages: [{ role: 'user', content: buildUserPrompt(bundle) }],
    });

    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      lastError = new Error('Model did not emit tool_use for emit_storybeats');
      continue;
    }

    const sb = toolUse.input;
    const validation = validateStoryBeats(sb, bundle);
    if (validation.valid) {
      return { storyBeats: sb, warnings: validation.warnings };
    }

    lastError = new Error(`storyBeats validation failed: ${validation.errors.join('; ')}`);
    // Retry with stronger steering
    if (attempt < maxRetries) {
      // eslint-disable-next-line no-console
      console.warn(`[storybeat-generator] attempt ${attempt + 1} failed: ${validation.errors.join('; ')} — retrying`);
    }
  }
  throw lastError;
}

module.exports = { generateStoryBeats, SYSTEM_PROMPT, TOOL_SCHEMA };

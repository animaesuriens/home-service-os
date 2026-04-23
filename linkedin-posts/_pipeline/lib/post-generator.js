'use strict';

const path = require('path');
const fs = require('fs-extra');

// ---------------------------------------------------------------------------
// System Prompt (per D-06, D-07, D-09, D-13, D-14)
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a LinkedIn content creator writing automation portfolio posts for a home service company owner.

STORYTELLING FRAMEWORK: Before-After-Bridge (BAB)
- BEFORE: Paint the painful manual reality (2-3 sentences of relatable chaos)
- AFTER: Show the smooth automated outcome (2-3 sentences of the dream state)
- BRIDGE: Walk through exactly how the automation makes this happen (the bulk of the post — describe the workflow steps in a natural, conversational way)

HARD CONSTRAINTS:
- MAXIMUM 2,800 characters total (LinkedIn's limit is 3,000 — leave buffer). Target 300-400 words. No exceptions.
- First line MUST hook readers in under 210 characters (this is the LinkedIn mobile preview cutoff). Make it punchy, specific, and pain-focused.
- Casual expert tone — like explaining to a friend who runs a business. Use "you" and "your" liberally. Contractions encouraged. No corporate jargon.
- Frame everything as "home service company" — never mention painting, painters, or any specific trade.
- Each post is COMPLETELY self-contained. Zero references to other posts, series, or "as I mentioned."
- End with a MIXED CTA: one engagement question + one soft sell. Vary these across posts — don't use the same CTA twice.

TOOL NAMING RULES (STRICT):
- Name explicitly: Make, Zapier, n8n (whichever platform this post is for), HubSpot, Airtable
- Generic names ONLY for everything else:
  - "estimating tool" (never PaintScout)
  - "photo storage" (never CompanyCam)
  - "appointment scheduler" (never YouCanBook.Me)
  - "your calendar" (never Google Calendar)
  - "your email" (never Gmail)
  - "your spreadsheet" (never Google Sheets)
  - "accounting software" (never QuickBooks)
  - "time tracking app" (never QuickBooks Time)
  - "SMS platform" (never RingCentral)
- NEVER use "Make.com" or "Integromat" — just "Make"

ACCURACY RULE (CRITICAL — ZERO TOLERANCE):
- ONLY describe capabilities that appear in the REAL SYSTEM DATA section below. Do NOT invent ANY feature not listed.
- FORBIDDEN INVENTIONS (never use unless a real step explicitly does this):
  "lead scoring", "scoring", "ranking", "prioritizing",
  "audit trail", "audit log",
  "reminders", "confirmations", "notifications to crews", "crew notifications", "alerts",
  "daily summaries", "categorized", "categorization",
  "materials ordered", "material ordering", "crew dispatch",
  "follow-up sequences", "drip campaigns", "nurture sequences",
  "completion %", "completion percentage", "percent complete",
  "on track", "behind schedule", "ahead of schedule",
  "collections", "collection notices", "payment reminders",
  "SMS delivery", "text message", "text notification",
  "photo linking", "site visit photos", "project photos",
  "high-value routing", "priority routing", "VIP",
  "real-time" (use "on a schedule" or "automatically" instead).
- Describe ONLY what the real steps actually do: lookups, syncs, branches, loops, payload generation, upserts, deletions.
- If a step says "Branch on Expression" describe it as routing or conditional logic — not "categorizing" or "scoring".
- Every capability you mention MUST map to a real step from the REAL SYSTEM DATA. Remove any sentence that describes something not in the data.

HASHTAGS: End with exactly 3 hashtags on a new line:
1. #Automation (always)
2. One journey-stage tag (e.g., #LeadGeneration, #InvoiceAutomation, #TimeTracking, #ExpenseManagement, #ProjectManagement, #CRM, #Scheduling)
3. #Make, #Zapier, or #n8n (matching the platform)

FORMAT: Write the post as plain text suitable for LinkedIn. Use line breaks for readability. Do NOT use markdown headers, bold, italic, or bullet points — LinkedIn doesn't render markdown. Use emoji sparingly (max 2-3 per post). Use short paragraphs (2-3 sentences each).`;

// ---------------------------------------------------------------------------
// Platform display names
// ---------------------------------------------------------------------------
const PLATFORM_NAMES = {
  make: 'Make',
  zapier: 'Zapier',
  n8n: 'n8n'
};

// ---------------------------------------------------------------------------
// Forbidden tool names (case-insensitive check)
// ---------------------------------------------------------------------------
const FORBIDDEN_NAMES = [
  'PaintScout',
  'CompanyCam',
  'YouCanBook',
  'RingCentral',
  'QuickBooks Time',
  'Integromat',
  'Make.com'
];

// ---------------------------------------------------------------------------
// generatePost(bundle, platform, storyBeats)
//
// Generates one LinkedIn post via Claude API.
// If storyBeats is provided, it becomes the narrative spine — the post must
// weave through the same beats that will render in the diagram. This guarantees
// post/diagram alignment (see 15-05 plan).
//
// @param {object} bundle      - Bundle object from bundles.json
// @param {string} platform    - 'make' | 'zapier' | 'n8n'
// @param {object} [storyBeats] - Optional storyBeats spine for this bundle
// @returns {Promise<string>} Generated post content
// ---------------------------------------------------------------------------
async function generatePost(bundle, platform, storyBeats = null) {
  // Lazy-require Anthropic SDK to avoid loading it until needed
  const AnthropicModule = require('@anthropic-ai/sdk');
  const Anthropic = AnthropicModule.default || AnthropicModule;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Get your key from: https://console.anthropic.com/');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const platformName = PLATFORM_NAMES[platform] || platform;

  // Build real system data section from bundle
  const realProcessNames = (bundle.constituentProcesses || []).join(', ') || 'N/A';
  const realStepsList = (bundle.realSteps || []).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'N/A';
  const appsList = (bundle.apps || []).join(', ') || 'N/A';

  const storySpineSection = storyBeats
    ? `NARRATIVE SPINE (this post must tell the exact same story as the companion diagram — every beat below should be visible in your Bridge section, in this order):
Headline to echo (paraphrase, don't copy verbatim): "${storyBeats.headline}"
Dek: "${storyBeats.dek}"
Beats:
${storyBeats.beats.map((b, i) => `${i + 1}. [${b.kind}] ${b.label} — ${b.detail}`).join('\n')}

The diagram renders exactly these beats as labeled cards. The reader will see both the post and the diagram together; they must reinforce each other. Use the same domain nouns. Describe the same decisions and branches. If a beat mentions "HubSpot" and "deal stage," the post should too.
`
    : '';

  const userPrompt = `Write a LinkedIn post for this automation workflow:

Platform: ${platformName}  (use this platform name throughout the post)
Business Capability: ${bundle.title}
Journey Stage: ${bundle.journeyStage}

BEFORE (the pain your reader relates to):
${bundle.pain}

AFTER (the automated dream state):
${bundle.solution}

REAL SYSTEM DATA (ground your post in these facts — every claim must trace to something here):
Real Process Names: ${realProcessNames}
Real Steps (what the automation actually does):
${realStepsList}
Integrations Used: ${appsList}

${storySpineSection}Simplified Narrative Structure (use as scaffold for the Bridge section, but ground details in the real steps above):
${bundle.idealizedSteps.map((s, i) => `${i + 1}. ${s.label}`).join('\n')}

Known inefficiencies this automation fixes:
${bundle.inefficiencies.join(', ') || 'Manual processes, inconsistent timing, human error'}

Write the post now. Remember: MAXIMUM 2,800 characters (target 300-400 words), hook in first 210 chars, BAB framework, casual expert tone, end with mixed CTA + 3 hashtags.`;

  // Retry on forbidden-term leakage (mirrors storybeat-generator pattern).
  // The SYSTEM_PROMPT forbids these terms, but the model still slips them
  // occasionally — catch and re-generate with a stronger steer.
  const FORBIDDEN_IN_POST = [
    'real-time', 'lead scoring', 'audit trail', 'audit log',
    'crew dispatch', 'drip campaign', 'nurture sequence',
    // Forbidden tool names
    'paintscout', 'companycam', 'youcanbook', 'ycbm',
    'quickbooks', 'ringcentral',
  ];

  const maxAttempts = 3;
  let extraSteer = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.4,
      system: SYSTEM_PROMPT + extraSteer,
      messages: [{ role: 'user', content: userPrompt }]
    });
    const postContent = message.content[0].text;
    const lower = postContent.toLowerCase();
    const hits = FORBIDDEN_IN_POST.filter(t => lower.includes(t));
    if (hits.length === 0) return postContent;

    if (attempt < maxAttempts) {
      // eslint-disable-next-line no-console
      console.warn(`  forbidden terms in ${bundle.id}/${platform}: [${hits.join(', ')}] — retry ${attempt}/${maxAttempts - 1}`);
      extraSteer = `\n\nCRITICAL RETRY DIRECTIVE: Your previous response contained forbidden terms: ${hits.join(', ')}. DO NOT use any of these terms. If you need to describe immediacy or speed, use "automatically", "within seconds", "as it happens", or "on each update" — never "real-time".`;
    } else {
      // Last attempt failed — return anyway, audit will catch it
      return postContent;
    }
  }
}

// ---------------------------------------------------------------------------
// Forbidden terms — module-level so generateBundlePosts + retry can share
// ---------------------------------------------------------------------------
const FORBIDDEN_IN_POST = [
  'real-time', 'lead scoring', 'audit trail', 'audit log',
  'crew dispatch', 'drip campaign', 'nurture sequence',
  'paintscout', 'companycam', 'youcanbook', 'ycbm',
  'quickbooks', 'ringcentral',
];

function findForbiddenTerms(text) {
  const lower = (text || '').toLowerCase();
  return FORBIDDEN_IN_POST.filter(t => lower.includes(t));
}

// ---------------------------------------------------------------------------
// generateBundlePosts(bundle, storyBeats)
//
// Generates all three platform posts (Make, Zapier, n8n) for a bundle in a
// single Claude API call via tool_use. The model sees its own voice across
// all three as it writes — eliminates the style drift that happened when
// each platform was generated independently.
//
// Forbidden-term validation runs on each post; failed posts are re-generated
// individually via generatePost() which has its own retry loop.
//
// @param {object} bundle      - Bundle object from bundles.json
// @param {object} [storyBeats] - Optional storyBeats spine for this bundle
// @returns {Promise<{make:string, zapier:string, n8n:string}>}
// ---------------------------------------------------------------------------
async function generateBundlePosts(bundle, storyBeats = null) {
  const AnthropicModule = require('@anthropic-ai/sdk');
  const Anthropic = AnthropicModule.default || AnthropicModule;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const realProcessNames = (bundle.constituentProcesses || []).join(', ') || 'N/A';
  const realStepsList = (bundle.realSteps || []).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'N/A';
  const appsList = (bundle.apps || []).join(', ') || 'N/A';

  const storySpineSection = storyBeats
    ? `NARRATIVE SPINE (all three posts share this spine — every beat below should be visible in each post's Bridge section, in this order):
Headline to echo (paraphrase, don't copy verbatim): "${storyBeats.headline}"
Dek: "${storyBeats.dek}"
Beats:
${storyBeats.beats.map((b, i) => `${i + 1}. [${b.kind}] ${b.label} — ${b.detail}`).join('\n')}

The companion diagram shows these exact beats as labeled cards. Reader sees post + diagram together; they must reinforce each other.
`
    : '';

  const userPrompt = `Write THREE LinkedIn posts for this automation workflow — one for Make, one for Zapier, one for n8n. Return them via the emit_bundle_posts tool call.

Business Capability: ${bundle.title}
Journey Stage: ${bundle.journeyStage}

BEFORE (the pain):
${bundle.pain}

AFTER (the automated outcome):
${bundle.solution}

REAL SYSTEM DATA (every claim must trace to something here):
Real Process Names: ${realProcessNames}
Real Steps:
${realStepsList}
Integrations Used: ${appsList}

${storySpineSection}Simplified Narrative Structure:
${bundle.idealizedSteps.map((s, i) => `${i + 1}. ${s.label}`).join('\n')}

Known inefficiencies this automation fixes:
${bundle.inefficiencies.join(', ') || 'Manual processes, inconsistent timing, human error'}

VOICE CONSISTENCY REQUIREMENT (critical):
All three posts must feel written by the SAME author. Same sentence rhythm. Same vocabulary choices. Same opening hook structure. Same CTA style. The ONLY things that differ between posts:
  (a) the platform name (Make vs Zapier vs n8n — substitute throughout)
  (b) the #Make/#Zapier/#n8n hashtag
  (c) optionally one or two lines acknowledging each platform's unique character (e.g. Make's modular canvas, Zapier's linear Zap structure, n8n's node graph) — keep these very brief
Every other sentence should read identically in voice. Do NOT restart from scratch for each post. Do NOT vary the hook, the CTA, or the beat-by-beat narrative. The same reader reading all three should think "same writer, same story, different tool."

Each post: 300-400 words, max 2,800 chars, hook in first 210 chars, BAB framework, end with mixed CTA + 3 hashtags (#Automation, one journey-stage tag, #Make|#Zapier|#n8n).`;

  const tool = {
    name: 'emit_bundle_posts',
    description: 'Emit all three platform posts for this bundle.',
    input_schema: {
      type: 'object',
      properties: {
        make: { type: 'string', description: 'The Make version of the post (plain text, LinkedIn-ready).' },
        zapier: { type: 'string', description: 'The Zapier version, same voice as Make, only swap platform-specific references.' },
        n8n: { type: 'string', description: 'The n8n version, same voice as Make, only swap platform-specific references.' },
      },
      required: ['make', 'zapier', 'n8n'],
    },
  };

  const maxAttempts = 2;
  let extraSteer = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.4,
      system: SYSTEM_PROMPT + extraSteer,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'emit_bundle_posts' },
      messages: [{ role: 'user', content: userPrompt }],
    });

    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      if (attempt === maxAttempts) throw new Error(`Model did not emit tool_use for ${bundle.id}`);
      extraSteer = '\n\nYou MUST call emit_bundle_posts. Do not emit plain text.';
      continue;
    }

    const posts = toolUse.input;
    // Validate all three. If any has forbidden terms, regenerate just those
    // via the single-platform generatePost so we don't re-burn 8k tokens.
    const allHits = {
      make: findForbiddenTerms(posts.make),
      zapier: findForbiddenTerms(posts.zapier),
      n8n: findForbiddenTerms(posts.n8n),
    };
    const failed = Object.entries(allHits).filter(([, hits]) => hits.length > 0).map(([p]) => p);

    if (failed.length === 0) {
      return posts;
    }

    // eslint-disable-next-line no-console
    console.warn(`  ${bundle.id}: forbidden terms in [${failed.join(', ')}] — regenerating those individually`);
    for (const p of failed) {
      // generatePost has its own forbidden-term retry; use it for targeted fix
      posts[p] = await generatePost(bundle, p, storyBeats);
    }
    return posts;
  }
}

// ---------------------------------------------------------------------------
// validatePost(content, platform, journeyStage)
//
// Validates a generated post against requirements.
//
// @param {string} content      - Post content
// @param {string} platform     - 'make' | 'zapier' | 'n8n'
// @param {string} journeyStage - Journey stage name
// @returns {{ valid: boolean, errors: string[] }}
// ---------------------------------------------------------------------------
function validatePost(content, platform, journeyStage) {
  const errors = [];

  // Character count check (LinkedIn limit: 3,000; target max: 2,800)
  const charCount = content.length;
  if (charCount > 2800) {
    errors.push(`Too long: ${charCount} chars (max 2800)`);
  }

  // Word count check (300-450 target range)
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 250) {
    errors.push(`Too short: ${wordCount} words (min 250)`);
  }

  // First line hook length (under 215 chars with buffer)
  const firstLine = content.split('\n')[0];
  if (firstLine.length > 215) {
    errors.push(`First line too long: ${firstLine.length} chars (max 215)`);
  }

  // Hashtag checks
  if (!content.includes('#Automation')) {
    errors.push('Missing #Automation hashtag');
  }

  const platformHashtag = `#${PLATFORM_NAMES[platform] || platform}`;
  if (!content.includes(platformHashtag)) {
    errors.push(`Missing platform hashtag: ${platformHashtag}`);
  }

  // Forbidden tool names check (case-insensitive)
  for (const forbidden of FORBIDDEN_NAMES) {
    const regex = new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(content)) {
      errors.push(`Contains forbidden tool name: ${forbidden}`);
    }
  }

  // Markdown formatting check
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Lines starting with # that are NOT hashtags (hashtags appear at end of post)
    if (line.startsWith('#') && !line.startsWith('#Automation') && !line.startsWith('#Make') && !line.startsWith('#Zapier') && !line.startsWith('#n8n') && !line.startsWith('#Lead') && !line.startsWith('#Invoice') && !line.startsWith('#Time') && !line.startsWith('#Expense') && !line.startsWith('#Project') && !line.startsWith('#CRM') && !line.startsWith('#Scheduling') && !line.startsWith('#Report') && !line.startsWith('#Contract') && !line.startsWith('#Change') && !line.startsWith('#Communication') && !line.startsWith('#Deal') && !line.startsWith('#Production') && !line.startsWith('#Appointment') && !line.startsWith('#Business')) {
      // Check if it looks like a markdown header (# followed by space then text)
      if (/^#{1,6}\s+\w/.test(line)) {
        errors.push(`Line ${i + 1} appears to be a markdown header: "${line.substring(0, 40)}..."`);
      }
    }
    // Bold markdown
    if (line.includes('**')) {
      errors.push(`Line ${i + 1} contains markdown bold formatting`);
      break; // Only report once
    }
    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      errors.push(`Line ${i + 1} contains markdown bullet point`);
      break; // Only report once
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// ---------------------------------------------------------------------------
// generateAllPosts(bundles, outputDir)
//
// Generates all posts for all bundles across all platforms.
//
// @param {Array}  bundles   - Array of bundle objects from bundles.json
// @param {string} outputDir - Base output directory (e.g. 'linkedin-posts/posts')
// @returns {Promise<{ total: number, passed: number, warnings: number, errors: number }>}
// ---------------------------------------------------------------------------
async function generateAllPosts(bundles, outputDir, storyBeatsByBundle = null) {
  const platforms = ['make', 'zapier', 'n8n'];
  let total = 0;
  let passed = 0;
  let warnings = 0;
  let errorCount = 0;

  for (const bundle of bundles) {
    for (const platform of platforms) {
      total++;

      try {
        const sb = storyBeatsByBundle ? storyBeatsByBundle[bundle.id] : null;
        const content = await generatePost(bundle, platform, sb);
        const validation = validatePost(content, platform, bundle.journeyStage);
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        const charCount = content.length;

        // Write the file regardless of validation (manual review will catch issues)
        const outputPath = path.join(outputDir, bundle.journeySlug, `${platform}.md`);
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, content, 'utf-8');

        if (validation.valid) {
          passed++;
          console.log(`Generated: posts/${bundle.journeySlug}/${platform}.md (${wordCount} words, ${charCount} chars, PASS)`);
        } else {
          warnings++;
          console.log(`Generated: posts/${bundle.journeySlug}/${platform}.md (${wordCount} words, ${charCount} chars, WARN: ${validation.errors.join(', ')})`);
        }

        // 2-second delay between API calls to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        errorCount++;
        console.error(`ERROR generating ${bundle.journeySlug}/${platform}.md: ${err.message}`);

        // Still delay to avoid hammering on error
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  return { total, passed, warnings, errors: errorCount };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  generatePost,
  generateBundlePosts,
  generateAllPosts,
  validatePost,
  SYSTEM_PROMPT
};

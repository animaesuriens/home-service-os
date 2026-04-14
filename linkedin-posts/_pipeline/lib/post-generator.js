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
- 400-700 words total. No exceptions.
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
// generatePost(bundle, platform)
//
// Generates one LinkedIn post via Claude API.
//
// @param {object} bundle   - Bundle object from bundles.json
// @param {string} platform - 'make' | 'zapier' | 'n8n'
// @returns {Promise<string>} Generated post content
// ---------------------------------------------------------------------------
async function generatePost(bundle, platform) {
  // Lazy-require Anthropic SDK to avoid loading it until needed
  const AnthropicModule = require('@anthropic-ai/sdk');
  const Anthropic = AnthropicModule.default || AnthropicModule;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Get your key from: https://console.anthropic.com/');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const platformName = PLATFORM_NAMES[platform] || platform;

  const userPrompt = `Write a LinkedIn post for this automation workflow:

Platform: ${platformName}  (use this platform name throughout the post)
Business Capability: ${bundle.title}
Journey Stage: ${bundle.journeyStage}

BEFORE (the pain your reader relates to):
${bundle.pain}

AFTER (the automated dream state):
${bundle.solution}

Key Automation Steps (reference these naturally in the Bridge section — don't list them as bullet points, weave them into the narrative):
${bundle.idealizedSteps.map((s, i) => `${i + 1}. ${s.label}`).join('\n')}

Known inefficiencies this automation fixes:
${bundle.inefficiencies.join(', ') || 'Manual processes, inconsistent timing, human error'}

Write the post now. Remember: 400-700 words, hook in first 210 chars, BAB framework, casual expert tone, end with mixed CTA + 3 hashtags.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const postContent = message.content[0].text;
  return postContent;
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

  // Word count check (400-750 with buffer)
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 400) {
    errors.push(`Too short: ${wordCount} words (min 400)`);
  }
  if (wordCount > 750) {
    errors.push(`Too long: ${wordCount} words (max 750)`);
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
async function generateAllPosts(bundles, outputDir) {
  const platforms = ['make', 'zapier', 'n8n'];
  let total = 0;
  let passed = 0;
  let warnings = 0;
  let errorCount = 0;

  for (const bundle of bundles) {
    for (const platform of platforms) {
      total++;

      try {
        const content = await generatePost(bundle, platform);
        const validation = validatePost(content, platform, bundle.journeyStage);
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

        // Write the file regardless of validation (manual review will catch issues)
        const outputPath = path.join(outputDir, bundle.journeySlug, `${platform}.md`);
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, content, 'utf-8');

        if (validation.valid) {
          passed++;
          console.log(`Generated: posts/${bundle.journeySlug}/${platform}.md (${wordCount} words, PASS)`);
        } else {
          warnings++;
          console.log(`Generated: posts/${bundle.journeySlug}/${platform}.md (${wordCount} words, WARN: ${validation.errors.join(', ')})`);
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
  generateAllPosts,
  validatePost,
  SYSTEM_PROMPT
};

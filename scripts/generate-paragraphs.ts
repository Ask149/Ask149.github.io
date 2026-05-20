// scripts/generate-paragraphs.ts
// Run via: npm run paragraphs
// Requires: GEMINI_API_KEY env var (load from .env — gitignored).
// Get one free at https://aistudio.google.com/app/apikey
//
// Reads all src/content/places/*.md files. For each entry where `paragraph` is
// empty/missing, calls Gemini 2.0 Flash to generate a 100–150-word reflective
// paragraph, writes it back to the frontmatter with
// `paragraphAuthor: "gemini-2.0-flash"`.
//
// Idempotency: existing paragraphs are NEVER overwritten unless
// `paragraphAuthor === 'ai-regenerate'`. To force regeneration: set
// `paragraphAuthor: ai-regenerate` in the .md file.
//
// Cost: Gemini 2.0 Flash free tier covers our usage (15 RPM, 1M TPM, 1500 RPD).

import { GoogleGenerativeAI } from "@google/generative-ai";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const PLACES_DIR = "src/content/places";
const MODEL_ID = process.env.GEMINI_MODEL || "gemini-flash-latest";

interface PlaceFrontmatter {
  title?: string;
  country?: string;
  yearMonth?: string;
  reason?: string;
  durationDays?: number;
  paragraph?: string;
  paragraphAuthor?: string;
  photoCaptions?: string[];
  draft?: boolean;
  [key: string]: unknown;
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("✗ GEMINI_API_KEY not set.");
    console.error("  Get one free at https://aistudio.google.com/app/apikey");
    console.error("  Add it to .env (gitignored) and re-run, e.g.:");
    console.error("    export $(grep -v '^#' .env | xargs) && npm run paragraphs");
    process.exit(1);
  }

  if (!existsSync(PLACES_DIR)) {
    console.error(`✗ ${PLACES_DIR} does not exist.`);
    process.exit(1);
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: MODEL_ID });

  const files = readdirSync(PLACES_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} place entr${files.length === 1 ? "y" : "ies"} in ${PLACES_DIR}.`);
  console.log(`Using model: ${MODEL_ID} (override with GEMINI_MODEL env var)`);

  let generated = 0;
  let skipped = 0;

  for (const file of files) {
    const fullPath = join(PLACES_DIR, file);
    const raw = readFileSync(fullPath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as PlaceFrontmatter;

    // Idempotency: if paragraph exists with content and author is NOT
    // 'ai-regenerate', skip.
    const hasParagraph = data.paragraph && String(data.paragraph).trim().length > 0;
    const forceRegen = data.paragraphAuthor === "ai-regenerate";
    if (hasParagraph && !forceRegen) {
      console.log(`  ✓ ${file}: paragraph present (${data.paragraphAuthor ?? "ashish"}), skipping`);
      skipped++;
      continue;
    }

    if (data.draft) {
      console.log(`  ↷ ${file}: draft, skipping`);
      skipped++;
      continue;
    }

    if (!data.title || !data.yearMonth) {
      console.warn(`  ⚠ ${file}: missing required frontmatter (title/yearMonth), skipping`);
      skipped++;
      continue;
    }

    const captionContext =
      data.photoCaptions && data.photoCaptions.length > 0
        ? ` Photo captions for sensory anchor: ${data.photoCaptions.slice(0, 6).join("; ")}.`
        : "";

    const promptParts = [
      `Write a 100–150 word reflective paragraph in first person, warm but not saccharine,`,
      `about a stay in ${data.title}, ${data.country ?? "unknown country"}, during ${data.yearMonth},`,
      `reason: ${data.reason ?? "leisure"}, duration: ${data.durationDays ?? "unknown"} days.`,
      `Tone: measured, observational, slightly melancholic.`,
      `No clichés about "finding myself" or "the journey".`,
      `Use sensory detail: weather, food, one small repeated ritual.`,
      `End on a single image, not a moral.${captionContext}`,
      `Output ONLY the paragraph text — no preamble, no quotes, no markdown headers.`,
    ];
    const userPrompt = promptParts.join(" ");

    console.log(`  → generating for ${file} (${data.title})...`);
    let paragraph = "";
    try {
      const result = await model.generateContent(userPrompt);
      paragraph = result.response.text().trim();
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message || err);
      const isZeroQuota = msg.includes("limit: 0") || msg.includes('"limit": 0');
      const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");

      if (isZeroQuota) {
        console.error(`  ✗ ${file}: model "${MODEL_ID}" has ZERO free-tier quota on your project.`);
        console.error(`\n    This is NOT a rate limit — your project has been granted 0 quota for this specific model.`);
        console.error(`    Likely causes:`);
        console.error(`      • Regional restriction (India accounts often hit this on gemini-2.0-flash)`);
        console.error(`      • Brand-new GCP project — quota provisioning lag (wait 1-24h)`);
        console.error(`      • Model is gated to paid tier for your account`);
        console.error(`\n    Try in this order:`);
        console.error(`      1. GEMINI_MODEL=gemini-1.5-flash npm run paragraphs  (most reliable free tier)`);
        console.error(`      2. GEMINI_MODEL=gemini-1.5-pro npm run paragraphs    (higher quality, same free tier)`);
        console.error(`      3. Check API enabled: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com`);
        console.error(`      4. Create a fresh AI Studio API key from a different GCP project: https://aistudio.google.com/app/apikey`);
        console.error(`      5. Ask orchestrator to dispatch a Groq SDK swap if no Gemini model works\n`);
      } else if (is429) {
        console.error(`  ✗ ${file}: rate limit (normal 429) — retry in ~60s.`);
      } else {
        console.error(`  ✗ ${file}: API call failed — ${msg}`);
      }
      continue;
    }

    if (!paragraph) {
      console.warn(`  ⚠ ${file}: empty response, skipping`);
      continue;
    }

    data.paragraph = paragraph;
    data.paragraphAuthor = MODEL_ID;

    const out = matter.stringify(parsed.content, data);
    writeFileSync(fullPath, out);

    const words = paragraph.split(/\s+/).length;
    console.log(`  ✓ ${file}: ${words} words`);
    generated++;
  }

  console.log("");
  console.log(`Summary: ${generated} generated, ${skipped} skipped.`);
  console.log(`Model: ${MODEL_ID} (free tier).`);
}

main().catch((e) => {
  console.error("✗ Script failed:", e);
  process.exit(1);
});

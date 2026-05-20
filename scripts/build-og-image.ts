/**
 * Build the default OG card at public/images/og-default.jpg (1200x630).
 * Run via `npm run build:og`.
 *
 * Output: cream canvas, portrait left, name + role right, terracotta accent.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PROFILE = resolve(ROOT, "src/assets/profile.jpeg");
const OUT = resolve(ROOT, "public/images/og-default.jpg");

const W = 1200;
const H = 630;
const CREAM = "#e8e5d8";
const TERRACOTTA = "#7a4a1f";
const DARK = "#2a2a2a";

const PORTRAIT_SIZE = 460;
const PORTRAIT_X = 80;
const PORTRAIT_Y = (H - PORTRAIT_SIZE) / 2;

const TEXT_X = PORTRAIT_X + PORTRAIT_SIZE + 70;

async function main() {
  await mkdir(dirname(OUT), { recursive: true });

  // 1. Resize portrait to a square, cover-fit.
  const portrait = await sharp(PROFILE)
    .resize(PORTRAIT_SIZE, PORTRAIT_SIZE, { fit: "cover", position: "centre" })
    .toBuffer();

  // 2. SVG overlay: name, role, accent rule.
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .name { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; font-size: 72px; fill: ${DARK}; letter-spacing: -1.5px; }
      .role { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 500; font-size: 34px; fill: ${DARK}; }
      .tag  { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 700; font-size: 22px; fill: ${TERRACOTTA}; letter-spacing: 3px; text-transform: uppercase; }
      .url  { font-family: 'Menlo', monospace; font-size: 20px; fill: ${TERRACOTTA}; }
    </style>
    <text x="${TEXT_X}" y="220" class="tag">~ portfolio · v4</text>
    <text x="${TEXT_X}" y="310" class="name">Ashish Kshirsagar</text>
    <rect x="${TEXT_X}" y="335" width="120" height="4" fill="${TERRACOTTA}" />
    <text x="${TEXT_X}" y="395" class="role">Software Engineer</text>
    <text x="${TEXT_X}" y="438" class="role">at Microsoft</text>
    <text x="${TEXT_X}" y="540" class="url">ask149.github.io</text>
  </svg>`;

  // 3. Composite onto cream canvas.
  await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: CREAM,
    },
  })
    .composite([
      { input: portrait, top: PORTRAIT_Y, left: PORTRAIT_X },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(OUT);

  console.log(`[og] wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

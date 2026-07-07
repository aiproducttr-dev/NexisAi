import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { default as pngToIco } from "png-to-ico";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "favicon.png");
const OUTPUT_SIZE = 512;
const LOGO_FILL = 0.98;

const OUTPUTS = [
  path.join(ROOT, "public", "favicon.png"),
  path.join(ROOT, "src", "app", "apple-icon.png"),
];

async function buildFaviconPng() {
  const trimmed = await sharp(SOURCE)
    .trim({ threshold: 12, background: "#000000" })
    .png()
    .toBuffer();

  const logoSize = Math.round(OUTPUT_SIZE * LOGO_FILL);
  const padding = Math.round((OUTPUT_SIZE - logoSize) / 2);

  return sharp(trimmed)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function buildIco(pngBuffer) {
  const png256 = await sharp(pngBuffer).resize(256, 256).png().toBuffer();
  return pngToIco(png256);
}

async function main() {
  const pngBuffer = await buildFaviconPng();

  await Promise.all(OUTPUTS.map((file) => fs.writeFile(file, pngBuffer)));

  const icoBuffer = await buildIco(pngBuffer);
  await fs.writeFile(path.join(ROOT, "src", "app", "favicon.ico"), icoBuffer);
  await fs.writeFile(path.join(ROOT, "public", "favicon.ico"), icoBuffer);

  console.log(`Favicon guncellendi (${OUTPUT_SIZE}px, %${Math.round(LOGO_FILL * 100)} doluluk)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

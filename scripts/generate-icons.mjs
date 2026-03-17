/**
 * Generates PNG and JPEG logo files from public/logo.svg using Puppeteer.
 * Run once with: npm run generate-icons
 */
import puppeteer from 'puppeteer';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');

mkdirSync(publicDir, { recursive: true });

const svgContent = readFileSync(join(publicDir, 'logo.svg'), 'utf8');
const svgBase64 = Buffer.from(svgContent).toString('base64');
const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

const PNG_SIZES  = [16, 32, 48, 64, 128, 192, 256, 512];
const JPEG_SIZES = [128, 192, 256, 512];

// High DPI scale factor for crisp HD rendering
const SCALE = 4;

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page    = await browser.newPage();

for (const size of PNG_SIZES) {
  // Render at SCALE× resolution for sharp output
  const renderSize = size * SCALE;
  await page.setViewport({ width: renderSize, height: renderSize, deviceScaleFactor: 1 });
  await page.setContent(`<!DOCTYPE html>
<html><head>
<style>*{margin:0;padding:0;overflow:hidden}body{background:transparent;width:${renderSize}px;height:${renderSize}px}</style>
</head><body>
<img src="${dataUri}" width="${renderSize}" height="${renderSize}" style="display:block"/>
</body></html>`);
  await page.waitForSelector('img');

  const filePng = join(publicDir, `logo-${size}x${size}.png`);
  await page.screenshot({ path: filePng, type: 'png', omitBackground: true,
    clip: { x: 0, y: 0, width: renderSize, height: renderSize } });
  console.log(`✓ PNG ${size}×${size} (rendered ${renderSize}×${renderSize})`);

  // JPEG: use navy background (#0F3460) to avoid white artefacts
  if (JPEG_SIZES.includes(size)) {
    await page.setContent(`<!DOCTYPE html>
<html><head>
<style>*{margin:0;padding:0;overflow:hidden}body{background:#0F3460;width:${renderSize}px;height:${renderSize}px}</style>
</head><body>
<img src="${dataUri}" width="${renderSize}" height="${renderSize}" style="display:block"/>
</body></html>`);
    await page.waitForSelector('img');
    const fileJpg = join(publicDir, `logo-${size}x${size}.jpeg`);
    await page.screenshot({ path: fileJpg, type: 'jpeg', quality: 100,
      clip: { x: 0, y: 0, width: renderSize, height: renderSize } });
    console.log(`✓ JPEG ${size}×${size} (rendered ${renderSize}×${renderSize}, quality 100)`);
  }
}

await browser.close();
console.log('\n🎉 All HD icons generated in public/');

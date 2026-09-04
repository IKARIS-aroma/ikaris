/*
 * Build-time asset processing. Run once (or whenever /assets/*.jpg source files
 * change): knocks the white background out of the two logo files, generates
 * WebP siblings for every JPEG, builds favicons, and composites the sitewide
 * Open Graph image. Output goes into /assets alongside the sources so the
 * generator and the static pages can reference plain files. Never runs at
 * request time — this is a one-off tool, not part of the deployed site.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const SLUGS = ['noir', 'vesper', 'monarch', 'iris', 'opalite', 'amor'];

const INK = { r: 11, g: 11, b: 13 };

// Turns a near-white background transparent with a soft edge, so the gold/black
// linework survives anti-aliasing instead of getting a hard cutout halo.
async function knockOutWhite(srcPath, destPath) {
  const img = sharp(srcPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = (r + g + b) / 3;
    // Fully white -> transparent. Ink/gold linework (brightness well below 235) -> opaque.
    // Linear ramp in between keeps anti-aliased edges smooth.
    let alpha;
    if (brightness >= 245) alpha = 0;
    else if (brightness <= 200) alpha = 255;
    else alpha = Math.round(((245 - brightness) / 45) * 255);
    data[i + 3] = Math.min(data[i + 3], alpha);
  }
  await sharp(data, { raw: { width, height, channels } }).png().toFile(destPath);
}

async function toWebp(srcPath, destPath) {
  await sharp(srcPath).webp({ quality: 82 }).toFile(destPath);
}

async function main() {
  console.log('Knocking out logo backgrounds...');
  await knockOutWhite(path.join(ASSETS, 'logo-full.jpg'), path.join(ASSETS, 'logo-full.png'));
  await knockOutWhite(path.join(ASSETS, 'logo-mark.jpg'), path.join(ASSETS, 'logo-mark.png'));

  console.log('Generating WebP siblings...');
  await toWebp(path.join(ASSETS, 'logo-full.png'), path.join(ASSETS, 'logo-full.webp'));
  await toWebp(path.join(ASSETS, 'logo-mark.png'), path.join(ASSETS, 'logo-mark.webp'));
  for (const slug of SLUGS) {
    await toWebp(path.join(ASSETS, 'products', `${slug}.jpg`), path.join(ASSETS, 'products', `${slug}.webp`));
    await toWebp(path.join(ASSETS, 'thumbs', `${slug}.jpg`), path.join(ASSETS, 'thumbs', `${slug}.webp`));
  }

  console.log('Building favicons...');
  const mark = path.join(ASSETS, 'logo-mark.png');
  const faviconSizes = [
    ['favicon-16.png', 16],
    ['favicon-32.png', 32],
    ['favicon-192.png', 192],
    ['apple-touch-icon.png', 180],
  ];
  for (const [name, size] of faviconSizes) {
    const pad = Math.round(size * 0.14);
    const inner = size - pad * 2;
    const markBuf = await sharp(mark).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: INK.r, g: INK.g, b: INK.b, alpha: 1 } },
    })
      .composite([{ input: markBuf, gravity: 'center' }])
      .png()
      .toFile(path.join(ASSETS, name));
  }
  // Referenced via <link rel="apple-touch-icon" href=".../assets/apple-touch-icon.png">
  // in generator/lib/layout.js, so it lives under /assets like the other icons
  // rather than relying on the browser's implicit site-root convention.

  console.log('Compositing sitewide OG image (1200x630)...');
  const ogMark = await sharp(mark).resize(420, 420, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: INK.r, g: INK.g, b: INK.b, alpha: 1 } },
  })
    .composite([{ input: ogMark, gravity: 'center' }])
    .jpeg({ quality: 90 })
    .toFile(path.join(ASSETS, 'og-default.jpg'));

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Generates a label PLAQUE texture per fragrance — a solid metal-toned
// background (not transparent) carrying the actual IKARIS emblem plus the
// wordmark and fragrance name, via sharp/SVG rendering. Also writes
// blender/bottle-params.json for the headless Blender export step.
// Run before blender/build_bottles.py.
//
// The background must be opaque: the faceted diamond-cut bottle geometry
// sits directly behind the label plane, and a transparent background let
// the bumpy facets show through around the letters, reading as "blurred"
// text. A solid plaque reads as an applied metal nameplate instead.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PRODUCTS } = require('../data/products');

const ROOT = path.join(__dirname, '..');
const LABELS_DIR = path.join(ROOT, 'assets', 'labels');
const PARAMS_PATH = path.join(ROOT, 'blender', 'bottle-params.json');
const LOGO_PATH = path.join(ROOT, 'assets', 'logo-mark.png');

const LABEL_W = 512, LABEL_H = 360;

function shade(hex, amount) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const adj = (c) => Math.max(0, Math.min(255, Math.round(c + amount)));
  return `rgb(${adj(r)},${adj(g)},${adj(b)})`;
}

function labelSvg(name, capColor, logoBase64) {
  const light = shade(capColor, 55);
  const dark = shade(capColor, -35);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LABEL_W}" height="${LABEL_H}">
    <defs>
      <linearGradient id="plaque" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${light}"/>
        <stop offset="45%" stop-color="${capColor}"/>
        <stop offset="100%" stop-color="${dark}"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="${LABEL_W - 12}" height="${LABEL_H - 12}" rx="10" fill="url(#plaque)" stroke="${light}" stroke-width="2"/>
    <image href="data:image/png;base64,${logoBase64}" x="${LABEL_W / 2 - 58}" y="30" width="116" height="110"/>
    <text x="50%" y="63%" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="42" letter-spacing="9" fill="#f3efe7">IKARIS</text>
    <line x1="36%" y1="70%" x2="64%" y2="70%" stroke="#f3efe7" stroke-width="1.2" opacity="0.8"/>
    <text x="50%" y="82%" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" letter-spacing="5" fill="#f3efe7">${name.toUpperCase()}</text>
    <text x="50%" y="92%" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="12" letter-spacing="4" fill="#f3efe7" opacity="0.75">EAU DE PARFUM</text>
  </svg>`;
}

async function main() {
  fs.mkdirSync(LABELS_DIR, { recursive: true });
  const params = [];
  const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64');

  for (const p of PRODUCTS) {
    const capColor = p.render3d.capColor;
    const svg = labelSvg(p.name, capColor, logoBase64);
    // density: 288 = 4x the default 72 DPI rasterization — same vector
    // design, a crisp ~2048x1440 texture instead of a soft 512x360 one.
    await sharp(Buffer.from(svg), { density: 288 }).png().toFile(path.join(LABELS_DIR, `${p.slug}.png`));
    params.push({
      slug: p.slug,
      name: p.name,
      labelPath: `assets/labels/${p.slug}.png`,
      ...p.render3d,
    });
    console.log('label written for', p.slug);
  }

  fs.writeFileSync(PARAMS_PATH, JSON.stringify(params, null, 2));
  console.log('wrote', PARAMS_PATH);
}

main().catch((e) => { console.error(e); process.exit(1); });

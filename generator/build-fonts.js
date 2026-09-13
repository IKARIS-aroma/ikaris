// Self-hosts the two Google Fonts families (Bodoni Moda, Jost) into
// assets/fonts/ instead of loading them from fonts.googleapis.com/
// fonts.gstatic.com at runtime. Every other heavy/interactive dependency
// in this project (GSAP, Lenis, Three.js) is already vendored locally —
// fonts were the one remaining external origin a page load actually
// blocked on, since the browser has to fetch the Google-hosted CSS before
// it even knows which font *files* to request, on top of the connections
// to two different Google origins. Self-hosting collapses that to one
// same-origin stylesheet the build already knows the contents of.
//
// Trimmed to the `latin` and `latin-ext` Unicode-range subsets — this
// site's content (and any name/address a visitor might type at checkout)
// is Latin-script, so cyrillic/math/symbol subsets Google's CSS also
// returns would just be dead weight here.
//
// Requires network access to Google Fonts. Not part of `npm run build`
// (which stays fully offline) — run this once, commit assets/fonts/, and
// re-run only if the font query in generator/lib/layout.js's FONT_QUERY
// ever changes. Run: node generator/build-fonts.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'fonts');

// Keep in sync with FONT_QUERY in generator/lib/layout.js.
const FONT_QUERY = 'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..500;0,6..96,600;1,6..96,500&family=Jost:wght@400;500;600&display=swap';
const CSS_URL = `https://fonts.googleapis.com/css2?${FONT_QUERY}`;
// A desktop Chrome UA — Google's CSS2 endpoint serves woff2 (the format
// every current browser actually wants) only to UAs it recognizes as
// supporting it, and falls back to woff/ttf for unrecognized/older UAs.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const KEEP_SUBSETS = new Set(['latin', 'latin-ext']);

function fetchText(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchText(res.headers.location, headers).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`${url} -> HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBinary(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`${url} -> HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Splits the returned CSS into individual @font-face blocks, tagged with
// whichever `/* subset */` comment precedes each one.
function parseFontFaceBlocks(css) {
  const blocks = [];
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css))) blocks.push({ subset: m[1], block: m[2] });
  return blocks;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Fetching', CSS_URL);
  const css = await fetchText(CSS_URL, { 'User-Agent': UA });
  const blocks = parseFontFaceBlocks(css).filter((b) => KEEP_SUBSETS.has(b.subset));
  console.log(`Kept ${blocks.length} @font-face blocks (subsets: ${[...KEEP_SUBSETS].join(', ')})`);

  const outputBlocks = [];
  for (const { block } of blocks) {
    const srcMatch = /src:\s*url\(([^)]+)\)/.exec(block);
    if (!srcMatch) { console.error('No src url() found in block:\n' + block); continue; }
    const srcUrl = srcMatch[1];
    // Google's own URL basename is already a unique, content-addressed-ish
    // name per physical font file — using it directly means two @font-face
    // blocks that happen to share one underlying variable-font file (seen
    // in practice: separate weight-range declarations pointing at the same
    // resource) correctly dedupe to one download, while blocks that are
    // genuinely different files (e.g. the same family/weight/style split
    // across the latin vs. latin-ext subsets) never collide.
    const filename = decodeURIComponent(srcUrl.split('/').pop());
    const localPath = path.join(OUT_DIR, filename);

    if (!fs.existsSync(localPath)) {
      console.log('Downloading', srcUrl, '->', filename);
      const buf = await fetchBinary(srcUrl);
      fs.writeFileSync(localPath, buf);
    } else {
      console.log('Already have', filename);
    }

    outputBlocks.push(block.replace(/src:\s*url\([^)]+\)\s*format\('woff2'\);/, `src: url('./${filename}') format('woff2');`));
  }

  const finalCss = outputBlocks.join('\n\n') + '\n';
  fs.writeFileSync(path.join(OUT_DIR, 'fonts.css'), finalCss, 'utf8');
  console.log('Wrote', path.join(OUT_DIR, 'fonts.css'));
  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });

// Subsets assets/fonts/*.woff2 down to the glyphs this site actually
// renders. build-fonts.js already trims Google's response to the 'latin'
// and 'latin-ext' subsets (dropping cyrillic/greek/vietnamese/etc
// entirely) and ships each as a separate @font-face with its own
// unicode-range — so the browser already skips fetching a whole subset
// file when a page never uses a codepoint in its range. What's left on
// the table is glyphs *inside* those two shipped ranges that this project
// never actually uses: the 'latin' files carry the full Latin-1
// punctuation/fraction/currency set (¡¿ÆØÞ¼½¾ etc), and the 'latin-ext'
// files carry hundreds of IPA/phonetic/historic-Latin glyphs — almost
// none of which this site's copy, UI strings, or JSON-LD ever render.
//
// TARGET_RANGES below was built by scanning every .js/.css/.html source
// file plus the built docs/ output for non-ASCII characters actually
// present (see the "grep -rhoP '[^\x00-\x7F]'" sweep this was derived
// from), then widening it with Latin-1 Supplement + Latin Extended-A as a
// safety margin — not because this site's own copy uses those glyphs,
// but because checkout's name/address <input> fields inherit these same
// fonts and a visitor may type an accented name (e.g. "José", "Müller").
// Confirmed renders found: § · × (Latin-1 Supplement, in copy/legal
// text), – — ' • (general punctuation, in copy), ₹ (rupee sign, in every
// price), − (U+2212 real minus sign, the cart quantity decrease button —
// distinct from the hyphen-minus already in Basic Latin). A → arrow
// turned up in the sweep too, but only inside a JS comment in
// data/site.js, never in rendered text — intentionally left out.
//
// Requires Python's fonttools (`pip install fonttools brotli`) for its
// pyftsubset CLI — a one-off manual tool like build-fonts.js and
// process-assets.js, not part of `npm run build`. Run after build-fonts.js
// (re-)populates assets/fonts/, or re-run any time TARGET_RANGES changes:
// node generator/subset-fonts.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'assets', 'fonts');
const CSS_PATH = path.join(FONTS_DIR, 'fonts.css');

const TARGET_RANGES = [
  [0x0020, 0x007e], // Basic Latin (printable ASCII)
  [0x00a0, 0x017f], // Latin-1 Supplement + Latin Extended-A
  [0x2000, 0x206f], // General Punctuation (en/em dash, curly quote, bullet, ...)
  [0x20b9, 0x20b9], // ₹ rupee sign
  [0x2212, 0x2212], // − real minus sign (cart qty decrease button)
];

function parseUnicodeRange(value) {
  return value.split(',').map((tok) => {
    tok = tok.trim().replace(/^U\+/i, '');
    if (tok.includes('-')) {
      const [start, end] = tok.split('-').map((h) => parseInt(h, 16));
      return [start, end];
    }
    const cp = parseInt(tok, 16);
    return [cp, cp];
  });
}

function intersectRanges(a, b) {
  const out = [];
  for (const [as, ae] of a) {
    for (const [bs, be] of b) {
      const start = Math.max(as, bs);
      const end = Math.min(ae, be);
      if (start <= end) out.push([start, end]);
    }
  }
  // merge overlapping/adjacent
  out.sort((x, y) => x[0] - y[0]);
  const merged = [];
  for (const r of out) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

function formatRanges(ranges) {
  return ranges.map(([s, e]) => (s === e ? `U+${s.toString(16).toUpperCase()}` : `U+${s.toString(16).toUpperCase()}-${e.toString(16).toUpperCase()}`)).join(',');
}

function main() {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const blockRe = /@font-face\s*\{([^}]*)\}/g;
  const fileRanges = new Map(); // filename -> original parsed unicode-range

  let m;
  while ((m = blockRe.exec(css))) {
    const block = m[1];
    const srcMatch = /src:\s*url\('\.\/([^']+)'\)/.exec(block);
    const rangeMatch = /unicode-range:\s*([^;]+);/.exec(block);
    if (!srcMatch || !rangeMatch) continue;
    const filename = srcMatch[1];
    if (!fileRanges.has(filename)) fileRanges.set(filename, parseUnicodeRange(rangeMatch[1]));
  }

  console.log(`Found ${fileRanges.size} distinct font files referenced in fonts.css`);

  const newRangeByFile = new Map();
  for (const [filename, originalRanges] of fileRanges) {
    const keep = intersectRanges(originalRanges, TARGET_RANGES);
    if (keep.length === 0) {
      console.warn(`  ${filename}: no overlap with TARGET_RANGES, skipping subset (left as-is)`);
      continue;
    }
    const unicodesArg = formatRanges(keep);
    const srcPath = path.join(FONTS_DIR, filename);
    const sizeBefore = fs.statSync(srcPath).size;
    const tmpPath = srcPath + '.subset.tmp';
    execFileSync('pyftsubset', [
      srcPath,
      `--unicodes=${unicodesArg}`,
      `--output-file=${tmpPath}`,
      '--flavor=woff2',
      // pyftsubset's *default* layout-features (kern/liga/calt/ccmp/locl/
      // mark/mkmk/rlig), not '--layout-features=*' — this site's CSS never
      // sets font-feature-settings or font-variant-*, so there's no reason
      // to keep the stylistic-set/small-caps/old-style-figures GSUB/GPOS
      // tables these families ship with. '*' was tried first and only
      // bought 6-16% (those tables dominate the file, not the glyf data) —
      // leaving layout-features on its default is what actually matters.
    ], { stdio: 'inherit' });
    fs.renameSync(tmpPath, srcPath);
    const sizeAfter = fs.statSync(srcPath).size;
    console.log(`  ${filename}: ${sizeBefore}B -> ${sizeAfter}B (-${(100 - (sizeAfter / sizeBefore) * 100).toFixed(0)}%)`);
    newRangeByFile.set(filename, unicodesArg);
  }

  let newCss = css.replace(/(src:\s*url\('\.\/([^']+)'\)[^;]*;\s*\n\s*unicode-range:\s*)([^;]+)(;)/g, (full, prefix, filename, _oldRange, suffix) => {
    const replacement = newRangeByFile.get(filename);
    return replacement ? `${prefix}${replacement}${suffix}` : full;
  });

  fs.writeFileSync(CSS_PATH, newCss, 'utf8');
  console.log('Wrote', CSS_PATH);
  console.log('Done.');
}

main();

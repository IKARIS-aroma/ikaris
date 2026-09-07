// Prepares the 10 hero-video story-beat frames from the raw commissioned
// artwork in icarus-src/originals/ (gitignored — see .gitignore's comment
// on icarus-src/) into video-gen-source/ (also gitignored), ready for
// generator/build-icarus-video.js to bake into the actual hero video.
//
// Two source shapes feed this:
// - The 10 individual wide (16:9-ish) illustrations, one per beat —
//   used as-is for the desktop/wide video, and center-cropped for the
//   portrait/tall video's ascend/fall/impact/seabed/rise/surface... no,
//   NOT for tall: see below.
// - "MOBILE VERSION.png", a 3x2 contact sheet of 6 panels the artist
//   actually composed for portrait framing. A naive center-crop of the
//   wide illustrations down to a 9:16 sliver loses most of the
//   wingspan — the widest element in nearly every beat — so the tall
//   video uses these panels instead, not a crop of the wide art. Beats
//   that don't have a 1:1 panel (the sheet only has 6 compositions for
//   10 beats: seabed/rise/surface/flight/fall/impact) reuse the nearest
//   matching panel — this is fine for the 4 ascend variants and 2 fall
//   variants specifically because those beats now crossfade quickly
//   (see build-icarus-video.js's FAST_XFADE) and are barely on screen
//   individually.
//
// Requires the two source files below to exist locally (they're large
// and gitignored, not checked in) — see the retrofit brief for how to
// re-obtain them. Run: node generator/prepare-icarus-frames.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'icarus-src', 'originals');
const OUT = path.join(ROOT, 'video-gen-source');

// order: ascend(4) -> peak -> fall(2) -> impact -> seabed -> rise -> surface
const FRAMES = [
  { out: '01-ascend1', file: '1A.jpeg' },
  { out: '02-ascend2', file: '1B.jpeg' },
  { out: '03-ascend3', file: '1C.jpeg' },
  { out: '04-peak', file: '1D.jpeg' },
  { out: '05-fall1', file: '2A.jpeg' },
  { out: '06-fall2', file: '2B.png' },
  { out: '07-impact', file: '2C ver1.png' },
  { out: '08-seabed', file: '3A.png' },
  { out: '09-rise', file: '3B.png' },
  { out: '10-surface', file: '3C.png' },
];

// Which of the 6 mobile-sheet panels (1-indexed, reading left-to-right
// top-to-bottom) each beat's tall/portrait frame comes from.
const TALL_PANEL_FOR = {
  '01-ascend1': 4, '02-ascend2': 4, '03-ascend3': 4, '04-peak': 4,
  '05-fall1': 5, '06-fall2': 5,
  '07-impact': 6,
  '08-seabed': 1,
  '09-rise': 2,
  '10-surface': 3,
};

// Badge crop: 1A/1B/1C/1D have no badge. 2A has a "5" badge top-left,
// 2C ver1 has an "8" badge top-left (leftover generation-batch numbers,
// not the narrative beat number — coincidence). Both sit in roughly the
// top-left 10% width x 9% height corner over plain sky/cloud texture.
const BADGE_FILES = new Set(['2A.jpeg', '2C ver1.png']);

// Clone a same-size patch from the mirror (top-right) corner — plain sky
// in every affected image — flip it horizontally so brush strokes/clouds
// still read as continuous, and composite over the badge. Used both for
// the individual wide illustrations and each mobile-sheet panel (which
// carry the sheet's own numbered corner badge, 1-6).
async function stripCornerBadge(buf, meta, opts) {
  const w = meta.width, h = meta.height;
  const bw = Math.round(w * (opts.wFrac || 0.10));
  const bh = Math.round(h * (opts.hFrac || 0.09));
  const patch = await sharp(await sharp(buf).extract({ left: w - bw, top: 0, width: bw, height: bh }).toBuffer())
    .flop()
    .toBuffer();
  return sharp(buf).composite([{ input: patch, left: 0, top: 0 }]).png().toBuffer();
}

async function prepareWideFrames() {
  for (const f of FRAMES) {
    const srcPath = path.join(SRC, f.file);
    const meta = await sharp(srcPath).metadata();
    let buf = await sharp(srcPath).png().toBuffer();
    if (BADGE_FILES.has(f.file)) buf = await stripCornerBadge(buf, meta, {});
    await sharp(buf).toFile(path.join(OUT, `${f.out}-wide.png`));
    console.log(f.out, 'wide', meta.width + 'x' + meta.height);
  }
}

async function prepareTallFrames() {
  const sheetPath = path.join(SRC, 'MOBILE VERSION.png');
  const sheetMeta = await sharp(sheetPath).metadata();
  const cellW = sheetMeta.width / 3, cellH = sheetMeta.height / 2;
  // Inset clears the grid border lines between panels.
  const insetX = Math.round(cellW * 0.045);
  const insetY = Math.round(cellH * 0.025);

  const panels = {};
  for (let i = 0; i < 6; i++) {
    const panelNum = i + 1;
    const col = i % 3, row = Math.floor(i / 3);
    const left = Math.round(col * cellW) + insetX;
    const top = Math.round(row * cellH) + insetY;
    const width = Math.round(cellW) - insetX * 2;
    const height = Math.round(cellH) - insetY * 2;

    const cellBuf = await sharp(sheetPath).extract({ left, top, width, height }).png().toBuffer();
    const final = await stripCornerBadge(cellBuf, { width, height }, { wFrac: 0.16, hFrac: 0.09 });
    panels[panelNum] = final;
    console.log('mobile sheet panel', panelNum, width + 'x' + height);
  }

  for (const f of FRAMES) {
    const panelBuf = panels[TALL_PANEL_FOR[f.out]];
    await sharp(panelBuf).toFile(path.join(OUT, `${f.out}-tall.png`));
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  await prepareWideFrames();
  await prepareTallFrames();
  console.log('Done.');
}
main().catch((e) => { console.error(e); process.exit(1); });

// Bakes the Icarus hero's scroll-scrubbed video from the 10 story-beat
// illustrations in video-gen-source/ (new artwork, Sep 2026: 4 ascend
// variants + 1 peak + 2 fall variants + impact + seabed + rise, replacing
// the previous 5-beat set 1:1 in narrative shape — ascend/peak/fall/ocean/
// rise — just with richer coverage of the ascend and fall beats). Each beat
// gets an actual directional Ken Burns pan (not a centered zoom) — the
// start/end crop-window fractions below were chosen by eye against each
// source image so the camera follows the figure (and, in the water beats,
// the sea) instead of drifting into blank paper. Beats are crossfaded into
// one continuous clip per orientation, matching the two source-image
// variants (wide 16:9 desktop, tall 9:16 mobile) already used by
// icarus-figure.js.
//
// Requires ffmpeg on PATH. Run: node generator/build-icarus-video.js
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'video-gen-source');
const OUT_DIR = path.join(ROOT, 'assets', 'icarus');

const FPS = 25;
// Shortened from 3.6/0.6 (the old 5-beat set's timings) now that there are
// twice as many beats — holding those durations would have doubled the
// video's length and, per the brief's own encoding-risk warning, this
// dense cross-hatched line art is already the worst case for a video
// codec's bitrate budget.
const CLIP_DUR = 1.8; // seconds each beat is fully on-screen before the next crossfade starts
const XFADE = 0.35; // seconds crossfaded into the next beat

// x/y are [start, end] fractions describing where the ACTION appears ON
// SCREEN (0 = pinned to that edge of the frame, 1 = the opposite edge,
// 0.5 = centered) — e.g. x:[0,1] means the subject drifts from the left
// edge of frame to the right edge over the clip.
//
// This is the inverse of the crop window's own position in the source
// (moving the window right reveals content further right in the source,
// which makes anything centered in the source appear to slide LEFT on
// screen) — buildVariant() below flips these on-screen fractions into
// window-position fractions when it builds the actual crop expression, so
// don't pre-flip these; write them as "where should this be on screen."
const BEATS = [
  {
    file: '01-ascend1', scale: 1.25,
    // rising toward the sun, centered
    wide: { x: [0.5, 0.5], y: [0.85, 0.6] },
    tall: { x: [0.5, 0.5], y: [0.85, 0.6] },
  },
  {
    file: '02-ascend2', scale: 1.25,
    wide: { x: [0.5, 0.5], y: [0.6, 0.4] },
    tall: { x: [0.5, 0.5], y: [0.6, 0.4] },
  },
  {
    file: '03-ascend3', scale: 1.25,
    wide: { x: [0.5, 0.5], y: [0.4, 0.22] },
    tall: { x: [0.5, 0.5], y: [0.4, 0.22] },
  },
  {
    file: '04-peak', scale: 1.35,
    // the hubris climax — tight on his face turned up into the sun
    wide: { x: [0.5, 0.5], y: [0.55, 0.3] },
    tall: { x: [0.5, 0.5], y: [0.55, 0.3] },
  },
  {
    file: '05-fall1', scale: 1.2,
    // badge-patch seam sits in the extreme top-left corner of this source —
    // keep x/y fractions away from [0,0] all clip long so the window never
    // reaches it, rather than trusting the patch to be invisible at 100% zoom
    wide: { x: [0.45, 0.55], y: [0.2, 0.55] },
    tall: { x: [0.45, 0.55], y: [0.2, 0.55] },
  },
  {
    file: '06-fall2', scale: 1.25,
    wide: { x: [0.5, 0.5], y: [0.3, 0.75] },
    tall: { x: [0.5, 0.5], y: [0.3, 0.75] },
  },
  {
    file: '07-impact', scale: 1.2,
    // same badge-patch caution as 05-fall1
    wide: { x: [0.5, 0.6], y: [0.35, 0.7] },
    tall: { x: [0.5, 0.6], y: [0.35, 0.7] },
  },
  {
    file: '08-seabed', scale: 1.3,
    // reaching down-right toward the bottle on the seabed
    wide: { x: [0.3, 0.6], y: [0.2, 0.7] },
    tall: { x: [0.35, 0.6], y: [0.2, 0.7] },
  },
  {
    file: '09-rise', scale: 1.25,
    // rising through the water, bottle held overhead
    wide: { x: [0.5, 0.5], y: [0.75, 0.35] },
    tall: { x: [0.5, 0.5], y: [0.75, 0.35] },
  },
  {
    file: '10-surface', scale: 1.2,
    // breaking the surface, bottle raised to the sun — the hold before the real 3D reveal
    wide: { x: [0.45, 0.55], y: [0.6, 0.25] },
    tall: { x: [0.45, 0.55], y: [0.6, 0.25] },
  },
];

const VARIANTS = {
  wide: { w: 960, h: 540 },
  tall: { w: 540, h: 960 },
};

function even(n) {
  return Math.round(n / 2) * 2;
}

function buildFilterComplex(variant) {
  const { w, h } = VARIANTS[variant];
  const inputs = [];
  const filters = [];
  const labels = [];

  BEATS.forEach((beat, i) => {
    const imgPath = path.join(SRC_DIR, `${beat.file}-${variant}.png`);
    inputs.push('-loop', '1', '-t', String(CLIP_DUR), '-i', imgPath);

    const OW = even(w * beat.scale);
    const OH = even(h * beat.scale);
    // Flip on-screen fractions into crop-window fractions: sliding the
    // window RIGHT reveals more of the source's right side, which pushes
    // anything centered in the source toward the LEFT of frame — the
    // opposite of the on-screen motion BEATS describes. Invert (1 - f) so
    // "x: [0, 1]" above really does read as "left edge to right edge".
    const [sx0, sx1] = beat[variant].x;
    const [sy0, sy1] = beat[variant].y;
    const x0 = 1 - sx0, x1 = 1 - sx1;
    const y0 = 1 - sy0, y1 = 1 - sy1;
    const xExpr = `(${OW}-${w})*(${x0}+(${x1 - x0})*t/${CLIP_DUR})`;
    const yExpr = `(${OH}-${h})*(${y0}+(${y1 - y0})*t/${CLIP_DUR})`;
    const label = `v${i}`;

    filters.push(
      `[${i}:v]scale=${OW}:${OH}:force_original_aspect_ratio=increase,` +
      `crop=${OW}:${OH},` +
      `crop=w=${w}:h=${h}:x='${xExpr}':y='${yExpr}',` +
      `fps=${FPS},format=yuv420p,setsar=1[${label}]`
    );
    labels.push(label);
  });

  const xfadeFilters = [];
  let prevLabel = labels[0];
  for (let i = 1; i < labels.length; i++) {
    const outLabel = i === labels.length - 1 ? 'vout' : `x${i}`;
    const offset = (i * (CLIP_DUR - XFADE)).toFixed(3);
    xfadeFilters.push(`[${prevLabel}][${labels[i]}]xfade=transition=fade:duration=${XFADE}:offset=${offset}[${outLabel}]`);
    prevLabel = outLabel;
  }

  return { inputs, filterComplex: filters.concat(xfadeFilters).join(';'), beatCount: filters.length, xfadeCount: xfadeFilters.length };
}

// Short GOP (0.6s) so the scroll-scrub's arbitrary seeks (video.currentTime
// = scrollProgress * duration) always land near a keyframe — without this,
// rapid successive seeks starve the decoder and playback stalls. Same
// interval used for both codecs so mp4/webm scrub identically.
const GOP = 15;

function buildVariant(variant) {
  const { inputs, filterComplex, beatCount, xfadeCount } = buildFilterComplex(variant);
  console.log(`${variant}: ${beatCount} beats, ${xfadeCount} crossfades`);

  // AV1/VP9 in WebM first (the brief's preferred codec for this content —
  // meaningfully smaller than H.264 at matching quality), H.264 MP4 as the
  // fallback for browsers/devices without WebM decode support.
  const webmPath = path.join(OUT_DIR, `icarus-hero-${variant}.webm`);
  execFileSync('ffmpeg', [
    '-y', ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[vout]',
    '-r', String(FPS),
    '-g', String(GOP), '-keyint_min', String(GOP),
    '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-deadline', 'good', '-cpu-used', '2',
    '-pix_fmt', 'yuv420p',
    webmPath,
  ], { stdio: 'inherit' });
  console.log('Wrote', webmPath);

  const mp4Path = path.join(OUT_DIR, `icarus-hero-${variant}.mp4`);
  execFileSync('ffmpeg', [
    '-y', ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[vout]',
    '-r', String(FPS),
    '-g', String(GOP), '-keyint_min', String(GOP), '-bf', '0',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    mp4Path,
  ], { stdio: 'inherit' });
  console.log('Wrote', mp4Path);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
Object.keys(VARIANTS).forEach(buildVariant);
console.log('Done.');

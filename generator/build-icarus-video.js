// Bakes the Icarus hero's scroll-scrubbed video from the 5 story-beat
// illustrations in video-gen-source/. Each beat gets an actual directional
// Ken Burns pan (not a centered zoom) — the start/end crop-window fractions
// below were chosen by eye against each source image so the camera follows
// the figure (and, in the water beats, the sea) instead of drifting into
// blank paper. Beats are crossfaded into one continuous clip per
// orientation, matching the two source-image variants (wide 16:9 desktop,
// tall 9:16 mobile) already used by icarus-figure.js.
//
// Requires ffmpeg on PATH. Run: node generator/build-icarus-video.js
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'video-gen-source');
const OUT_DIR = path.join(ROOT, 'assets', 'icarus');

const FPS = 25;
const CLIP_DUR = 3.6; // seconds each beat is fully on-screen before the next crossfade starts
const XFADE = 0.6; // seconds crossfaded into the next beat

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
    file: '01-ascend', scale: 1.3,
    // bottom-left of frame drifting to top-right, toward the sun
    wide: { x: [0.25, 0.75], y: [0.78, 0.12] },
    tall: { x: [0.35, 0.65], y: [0.78, 0.12] },
  },
  {
    file: '02-peak', scale: 1.4,
    // continues up and right into a tighter frame on his face and the melting wings
    wide: { x: [0.35, 0.65], y: [0.55, 0.18] },
    tall: { x: [0.35, 0.60], y: [0.55, 0.18] },
  },
  {
    file: '03-fall', scale: 1.3,
    // he's upside down (feet up top, head low) with the sea below — he drifts down-frame as he falls
    wide: { x: [0.5, 0.5], y: [0.12, 0.78] },
    tall: { x: [0.5, 0.5], y: [0.12, 0.78] },
  },
  {
    file: '04-dive', scale: 1.3,
    // underwater, diving further down and right toward the seabed/bottle
    wide: { x: [0.35, 0.65], y: [0.22, 0.72] },
    tall: { x: [0.35, 0.60], y: [0.22, 0.72] },
  },
  {
    file: '05-rise', scale: 1.25,
    // "forming up a bit" — a modest rise from the waterline toward the raised bottle
    wide: { x: [0.5, 0.5], y: [0.62, 0.30] },
    tall: { x: [0.45, 0.50], y: [0.58, 0.28] },
  },
];

const VARIANTS = {
  wide: { w: 960, h: 540 },
  tall: { w: 540, h: 960 },
};

function even(n) {
  return Math.round(n / 2) * 2;
}

function buildVariant(variant) {
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

  const filterComplex = filters.concat(xfadeFilters).join(';');
  const outPath = path.join(OUT_DIR, `icarus-hero-${variant}.mp4`);

  const args = [
    '-y',
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[vout]',
    '-r', String(FPS),
    // Short GOP so the scroll-scrub's arbitrary seeks (video.currentTime =
    // scrollProgress * duration) always land near a keyframe — without
    // this, rapid successive seeks starve the decoder and playback stalls.
    '-g', '5', '-keyint_min', '5', '-bf', '0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outPath,
  ];

  console.log('Building', outPath, `(${filters.length} beats, ${xfadeFilters.length} crossfades)`);
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  console.log('Wrote', outPath);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
Object.keys(VARIANTS).forEach(buildVariant);
console.log('Done.');

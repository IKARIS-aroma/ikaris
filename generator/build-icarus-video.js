// Bakes the Icarus hero's scroll-scrubbed video from the 10 story-beat
// illustrations in video-gen-source/ (new artwork, Sep 2026: 4 ascend
// variants + 1 peak + 2 fall variants + impact + seabed + rise, replacing
// the previous 5-beat set 1:1 in narrative shape — ascend/peak/fall/ocean/
// rise — just with richer coverage of the ascend and fall beats). Each beat
// is a completely static frame, no per-beat Ken Burns pan (dropped per
// explicit request — the pans read as unwanted "movement" against the
// user's intent for the artwork to hold still); the beats are crossfaded
// into one continuous clip per orientation with a long, slow dissolve
// (see SLOW_XFADE) so scrubbing through them still feels like a continuous
// interactive video rather than a slideshow of hard cuts — except the
// ascend beats themselves, which stay quick (FAST_XFADE) per explicit
// request ("the first part with the flapping wings can be fast"). Matches
// the two source-image variants (wide 16:9 desktop, tall 9:16 mobile)
// already used by icarus-figure.js — the tall ones are NOT a crop of the
// wide art (a 9:16 sliver of a 16:9 composition loses most of the
// wingspan); see generator/prepare-icarus-frames.js, which must be run
// first to populate video-gen-source/ from the raw artwork.
//
// Requires ffmpeg on PATH and video-gen-source/ already populated (run
// generator/prepare-icarus-frames.js first). Run: node generator/build-icarus-video.js
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'video-gen-source');
const OUT_DIR = path.join(ROOT, 'assets', 'icarus');

const FPS = 25;
// Two crossfade speeds, per explicit request: the ascend beats (flapping
// wings) stay quick, everything from the peak onward is a long, slow
// dissolve (>=5s) so it never reads as a cut. Each beat's own `dur` has to
// comfortably exceed the sum of its leading + trailing crossfade (fully
// overlapped beats produce a garbled/negative-offset filter graph) — the
// slow-crossfade beats are long enough to still hold solidly for a few
// seconds in between.
const FAST_XFADE = 1.0;
const SLOW_XFADE = 5.0;

const BEATS = [
  { file: '01-ascend1', dur: 2 },
  { file: '02-ascend2', dur: 2, xfadeIn: FAST_XFADE },
  { file: '03-ascend3', dur: 2, xfadeIn: FAST_XFADE },
  { file: '04-peak', dur: 8, xfadeIn: FAST_XFADE }, // last fast entry; leaves it holding briefly before the slow dissolve into the fall
  { file: '05-fall1', dur: 12, xfadeIn: SLOW_XFADE },
  { file: '06-fall2', dur: 12, xfadeIn: SLOW_XFADE },
  { file: '07-impact', dur: 12, xfadeIn: SLOW_XFADE },
  { file: '08-seabed', dur: 12, xfadeIn: SLOW_XFADE },
  { file: '09-rise', dur: 14, xfadeIn: SLOW_XFADE },
  { file: '10-surface', dur: 16, xfadeIn: SLOW_XFADE }, // the emphasized closing beat — longest hold, no trailing crossfade
];

const VARIANTS = {
  wide: { w: 960, h: 540 },
  tall: { w: 540, h: 960 },
};

function buildFilterComplex(variant) {
  const { w, h } = VARIANTS[variant];
  const inputs = [];
  const filters = [];
  const labels = [];

  BEATS.forEach((beat, i) => {
    const imgPath = path.join(SRC_DIR, `${beat.file}-${variant}.png`);
    inputs.push('-loop', '1', '-t', String(beat.dur), '-i', imgPath);

    const label = `v${i}`;
    // Static centered cover-crop to the output canvas — no time-varying
    // crop window, so the frame genuinely holds still for its full duration.
    filters.push(
      `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,` +
      `crop=${w}:${h},` +
      `fps=${FPS},format=yuv420p,setsar=1[${label}]`
    );
    labels.push(label);
  });

  // Cumulative offset for the Nth crossfade = total duration of clips
  // 1..N (their own lengths, not yet overlapped) minus the sum of every
  // crossfade duration used so far (each completed crossfade has already
  // pulled the timeline back by its own length) — generalizes the earlier
  // uniform i*(CLIP_DUR-XFADE) to per-transition crossfade lengths.
  const xfadeFilters = [];
  let prevLabel = labels[0];
  let cumulative = BEATS[0].dur;
  let xfadeSum = 0;
  for (let i = 1; i < labels.length; i++) {
    const outLabel = i === labels.length - 1 ? 'vout' : `x${i}`;
    const xfade = BEATS[i].xfadeIn;
    xfadeSum += xfade;
    const offset = (cumulative - xfadeSum).toFixed(3);
    xfadeFilters.push(`[${prevLabel}][${labels[i]}]xfade=transition=fade:duration=${xfade}:offset=${offset}[${outLabel}]`);
    prevLabel = outLabel;
    cumulative += BEATS[i].dur;
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

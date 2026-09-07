// Bakes the Icarus hero's scroll-scrubbed video from the 10 story-beat
// illustrations in video-gen-source/ (new artwork, Sep 2026: 4 ascend
// variants + 1 peak + 2 fall variants + impact + seabed + rise, replacing
// the previous 5-beat set 1:1 in narrative shape — ascend/peak/fall/ocean/
// rise — just with richer coverage of the ascend and fall beats). Each beat
// is a completely static frame, no per-beat Ken Burns pan (dropped per
// explicit request — the pans read as unwanted "movement" against the
// user's intent for the artwork to hold still); the beats are crossfaded
// into one continuous clip per orientation with a long dissolve (see XFADE)
// so scrubbing through them still feels like a continuous interactive
// video rather than a slideshow of hard cuts. Matches the two source-image
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
// A long crossfade relative to the hold is what makes a static-frame
// sequence still read as one continuous "video" under scroll-scrubbing
// instead of a slideshow — XFADE is a substantial fraction of even the
// short beats' own duration (previously a quick 0.35s snap against a 1.8s
// hold, back when each beat also had its own Ken Burns pan providing
// continuous motion on its own).
const XFADE = 1.0; // seconds crossfaded into the next beat
const SHORT_DUR = 2.0; // ascend/peak/fall/impact/seabed — short enough that it's mostly crossfade, deliberately: reads as continuous flow rather than a hard hold
const LONG_DUR = 7.0; // rise + surface — the emotional close before the real bottle reveal, held a lot longer per explicit request

const BEATS = [
  { file: '01-ascend1', dur: SHORT_DUR },
  { file: '02-ascend2', dur: SHORT_DUR },
  { file: '03-ascend3', dur: SHORT_DUR },
  { file: '04-peak', dur: SHORT_DUR },
  { file: '05-fall1', dur: SHORT_DUR },
  { file: '06-fall2', dur: SHORT_DUR },
  { file: '07-impact', dur: SHORT_DUR },
  { file: '08-seabed', dur: SHORT_DUR },
  { file: '09-rise', dur: LONG_DUR },
  { file: '10-surface', dur: LONG_DUR },
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
  // 1..N (their own lengths, not yet overlapped) minus N*XFADE (each
  // completed crossfade before it has already pulled the timeline back by
  // one XFADE) — this is what lets beats have different lengths at all;
  // the old uniform i*(CLIP_DUR-XFADE) was just this formula's special case.
  const xfadeFilters = [];
  let prevLabel = labels[0];
  let cumulative = BEATS[0].dur;
  for (let i = 1; i < labels.length; i++) {
    const outLabel = i === labels.length - 1 ? 'vout' : `x${i}`;
    const offset = (cumulative - i * XFADE).toFixed(3);
    xfadeFilters.push(`[${prevLabel}][${labels[i]}]xfade=transition=fade:duration=${XFADE}:offset=${offset}[${outLabel}]`);
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

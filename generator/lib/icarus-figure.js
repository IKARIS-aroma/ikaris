// The Icarus hero visual: a single scroll-scrubbed video (see
// blender/ — no, see the ffmpeg-built assets/icarus/icarus-hero-*.mp4)
// covering all five story beats (ascend, peak/wax-melting, fall,
// underwater dive, rise with the bottle) as one continuous 16s clip —
// a slow Ken Burns zoom on each of the five illustrations, crossfading
// between them. icarus-cinematic.js sets video.currentTime directly from
// scroll progress (0-1 -> 0-16s), the same "scrub a video like an Apple
// product page" technique, instead of crossfading separate DOM frames.
// Two independently-built source videos, not one video squeezed to fit:
// a landscape "wide" cut for desktop and a portrait "tall" cut for
// mobile, chosen via a <source media> breakpoint (BREAKPOINT_PX) that
// matches the CSS media query in style.css.
const { assetUrl } = require('./urls');

const BREAKPOINT_PX = 700;

function renderIcarusFigure() {
  const wideMp4 = assetUrl('icarus/icarus-hero-wide.mp4');
  const tallMp4 = assetUrl('icarus/icarus-hero-tall.mp4');
  // <source media> on <video> is not reliably re-evaluated the way
  // <picture><source media> is across browsers — confirmed on this exact
  // build (Chromium picked the tall source at an 800px viewport, which
  // should have matched the wide query). JS-driven src selection (see
  // icarus-cinematic.js) is the standard, reliable workaround.
  return `<div class="epic__icarus" data-epic-figure aria-hidden="true">
    <video data-icarus-video data-wide-src="${wideMp4}" data-tall-src="${tallMp4}" data-breakpoint="${BREAKPOINT_PX}" muted playsinline webkit-playsinline preload="auto" poster="${assetUrl('icarus/icarus-01-ascend-wide.jpg')}"></video>
  </div>`;
}

module.exports = { renderIcarusFigure };

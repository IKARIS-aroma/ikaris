// The Icarus hero visual: a single scroll-scrubbed video (built by
// generator/build-icarus-video.js from the 10 story-beat illustrations in
// video-gen-source/ — ascend x4, peak, fall x2, impact, seabed, rise) as
// one continuous ~15s clip — a slow Ken Burns pan on each illustration,
// crossfading between them. icarus-cinematic.js sets video.currentTime
// directly from scroll progress (0-1 -> 0-duration), the same "scrub a
// video like an Apple product page" technique, instead of crossfading
// separate DOM frames. Two independently-built source videos, not one
// video squeezed to fit: a landscape "wide" cut for desktop and a portrait
// "tall" cut for mobile, chosen via a breakpoint (BREAKPOINT_PX) that
// matches the CSS media query in style.css. Each orientation also has a
// VP9/WebM encode (meaningfully smaller than H.264 on this dense
// cross-hatched line art) tried before the H.264/MP4 fallback.
const { assetUrl } = require('./urls');

const BREAKPOINT_PX = 700;

function renderIcarusFigure() {
  const wideMp4 = assetUrl('icarus/icarus-hero-wide.mp4');
  const tallMp4 = assetUrl('icarus/icarus-hero-tall.mp4');
  const wideWebm = assetUrl('icarus/icarus-hero-wide.webm');
  const tallWebm = assetUrl('icarus/icarus-hero-tall.webm');
  // <source media> on <video> is not reliably re-evaluated the way
  // <picture><source media> is across browsers — confirmed on this exact
  // build (Chromium picked the tall source at an 800px viewport, which
  // should have matched the wide query). JS-driven src selection (see
  // icarus-cinematic.js) is the standard, reliable workaround — so the
  // codec choice is made in JS too (canPlayType), not via <source type>.
  return `<div class="epic__icarus" data-epic-figure aria-hidden="true">
    <video data-icarus-video data-wide-src="${wideMp4}" data-tall-src="${tallMp4}" data-wide-src-webm="${wideWebm}" data-tall-src-webm="${tallWebm}" data-breakpoint="${BREAKPOINT_PX}" muted playsinline webkit-playsinline preload="auto" poster="${assetUrl('icarus/icarus-01-ascend-wide.jpg')}"></video>
  </div>`;
}

module.exports = { renderIcarusFigure };

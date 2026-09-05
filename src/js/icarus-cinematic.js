/*
 * The Icarus sequence, take two: GSAP + ScrollTrigger pin .epic and scrub
 * a single timeline against scroll position (Lenis supplies the smooth
 * scroll feel ScrollTrigger reads from). Percentage checkpoints follow the
 * creative brief: 0 begin flying, 20 rise toward the sun, 40 reach it,
 * 55 begin falling, 70 enter the ocean, 80 rise holding the bottle,
 * 90 the bottle comes toward camera, 100 it fills the screen and the pin
 * releases straight into the product gallery beneath.
 *
 * Progressive enhancement: with prefers-reduced-motion, or if GSAP/
 * ScrollTrigger failed to load, .epic--static is applied instead — the CSS
 * for that class already lays every element out in normal flow at full
 * opacity, so nothing needs to be built or torn down.
 */
(function () {
  'use strict';

  // Shared by every animated feature in this file. initEpic() already
  // checked this before it grew a second reference in this module, but
  // initGallerySwitcher() and initShowcase()'s panel-fade tweens never did
  // — they only fell back to non-animated behaviour when GSAP itself was
  // missing, never for a stated reduced-motion preference.
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initEpic() {
    var root = document.querySelector('[data-epic]');
    if (!root) return;

    // Pick the wide (desktop) or tall (mobile) video source in JS —
    // <video><source media> is not reliably re-evaluated across browsers
    // the way <picture><source media> is, so this doesn't use <source>
    // children at all (see icarus-figure.js). Runs before the reduced-
    // motion/no-GSAP checks below so the right video is set regardless.
    var heroVideo = root.querySelector('[data-icarus-video]');

    function currentBreakpointSrc() {
      var breakpoint = Number(heroVideo.getAttribute('data-breakpoint')) || 700;
      var isWide = window.matchMedia('(min-width: ' + breakpoint + 'px)').matches;
      return heroVideo.getAttribute(isWide ? 'data-wide-src' : 'data-tall-src');
    }

    function loadVideoSource() {
      heroVideo.src = currentBreakpointSrc();
      heroVideo.load();

      // This video is only ever *seeked* (video.currentTime = ...), never
      // actually played — iOS Safari's decode pipeline for a preload="auto"
      // video routinely never fully engages until .play() has been called
      // at least once, so arbitrary currentTime seeks on a video that has
      // literally never played can just show nothing. Muted, inline video
      // is exempt from autoplay-gesture restrictions on every current
      // browser (including iOS), so this succeeds without user interaction
      // — kick it off immediately, then pause on the same tick the promise
      // resolves so nothing actually plays.
      heroVideo.muted = true;
      heroVideo.playsInline = true;
      var kickstart = heroVideo.play();
      if (kickstart && typeof kickstart.then === 'function') {
        kickstart.then(function () { heroVideo.pause(); }).catch(function () {});
      } else {
        heroVideo.pause();
      }
    }

    if (heroVideo && !heroVideo.currentSrc) loadVideoSource();

    var reduceMotion = prefersReducedMotion;
    var hasGSAP = !!(window.gsap && window.ScrollTrigger);

    if (reduceMotion || !hasGSAP) {
      root.classList.add('epic--static');
      return;
    }

    var sky = root.querySelector('[data-epic-sky]');
    var clouds = root.querySelector('[data-epic-clouds]');
    var ocean = root.querySelector('[data-epic-ocean]');
    var particles = root.querySelector('[data-epic-particles]');
    var figure = root.querySelector('[data-epic-figure]');
    var bottleEl = root.querySelector('[data-epic-bottle]');
    var cue = root.querySelector('[data-epic-cue]');
    var actions = root.querySelector('[data-epic-actions]');
    var lines = root.querySelectorAll('[data-epic-line]');
    var subs = root.querySelectorAll('[data-epic-sub]');
    var video = heroVideo;

    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      var lenis = new window.Lenis({ smoothWheel: true, duration: 1.1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // Thresholds re-derived from the actual baked video's beat windows (see
    // the caption comment further down) rather than the original abstract
    // percentages — those ran 8-10 points behind what the video was
    // already showing (e.g. the sky stayed "daytime" until 48% when the
    // video was already well into the fall by 38%).
    var PHASES = ['phase-dawn', 'phase-ascend', 'phase-peak', 'phase-fall', 'phase-ocean', 'phase-rise'];
    function phaseForProgress(p) {
      if (p < 0.08) return 'phase-dawn';
      if (p < 0.21) return 'phase-ascend';
      if (p < 0.40) return 'phase-peak';
      if (p < 0.60) return 'phase-fall';
      if (p < 0.79) return 'phase-ocean';
      return 'phase-rise';
    }
    var currentPhase = '';

    var bottleInited = false;
    function initBottle() {
      if (bottleInited || !window.IKARIS_BOTTLE_VIEWER || !window.IKARIS_BOTTLE_VIEWER.supportsWebGL()) return;
      bottleInited = true;
      window.IKARIS_BOTTLE_VIEWER.init(bottleEl, {
        glbUrl: bottleEl.getAttribute('data-glb-url'),
        showHint: false,
        enableControls: false,
        autoRotate: true,
        // The bottle's CSS transform scales up to 3.4x at the finale — see
        // bottle-viewer.js's oversample comment for why the canvas needs
        // extra baked-in resolution to survive that stretch sharply.
        oversample: 2,
        onReady: function () {
          bottleEl.classList.add('is-live');
        },
      });
    }

    // iOS Safari's video decoder gets stuck showing a blank frame (or
    // destabilizes the whole tab) under a sustained ~60/sec currentTime
    // write rate — a known limitation specific to scroll-scrubbed video on
    // iOS, not something desktop hardware decoders struggle with. Even
    // gating writes to one per rendered frame isn't enough margin on that
    // hardware; community fixes for this exact pattern throttle to
    // roughly half the frame rate. onUpdate just records the latest
    // progress (cheap); this loop applies it at ~30/sec, comfortably
    // smooth for slow Ken-Burns-style motion while giving iOS's decoder
    // real breathing room between seeks.
    var pendingProgress = null;
    var lastSeekAt = 0;
    var MIN_SEEK_INTERVAL_MS = 33;
    function videoSeekLoop(now) {
      requestAnimationFrame(videoSeekLoop);
      if (pendingProgress === null || !video || !video.duration) return;
      if (now - lastSeekAt < MIN_SEEK_INTERVAL_MS) return;
      lastSeekAt = now;
      video.currentTime = pendingProgress * video.duration;
      pendingProgress = null;
    }
    requestAnimationFrame(videoSeekLoop);

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        // Was +=400%. All the beat percentages below are relative to this
        // total, so raising it slows the entire sequence uniformly — every
        // beat, the video scrub included, now takes 25% more physical
        // scroll to get through, without touching a single percentage
        // point (which stay synced to the baked video's own beat windows;
        // re-deriving those took real work earlier and isn't worth
        // reopening). Directly answers "keep the scroll speed slower":
        // the finale hold below was still only ~32vh of scroll at 400%,
        // easily blown through in a single fast flick on mobile — at 500%
        // the same percentage window is ~40vh, and wider still now that
        // the hold itself was also widened (see the bottle scale tweens).
        end: '+=500%',
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        onUpdate: function (self) {
          var p = self.progress;

          var phase = phaseForProgress(p);
          if (phase !== currentPhase) {
            sky.classList.remove.apply(sky.classList, PHASES);
            sky.classList.add(phase);
            currentPhase = phase;
          }

          cue.classList.toggle('is-hidden', p > 0.04);
          actions.classList.toggle('is-live', p > 0.82);
          // Starts loading earlier (was 0.75) now that the reveal itself
          // starts at 0.74 — the GLB needs real lead time to fetch/parse
          // before it's actually due on screen.
          if (p > 0.62) initBottle();

          // Clouds drift on their own via CSS, but also parallax with
          // scroll so the sky itself feels like it's moving as you move,
          // not just the foreground figure/ocean/bottle.
          if (clouds) clouds.style.transform = 'translate(' + (-p * 60) + 'px,' + (-p * 40) + 'px)';

          // Scrub the hero video like an Apple product page: scroll
          // progress maps linearly onto the video's own timeline. The
          // video already contains its own Ken Burns pans and crossfades
          // between the five story beats (built via ffmpeg — see
          // assets/icarus/icarus-hero-*.mp4), so there's nothing else to
          // animate here. The actual seek happens in videoSeekLoop above.
          pendingProgress = p;
        },
      },
    });

    if (video) {
      video.addEventListener('loadedmetadata', function () {
        video.currentTime = tl.scrollTrigger.progress * video.duration;
      });

      // The wide/tall source was previously picked once and never
      // reconsidered — rotating a phone mid-scroll (or resizing a desktop
      // window across the breakpoint) kept showing the wrong-aspect cut
      // for the rest of that session. Re-check on resize/orientation
      // change; only actually swap (and re-seek to the current scroll
      // progress) when the correct source has genuinely changed.
      var resizeTimer = null;
      function maybeSwapVideoSource() {
        var wanted = currentBreakpointSrc();
        if (video.getAttribute('src') === wanted) return;
        var progress = tl.scrollTrigger.progress;
        loadVideoSource();
        video.addEventListener('loadedmetadata', function onceMeta() {
          video.removeEventListener('loadedmetadata', onceMeta);
          video.currentTime = progress * video.duration;
        });
      }
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(maybeSwapVideoSource, 250);
      });
      window.addEventListener('orientationchange', maybeSwapVideoSource);
    }

    // Fully gone by 74 — previously faded 82-88 while the real bottle was
    // ALSO fading in from 78, so for a 6-point stretch the illustrated
    // (teal, hand-drawn) bottle in the video and the real 3D (dark,
    // faceted) product bottle were both on screen in the same spot at
    // once. Confirmed live: a visible double-bottle overlap right at the
    // supposed "transformation" moment, undercutting the one beat that's
    // supposed to read as a clean reveal.
    tl.to(figure, { opacity: 0, duration: 10 }, 64);

    // Ocean rises into frame as Icarus falls, settles once he's in it.
    // Start nudged from 38 to 34 to close part of the same lag the phase
    // thresholds above were re-synced for. (gsap.set first so GSAP tracks
    // the CSS translateY(100%) as yPercent — otherwise it assumes
    // yPercent starts at 0 and the tween is a no-op.)
    gsap.set(ocean, { y: 0, yPercent: 100 });
    tl.to(ocean, { yPercent: 0, duration: 20 }, 34);

    // Sun-glints during the climb, sea-spray during the fall/splash/dive —
    // shifted earlier in step with the re-synced phase thresholds.
    tl.to(particles, { opacity: 1, duration: 8 }, 10)
      .to(particles, { opacity: 0.3, duration: 8 }, 26)
      .to(particles, { opacity: 1, duration: 8 }, 44)
      .to(particles, { opacity: 0, duration: 8 }, 62);

    // Rebirth: the real bottle grows from nothing exactly as the
    // illustrated one finishes fading (74, right after figure above), then
    // closes the distance until it fills the screen — but finishes at 88,
    // not 100. The payoff used to complete exactly as the pin released, so
    // the fully-revealed bottle was on screen for a single instant before
    // scrolling straight into the next section ("the last frame is too
    // short, barely visible" — confirmed live, twice: first with zero
    // dwell at all, then again after an 8-point hold still wasn't enough
    // on a real device, since 8% of even the old 400%-length pin is only
    // ~32vh — a single fast swipe. Finishing the scale-up at 88 instead of
    // 92 gives 12 points of hold instead of 8, and that 12% now applies to
    // the wider 500%-length pin above (~60vh total) — nearly double the
    // previous physical scroll distance. Three strictly back-to-back
    // segments (74->80->84->88, not overlapping) — the old 78/90/96
    // numbers overlapped 90-96 and 96-100, two tweens fighting over the
    // same `scale` property, which produced a small but real speed hitch.
    tl.to(bottleEl, { opacity: 1, scale: 1, duration: 6 }, 74)
      .to(bottleEl, { scale: 1.7, duration: 4 }, 80)
      .to(bottleEl, { scale: 3.4, duration: 4 }, 84);

    // Captions, keyed to the actual baked video beat windows (see
    // generator/build-icarus-video.js: CLIP_DUR=3.6, XFADE=0.6, 5 beats ->
    // beat N's own window as % of total scroll is roughly ascend 0-23,
    // peak 19-42, fall 38-62, dive 58-81, rise 77-100). The original
    // caption timings were authored against an earlier abstract "story
    // beat" percentage scheme and drifted 8-10 points behind what the
    // video actually shows by the time it landed — confirmed live by
    // scrolling the real page: at 40% the sun was still at full daytime
    // opacity while the video already showed him falling toward the sea.
    // Looked up by data-epic-sub/-line VALUE, not array index, since the
    // two new captions below (2, 3) aren't in numeric DOM order.
    function line(idx) { return root.querySelector('[data-epic-line="' + idx + '"]'); }
    function sub(idx) { return root.querySelector('[data-epic-sub="' + idx + '"]'); }
    // All six lines share one grid cell (see .epic__caption in style.css)
    // so the crossfades below must hand off sequentially, not overlap in
    // time — two lines partially visible at once means two lines of text
    // literally drawn on top of each other in the same spot.
    if (line(0)) { gsap.set(line(0), { opacity: 1 }); tl.to(line(0), { opacity: 0, duration: 4 }, 8); }
    if (sub(0)) tl.to(sub(0), { opacity: 1, duration: 4 }, 12).to(sub(0), { opacity: 0, duration: 4 }, 20);
    // Peak/hubris beat (video ~19-42) previously had no caption at all —
    // the wax visibly melting was the one story beat told in total silence.
    if (sub(2)) tl.to(sub(2), { opacity: 1, duration: 4 }, 26).to(sub(2), { opacity: 0, duration: 4 }, 34);
    if (sub(1)) tl.to(sub(1), { opacity: 1, duration: 4 }, 40).to(sub(1), { opacity: 0, duration: 4 }, 48);
    // Dive/discovery beat (video ~58-81) also had no caption — this is the
    // myth-to-product hinge (why is there a bottle underwater?) and was
    // previously left entirely to inference.
    if (sub(3)) tl.to(sub(3), { opacity: 1, duration: 4 }, 56).to(sub(3), { opacity: 0, duration: 4 }, 66);
    // Starts right as the real bottle begins fading in below (74) — the
    // line and the reveal land together — and clears out at 84, before the
    // bottle's biggest scale-up (86->92), so it never overlaps the
    // bottle's neck/cap the way the unconditional "stay visible to 100%"
    // version used to.
    if (line(1)) tl.to(line(1), { opacity: 1, duration: 6 }, 74).to(line(1), { opacity: 0, duration: 4 }, 84);

    tl.to(actions, { opacity: 1, duration: 6 }, 84);

    // The actual root cause of "the last frame is too short" surviving
    // several previous rounds of retiming: GSAP infers a timeline's own
    // totalDuration from whichever child tween ends LAST — here, actions
    // finishing at 90 — and scrub maps scroll progress onto THAT total,
    // not onto a fixed literal 100. With nothing authored past 90, position
    // 90 WAS 100% scroll progress, so the bottle's "finish at 88" was really
    // finishing at 88/90 = 97.8% of the scroll — a hold of barely 2 points,
    // no matter how generously the percentages above were spaced out. This
    // empty marker anchors true position 100 as the real end, so 88-100
    // is a genuine 12-point hold with nothing left changing in it.
    tl.set({}, {}, 100);
  }

  function initGallerySwitcher() {
    var switcher = document.querySelector('[data-gallery-switcher]');
    if (!switcher) return;
    var buttons = Array.prototype.slice.call(switcher.querySelectorAll('[data-gender-btn]'));
    var sets = Array.prototype.slice.call(document.querySelectorAll('[data-gallery-set]'));

    function activate(gender, animate) {
      buttons.forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-gender-btn') === gender);
      });
      sets.forEach(function (s) {
        var match = s.getAttribute('data-gallery-set') === gender;
        if (!window.gsap || !animate || prefersReducedMotion) {
          s.hidden = !match;
          return;
        }
        if (match) {
          s.hidden = false;
          gsap.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.35 });
        } else {
          gsap.to(s, { opacity: 0, duration: 0.2, onComplete: function () { s.hidden = true; } });
        }
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { activate(b.getAttribute('data-gender-btn'), true); });
    });

    activate(buttons.length ? buttons[0].getAttribute('data-gender-btn') : 'men', false);
  }

  // A single-product showcase per gender: one large stage (3D bottle where
  // a model exists, its static photo otherwise) with prev/next + dots to
  // slide between that gender's fragrances — the Santioni-style "one model,
  // one name, slide to the next" layout, not a grid of cards.
  function initShowcase() {
    var showcases = Array.prototype.slice.call(document.querySelectorAll('[data-showcase]'));
    showcases.forEach(function (sc) {
      var panels = Array.prototype.slice.call(sc.querySelectorAll('[data-showcase-panel]'));
      if (!panels.length) return;
      var nameEl = sc.querySelector('[data-showcase-name]');
      var charEl = sc.querySelector('[data-showcase-char]');
      var priceEl = sc.querySelector('[data-showcase-price]');
      var linkEl = sc.querySelector('[data-showcase-link]');
      var dotsWrap = sc.querySelector('[data-showcase-dots]');
      var category = sc.getAttribute('data-category');
      var prevBtn = sc.querySelector('[data-showcase-prev]');
      var nextBtn = sc.querySelector('[data-showcase-next]');
      var current = 0;
      var inited3d = {};
      // Slug -> live viewer handle. Only ever one at a time in practice
      // (the carousel shows one panel), but tracked by slug rather than a
      // single variable so goTo() can dispose exactly the panel it's
      // leaving, even under a fast double-click.
      var viewers = {};

      function disposeSlug(slug) {
        var entry = viewers[slug];
        if (!entry) return;
        entry.handle.dispose();
        // Reset the container so if this panel is revisited, init3D below
        // builds a clean new canvas + hint instead of stacking a second
        // "Drag to Rotate" label onto whatever dispose() left behind.
        entry.el.hidden = true;
        entry.el.classList.remove('is-ready');
        entry.el.innerHTML = '';
        delete viewers[slug];
        delete inited3d[slug];
      }

      function init3D(panel) {
        var el = panel.querySelector('[data-bottle-3d-lazy]');
        var slug = panel.getAttribute('data-slug');
        if (!el || inited3d[slug] || !window.IKARIS_BOTTLE_VIEWER || !window.IKARIS_BOTTLE_VIEWER.supportsWebGL()) return;
        inited3d[slug] = true;
        el.hidden = false;
        // Every previously-visited panel's viewer used to keep running in
        // the background forever (its own WebGL context + render loop),
        // never disposed — a few fragrances into the slider and several
        // contexts are alive at once, which mobile browsers tolerate far
        // worse than desktop. Disposing whatever's currently live before
        // starting a new one keeps at most one context open at a time.
        Object.keys(viewers).forEach(disposeSlug);
        viewers[slug] = { el: el, handle: window.IKARIS_BOTTLE_VIEWER.init(el, {
          glbUrl: el.getAttribute('data-glb-url'),
          hideSiblingPhoto: true,
          showHint: true,
          enableControls: true,
          autoRotate: true,
        }) };
      }

      function renderDots() {
        if (!dotsWrap) return;
        // Rebuilding via innerHTML destroys and recreates every dot button,
        // including whichever one was just clicked or reached by keyboard —
        // focus fell back to document.body on every navigation, so a
        // keyboard user pressing Enter on a dot (or prev/next) lost their
        // place entirely and had to re-Tab from the top of the page. Only
        // worth restoring if focus was actually inside the dots to begin
        // with (true right after a click/keypress on one) — plain page
        // load or a mouse click on prev/next shouldn't yank focus here.
        var hadFocus = document.activeElement && dotsWrap.contains(document.activeElement);
        dotsWrap.innerHTML = panels.map(function (p, i) {
          return '<button type="button" class="showcase__dot' + (i === current ? ' is-active' : '') + '" data-i="' + i + '" aria-label="Show ' + p.getAttribute('data-name') + '"></button>';
        }).join('');
        Array.prototype.slice.call(dotsWrap.querySelectorAll('button')).forEach(function (b) {
          b.addEventListener('click', function () { goTo(Number(b.getAttribute('data-i'))); });
        });
        if (hadFocus) {
          var toFocus = dotsWrap.querySelector('[data-i="' + current + '"]');
          if (toFocus) toFocus.focus();
        }
      }

      function setAttrs(el, panel) {
        if (!el) return;
        el.setAttribute('data-item-id', panel.getAttribute('data-slug'));
        el.setAttribute('data-item-name', panel.getAttribute('data-name'));
        el.setAttribute('data-item-category', category);
        el.setAttribute('data-item-price', panel.getAttribute('data-price'));
        el.setAttribute('data-item-index', panel.getAttribute('data-index'));
        el.setAttribute('href', panel.getAttribute('data-href'));
      }

      function goTo(i) {
        current = ((i % panels.length) + panels.length) % panels.length;
        var active = panels[current];
        panels.forEach(function (p, idx) {
          var isActive = idx === current;
          if (window.gsap && !prefersReducedMotion) {
            gsap.to(p, { opacity: isActive ? 1 : 0, duration: 0.4 });
          } else {
            p.classList.toggle('is-active', isActive);
          }
          if (window.gsap) p.classList.toggle('is-active', isActive);
          p.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });
        if (nameEl) nameEl.textContent = active.getAttribute('data-name');
        if (charEl) charEl.textContent = active.getAttribute('data-char');
        if (priceEl) priceEl.textContent = '₹' + Number(active.getAttribute('data-price')).toLocaleString('en-IN');
        setAttrs(linkEl, active);
        renderDots();
        init3D(active);
      }

      if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

      renderDots();

      // Previously init3D(panels[0]) ran unconditionally here for every
      // showcase on the page — the homepage has two (men, women), both
      // below the fold, so page load was paying for two full WebGL
      // contexts (plus, per the PMREM comment in bottle-viewer.js, two
      // expensive environment-map render passes) before the visitor had
      // scrolled anywhere near either one. Deferring to an
      // IntersectionObserver spreads that cost out to when it's actually
      // needed instead of bursting it all at once on load — one more
      // contributor to the iOS crash reports alongside the PMREM skip.
      if ('IntersectionObserver' in window) {
        var lazyIO = new IntersectionObserver(function (entries) {
          if (entries[entries.length - 1].isIntersecting) {
            lazyIO.disconnect();
            init3D(panels[current]);
          }
        }, { rootMargin: '200px' });
        lazyIO.observe(sc);
      } else {
        init3D(panels[0]);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initEpic();
    initGallerySwitcher();
    initShowcase();
  });
})();

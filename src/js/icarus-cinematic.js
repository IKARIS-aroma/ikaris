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

    // VP9/WebM is meaningfully smaller than the H.264/MP4 fallback on this
    // dense cross-hatched line art (measured ~20-30% smaller at matching
    // quality) — same codec-detection approach as the breakpoint pick
    // above, done once since canPlayType's answer doesn't change at runtime.
    var supportsWebm = !!(heroVideo && heroVideo.canPlayType &&
      heroVideo.canPlayType('video/webm; codecs="vp9"').replace('no', ''));

    function currentBreakpointSrc() {
      var breakpoint = Number(heroVideo.getAttribute('data-breakpoint')) || 700;
      var isWide = window.matchMedia('(min-width: ' + breakpoint + 'px)').matches;
      var attr = (isWide ? 'data-wide-src' : 'data-tall-src') + (supportsWebm ? '-webm' : '');
      return heroVideo.getAttribute(attr);
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

    // Save-Data asks explicitly to skip non-essential heavy downloads —
    // the hero video (5-9MB depending on variant/codec) is exactly that.
    // Treated the same as prefers-reduced-motion: fall back to the static
    // layout (poster image + real DOM text), never fetch the video at all.
    var saveData = !!(navigator.connection && navigator.connection.saveData);

    var reduceMotion = prefersReducedMotion || saveData;
    var hasGSAP = !!(window.gsap && window.ScrollTrigger);

    if (reduceMotion || !hasGSAP) {
      root.classList.add('epic--static');
      return;
    }

    if (heroVideo && !heroVideo.currentSrc) loadVideoSource();

    var sky = root.querySelector('[data-epic-sky]');
    var clouds = root.querySelector('[data-epic-clouds]');
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
    //
    // Re-derived a third time (Sep 2026) after two changes to
    // build-icarus-video.js: per-beat Ken Burns pans were dropped (beats
    // are now static, held together by a long 1s crossfade instead), and
    // the last two beats (rise, surface) were stretched to 7s each versus
    // 2s for every other beat — the emotional close before the real bottle
    // reveal now gets deliberately lingered on. That makes the beat-group
    // durations wildly uneven (8 short beats vs. 2 long ones), so unlike
    // the previous re-derivation this shifted every threshold, not just
    // one: rise+surface alone now span 40%-100% of scroll.
    var PHASES = ['phase-dawn', 'phase-ascend', 'phase-peak', 'phase-fall', 'phase-ocean', 'phase-rise'];
    function phaseForProgress(p) {
      if (p < 0.05) return 'phase-dawn';
      if (p < 0.17) return 'phase-ascend';
      if (p < 0.21) return 'phase-peak';
      if (p < 0.31) return 'phase-fall';
      if (p < 0.40) return 'phase-ocean';
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
          actions.classList.toggle('is-live', p > 0.9);
          // The reveal itself now starts at 0.70 (rise+surface stretched
          // the back half of the scroll considerably) — the GLB needs real
          // lead time to fetch/parse before it's actually due on screen.
          if (p > 0.55) initBottle();

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

    // Fully gone by 70, right as the real bottle starts taking over (was
    // 64->74) — re-timed along with everything below now that rise+surface
    // (the last two beats) were stretched to 7s each and dominate the back
    // half of the scroll (40-100%, see the phase thresholds above). Kept
    // the same "finish exactly as the reveal begins" relationship as
    // before so there's still no double-bottle overlap.
    tl.to(figure, { opacity: 0, duration: 8 }, 62);

    // Sun-glints during the climb, sea-spray during the fall/splash/dive —
    // re-timed to the new, much-compressed 0-40% window that now covers
    // every beat except rise/surface.
    tl.to(particles, { opacity: 1, duration: 4 }, 3)
      .to(particles, { opacity: 0.3, duration: 4 }, 15)
      .to(particles, { opacity: 1, duration: 4 }, 23)
      .to(particles, { opacity: 0, duration: 4 }, 36);

    // Rebirth: the real bottle grows from nothing exactly as the
    // illustrated one finishes fading (70, right after figure above), then
    // closes the distance until it fills the screen — finishing at 90, not
    // 100, so the fully-revealed bottle gets a genuine 10-point hold
    // instead of appearing on the very last pixel of scroll. Three
    // strictly back-to-back segments (70->78->84->90, not overlapping) —
    // overlapping segments previously produced a small but real speed
    // hitch from two tweens fighting over the same `scale` property.
    tl.to(bottleEl, { opacity: 1, scale: 1, duration: 8 }, 70)
      .to(bottleEl, { scale: 1.7, duration: 6 }, 78)
      .to(bottleEl, { scale: 3.4, duration: 6 }, 84);

    // Captions, keyed to the actual baked video beat windows (see
    // generator/build-icarus-video.js). Re-derived three times now:
    // - originally for the 5-beat set (CLIP_DUR=3.6, XFADE=0.6): ascend
    //   0-23, peak 19-42, fall 38-62, dive 58-81, rise 77-100.
    // - for the first 10-beat set (CLIP_DUR=1.8, XFADE=0.35, uniform beat
    //   length): ascend 0-30, peak 30-40, fall 40-60, ocean 60-79, rise
    //   79-100.
    // - again (Sep 2026) after dropping the per-beat Ken Burns pans and
    //   stretching rise+surface to 7s each against 2s for every other beat
    //   (see build-icarus-video.js): ascend 0-17, peak 17-21, fall 21-31,
    //   ocean 31-40, rise+surface 40-100. Every threshold shifted this
    //   time, not just one — the beat-group durations are now wildly
    //   uneven (8 short beats vs. 2 long ones) instead of roughly even.
    // The original caption timings (before any re-derivation) were
    // authored against an earlier abstract "story beat" percentage scheme
    // and drifted 8-10 points behind what the video actually shows —
    // confirmed live by scrolling the real page: at 40% the sun was still
    // at full daytime opacity while the video already showed him falling
    // toward the sea.
    // Looked up by data-epic-sub/-line VALUE, not array index, since the
    // two new captions below (2, 3) aren't in numeric DOM order.
    function line(idx) { return root.querySelector('[data-epic-line="' + idx + '"]'); }
    function sub(idx) { return root.querySelector('[data-epic-sub="' + idx + '"]'); }
    // All six lines share one grid cell (see .epic__caption in style.css)
    // so the crossfades below must hand off sequentially, not overlap in
    // time — two lines partially visible at once means two lines of text
    // literally drawn on top of each other in the same spot.
    if (line(0)) { gsap.set(line(0), { opacity: 1 }); tl.to(line(0), { opacity: 0, duration: 4 }, 5); }
    if (sub(0)) tl.to(sub(0), { opacity: 1, duration: 4 }, 7).to(sub(0), { opacity: 0, duration: 4 }, 14);
    // Peak/hubris beat is now only 17-21, a 4-point window — kept brief on
    // purpose rather than stealing time from the ascend/fall captions.
    if (sub(2)) tl.to(sub(2), { opacity: 1, duration: 2 }, 17).to(sub(2), { opacity: 0, duration: 2 }, 19);
    if (sub(1)) tl.to(sub(1), { opacity: 1, duration: 3 }, 22).to(sub(1), { opacity: 0, duration: 3 }, 27);
    // Dive/discovery beat (video ~31-40) — this is the myth-to-product
    // hinge (why is there a bottle underwater?).
    if (sub(3)) tl.to(sub(3), { opacity: 1, duration: 3 }, 32).to(sub(3), { opacity: 0, duration: 3 }, 36);
    // Starts right as the real bottle begins fading in below (70) — the
    // line and the reveal land together — and clears out at 84, before the
    // bottle's biggest scale-up (84->90), so it never overlaps the
    // bottle's neck/cap.
    if (line(1)) tl.to(line(1), { opacity: 1, duration: 8 }, 70).to(line(1), { opacity: 0, duration: 6 }, 84);

    tl.to(actions, { opacity: 1, duration: 6 }, 90);

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

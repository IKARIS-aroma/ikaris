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

  function initEpic() {
    var root = document.querySelector('[data-epic]');
    if (!root) return;

    // Pick the wide (desktop) or tall (mobile) video source in JS —
    // <video><source media> is not reliably re-evaluated across browsers
    // the way <picture><source media> is, so this doesn't use <source>
    // children at all (see icarus-figure.js). Runs before the reduced-
    // motion/no-GSAP checks below so the right video is set regardless.
    var heroVideo = root.querySelector('[data-icarus-video]');
    if (heroVideo && !heroVideo.currentSrc) {
      var breakpoint = Number(heroVideo.getAttribute('data-breakpoint')) || 700;
      var isWide = window.matchMedia('(min-width: ' + breakpoint + 'px)').matches;
      heroVideo.src = heroVideo.getAttribute(isWide ? 'data-wide-src' : 'data-tall-src');
    }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    var PHASES = ['phase-dawn', 'phase-ascend', 'phase-peak', 'phase-fall', 'phase-ocean', 'phase-rise'];
    function phaseForProgress(p) {
      if (p < 0.20) return 'phase-dawn';
      if (p < 0.34) return 'phase-ascend';
      if (p < 0.48) return 'phase-peak';
      if (p < 0.68) return 'phase-fall';
      if (p < 0.85) return 'phase-ocean';
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

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: '+=400%',
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
          actions.classList.toggle('is-live', p > 0.88);
          if (p > 0.75) initBottle();

          // Clouds drift on their own via CSS, but also parallax with
          // scroll so the sky itself feels like it's moving as you move,
          // not just the foreground figure/ocean/bottle.
          if (clouds) clouds.style.transform = 'translate(' + (-p * 60) + 'px,' + (-p * 40) + 'px)';

          // Scrub the hero video like an Apple product page: scroll
          // progress maps linearly onto the video's own timeline. The
          // video already contains its own Ken Burns pans and crossfades
          // between the five story beats (built via ffmpeg — see
          // assets/icarus/icarus-hero-*.mp4), so there's nothing else to
          // animate here.
          if (video && video.duration) video.currentTime = p * video.duration;
        },
      },
    });

    if (video) {
      video.addEventListener('loadedmetadata', function () {
        video.currentTime = tl.scrollTrigger.progress * video.duration;
      });
    }

    tl.to(figure, { opacity: 0, duration: 6 }, 82);

    // Ocean rises into frame as Icarus falls, settles once he's in it.
    // (gsap.set first so GSAP tracks the CSS translateY(100%) as yPercent —
    // otherwise it assumes yPercent starts at 0 and the tween is a no-op.)
    gsap.set(ocean, { y: 0, yPercent: 100 });
    tl.to(ocean, { yPercent: 0, duration: 16 }, 38);

    // Sun-glints during the climb, sea-spray during the fall/splash/dive.
    tl.to(particles, { opacity: 1, duration: 8 }, 14)
      .to(particles, { opacity: 0.3, duration: 8 }, 30)
      .to(particles, { opacity: 1, duration: 8 }, 50)
      .to(particles, { opacity: 0, duration: 8 }, 68);

    // Rebirth: the real bottle grows from nothing, overtakes the figure,
    // then closes the distance until it fills the screen at 100%.
    tl.to(bottleEl, { opacity: 1, scale: 1, duration: 10 }, 78)
      .to(bottleEl, { scale: 1.7, duration: 10 }, 90)
      .to(bottleEl, { scale: 3.4, duration: 4 }, 100 - 4);

    // Captions, keyed to the new five-beat windows.
    function line(idx) { return lines[idx]; }
    function sub(idx) { return subs[idx]; }
    // All four lines share one grid cell (see .epic__caption in style.css)
    // so the crossfades below must hand off sequentially, not overlap in
    // time — two lines partially visible at once means two lines of text
    // literally drawn on top of each other in the same spot.
    if (line(0)) { gsap.set(line(0), { opacity: 1 }); tl.to(line(0), { opacity: 0, duration: 4 }, 10); }
    if (sub(0)) tl.to(sub(0), { opacity: 1, duration: 4 }, 14).to(sub(0), { opacity: 0, duration: 4 }, 26);
    if (sub(1)) tl.to(sub(1), { opacity: 1, duration: 4 }, 40).to(sub(1), { opacity: 0, duration: 4 }, 58);
    if (line(1)) tl.to(line(1), { opacity: 1, duration: 6 }, 76);

    tl.to(actions, { opacity: 1, duration: 6 }, 90);
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
        if (!window.gsap || !animate) {
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
        dotsWrap.innerHTML = panels.map(function (p, i) {
          return '<button type="button" class="showcase__dot' + (i === current ? ' is-active' : '') + '" data-i="' + i + '" aria-label="Show ' + p.getAttribute('data-name') + '"></button>';
        }).join('');
        Array.prototype.slice.call(dotsWrap.querySelectorAll('button')).forEach(function (b) {
          b.addEventListener('click', function () { goTo(Number(b.getAttribute('data-i'))); });
        });
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
          if (window.gsap) {
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
      init3D(panels[0]);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initEpic();
    initGallerySwitcher();
    initShowcase();
  });
})();

/*
 * IKARIS "experience layer": preloader, custom cursor, tilt/glass-highlight
 * on product imagery, magnetic buttons, and scroll-reveal. Everything here
 * is progressive enhancement — every element it touches already has its
 * real content in the DOM and works with plain CSS if this file never runs
 * (JS disabled, or prefers-reduced-motion, or a coarse/touch pointer).
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- Preloader ----------
  function initPreloader() {
    var pre = document.querySelector('.preloader');
    if (!pre) return;
    var done = false;
    function dismiss() {
      if (done) return;
      done = true;
      pre.classList.add('is-done');
      window.setTimeout(function () { pre.remove(); }, 700);
    }
    if (reduceMotion) { dismiss(); return; }

    // Used to also hold for the homepage hero video's loadedmetadata here
    // (it gets its .src assigned by icarus-cinematic.js, not a static
    // <source>, so window's own 'load' event never waited on it) — on a
    // slow connection the preloader was clearing before the video was
    // ready, handing the visitor a blank hero mid-scroll-in. That's now
    // moot: icarus-cinematic.js's startVideoOnce() deliberately doesn't
    // load the video at all until the visitor's first scroll (to stop
    // downloading it unread — see that comment for the network evidence),
    // so waiting here for loadedmetadata just meant every homepage visit
    // sitting through the full safety timeout instead, since metadata
    // load can't finish before a scroll that hasn't happened yet. The
    // poster image is what's actually visible pre-scroll, and that's
    // already in the initial HTML — nothing left to wait on beyond 'load'.
    window.addEventListener('load', function () { window.setTimeout(dismiss, 500); });
    window.setTimeout(dismiss, 2200); // safety timeout so a slow asset never traps the visitor
  }

  // ---------- Custom cursor ----------
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    document.body.classList.add('has-custom-cursor');
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mouseX = -100, mouseY = -100, ringX = -100, ringY = -100;
    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
    });
    (function loop() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
      window.requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      var target = e.target.closest && e.target.closest('a, button, [data-tilt-stage], input, select, textarea');
      ring.classList.toggle('is-hover', !!target);
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest('[data-tilt-stage]')) ring.classList.remove('is-drag');
    });
  }

  // ---------- Tilt + glass sheen on product imagery ----------
  function initTiltStages() {
    var stages = document.querySelectorAll('[data-tilt-stage]');
    stages.forEach(function (stage) {
      var inner = stage.querySelector('.tilt-stage__inner');
      if (!inner) return;
      if (reduceMotion || !finePointer) return; // static image is already a complete, correct experience

      stage.addEventListener('mousemove', function (e) {
        var rect = stage.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width; // 0..1
        var py = (e.clientY - rect.top) / rect.height;
        var rotateY = (px - 0.5) * 14;
        var rotateX = (0.5 - py) * 10;
        inner.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        stage.style.setProperty('--sx', (px * 100) + '%');
        stage.style.setProperty('--sy', (py * 100) + '%');
      });
      stage.addEventListener('mouseleave', function () {
        inner.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  // ---------- Magnetic buttons ----------
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        var y = (e.clientY - rect.top - rect.height / 2) * 0.35;
        btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = 'translate(0,0)'; });
    });
  }

  // ---------- Scroll reveal ----------
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduceMotion || !window.IntersectionObserver) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    // threshold: 0 fires as soon as a single pixel is visible — safe for both
    // small cards and very tall elements (e.g. a full guide article body),
    // where an area-ratio threshold like 0.15 could stay unmet for a long
    // scroll and leave real content invisible.
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  // ---------- Sitewide background music ----------
  // Opt-in ambient music for everywhere on the site EXCEPT the Icarus
  // hero — that section has its own distinct sound (see icarus-
  // cinematic.js's startVideoOnce/sound-toggle logic), and layering a
  // second soundscape on top of it would undercut exactly the "its own
  // distinct experience" the hero was built for. This toggle lives in
  // the header (loaded on every page, unlike the hero which only exists
  // on the homepage), off by default, and only ever starts inside its
  // own click handler — a real user gesture, satisfying every browser's
  // autoplay policy on its own.
  //
  // Static multi-page site, not an SPA: there is no way for this to
  // literally keep playing gaplessly across a full page navigation (that
  // tears down all JS state, this Audio object included) — it restarts
  // fresh each time a new page loads, rather than following the visitor
  // continuously from page to page. Accepted trade-off of this
  // architecture, not something worth an SPA rewrite to fix.
  function initAmbientMusic() {
    var toggle = document.querySelector('[data-ambient-music-toggle]');
    if (!toggle) return;
    var music = null;
    var enabled = false;
    var userMuted = false;
    // Only the homepage has an Icarus hero; on every other page this
    // just stays false forever, so the music plays as soon as enabled.
    var insideHero = false;

    var heroEl = document.querySelector('[data-epic]');
    if (heroEl && window.IntersectionObserver) {
      // threshold 0 — any part of the hero on screen at all counts as
      // "inside the story", whether GSAP has it pinned/fixed or (in
      // .epic--static/reduced-motion mode) sitting in normal flow.
      var io = new IntersectionObserver(function (entries) {
        insideHero = entries[0].isIntersecting;
        sync();
      }, { threshold: 0 });
      io.observe(heroEl);
    }

    function sync() {
      if (!music) return;
      if (enabled && !insideHero) {
        if (music.paused) music.play().catch(function () {});
      } else if (!music.paused) {
        music.pause();
      }
    }

    // On by default, per explicit request — but every browser still
    // requires a real user gesture before any audio can actually start,
    // toggle click or not. The toggle shows "on" (muted, not activated,
    // is a distinction visitors shouldn't have to care about) from the
    // first frame, and actual playback starts on the very first
    // wheel/touch/key input anywhere on the page, same gesture family
    // icarus-cinematic.js already waits for to defer the hero video.
    function activate() {
      if (userMuted || enabled) return;
      if (!music) {
        music = new Audio(toggle.getAttribute('data-music-src'));
        music.loop = true;
        // A real mastered track (measured peak ~0dB, RMS ~-10dB) unlike
        // the hero's own quiet synthesized ambience (RMS ~-31dB) — needs
        // real attenuation to read as background, not foreground. Capped
        // low per explicit request (0.2 still read as too present).
        music.volume = 0.1;
      }
      enabled = true;
      sync();
    }
    toggle.setAttribute('aria-pressed', 'true');
    toggle.setAttribute('aria-label', 'Mute background music');
    // wheel/touchstart/keydown alone missed short pages like a product
    // page, where a visitor's very first interaction is often just
    // clicking the quantity stepper or Add to Cart rather than scrolling —
    // no gesture ever fired there, so music never activated. click is
    // just as valid a user-activation gesture for the autoplay policy.
    window.addEventListener('wheel', activate, { passive: true, once: true });
    window.addEventListener('touchstart', activate, { passive: true, once: true });
    window.addEventListener('keydown', activate, { once: true });
    window.addEventListener('click', activate, { once: true });

    toggle.addEventListener('click', function () {
      if (enabled) {
        userMuted = true;
        enabled = false;
        toggle.setAttribute('aria-pressed', 'false');
        toggle.setAttribute('aria-label', 'Play background music');
        sync();
      } else {
        userMuted = false;
        toggle.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('aria-label', 'Mute background music');
        activate();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPreloader();
    initCursor();
    initTiltStages();
    initMagnetic();
    initReveal();
    initAmbientMusic();
  });
})();

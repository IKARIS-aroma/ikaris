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

  document.addEventListener('DOMContentLoaded', function () {
    initPreloader();
    initCursor();
    initTiltStages();
    initMagnetic();
    initReveal();
  });
})();

/*
 * Minimal, no-backend A/B testing: a visitor is bucketed into a variant
 * once (persisted in localStorage, same pattern as the visitor ID in
 * analytics.js), and results are read by comparing two ordinary events
 * in GA4 (experiment_exposure vs experiment_conversion, both carrying the
 * variant) rather than by adding a separate reporting system.
 */
(function () {
  'use strict';

  function getVariant(experimentName, variants) {
    var key = 'ikaris_exp_' + experimentName;
    try {
      var stored = window.localStorage.getItem(key);
      if (stored && variants.indexOf(stored) !== -1) return stored;
      var assigned = variants[Math.floor(Math.random() * variants.length)];
      window.localStorage.setItem(key, assigned);
      return assigned;
    } catch (e) {
      // Storage unavailable — still run the experiment, just re-randomised
      // on every page view for this visitor instead of sticking.
      return variants[Math.floor(Math.random() * variants.length)];
    }
  }

  window.IKARIS_EXPERIMENTS = window.IKARIS_EXPERIMENTS || {};
  window.IKARIS_EXPERIMENTS.getVariant = getVariant;

  // ---------- cta_copy: "Add to Cart" vs "Add to Bag" on product pages ----------
  var CTA_COPY_LABELS = { control: 'Add to Cart', variant: 'Add to Bag' };

  function initCtaCopyExperiment() {
    if (document.body.dataset.pageType !== 'product') return;
    var variant = getVariant('cta_copy', ['control', 'variant']);
    var label = CTA_COPY_LABELS[variant];
    window.IKARIS_EXPERIMENTS.ctaCopyVariant = variant;
    window.IKARIS_EXPERIMENTS.ctaCopyLabel = label;

    var btn = document.querySelector('[data-add-to-cart]');
    if (btn) btn.textContent = label;

    if (typeof window.track === 'function') {
      window.track('experiment_exposure', { experiment_name: 'cta_copy', variant: variant });
    }
  }

  document.addEventListener('DOMContentLoaded', initCtaCopyExperiment);
})();

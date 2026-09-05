/*
 * /analytics-debug/ — noindex QA console. Shows config, vendor load status,
 * the live event log, cart/visitor/attribution state, and buttons to fire
 * every event manually. Not linked from navigation; exists as evidence that
 * the tracking implementation works, and as a tool while building it.
 */
(function () {
  'use strict';

  function mask(id) {
    if (!id || id.length < 6) return id || '(not set)';
    return id.slice(0, 4) + '••••' + id.slice(-3);
  }

  // Attribution data (first/last touch, UTM params) traces back to raw query
  // string values an attacker fully controls, and flows from there into
  // purchase events' first_touch_source/last_touch_source too. innerHTML
  // parses markup even inside <pre>, so a JSON.stringify'd value containing
  // "<img src=x onerror=...>" as e.g. utm_source becomes real, executing
  // markup the moment this debug page is opened — a textbook stored-XSS
  // path. Escape before interpolating instead of using textContent
  // everywhere, to keep the existing string-building style intact.
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderConfig() {
    var cfg = window.IKARIS.CONFIG;
    var rows = [
      ['GTM Container', mask(cfg.GTM_CONTAINER_ID)],
      ['GA4 Measurement ID', mask(cfg.GA4_MEASUREMENT_ID)],
      ['USE_DIRECT_GA4', String(cfg.USE_DIRECT_GA4)],
      ['Clarity Project ID', cfg.CLARITY_PROJECT_ID ? mask(cfg.CLARITY_PROJECT_ID) : '(not set)'],
      ['Meta Pixel ID', cfg.META_PIXEL_ID ? mask(cfg.META_PIXEL_ID) : '(not set)'],
      ['DEBUG', String(cfg.DEBUG)],
    ];
    document.getElementById('debug-config').innerHTML = rows.map(function (r) {
      return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>';
    }).join('');
  }

  function pill(ok, label) {
    return '<span class="status-pill ' + (ok ? 'ok' : 'off') + '">' + label + ': ' + (ok ? 'loaded' : 'not loaded') + '</span>';
  }

  function renderVendorStatus() {
    var gtmLoaded = Array.prototype.some.call(document.scripts, function (s) { return s.src.indexOf('googletagmanager.com/gtm.js') !== -1; });
    var ga4Loaded = !!document.getElementById('ikaris-ga4-lib');
    var clarityLoaded = typeof window.clarity === 'function';
    var pixelLoaded = typeof window.fbq === 'function';
    document.getElementById('debug-vendors').innerHTML = [
      pill(gtmLoaded, 'GTM'),
      pill(ga4Loaded, 'GA4 direct'),
      pill(clarityLoaded, 'Clarity'),
      pill(pixelLoaded, 'Meta Pixel'),
    ].join(' ');
  }

  function renderIdentity() {
    var consent = window.IKARIS.getConsent();
    var rows = [
      ['Visitor ID', window.IKARIS.getVisitorId()],
      ['Session ID', window.IKARIS.getSessionId()],
      ['Internal traffic', window.IKARIS.isInternal() ? 'yes' : 'no'],
      ['Consent', consent ? consent.analytics + ' (' + consent.timestamp + ')' : '(no decision yet)'],
    ];
    document.getElementById('debug-identity').innerHTML = rows.map(function (r) {
      return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>';
    }).join('');

    var first = window.IKARIS.getFirstTouch();
    var last = window.IKARIS.getLastTouch();
    document.getElementById('debug-attribution').innerHTML =
      '<h3>First touch</h3><pre>' + escapeHtml(JSON.stringify(first, null, 2)) + '</pre>' +
      '<h3>Last touch</h3><pre>' + escapeHtml(JSON.stringify(last, null, 2)) + '</pre>';
  }

  function renderCart() {
    var cart = window.IKARIS_CART.getCart();
    document.getElementById('debug-cart').innerHTML = '<pre>' + escapeHtml(JSON.stringify(cart, null, 2)) + '</pre>';
  }

  function renderEventLog() {
    var log = window.IKARIS.readEventLog();
    var tbody = document.getElementById('debug-events');
    tbody.innerHTML = log.map(function (evt) {
      return '<tr><td>' + escapeHtml(evt.timestamp) + '</td><td>' + escapeHtml(evt.event) + '</td><td><pre>' + escapeHtml(JSON.stringify(evt, null, 2)) + '</pre></td></tr>';
    }).join('') || '<tr><td colspan="3">No events yet this session.</td></tr>';
  }

  function refreshAll() {
    renderConfig();
    renderVendorStatus();
    renderIdentity();
    renderCart();
    renderEventLog();
  }

  var SAMPLE_ITEM = { item_id: 'noir', item_name: 'Noir', item_category: 'Men', item_variant: '50ml', price: 2800, quantity: 1, index: 0, currency: 'INR' };
  var MANUAL_EVENTS = {
    view_item_list: function () { window.track('view_item_list', { item_list_id: 'debug_list', item_list_name: 'Debug List', items: [SAMPLE_ITEM] }); },
    select_item: function () { window.track('select_item', { item_list_id: 'debug_list', item_list_name: 'Debug List', items: [SAMPLE_ITEM] }); },
    view_item: function () { window.track('view_item', { currency: 'INR', value: 2800, items: [SAMPLE_ITEM] }); },
    add_to_cart: function () { window.track('add_to_cart', { currency: 'INR', value: 2800, items: [SAMPLE_ITEM] }); },
    remove_from_cart: function () { window.track('remove_from_cart', { currency: 'INR', value: 2800, items: [SAMPLE_ITEM] }); },
    view_cart: function () { window.track('view_cart', { currency: 'INR', value: 2800, items: [SAMPLE_ITEM] }); },
    begin_checkout: function () { window.track('begin_checkout', { currency: 'INR', value: 2800, items: [SAMPLE_ITEM] }); },
    add_shipping_info: function () { window.track('add_shipping_info', { currency: 'INR', value: 2800, items: [SAMPLE_ITEM], shipping_tier: 'Standard' }); },
    add_payment_info: function () { window.track('add_payment_info', { currency: 'INR', value: 2800, items: [SAMPLE_ITEM], payment_type: 'upi' }); },
    purchase: function () { window.track('purchase', { transaction_id: 'IK-DEBUG-' + Date.now(), currency: 'INR', value: 2800, items: [SAMPLE_ITEM] }); },
    view_notes: function () { window.track('view_notes', { item_id: 'noir' }); },
    guide_complete: function () { window.track('guide_complete', { guide_slug: 'how-to-choose-a-perfume' }); },
    filter_use: function () { window.track('filter_use', { filter_type: 'sort', filter_value: 'price-asc' }); },
    price_band_view: function () { window.track('price_band_view', { price_band: 2800 }); },
    scroll_depth: function () { window.track('scroll_depth', { depth_percent: 50 }); },
    outbound_click: function () { window.track('outbound_click', { link_url: 'https://example.com', link_domain: 'example.com' }); },
    cart_abandoned: function () { window.track('cart_abandoned', { currency: 'INR', value: 2800, items: [SAMPLE_ITEM] }); },
  };

  document.addEventListener('DOMContentLoaded', function () {
    refreshAll();

    var btnWrap = document.getElementById('debug-fire-buttons');
    Object.keys(MANUAL_EVENTS).forEach(function (name) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost';
      btn.textContent = name;
      btn.dataset.testid = 'fire-' + name;
      btn.addEventListener('click', function () {
        MANUAL_EVENTS[name]();
        renderEventLog();
      });
      btnWrap.appendChild(btn);
    });

    document.getElementById('debug-refresh').addEventListener('click', refreshAll);

    document.getElementById('debug-copy').addEventListener('click', function () {
      var log = window.IKARIS.readEventLog();
      var text = JSON.stringify(log, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          var btn = document.getElementById('debug-copy');
          var original = btn.textContent;
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = original; }, 1500);
        });
      }
    });

    window.setInterval(renderEventLog, 3000);
  });
})();

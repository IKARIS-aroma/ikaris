/*
 * IKARIS analytics core.
 *
 * One rule: nothing calls gtag() or a vendor SDK directly from page code.
 * Everything goes through window.track(name, payload), which normalises the
 * event, pushes it to window.dataLayer, mirrors it into a local debug log,
 * and — only once analytics consent is granted — forwards it to GA4 direct
 * (when ANALYTICS.USE_DIRECT_GA4 is true). GTM reads the same dataLayer
 * independently, so adding Clarity/Meta/Matomo later means configuring a
 * tag, not editing page code.
 *
 * Consent: Google Consent Mode v2 defaults (set inline in <head>, before
 * this file or GTM loads) start every visit denied. Vendor scripts that
 * don't understand consent mode (Clarity, Meta Pixel) are only injected
 * after the visitor grants consent. dataLayer pushes themselves are local
 * bookkeeping, not a third-party send, so they always happen — that's what
 * makes /analytics-debug/ useful for showing events even pre-consent.
 */
(function () {
  'use strict';

  var CONFIG = window.IKARIS_ANALYTICS || {
    GTM_CONTAINER_ID: '',
    GA4_MEASUREMENT_ID: '',
    USE_DIRECT_GA4: false,
    CLARITY_PROJECT_ID: '',
    META_PIXEL_ID: '',
    DEBUG: false,
  };
  window.IKARIS_DEBUG = !!CONFIG.DEBUG;

  var LS = {
    VISITOR: 'ikaris_visitor_id',
    CONSENT: 'ikaris_consent',
    INTERNAL: 'ikaris_internal',
    FIRST_TOUCH: 'ikaris_first_touch',
    LAST_TOUCH: 'ikaris_last_touch',
  };
  var SS = {
    SESSION: 'ikaris_session_id',
    EVENT_LOG: 'ikaris_event_log',
  };
  var EVENT_LOG_CAP = 50;

  // ---------- Safe storage wrappers (private browsing can throw) ----------
  function safeGet(store, key) {
    try { return store.getItem(key); } catch (e) { return null; }
  }
  function safeSet(store, key, value) {
    try { store.setItem(key, value); return true; } catch (e) { return false; }
  }
  function safeRemove(store, key) {
    try { store.removeItem(key); } catch (e) { /* noop */ }
  }
  var LSS = window.localStorage;
  var SSS = window.sessionStorage;

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ---------- Visitor / session identity ----------
  function getVisitorId() {
    var id = safeGet(LSS, LS.VISITOR);
    if (!id) {
      id = uuid();
      safeSet(LSS, LS.VISITOR, id);
    }
    return id;
  }

  function getSessionId() {
    var id = safeGet(SSS, SS.SESSION);
    if (!id) {
      id = uuid();
      safeSet(SSS, SS.SESSION, id);
    }
    return id;
  }

  // ---------- Internal traffic exclusion ----------
  function handleInternalFlag() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('internal')) {
      if (params.get('internal') === '1') safeSet(LSS, LS.INTERNAL, '1');
      else safeRemove(LSS, LS.INTERNAL);
    }
  }
  function isInternal() {
    return safeGet(LSS, LS.INTERNAL) === '1';
  }
  function renderInternalBadge() {
    if (!isInternal()) return;
    if (document.querySelector('.internal-badge')) return;
    var badge = document.createElement('div');
    badge.className = 'internal-badge';
    badge.textContent = 'INTERNAL TRAFFIC';
    document.body.appendChild(badge);
  }

  // ---------- First-touch / last-touch attribution ----------
  function captureAttribution() {
    var params = new URLSearchParams(window.location.search);
    var touch = {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_content: params.get('utm_content') || null,
      utm_term: params.get('utm_term') || null,
      gclid: params.get('gclid') || null,
      fbclid: params.get('fbclid') || null,
      referrer: document.referrer || null,
      landing_page: window.location.pathname,
      captured_at: new Date().toISOString(),
    };
    var hasSignal = touch.utm_source || touch.utm_medium || touch.utm_campaign || touch.gclid || touch.fbclid || touch.referrer;

    safeSet(LSS, LS.LAST_TOUCH, JSON.stringify(touch));
    if (!safeGet(LSS, LS.FIRST_TOUCH) && hasSignal) {
      safeSet(LSS, LS.FIRST_TOUCH, JSON.stringify(touch));
    } else if (!safeGet(LSS, LS.FIRST_TOUCH)) {
      // No campaign signal on a brand-new visitor (direct traffic) — still
      // record it once, so "direct" is a real first-touch value, not a gap.
      safeSet(LSS, LS.FIRST_TOUCH, JSON.stringify(touch));
    }
  }
  function getFirstTouch() {
    try { return JSON.parse(safeGet(LSS, LS.FIRST_TOUCH) || 'null'); } catch (e) { return null; }
  }
  function getLastTouch() {
    try { return JSON.parse(safeGet(LSS, LS.LAST_TOUCH) || 'null'); } catch (e) { return null; }
  }

  // ---------- Consent ----------
  function getConsent() {
    try { return JSON.parse(safeGet(LSS, LS.CONSENT) || 'null'); } catch (e) { return null; }
  }
  function hasConsentDecision() {
    return !!getConsent();
  }
  function analyticsGranted() {
    var c = getConsent();
    return !!c && c.analytics === 'granted';
  }

  function applyConsentToGtag(state) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      ad_storage: state === 'granted' ? 'granted' : 'denied',
      analytics_storage: state === 'granted' ? 'granted' : 'denied',
      ad_user_data: state === 'granted' ? 'granted' : 'denied',
      ad_personalization: state === 'granted' ? 'granted' : 'denied',
    });
  }

  var vendorsLoaded = false;
  function loadVendorScriptsIfGranted() {
    if (vendorsLoaded || !analyticsGranted()) return;
    vendorsLoaded = true;

    if (CONFIG.USE_DIRECT_GA4 && CONFIG.GA4_MEASUREMENT_ID && !document.getElementById('ikaris-ga4-lib')) {
      var s = document.createElement('script');
      s.id = 'ikaris-ga4-lib';
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.GA4_MEASUREMENT_ID);
      document.head.appendChild(s);
      window.gtag('js', new Date());
      window.gtag('config', CONFIG.GA4_MEASUREMENT_ID, { send_page_view: false });
    }

    if (CONFIG.CLARITY_PROJECT_ID && !document.getElementById('ikaris-clarity')) {
      /* eslint-disable */
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.id = 'ikaris-clarity'; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', CONFIG.CLARITY_PROJECT_ID);
      /* eslint-enable */
    }

    if (CONFIG.META_PIXEL_ID && !document.getElementById('ikaris-pixel')) {
      /* eslint-disable */
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = true; t.id = 'ikaris-pixel'; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', CONFIG.META_PIXEL_ID);
      window.fbq('track', 'PageView');
      /* eslint-enable */
    }
  }

  function setConsent(state) {
    var record = { analytics: state, timestamp: new Date().toISOString() };
    safeSet(LSS, LS.CONSENT, JSON.stringify(record));
    applyConsentToGtag(state);
    if (state === 'granted') loadVendorScriptsIfGranted();
    hideConsentBanner();
  }

  function showConsentBanner() {
    var el = document.querySelector('[data-consent-banner]');
    if (el) el.classList.add('is-visible');
  }
  function hideConsentBanner() {
    var el = document.querySelector('[data-consent-banner]');
    if (el) el.classList.remove('is-visible');
  }

  function initConsent() {
    var existing = getConsent();
    if (existing) {
      applyConsentToGtag(existing.analytics);
      if (existing.analytics === 'granted') loadVendorScriptsIfGranted();
      return;
    }
    showConsentBanner();
    var accept = document.querySelector('[data-consent-accept]');
    var reject = document.querySelector('[data-consent-reject]');
    if (accept) accept.addEventListener('click', function () { setConsent('granted'); });
    if (reject) reject.addEventListener('click', function () { setConsent('denied'); });
  }

  // ---------- Event log (backs /analytics-debug/) ----------
  function readEventLog() {
    try { return JSON.parse(safeGet(SSS, SS.EVENT_LOG) || '[]'); } catch (e) { return []; }
  }
  function appendToEventLog(evt) {
    var log = readEventLog();
    log.unshift(evt);
    if (log.length > EVENT_LOG_CAP) log.length = EVENT_LOG_CAP;
    safeSet(SSS, SS.EVENT_LOG, JSON.stringify(log));
  }

  // ---------- The one tracking function ----------
  function track(eventName, payload) {
    payload = payload || {};
    window.dataLayer = window.dataLayer || [];
    var evt = Object.assign(
      {
        event: eventName,
        timestamp: new Date().toISOString(),
        page_type: document.body.dataset.pageType || null,
        page_category: document.body.dataset.pageCategory || null,
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        traffic_type: isInternal() ? 'internal' : 'external',
      },
      payload
    );
    window.dataLayer.push(evt);
    appendToEventLog(evt);
    if (window.IKARIS_DEBUG) console.log('[track]', eventName, evt);

    if (CONFIG.USE_DIRECT_GA4 && analyticsGranted() && typeof window.gtag === 'function') {
      var forwarded = Object.assign({}, evt);
      delete forwarded.event;
      window.gtag('event', eventName, forwarded);
    }
  }
  window.track = track;

  // ---------- Scroll depth ----------
  function initScrollDepth() {
    var fired = { 25: false, 50: false, 75: false, 100: false };
    var ticking = false;
    function check() {
      ticking = false;
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      var pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      [25, 50, 75, 100].forEach(function (mark) {
        if (pct >= mark && !fired[mark]) {
          fired[mark] = true;
          track('scroll_depth', { depth_percent: mark });
        }
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(check); ticking = true; }
    }, { passive: true });
  }

  // ---------- Outbound links ----------
  function initOutboundLinks() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      try {
        var url = new URL(a.href, window.location.href);
        if (url.hostname && url.hostname !== window.location.hostname) {
          track('outbound_click', { link_url: url.href, link_domain: url.hostname });
        }
      } catch (err) { /* malformed href, ignore */ }
    });
  }

  // ---------- Generic data-ev delegation ----------
  function initGenericEvents() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-ev]');
      if (!el) return;
      var name = el.getAttribute('data-ev');
      if (!name) return;
      // Elements that need a computed items[] payload (add_to_cart, select_item,
      // etc.) fire track() themselves from cart.js/main.js and omit data-ev,
      // or set data-ev-handled to skip this generic pass.
      if (el.hasAttribute('data-ev-handled')) return;
      var payload = {};
      Object.keys(el.dataset).forEach(function (key) {
        if (key === 'ev' || key === 'testid' || key === 'evHandled') return;
        payload[key] = el.dataset[key];
      });
      track(name, payload);
    });
  }

  window.IKARIS = window.IKARIS || {};
  window.IKARIS.track = track;
  window.IKARIS.getVisitorId = getVisitorId;
  window.IKARIS.getSessionId = getSessionId;
  window.IKARIS.getFirstTouch = getFirstTouch;
  window.IKARIS.getLastTouch = getLastTouch;
  window.IKARIS.isInternal = isInternal;
  window.IKARIS.getConsent = getConsent;
  window.IKARIS.setConsent = setConsent;
  window.IKARIS.readEventLog = readEventLog;
  window.IKARIS.CONFIG = CONFIG;

  handleInternalFlag();
  captureAttribution();

  document.addEventListener('DOMContentLoaded', function () {
    renderInternalBadge();
    initConsent();
    initScrollDepth();
    initOutboundLinks();
    initGenericEvents();
  });
})();

/*
 * Page behaviour: mobile nav, note-pyramid accordions, collection sort,
 * and the cart / checkout / confirmation flows. Reads per-page data from a
 * <script type="application/json" id="ikaris-data"> block the generator
 * embeds on pages that need it, so this file stays product-data-agnostic.
 */
(function () {
  'use strict';

  function pageData() {
    var el = document.getElementById('ikaris-data');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  var BASE = document.body.dataset.basePath || '';
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cart.js falls back to an in-memory array when localStorage throws
  // (Safari private browsing, storage blocked in settings, quota full) —
  // but nothing ever surfaced that to the visitor. The fallback array is a
  // module-scoped var, so it can't survive a page navigation; in a session
  // where storage is genuinely unavailable, the cart silently "empties
  // itself" between the product page and the cart page with zero
  // explanation. Show a small, dismissible-by-being-informational notice
  // wherever the cart actually matters (cart + checkout).
  function insertFallbackNoticeIfNeeded(beforeEl) {
    if (!beforeEl || !window.IKARIS_CART || !window.IKARIS_CART.isUsingFallback || !window.IKARIS_CART.isUsingFallback()) return;
    var notice = document.createElement('div');
    notice.className = 'disclosure-box';
    notice.setAttribute('data-testid', 'cart-storage-fallback-notice');
    notice.textContent = "Your browser is blocking saved data for this site, so your cart won't carry over between pages. Add everything you want in one visit before checking out.";
    beforeEl.parentNode.insertBefore(notice, beforeEl);
  }

  // ---------- Mobile nav ----------
  function initMobileNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    var close = document.querySelector('[data-nav-close]');
    if (!toggle || !nav) return;
    function open() { nav.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); nav.querySelector('a,button').focus(); }
    function shut() { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    toggle.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    nav.addEventListener('click', function (e) { if (e.target === nav) shut(); });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', shut); });
    document.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (e.key === 'Escape') { shut(); return; }
      // aria-modal="true" claims keyboard focus can't leave this dialog,
      // but nothing was actually enforcing that — Tab/Shift+Tab could
      // walk focus straight out into the page underneath. Wrap it back
      // to the other end of the dialog's own focusable elements instead.
      if (e.key !== 'Tab') return;
      var focusable = nav.querySelectorAll('a, button');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // ---------- Note pyramid accordion ----------
  function initNotesAccordion() {
    document.querySelectorAll('.notes-accordion__toggle').forEach(function (btn) {
      var panelId = btn.getAttribute('aria-controls');
      var panel = panelId && document.getElementById(panelId);
      if (!panel) return;
      btn.addEventListener('click', function () {
        var willOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', willOpen);
        btn.setAttribute('aria-expanded', String(willOpen));
        if (willOpen && !btn.dataset.viewed) {
          btn.dataset.viewed = '1';
          window.track('view_notes', { item_id: document.body.dataset.pageCategory === null ? undefined : (pageData() && pageData().item ? pageData().item.item_id : undefined) });
        }
      });
    });
  }

  // ---------- select_item / quick add-to-cart from cards ----------
  function initCardEvents() {
    document.addEventListener('click', function (e) {
      var selectEl = e.target.closest && e.target.closest('[data-select-item]');
      if (selectEl && !e.target.closest('[data-quick-add]')) {
        window.track('select_item', {
          item_list_id: selectEl.dataset.listId || null,
          item_list_name: selectEl.dataset.listName || null,
          items: [{
            item_id: selectEl.dataset.itemId,
            item_name: selectEl.dataset.itemName,
            item_category: selectEl.dataset.itemCategory,
            item_variant: selectEl.dataset.itemVariant,
            price: Number(selectEl.dataset.itemPrice),
            quantity: 1,
            index: Number(selectEl.dataset.itemIndex || 0),
            currency: 'INR',
          }],
        });
      }

      var addEl = e.target.closest && e.target.closest('[data-quick-add]');
      if (addEl) {
        e.preventDefault();
        window.IKARIS_CART.addToCart({
          slug: addEl.dataset.itemId,
          name: addEl.dataset.itemName,
          price: Number(addEl.dataset.itemPrice),
          category: addEl.dataset.itemCategory,
          variant: addEl.dataset.itemVariant,
          image: addEl.dataset.itemImage || '',
        }, 1);
        addEl.textContent = 'Added';
        setTimeout(function () { addEl.textContent = 'Add to Cart'; }, 1400);
      }
    });
  }

  // ---------- Collection view_item_list + sort ----------
  function initCollectionList() {
    var data = pageData();
    if (!data || data.type !== 'collection') return;
    fireViewItemList(data.items, data.listId, data.listName);

    var sortSelect = document.querySelector('[data-sort-select]');
    var grid = document.querySelector('[data-product-grid]');
    if (!sortSelect || !grid) return;
    sortSelect.addEventListener('change', function () {
      var value = sortSelect.value;
      var cards = Array.prototype.slice.call(grid.children);
      var sorted = cards.slice();
      if (value === 'price-asc') sorted.sort(function (a, b) { return Number(a.dataset.price) - Number(b.dataset.price); });
      else if (value === 'price-desc') sorted.sort(function (a, b) { return Number(b.dataset.price) - Number(a.dataset.price); });
      else sorted.sort(function (a, b) { return Number(a.dataset.index) - Number(b.dataset.index); });
      sorted.forEach(function (card) { grid.appendChild(card); });
      window.track('filter_use', { filter_type: 'sort', filter_value: value });
    });
  }

  function fireViewItemList(items, listId, listName) {
    if (!items || !items.length) return;
    window.track('view_item_list', {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map(function (it, i) {
        return {
          item_id: it.slug, item_name: it.name, item_category: it.category,
          item_variant: it.variant, price: it.price, quantity: 1, index: i, currency: 'INR',
        };
      }),
    });
  }

  // ---------- Product page ----------
  function initProductPage() {
    var data = pageData();
    if (!data || data.type !== 'product') return;
    var item = data.item;
    window.track('view_item', {
      currency: 'INR',
      value: item.price,
      items: [{ item_id: item.slug, item_name: item.name, item_category: item.category, item_variant: item.variant, price: item.price, quantity: 1, index: 0, currency: 'INR' }],
    });
    window.track('price_band_view', { price_band: item.price });

    var qtyInput = document.querySelector('[data-qty-input]');
    document.querySelectorAll('[data-qty-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = Number(btn.dataset.qtyStep);
        var next = Math.max(1, (Number(qtyInput.value) || 1) + step);
        qtyInput.value = next;
      });
    });

    var addBtn = document.querySelector('[data-add-to-cart]');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var qty = Number(qtyInput && qtyInput.value) || 1;
        window.IKARIS_CART.addToCart({ slug: item.slug, name: item.name, price: item.price, category: item.category, variant: item.variant, image: item.image }, qty);
        addBtn.textContent = 'Added to Cart';
        setTimeout(function () { addBtn.textContent = 'Add to Cart'; }, 1600);
      });
    }
  }

  // ---------- Guide completion ----------
  function initGuideComplete() {
    var sentinel = document.querySelector('[data-guide-end]');
    if (!sentinel || !window.IntersectionObserver) return;
    var fired = false;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          window.track('guide_complete', { guide_slug: document.body.dataset.pageSlug || null });
          obs.disconnect();
        }
      });
    }, { threshold: 0.1 });
    obs.observe(sentinel);
  }

  // ---------- Cart page ----------
  function renderCartPage() {
    if (document.body.dataset.pageType !== 'cart') return;
    var cart = window.IKARIS_CART.getCart();
    window.track('view_cart', {
      currency: 'INR',
      value: window.IKARIS_CART.getCartTotal(cart),
      items: cart.map(function (l, i) { return window.IKARIS_CART.toItemPayload(l, i); }),
    });

    var tableBody = document.querySelector('[data-cart-body]');
    var emptyState = document.querySelector('[data-cart-empty]');
    var summaryWrap = document.querySelector('[data-cart-summary]');
    if (!tableBody) return;

    insertFallbackNoticeIfNeeded(document.querySelector('[data-cart-table]') || emptyState);

    function render() {
      // tableBody.innerHTML = '' below throws away every row, including
      // whichever +/- or Remove button the visitor just activated — for a
      // keyboard or screen-reader user, focus then falls back to <body>,
      // and the next Tab press starts over from the top of the page
      // instead of continuing from where they were. Captured against the
      // *old* cart (this closure's `cart`, not yet reassigned) since that
      // reflects the row positions currently in the DOM.
      var activeEl = document.activeElement;
      var restoreFocus = null;
      if (activeEl && tableBody.contains(activeEl)) {
        var role = activeEl.hasAttribute('data-cart-inc') ? 'inc'
          : activeEl.hasAttribute('data-cart-dec') ? 'dec'
          : activeEl.hasAttribute('data-cart-remove') ? 'remove'
          : null;
        if (role) {
          var slug = activeEl.getAttribute('data-cart-' + role);
          restoreFocus = { role: role, slug: slug, index: cart.findIndex(function (l) { return l.slug === slug; }) };
        }
      }

      cart = window.IKARIS_CART.getCart();
      tableBody.innerHTML = '';
      if (cart.length === 0) {
        if (emptyState) emptyState.hidden = false;
        if (summaryWrap) summaryWrap.hidden = true;
        document.querySelector('[data-cart-table]') && (document.querySelector('[data-cart-table]').hidden = true);
        if (restoreFocus && emptyState) {
          var emptyFocusTarget = emptyState.querySelector('a, button');
          if (emptyFocusTarget) emptyFocusTarget.focus();
        }
        return;
      }
      if (emptyState) emptyState.hidden = true;
      if (summaryWrap) summaryWrap.hidden = false;
      document.querySelector('[data-cart-table]') && (document.querySelector('[data-cart-table]').hidden = false);

      cart.forEach(function (line) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td class="cart-line__product"><img src="' + BASE + '/assets/thumbs/' + line.slug + '.jpg" width="56" height="76" alt="" loading="lazy">' +
          '<div><strong>' + line.name + '</strong><br><span style="color:var(--muted);font-size:0.8rem;">' + line.variant + '</span></div></td>' +
          '<td class="cart-line__price" data-label="Price">₹' + line.price.toLocaleString('en-IN') + '</td>' +
          '<td class="cart-line__qty" data-label="Qty"><span class="qty-input"><button type="button" data-cart-dec="' + line.slug + '" aria-label="Decrease quantity">−</button>' +
          '<input type="text" inputmode="numeric" value="' + line.qty + '" readonly aria-label="Quantity for ' + line.name + '">' +
          '<button type="button" data-cart-inc="' + line.slug + '" aria-label="Increase quantity">+</button></span></td>' +
          '<td class="cart-line__total" data-label="Subtotal">₹' + (line.price * line.qty).toLocaleString('en-IN') + '</td>' +
          '<td class="cart-line__remove"><button type="button" class="btn btn-ghost" data-cart-remove="' + line.slug + '" data-testid="cart-remove">Remove</button></td>';
        tableBody.appendChild(tr);
      });

      var total = window.IKARIS_CART.getCartTotal(cart);
      if (summaryWrap) {
        var totalEl = summaryWrap.querySelector('[data-cart-total]');
        var countEl = summaryWrap.querySelector('[data-cart-count]');
        if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
        if (countEl) countEl.textContent = String(window.IKARIS_CART.getCartCount(cart));
      }

      if (restoreFocus) {
        var target = tableBody.querySelector('[data-cart-' + restoreFocus.role + '="' + restoreFocus.slug + '"]');
        if (!target) {
          // The focused line is gone (qty dropped to 0, or Remove was
          // clicked) — land on the Remove button of whatever now sits in
          // that same row position, so repeatedly clearing lines keeps
          // walking down the table instead of dropping focus every time.
          var removeButtons = tableBody.querySelectorAll('[data-cart-remove]');
          target = removeButtons[Math.min(restoreFocus.index, removeButtons.length - 1)];
        }
        if (target) target.focus();
      }
    }

    tableBody.addEventListener('click', function (e) {
      var inc = e.target.closest('[data-cart-inc]');
      var dec = e.target.closest('[data-cart-dec]');
      var rem = e.target.closest('[data-cart-remove]');
      if (inc) {
        var line1 = cart.find(function (l) { return l.slug === inc.dataset.cartInc; });
        if (line1) window.IKARIS_CART.updateQuantity(line1.slug, line1.qty + 1);
        render();
      } else if (dec) {
        var line2 = cart.find(function (l) { return l.slug === dec.dataset.cartDec; });
        if (line2) window.IKARIS_CART.updateQuantity(line2.slug, line2.qty - 1);
        render();
      } else if (rem) {
        window.IKARIS_CART.removeFromCart(rem.dataset.cartRemove);
        render();
      }
    });

    // If the cart changes in another tab (cart.js's 'storage' listener
    // re-dispatches this), pick it up here too, so a visitor with the
    // cart page open in one tab isn't looking at stale quantities after
    // editing the same cart from a product page in another tab.
    window.addEventListener('ikaris:cart-changed', render);

    render();
  }

  // ---------- Checkout page ----------
  function initCheckoutPage() {
    if (document.body.dataset.pageType !== 'checkout') return;

    // If this exact page instance is restored from bfcache (routine in
    // Safari/Firefox, increasingly Chrome) after a completed order, its
    // in-memory JS state — including an already-re-enabled Place Order
    // button — comes back frozen exactly as it was pre-submit. Clicking it
    // again would re-fire a second purchase (a fresh transaction_id, since
    // that's generated on /order-confirmed/) against a cart that's already
    // been cleared. Force a reload so this function re-runs fresh instead —
    // it already renders the correct empty-cart state below when the cart
    // is actually empty.
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) window.location.reload();
    });

    var cart = window.IKARIS_CART.getCart();
    var emptyState = document.querySelector('[data-checkout-empty]');
    var form = document.querySelector('[data-checkout-form]');

    try { window.sessionStorage.removeItem('ikaris_checkout_completed'); } catch (e) { /* noop */ }

    if (cart.length === 0) {
      if (emptyState) emptyState.hidden = false;
      if (form) form.hidden = true;
      return;
    }

    insertFallbackNoticeIfNeeded(form);

    var value = window.IKARIS_CART.getCartTotal(cart);
    var items = cart.map(function (l, i) { return window.IKARIS_CART.toItemPayload(l, i); });
    window.track('begin_checkout', { currency: 'INR', value: value, items: items });

    var summaryEl = document.querySelector('[data-cart-summary-checkout]');
    if (summaryEl) {
      summaryEl.innerHTML = cart.map(function (l) {
        return '<div class="cart-summary__row"><span>' + l.name + ' (' + l.variant + ') &times; ' + l.qty + '</span><span>₹' + (l.price * l.qty).toLocaleString('en-IN') + '</span></div>';
      }).join('') + '<div class="cart-summary__row cart-summary__row--total"><span>Total</span><span>₹' + value.toLocaleString('en-IN') + '</span></div>';
    }

    var shippingForm = document.querySelector('[data-shipping-form]');
    var paymentSection = document.querySelector('[data-payment-section]');
    var placeOrderBtn = document.querySelector('[data-place-order]');
    var paymentChosen = false;

    if (shippingForm) {
      shippingForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!shippingForm.checkValidity()) { shippingForm.reportValidity(); return; }
        window.track('add_shipping_info', { currency: 'INR', value: value, items: items, shipping_tier: 'Standard' });
        if (paymentSection) {
          paymentSection.hidden = false;
          paymentSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
    }

    document.querySelectorAll('[name="payment_method"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (!paymentChosen) {
          paymentChosen = true;
          window.track('add_payment_info', { currency: 'INR', value: value, items: items, payment_type: radio.value });
        }
        if (placeOrderBtn) placeOrderBtn.disabled = false;
      });
    });

    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', function () {
        var snapshot = { items: items, value: value, currency: 'INR' };
        try {
          window.sessionStorage.setItem('ikaris_checkout_snapshot', JSON.stringify(snapshot));
          window.sessionStorage.setItem('ikaris_checkout_completed', '1');
        } catch (e) { /* private browsing: confirmation page will fall back to live cart */ }
        window.location.href = BASE + '/order-confirmed/';
      });
    }

    // pagehide fires on every navigation away from this page, not just a
    // genuine abandonment — clicking the Cart icon to double-check the
    // order, or a nav link to keep browsing before coming back, both
    // trigger it too, and both used to fire a false cart_abandoned event
    // even though the visitor never actually left the purchase journey.
    // Any click on a link is a reasonable enough signal that this is
    // intentional in-site navigation, not abandonment — only fire when the
    // page is being unloaded WITHOUT having gone through a clicked link
    // (closing the tab, typing a new address, closing the browser).
    var navigatedViaLink = false;
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) navigatedViaLink = true;
    });

    window.addEventListener('pagehide', function () {
      var completed = false;
      try { completed = window.sessionStorage.getItem('ikaris_checkout_completed') === '1'; } catch (e) { /* noop */ }
      if (!completed && !navigatedViaLink && cart.length > 0) {
        window.track('cart_abandoned', { currency: 'INR', value: value, items: items });
      }
    });
  }

  // ---------- Order confirmation ----------
  function initConfirmationPage() {
    if (document.body.dataset.pageType !== 'confirmation') return;
    var snapshot = null;
    try {
      var raw = window.sessionStorage.getItem('ikaris_checkout_snapshot');
      if (raw) snapshot = JSON.parse(raw);
    } catch (e) { /* noop */ }

    if (!snapshot) {
      var cart = window.IKARIS_CART.getCart();
      if (cart.length > 0) {
        snapshot = { items: cart.map(function (l, i) { return window.IKARIS_CART.toItemPayload(l, i); }), value: window.IKARIS_CART.getCartTotal(cart), currency: 'INR' };
      }
    }

    var refEl = document.querySelector('[data-order-ref]');
    var summaryEl = document.querySelector('[data-order-summary]');
    var ref = 'IK-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    if (snapshot && snapshot.items && snapshot.items.length) {
      if (refEl) refEl.textContent = ref;
      if (summaryEl) {
        summaryEl.innerHTML = snapshot.items.map(function (it) {
          return '<div class="cart-summary__row"><span>' + it.item_name + ' × ' + it.quantity + '</span><span>₹' + (it.price * it.quantity).toLocaleString('en-IN') + '</span></div>';
        }).join('') + '<div class="cart-summary__row cart-summary__row--total"><span>Total</span><span>₹' + snapshot.value.toLocaleString('en-IN') + '</span></div>';
      }

      var firstTouch = window.IKARIS.getFirstTouch();
      var lastTouch = window.IKARIS.getLastTouch();
      window.track('purchase', {
        transaction_id: ref,
        currency: 'INR',
        value: snapshot.value,
        items: snapshot.items,
        first_touch_source: firstTouch && firstTouch.utm_source,
        first_touch_medium: firstTouch && firstTouch.utm_medium,
        first_touch_campaign: firstTouch && firstTouch.utm_campaign,
        last_touch_source: lastTouch && lastTouch.utm_source,
        last_touch_medium: lastTouch && lastTouch.utm_medium,
        last_touch_campaign: lastTouch && lastTouch.utm_campaign,
      });

      window.IKARIS_CART.clearCart();
    } else if (refEl) {
      refEl.textContent = 'No pending order';
      if (summaryEl) summaryEl.innerHTML = '<p>You have reached this page directly. No order was placed.</p>';
    }

    try { window.sessionStorage.removeItem('ikaris_checkout_snapshot'); } catch (e) { /* noop */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initNotesAccordion();
    initCardEvents();
    initCollectionList();
    initProductPage();
    initGuideComplete();
    renderCartPage();
    initCheckoutPage();
    initConfirmationPage();

    if (document.body.dataset.pageType === 'home') {
      var data = pageData();
      if (data && data.type === 'home') fireViewItemList(data.items, data.listId, data.listName);
    }
  });
})();

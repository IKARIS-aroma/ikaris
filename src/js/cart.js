/*
 * IKARIS cart. Client-side only — there is no backend. State lives in
 * localStorage, wrapped in try/catch because private browsing can throw on
 * every call. Every mutation fires the matching GA4 e-commerce event through
 * window.track() so the cart is instrumented at the source rather than
 * retrofitted.
 */
(function () {
  'use strict';

  var CART_KEY = 'ikaris_cart';
  var memoryFallback = [];
  var usingFallback = false;

  function readCart() {
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      usingFallback = true;
      return memoryFallback.slice();
    }
  }

  function writeCart(cart) {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      usingFallback = true;
      memoryFallback = cart.slice();
    }
    updateBadges(cart);
  }

  function getCart() {
    return readCart();
  }

  function getCartCount(cart) {
    cart = cart || readCart();
    return cart.reduce(function (sum, line) { return sum + line.qty; }, 0);
  }

  function getCartTotal(cart) {
    cart = cart || readCart();
    return cart.reduce(function (sum, line) { return sum + line.price * line.qty; }, 0);
  }

  function updateBadges(cart) {
    var count = getCartCount(cart);
    document.querySelectorAll('.cart-badge').forEach(function (el) {
      el.textContent = String(count);
      el.hidden = count === 0;
    });
  }

  function toItemPayload(line, index) {
    return {
      item_id: line.slug,
      item_name: line.name,
      item_category: line.category,
      item_variant: line.variant,
      price: line.price,
      quantity: line.qty,
      index: index,
      currency: 'INR',
    };
  }

  function addToCart(product, qty) {
    qty = qty || 1;
    var cart = readCart();
    var existing = cart.find(function (l) { return l.slug === product.slug; });
    if (existing) existing.qty += qty;
    else cart.push({ slug: product.slug, name: product.name, price: product.price, category: product.category, variant: product.variant, image: product.image, qty: qty });
    writeCart(cart);

    window.track('add_to_cart', {
      currency: 'INR',
      value: product.price * qty,
      items: [toItemPayload({ slug: product.slug, name: product.name, price: product.price, category: product.category, variant: product.variant, qty: qty }, 0)],
    });
    return cart;
  }

  function removeFromCart(slug) {
    var cart = readCart();
    var idx = cart.findIndex(function (l) { return l.slug === slug; });
    if (idx === -1) return cart;
    var removed = cart[idx];
    cart.splice(idx, 1);
    writeCart(cart);
    window.track('remove_from_cart', {
      currency: 'INR',
      value: removed.price * removed.qty,
      items: [toItemPayload(removed, idx)],
    });
    return cart;
  }

  function updateQuantity(slug, qty) {
    var cart = readCart();
    var line = cart.find(function (l) { return l.slug === slug; });
    if (!line) return cart;
    if (qty <= 0) return removeFromCart(slug);
    line.qty = qty;
    writeCart(cart);
    return cart;
  }

  function clearCart() {
    writeCart([]);
  }

  function isUsingFallback() {
    return usingFallback;
  }

  window.IKARIS_CART = {
    getCart: getCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQuantity: updateQuantity,
    clearCart: clearCart,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal,
    toItemPayload: toItemPayload,
    isUsingFallback: isUsingFallback,
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateBadges(readCart());
  });
})();

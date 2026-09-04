const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode } = require('../lib/jsonld');
const { url } = require('../lib/urls');

function build() {
  const path = '/checkout/';

  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Cart', path: '/cart/' }, { name: 'Checkout', path }])}
  <div class="container">
    <h1 class="reveal">Checkout</h1>
    <div class="disclosure-box reveal" data-testid="checkout-disclosure">
      This is a student demonstration checkout. No payment is collected, no card details are requested anywhere on this site, and no order is fulfilled. Submitting this form generates a simulated confirmation for analytics testing only.
    </div>

    <div data-checkout-empty hidden class="cart-empty reveal">
      <p>Your cart is empty.</p>
      <a href="${url('/men/')}" class="btn btn-primary">Continue Shopping</a>
    </div>

    <div class="checkout-layout reveal" data-checkout-form>
      <div>
        <div class="checkout-step">
          <h2>1. Delivery Details</h2>
          <form data-shipping-form novalidate>
            <div class="form-grid cols-2">
              <div class="form-field">
                <label for="cf-name">Full name</label>
                <input id="cf-name" name="name" type="text" autocomplete="name" required data-clarity-mask="true">
              </div>
              <div class="form-field">
                <label for="cf-email">Email</label>
                <input id="cf-email" name="email" type="email" autocomplete="email" required data-clarity-mask="true">
              </div>
            </div>
            <div class="form-field" style="margin-top:1rem;">
              <label for="cf-address">Address</label>
              <input id="cf-address" name="address" type="text" autocomplete="street-address" required data-clarity-mask="true">
            </div>
            <div class="form-grid cols-2" style="margin-top:1rem;">
              <div class="form-field">
                <label for="cf-city">City</label>
                <input id="cf-city" name="city" type="text" autocomplete="address-level2" required data-clarity-mask="true">
              </div>
              <div class="form-field">
                <label for="cf-state">State</label>
                <input id="cf-state" name="state" type="text" autocomplete="address-level1" required data-clarity-mask="true">
              </div>
            </div>
            <div class="form-field" style="margin-top:1rem;max-width:200px;">
              <label for="cf-pincode">PIN code</label>
              <input id="cf-pincode" name="pincode" type="text" inputmode="numeric" autocomplete="postal-code" required data-clarity-mask="true">
            </div>
            <button type="submit" class="btn btn-primary btn-magnetic" style="margin-top:1.5rem;" data-testid="continue-to-payment">Continue to Payment</button>
          </form>
        </div>

        <div class="checkout-step" data-payment-section hidden>
          <h2>2. Payment Method</h2>
          <fieldset>
            <legend>Choose one</legend>
            <label class="radio-row"><input type="radio" name="payment_method" value="upi" data-testid="payment-upi"> UPI</label>
            <label class="radio-row"><input type="radio" name="payment_method" value="card" data-testid="payment-card"> Credit / Debit Card</label>
            <label class="radio-row"><input type="radio" name="payment_method" value="cod" data-testid="payment-cod"> Cash on Delivery</label>
          </fieldset>
          <p style="color:var(--muted);font-size:0.85rem;">No card, UPI ID, or bank details are collected on this demonstration site &mdash; selecting a method only records your preference for the simulated order.</p>
          <button type="button" class="btn btn-primary btn-block btn-magnetic" style="margin-top:1rem;" data-place-order data-testid="checkout-submit" disabled>Place Order</button>
        </div>
      </div>

      <div class="cart-summary" data-testid="checkout-summary">
        <h2 style="font-size:1.1rem;">Order Summary</h2>
        <div data-cart-summary-checkout></div>
      </div>
    </div>
  </div>
  `;

  const jsonLd = wrapGraph([
    organizationNode(), brandNode(), websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'Cart', path: '/cart/' }, { name: 'Checkout', path }]),
  ]);

  const html = renderPage({
    title: 'Checkout (Simulated) | IKARIS',
    description: 'Simulated checkout for a student analytics project. No payment is collected and no card details are requested anywhere on this site.',
    canonicalPath: path,
    pageType: 'checkout',
    pageSlug: 'checkout',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

module.exports = { build };

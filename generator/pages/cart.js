const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode } = require('../lib/jsonld');
const { url } = require('../lib/urls');

function build() {
  const path = '/cart/';

  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Cart', path }])}
  <div class="container">
    <h1 class="reveal">Your Cart</h1>

    <div data-cart-empty class="cart-empty reveal" hidden>
      <p>Your cart is empty.</p>
      <a href="${url('/men/')}" class="btn btn-primary">Continue Shopping</a>
    </div>

    <div style="overflow-x:auto;" class="reveal">
      <table class="cart-table" data-cart-table data-testid="cart-table">
        <thead>
          <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr>
        </thead>
        <tbody data-cart-body></tbody>
      </table>
    </div>

    <div data-cart-summary class="cart-summary reveal" style="max-width:360px;margin-left:auto;margin-top:2rem;" hidden>
      <div class="cart-summary__row"><span>Items</span><span data-cart-count>0</span></div>
      <div class="cart-summary__row cart-summary__row--total"><span>Total</span><span data-cart-total>&#8377;0</span></div>
      <a href="${url('/checkout/')}" class="btn btn-primary btn-block btn-magnetic" style="margin-top:1rem;" data-testid="checkout-link">Proceed to Checkout</a>
    </div>
  </div>
  `;

  const jsonLd = wrapGraph([
    organizationNode(), brandNode(), websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'Cart', path }]),
  ]);

  const html = renderPage({
    title: 'Your Cart | IKARIS',
    description: 'Review your IKARIS eau de parfum selections before checkout. Adjust quantities or remove items anytime before you proceed.',
    canonicalPath: path,
    pageType: 'cart',
    pageSlug: 'cart',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

module.exports = { build };

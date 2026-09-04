const fs = require('fs');
const path_ = require('path');
const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode, productNode } = require('../lib/jsonld');
const { picture } = require('../lib/picture');
const { url, assetUrl } = require('../lib/urls');
const { escapeHtml } = require('../lib/html');

const MODELS_DIR = path_.join(__dirname, '..', '..', 'assets', 'models');

function notesTier(label, notes) {
  return `<div class="notes-tier"><h4>${label}</h4><p>${notes.join(', ')}</p></div>`;
}

function build(product) {
  const genderPath = product.gender === 'men' ? '/men/' : '/women/';
  const genderLabel = product.genderLabel;
  const path = `/fragrances/${product.slug}/`;

  const media = picture({
    assetPathNoExt: `products/${product.slug}`,
    width: 586,
    height: 996,
    alt: product.alt,
    loading: 'eager',
    fetchpriority: 'high',
  });

  const has3D = fs.existsSync(path_.join(MODELS_DIR, `bottle-${product.slug}.glb`));

  const bodyHtml = `
  ${renderBreadcrumbs([
    { name: 'Home', path: '/' },
    { name: genderLabel, path: genderPath },
    { name: product.name, path },
  ])}
  <div class="container">
    <div class="product-page__grid">
      <div class="product-page__media reveal">
        <div class="tilt-stage" data-tilt-stage>
          <div class="tilt-stage__inner">${media}</div>
          <div class="tilt-stage__sheen"></div>
          <div class="tilt-stage__hint">Explore</div>
        </div>
        ${has3D ? `<div class="bottle-3d" data-bottle-3d data-slug="${escapeHtml(product.slug)}" data-glb-url="${assetUrl(`models/bottle-${product.slug}.glb`)}" data-testid="bottle-3d-viewer" hidden aria-label="Interactive 3D model of ${escapeHtml(product.name)} — drag to rotate"></div>` : ''}
      </div>
      <div class="product-page__meta reveal" style="--rd:0.15s">
        <span class="ghost-word ghost-word--meta" aria-hidden="true">${escapeHtml(product.name)}</span>
        <span class="eyebrow">${escapeHtml(genderLabel)} &middot; Eau de Parfum, 50ml</span>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="product-page__price" data-testid="product-price">&#8377;${product.price.toLocaleString('en-IN')}</p>
        <p>${escapeHtml(product.description)}</p>

        <dl class="product-page__facts">
          <div><dt>Longevity</dt><dd>${escapeHtml(product.longevity)}</dd></div>
          <div><dt>Sillage</dt><dd>${escapeHtml(product.sillage)}</dd></div>
          <div><dt>Best season</dt><dd>${escapeHtml(product.season)}</dd></div>
        </dl>

        <div>
          <span class="qty-input">
            <button type="button" data-qty-step="-1" aria-label="Decrease quantity">&minus;</button>
            <input type="text" inputmode="numeric" value="1" data-qty-input readonly aria-label="Quantity">
            <button type="button" data-qty-step="1" aria-label="Increase quantity">+</button>
          </span>
          <button type="button" class="btn btn-primary btn-magnetic" data-add-to-cart data-testid="add-to-cart" data-ev-handled>Add to Cart</button>
        </div>

        <div class="notes-accordion">
          <button type="button" class="notes-accordion__toggle" aria-expanded="false" aria-controls="notes-panel" data-testid="notes-toggle">
            <span>The Note Pyramid</span><span aria-hidden="true" class="notes-accordion__icon">+</span>
          </button>
          <div class="notes-accordion__panel" id="notes-panel">
            <div class="notes-accordion__panel-inner">
              ${notesTier('Top', product.notes.top)}
              ${notesTier('Heart', product.notes.heart)}
              ${notesTier('Base', product.notes.base)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  const pageData = {
    type: 'product',
    item: { slug: product.slug, name: product.name, price: product.price, category: genderLabel, variant: '50ml', image: `products/${product.slug}.jpg` },
  };

  const jsonLd = wrapGraph([
    organizationNode(),
    brandNode(),
    websiteNode(),
    breadcrumbListNode([
      { name: 'Home', path: '/' },
      { name: genderLabel, path: genderPath },
      { name: product.name, path },
    ]),
    productNode(product, path, `/assets/thumbs/${product.slug}.jpg`, '2026-12-31'),
  ]);

  const title = `${product.name} Eau de Parfum, ${genderLabel} | IKARIS`;
  const description = `${product.name}: ${product.notes.top.join(', ')} opening into ${product.notes.heart[0].toLowerCase()}. ${product.character}. 50ml, ₹${product.price.toLocaleString('en-IN')}.`;

  const importMap = `<script type="importmap">{"imports":{"three":"${url('/js/vendor/three.module.min.js')}"}}</script>`;
  const viewerScript = `<script type="module" src="${url('/js/bottle-viewer.js')}"></script>`;

  const html = renderPage({
    title,
    description: description.slice(0, 159),
    canonicalPath: path,
    ogType: 'product',
    ogImagePath: `/assets/thumbs/${product.slug}.jpg`,
    ogImageAlt: product.alt,
    ogImageWidth: 600,
    ogImageHeight: 600,
    pageType: 'product',
    pageCategory: product.gender,
    pageSlug: product.slug,
    bodyHtml,
    pageData,
    jsonLd,
    extraHead: has3D ? importMap : '',
    extraBodyScripts: has3D ? viewerScript : '',
  });

  return { path, html };
}

module.exports = { build };

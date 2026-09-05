// The single-product showcase: one large 3D bottle (or photo, for
// fragrances that don't have a model yet), the name and a small detail
// line beneath it, and a prev/next clicker to move to the next fragrance —
// no product grid anywhere. Shared between the homepage and the men's/
// women's collection pages so there's exactly one carousel implementation.
const fs = require('fs');
const path_ = require('path');
const { picture } = require('./picture');
const { url, assetUrl } = require('./urls');
const { escapeHtml, escapeAttr, inlineHideStaticPhotoScript } = require('./html');

const MODELS_DIR = path_.join(__dirname, '..', '..', 'assets', 'models');

function hasModel(slug) {
  return fs.existsSync(path_.join(MODELS_DIR, `bottle-${slug}.glb`));
}

function showcasePanel(product, { index, isActive }) {
  const img = picture({ assetPathNoExt: `products/${product.slug}`, width: 586, height: 996, alt: product.alt, loading: index === 0 ? 'eager' : 'lazy' });
  const has3D = hasModel(product.slug);
  const model3d = has3D
    ? `<div class="bottle-3d" data-bottle-3d-lazy data-slug="${escapeAttr(product.slug)}" data-glb-url="${assetUrl(`models/bottle-${product.slug}.glb`)}" hidden aria-label="Interactive 3D model of ${escapeAttr(product.name)} — drag to rotate"></div>`
    : '';

  return `<div class="showcase__panel${isActive ? ' is-active' : ''}" data-showcase-panel data-slug="${escapeAttr(product.slug)}" data-index="${index}"
    data-name="${escapeAttr(product.name)}" data-char="${escapeAttr(product.character || '')}" data-price="${product.price}" data-href="${url(`/fragrances/${product.slug}/`)}"
    style="--wash-color:${escapeAttr(product.render3d.capColor)}"
    ${isActive ? '' : 'aria-hidden="true"'}>
    <div class="tilt-stage" data-tilt-stage><div class="tilt-stage__inner">${img}</div></div>
    ${model3d}
    ${has3D ? inlineHideStaticPhotoScript() : ''}
  </div>`;
}

function showcase(products, { listId, listName, gender }) {
  const panels = products.map((p, i) => showcasePanel(p, { index: i, isActive: i === 0 })).join('');
  const first = products[0];
  return `<div class="showcase" data-showcase="${gender}" data-list-id="${escapeAttr(listId)}" data-list-name="${escapeAttr(listName)}" data-category="${escapeAttr(first.genderLabel)}">
    <div class="showcase__stage">${panels}</div>
    <div class="showcase__caption">
      <button type="button" class="showcase__arrow" data-showcase-prev aria-label="Previous fragrance">&larr;</button>
      <div class="showcase__info">
        <h3 class="showcase__name" data-showcase-name>${escapeHtml(first.name)}</h3>
        <p class="showcase__char"><span data-showcase-char>${escapeHtml(first.character || '')}</span> &middot; <span data-showcase-price>&#8377;${first.price.toLocaleString('en-IN')}</span></p>
        <a href="${url(`/fragrances/${first.slug}/`)}" class="showcase__link" data-showcase-link data-select-item data-testid="showcase-view"
           data-list-id="${escapeAttr(listId)}" data-list-name="${escapeAttr(listName)}" data-item-id="${escapeAttr(first.slug)}"
           data-item-name="${escapeAttr(first.name)}" data-item-category="${escapeAttr(first.genderLabel)}" data-item-variant="50ml"
           data-item-price="${first.price}" data-item-index="0">View Fragrance</a>
      </div>
      <button type="button" class="showcase__arrow" data-showcase-next aria-label="Next fragrance">&rarr;</button>
    </div>
    <div class="showcase__dots" data-showcase-dots></div>
  </div>`;
}

module.exports = { hasModel, showcase };

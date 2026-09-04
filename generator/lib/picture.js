const { escapeAttr } = require('./html');
const { assetUrl } = require('./urls');

// assetPathNoExt: e.g. 'products/noir' (a .jpg and a .webp both exist at that path)
function picture({ assetPathNoExt, width, height, alt, loading = 'lazy', className = '', fetchpriority = '' }) {
  const jpg = assetUrl(`${assetPathNoExt}.jpg`);
  const webp = assetUrl(`${assetPathNoExt}.webp`);
  const cls = className ? ` class="${escapeAttr(className)}"` : '';
  const fp = fetchpriority ? ` fetchpriority="${fetchpriority}"` : '';
  return `<picture>
    <source srcset="${webp}" type="image/webp">
    <img src="${jpg}" width="${width}" height="${height}" alt="${escapeAttr(alt)}" loading="${loading}" decoding="async"${cls}${fp}>
  </picture>`;
}

module.exports = { picture };

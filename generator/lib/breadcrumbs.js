const { escapeHtml } = require('./html');
const { url } = require('./urls');

// items: [{ name, path }], path is site-root-relative (no BASE_PATH, no domain)
function renderBreadcrumbs(items) {
  if (!items || items.length === 0) return '';
  const lis = items
    .map((it, i) => {
      const isLast = i === items.length - 1;
      if (isLast) return `<li aria-current="page">${escapeHtml(it.name)}</li>`;
      return `<li><a href="${url(it.path)}">${escapeHtml(it.name)}</a></li>`;
    })
    .join('');
  return `<nav class="breadcrumbs container" aria-label="Breadcrumb"><ol>${lis}</ol></nav>`;
}

module.exports = { renderBreadcrumbs };

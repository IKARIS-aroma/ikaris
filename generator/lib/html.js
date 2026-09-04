function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Attribute values go through the same escaping as text content in HTML5.
const escapeAttr = escapeHtml;

module.exports = { escapeHtml, escapeAttr };

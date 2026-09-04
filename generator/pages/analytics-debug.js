const { renderPage } = require('../lib/layout');
const { url } = require('../lib/urls');

function build() {
  const path = '/analytics-debug/';

  const bodyHtml = `
  <div class="container">
    <h1>Analytics Debug</h1>
    <p style="color:var(--muted);">Not linked from navigation, not in the sitemap, noindex. QA console for the tracking implementation.</p>
    <button type="button" class="btn btn-ghost" id="debug-refresh" style="margin-bottom:1.5rem;">Refresh</button>

    <div class="debug-grid">
      <div class="debug-panel">
        <h2>Config</h2>
        <table class="debug-table"><tbody id="debug-config"></tbody></table>
      </div>
      <div class="debug-panel">
        <h2>Vendor Load Status</h2>
        <div id="debug-vendors"></div>
      </div>
      <div class="debug-panel">
        <h2>Identity &amp; Consent</h2>
        <table class="debug-table"><tbody id="debug-identity"></tbody></table>
      </div>
      <div class="debug-panel">
        <h2>Attribution</h2>
        <div id="debug-attribution"></div>
      </div>
      <div class="debug-panel">
        <h2>Cart Contents</h2>
        <div id="debug-cart"></div>
      </div>
      <div class="debug-panel">
        <h2>Fire an Event Manually</h2>
        <div class="debug-actions" id="debug-fire-buttons"></div>
      </div>
    </div>

    <div class="debug-panel" style="margin-top:1.5rem;">
      <h2>Live Event Log (last 50) <button type="button" class="btn btn-ghost" id="debug-copy" style="margin-left:1rem;">Copy all as JSON</button></h2>
      <div style="overflow-x:auto;">
        <table class="debug-table">
          <thead><tr><th>Time</th><th>Event</th><th>Payload</th></tr></thead>
          <tbody id="debug-events"></tbody>
        </table>
      </div>
    </div>
  </div>
  `;

  const html = renderPage({
    title: 'Analytics Debug (Internal) | IKARIS',
    description: 'Internal QA console for the IKARIS analytics implementation. Not indexed, not linked from navigation.',
    canonicalPath: path,
    noindex: true,
    pageType: 'debug',
    pageSlug: 'analytics-debug',
    bodyHtml,
    extraBodyScripts: `<script src="${url('/js/debug.js')}" defer></script>`,
  });

  return { path, html };
}

module.exports = { build };

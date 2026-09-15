// Client-only personalization: which fragrances a visitor actually looked
// at can't be known at build time, so this renders as an empty, hidden
// shell — src/js/main.js's renderRecentlyViewed() fills it in from
// localStorage and un-hides it, or leaves it hidden if there's no history.
function recentlyViewedSection() {
  return `<section class="recently-viewed" data-recently-viewed hidden data-testid="recently-viewed">
    <div class="container">
      <h2 class="recently-viewed__title">Recently viewed</h2>
      <div class="recently-viewed__grid" data-recently-viewed-grid></div>
    </div>
  </section>`;
}

module.exports = { recentlyViewedSection };

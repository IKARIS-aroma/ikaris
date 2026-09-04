const { BASE_PATH, SITE_URL } = require('../../data/site');

// Root-relative internal link, carrying the /ikaris project-repo prefix.
function url(path) {
  if (!path.startsWith('/')) path = '/' + path;
  return BASE_PATH + path;
}

// Absolute URL for canonical tags, OG tags, and JSON-LD @id / url fields.
function absoluteUrl(path) {
  if (!path.startsWith('/')) path = '/' + path;
  return SITE_URL + path;
}

function assetUrl(path) {
  return url('/assets/' + path.replace(/^\//, ''));
}

module.exports = { url, absoluteUrl, assetUrl };

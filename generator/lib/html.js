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

// Hides the static product photo the instant WebGL support is known, not
// once bottle-viewer.js gets around to it. bottle-viewer.js loads as
// type="module" so it can `import` three.js/GLTFLoader/OrbitControls —
// per spec, module and defer scripts execute in document order, so the
// classic-defer icarus-cinematic.js (which calls into it) has to wait for
// that whole import graph to fetch before running at all. On a fast
// connection that's invisible; on a slow one it's a real window where the
// photo sits fully visible with nothing yet hiding it — exactly the
// "still see the original photo for a split second" report. This plain,
// synchronous, dependency-free inline script runs the moment the parser
// reaches it, using the identical cheap WebGL probe bottle-viewer.js
// already does, so there's no gap left for a slow module fetch to open up.
// bottle-viewer.js's own dispose() (on 3D load failure) restores the same
// style.display, so the fallback path is unaffected either way.
function inlineHideStaticPhotoScript() {
  return `<script>(function(){try{var c=document.createElement('canvas');if(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl'))){var s=document.currentScript.parentElement.querySelector('[data-tilt-stage]');if(s)s.style.display='none';}}catch(e){}})();</script>`;
}

module.exports = { escapeHtml, escapeAttr, inlineHideStaticPhotoScript };

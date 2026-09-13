/*
 * Interactive 3D bottle viewer — real WebGL, real geometry, drag-to-rotate.
 * Progressive enhancement over the static product photo: this only runs
 * where a) WebGL is available and b) that product's .glb model exists yet
 * (built via blender/build_bottles.py — not every fragrance has one). If
 * either check fails, the container is removed and the static photo
 * (already in the DOM, never hidden until this succeeds) is what the
 * visitor sees — there is no broken/empty state.
 *
 * Exposes window.IKARIS_BOTTLE_VIEWER.init(container, opts) so the Icarus
 * hero sequence can host the same real 3D bottle at its climax, not just
 * product pages — see icarus-cinematic.js.
 */
import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

// A cheap stand-in for the full RoomEnvironment PMREM pass (see the
// isCoarsePointer branch in initViewer): the bottle's metallic/glass
// materials get essentially all of their brightness from specular
// environment reflections, not direct light — a HemisphereLight alone
// (tried first) only feeds the diffuse term, so anything metallic still
// read as near-black on phones with no environment map at all. A tiny
// canvas gradient assigned as scene.environment still gives materials
// something to reflect, and — unlike PMREMGenerator.fromScene(RoomEnvironment)
// — costs no scene render: three.js's internal PMREM conversion of a
// source this small (16x8px) is a trivial mip-chain generation, not a
// six-direction cubemap capture of actual 3D geometry.
function makeFallbackEnvironment() {
  // Raising the flat gradient's brightness (see the git history on this
  // function) helped but still read dark on a real phone screen — the
  // bottles are built with metallic:1.0 caps and metallic:0.75 bodies
  // (see blender/build_bottles.py's clean_material calls), and a fully
  // metallic, low-roughness PBR material has essentially ZERO diffuse
  // response — it is a near-mirror. Its entire visible brightness comes
  // from specular reflections of BRIGHT, DISCRETE points in whatever it's
  // reflecting, not from the environment's average brightness. A smooth
  // gradient has no discrete highlight to catch, so the metal reads dull
  // and flat no matter how bright the gradient's stops are raised. Real
  // rooms (what RoomEnvironment renders, and what the desktop path still
  // uses) have actual light fixtures/windows as bright discrete shapes —
  // that's what was missing here, not overall brightness.
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, size / 2);
  gradient.addColorStop(0, '#fffbf0');
  gradient.addColorStop(0.45, '#f2efe4');
  gradient.addColorStop(1, '#7d7a82');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size / 2);

  // Two soft bright "light source" blobs standing in for a key + rim
  // light — positioned to roughly match this file's real key/rim
  // DirectionalLight directions below, so the specular highlight they
  // produce on the faceted cap/body lands somewhere physically plausible
  // rather than looking pasted-on.
  function lightSpot(x, y, r, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,251,240,${alpha})`);
    g.addColorStop(1, 'rgba(255,251,240,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  lightSpot(size * 0.7, size * 0.22, size * 0.3, 1);
  lightSpot(size * 0.18, size * 0.42, size * 0.18, 0.55);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

function initViewer(container, opts) {
  opts = opts || {};
  const glbUrl = opts.glbUrl || container.dataset.glbUrl;
  const hideSiblingPhoto = opts.hideSiblingPhoto !== false;
  const showHint = opts.showHint !== false;
  const enableControls = opts.enableControls !== false;
  // Drag-to-rotate stays available under reduced motion (it's a user-
  // initiated action, not automatic movement) — only the self-driven
  // auto-rotate is gated. The viewer previously had no reduced-motion
  // awareness at all, so a visitor with the OS setting on still got a
  // bottle spinning on its own with zero way to stop it short of dragging.
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoRotate = opts.autoRotate !== false && !prefersReducedMotion;
  const photoStage = hideSiblingPhoto ? container.parentElement.querySelector('[data-tilt-stage]') : null;
  // The hero bottle nests its static photo directly inside the same
  // container as the canvas (not a [data-tilt-stage] sibling like product
  // pages), so it needs its own handle here.
  const innerPhoto = container.querySelector('picture, img');

  // Hide the static photo the moment we commit to a 3D attempt, not once
  // the GLB finishes loading — the WebGL canvas below is appended
  // synchronously but stays fully transparent (nothing rendered yet) until
  // the async load resolves, so the photo was staying visible underneath
  // it for however long that fetch + parse took. Restored on error, since
  // that's the one path where the photo needs to remain the real fallback.
  if (photoStage) photoStage.style.display = 'none';
  if (innerPhoto) innerPhoto.style.display = 'none';

  // Hero use only: the container gets CSS-transform-scaled up to 3.4x at
  // the climax (icarus-cinematic.js's bottle "rebirth" tween) without ever
  // resizing — a transform doesn't touch layout size, so ResizeObserver
  // never fires and the canvas stays rendered at its small starting
  // resolution, then gets visibly blurred by the CSS scale stretching that
  // bitmap up. Rendering at extra pixel density up front means there's
  // already enough resolution in the bitmap for that stretch to be lossless.
  //
  // BUT: devicePixelRatio 2 (already the desktop cap) * oversample 2 = 4x
  // pixel ratio, and iPhones commonly report devicePixelRatio 3 — before
  // the min() cap that's a drawing buffer several million pixels larger
  // per frame than it needs to be, re-rendered every frame by a
  // continuous rAF loop, on top of whatever the hero video's own decode
  // is costing at the same moment. That combination is a real, plausible
  // cause of the "3D models crash the site on mobile" reports — coarse
  // pointer (a reliable enough phone/tablet signal, iOS included) gets a
  // materially cheaper render path: no oversample, capped pixel ratio, and
  // antialiasing off (MSAA is comparatively expensive on tile-based mobile
  // GPUs). A slightly softer bottle on a phone is a fine trade for the
  // site not crashing.
  const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const oversample = isCoarsePointer ? 1 : (opts.oversample || 1);
  const pixelRatioCap = isCoarsePointer ? 1.5 : 2;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: !isCoarsePointer, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap) * oversample);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  // PMREMGenerator.fromScene renders a full environment cubemap plus its
  // mip chain through this context — a genuinely heavy one-time GPU pass,
  // not just a cheap texture upload. A single page here can trigger up to
  // three of these nearly simultaneously (the homepage's two showcase
  // carousels init on load, then the hero bottle joins in once scrolled
  // to), stacked on top of whatever the hero video's own decode is
  // costing — a very plausible cause of the WebGL/GPU-driver crashes
  // reported specifically on iOS Safari, which tolerates concurrent GPU
  // work far worse than desktop. Skip the RoomEnvironment scene render on
  // coarse-pointer devices, but still assign SOME environment map — a
  // first attempt used a HemisphereLight alone instead, and the bottle's
  // metallic/glass materials (which draw almost all their brightness from
  // specular env reflections, not direct diffuse light) came out looking
  // badly underlit as a result. makeFallbackEnvironment() gives them
  // something to reflect for essentially no GPU cost.
  let pmrem = null;
  if (isCoarsePointer) {
    scene.environment = makeFallbackEnvironment();
  } else {
    pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }

  const key = new THREE.DirectionalLight(0xfff2d9, 1.4);
  key.position.set(2, 3, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9d6ff, 0.6);
  rim.position.set(-2, 1, -2);
  scene.add(rim);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = enableControls;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.28;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 2.2;

  // OrbitControls unconditionally sets touch-action: none on its DOM
  // element as soon as it's constructed (see vendor/OrbitControls.js's
  // connect()), regardless of `enabled` — so even a purely decorative,
  // non-interactive instance (the hero's bottle, enableControls: false)
  // was silently swallowing every touch gesture starting over its canvas,
  // for no benefit since dragging does nothing while disabled. On the
  // hero that canvas scales up to fill nearly the whole screen right as
  // the "Shop Men"/"Shop Women" CTAs fade in at the end of the pinned
  // scroll — a swipe landing on that now-huge canvas simply never
  // scrolled, which read live as the page getting stuck in exactly that
  // spot. Where dragging IS wanted (product pages, showcase panels),
  // don't disable touch scrolling outright either — pan-y lets a mostly-
  // vertical swipe scroll the page natively while a mostly-horizontal one
  // still reaches OrbitControls to rotate, the standard trade-off for a
  // draggable object sitting in a scrollable page (confirmed live: the
  // full-width, up to 52vh-tall interactive area made it hard to scroll
  // past on mobile).
  renderer.domElement.style.touchAction = enableControls ? 'pan-y' : 'auto';

  let userInteracted = false;
  let hintEl = null; // assigned below once the GLB loads and the hint is actually created
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    if (!userInteracted) {
      userInteracted = true;
      if (window.track) window.track('product_3d_interact', { item_id: container.dataset.slug || opts.slug || null });
      // The hint used to stay on screen, static, for the entire visit —
      // it's only meant to teach the gesture once. Fade it out the moment
      // real drag input is confirmed rather than leaving it competing with
      // the bottle for attention indefinitely.
      if (hintEl) hintEl.classList.add('is-dismissed');
    }
  });

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Nothing here was ever torn down — every viewer (each showcase panel
  // visited, plus the hero's own bottle) kept its WebGLRenderer, its
  // requestAnimationFrame loop, and its GPU-side geometry/textures alive
  // forever, even once hidden. A few fragrances into the showcase slider
  // and several WebGL contexts are running full render loops
  // simultaneously — desktop tolerates that, but mobile browsers cap the
  // number of live contexts much lower (and have far less GPU memory),
  // so this is what was actually behind the slider "crashing" and the
  // hero bottle sometimes coming up blank (a new context silently failing
  // to allocate because old ones were never released).
  let raf = null;
  let ro = null;
  let io = null;
  let disposed = false;
  // Once revealed, this kept rendering every frame forever — including
  // long after the visitor scrolled past it (the hero bottle stays in the
  // DOM below the fold for the rest of the homepage; a product-page
  // viewer stays alive for as long as that tab is open). An off-screen
  // context burning a full render loop indefinitely is pure waste, and it
  // was very possibly what tipped some phones over the edge into a real
  // crash once a second viewer (e.g. a showcase panel) became active at
  // the same time. Pause the loop while the container isn't actually
  // visible; resume exactly where controls.autoRotate would put it.
  // Starts false (not "assumed visible") so the IntersectionObserver's own
  // first callback — reporting the real initial state — is what starts
  // the loop, rather than being a no-op because isVisible already matched.
  let isVisible = false;
  let onPageHide = null;

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    if (io) io.disconnect();
    if (onPageHide) window.removeEventListener('pagehide', onPageHide);
    if (photoStage) photoStage.style.display = '';
    if (innerPhoto) innerPhoto.style.display = '';
    controls.dispose();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          Object.keys(m).forEach((key) => {
            const value = m[key];
            if (value && value.isTexture) value.dispose();
          });
          m.dispose();
        });
      }
    });
    if (scene.environment) scene.environment.dispose();
    if (pmrem) pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  }

  const handle = { scene, camera, renderer, controls, model: null, resize, dispose };

  const loader = new GLTFLoader();
  loader.load(
    glbUrl,
    (gltf) => {
      if (disposed) return; // switched away from this panel before the GLB finished loading
      const model = gltf.scene;

      // The bottle label texture is 2048x1440 — not power-of-two (1440
      // isn't) — but its glTF sampler asks for REPEAT wrapping and a
      // mipmap minFilter. Per the WebGL spec that combination on an NPOT
      // texture makes it "incomplete" and renders as blank/transparent;
      // WebGL2 (and Chrome's ANGLE layer generally) is forgiving about
      // this, but Safari's WebGL implementation enforces it strictly —
      // confirmed live as the label rendering everywhere except Safari,
      // while the (power-of-two) normal maps were never affected. Force
      // NPOT-safe sampler settings on any texture that actually is NPOT,
      // rather than trying to fix it upstream in the asset (the label
      // doesn't tile or need mipmaps at the size it's ever viewed at, so
      // this has no visible cost).
      model.traverse((obj) => {
        if (!obj.material) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          Object.keys(mat).forEach((key) => {
            const tex = mat[key];
            if (!tex || !tex.isTexture || !tex.image) return;
            const w = tex.image.width, h = tex.image.height;
            const isPOT = (n) => (n & (n - 1)) === 0;
            if (w && h && (!isPOT(w) || !isPOT(h))) {
              tex.wrapS = THREE.ClampToEdgeWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
              tex.minFilter = THREE.LinearFilter;
              tex.generateMipmaps = false;
              tex.needsUpdate = true;
            }
          });
        });
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      model.position.sub(center); // centre the model at the origin

      scene.add(model);
      handle.model = model;

      const radius = Math.max(size.x, size.y, size.z) * 0.62;
      const dist = radius / Math.tan((camera.fov * Math.PI) / 360);
      camera.position.set(0, size.y * 0.08, dist);
      controls.target.set(0, 0, 0);
      controls.update();

      resize();
      container.classList.add('is-ready');
      container.hidden = false;

      if (showHint) {
        const hint = document.createElement('div');
        hint.className = 'bottle-3d__hint';
        hint.textContent = 'Drag to Rotate';
        container.appendChild(hint);
        hintEl = hint;
      }

      function animate() {
        raf = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }

      ro = new ResizeObserver(resize);
      ro.observe(container);

      // Only render while actually on screen. The render loop used to run
      // unconditionally forever once started, including long after the
      // visitor scrolled past it — see the isVisible comment above dispose().
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => {
          var nowVisible = entries[entries.length - 1].isIntersecting;
          if (nowVisible && !isVisible) {
            isVisible = true;
            if (!raf) animate();
          } else if (!nowVisible && isVisible) {
            isVisible = false;
            if (raf) { cancelAnimationFrame(raf); raf = null; }
          }
        }, { threshold: 0.01 });
        io.observe(container);
      } else {
        animate(); // no IntersectionObserver support — fall back to always-on, as before
      }

      // pagehide, not beforeunload: the latter is a well-known bfcache
      // disqualifier in most browsers (and was never removed on dispose,
      // so every successful GLB load — each showcase panel switch
      // included — left one more listener behind). pagehide fires on both
      // a real unload and a bfcache-eligible navigation without blocking
      // the cache, and this one *is* cleaned up in dispose().
      onPageHide = dispose;
      window.addEventListener('pagehide', onPageHide);
      if (opts.onReady) opts.onReady(handle);
    },
    undefined,
    () => {
      // No model for this product yet, or it failed to load — dispose()
      // restores whichever photo we hid up front (the real fallback the
      // visitor should see) and releases the renderer/PMREM, which were
      // already created and hold a live WebGL context that would
      // otherwise leak. In hero contexts with no photo fallback, this
      // just means that layer of the sequence never appears.
      dispose();
      container.remove();
      if (opts.onError) opts.onError();
    }
  );

  return handle;
}

window.IKARIS_BOTTLE_VIEWER = { init: initViewer, supportsWebGL };

document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('[data-bottle-3d]');
  if (!containers.length || !supportsWebGL()) return;
  containers.forEach((c) => initViewer(c));
});

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
  const autoRotate = opts.autoRotate !== false;
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

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

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

  let userInteracted = false;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    if (!userInteracted) {
      userInteracted = true;
      if (window.track) window.track('product_3d_interact', { item_id: container.dataset.slug || opts.slug || null });
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

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    if (io) io.disconnect();
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
    pmrem.dispose();
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

      window.addEventListener('beforeunload', dispose);
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

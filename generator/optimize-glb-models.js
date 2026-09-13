// Shrinks the Blender-exported bottle .glb models in assets/models/, which
// ship at ~3.7MB each almost entirely because of oversized textures, not
// geometry (confirmed via `gltf-transform inspect`: the meshes total ~350KB;
// a single 4096x4096 normal map alone accounts for ~2.9MB). Run this after
// blender/build_bottles.py regenerates the source .glb files, or any time a
// new product model is added — it's idempotent (re-running on an
// already-optimized file is a safe no-op-ish pass, just slightly lossy on
// a second JPEG/WebP re-encode, so prefer running it once against a fresh
// Blender export).
//
// Requires @gltf-transform/cli (devDependency) on PATH via node_modules/.bin.
// Run: node generator/optimize-glb-models.js
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const MODELS_DIR = path.join(ROOT, 'assets', 'models');
const GLTF_TRANSFORM = path.join(ROOT, 'node_modules', '.bin', 'gltf-transform');

// Normal maps carry only bump/lighting detail, not directly-viewed imagery
// — the Blender export ships them at 4096x4096, but the bottle is never
// rendered anywhere near that many screen pixels (even at the hero's 3.4x
// climax scale). 2048 is a deliberately conservative cap: a 4x pixel-count
// cut with real quality margin to spare, verified visually before shipping
// (see the commit message this script was introduced in).
const NORMAL_MAX_PX = 2048;

function run(args) {
  execFileSync(GLTF_TRANSFORM, args, { stdio: 'inherit' });
}

function optimize(file) {
  const srcPath = path.join(MODELS_DIR, file);
  // gltf-transform decides output format (binary .glb vs. loose .gltf+.bin+
  // textures) from the OUTPUT extension, not the input's — a non-.glb temp
  // suffix here silently produced a tiny JSON manifest plus stray sibling
  // texture/.bin files dumped into assets/models/ instead of a single .glb.
  const step1 = srcPath.replace(/\.glb$/, '.step1.glb');
  const step2 = srcPath.replace(/\.glb$/, '.step2.glb');
  const step3 = srcPath.replace(/\.glb$/, '.step3.glb');

  run(['resize', srcPath, step1, '--pattern', '*Normal*', '--width', String(NORMAL_MAX_PX), '--height', String(NORMAL_MAX_PX)]);
  // Re-encode at max effort now that resolution dropped — PNG's own
  // compression doesn't get materially better with resolution alone.
  run(['png', step1, step2, '--slots', 'normalTexture', '--effort', '100']);
  // near-lossless (not plain lossy) WebP for the bottle's printed label —
  // the one texture that's actually read as an image (product name/text),
  // where compression artifacts would be immediately visible up close.
  run(['webp', step2, step3, '--slots', 'baseColorTexture', '--near-lossless', 'true']);

  const before = fs.statSync(srcPath).size;
  const after = fs.statSync(step3).size;
  fs.renameSync(step3, srcPath);
  fs.unlinkSync(step1);
  fs.unlinkSync(step2);
  console.log(`${file}: ${(before / 1e6).toFixed(2)}MB -> ${(after / 1e6).toFixed(2)}MB`);
}

function main() {
  if (!fs.existsSync(GLTF_TRANSFORM)) {
    console.error('gltf-transform not found — run `npm install` first (it is a devDependency).');
    process.exit(1);
  }
  const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith('.glb'));
  files.forEach(optimize);
  console.log('Done.');
}

main();

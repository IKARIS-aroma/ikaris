// Turns the Blender-rendered master shots (assets/renders/<slug>.png,
// produced by blender/build_bottles.py's render_product_shot()) into the
// actual site assets: the tall product photo used in <picture> on product
// pages/showcase panels, and the square thumbnail used for OG/schema
// images. These replace the old separately-photographed (AI-generated)
// product images, which showed a differently-lit, differently-framed
// bottle — swapping the static photo out for the live 3D viewer once it
// loads now reads as "the same shot starting to move," not a jump cut to
// an unrelated picture.
//
// Run after blender/build_bottles.py. Not part of the deployed site.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PRODUCTS } = require('../data/products');

const ROOT = path.join(__dirname, '..');
const RENDERS_DIR = path.join(ROOT, 'assets', 'renders');
const PRODUCTS_DIR = path.join(ROOT, 'assets', 'products');
const THUMBS_DIR = path.join(ROOT, 'assets', 'thumbs');

const PRODUCT_W = 586, PRODUCT_H = 996;
const THUMB_SIZE = 600;

async function main() {
  for (const p of PRODUCTS) {
    const srcPath = path.join(RENDERS_DIR, `${p.slug}.png`);
    if (!fs.existsSync(srcPath)) {
      console.log('skip (no render):', p.slug);
      continue;
    }

    // Sample the render's own backdrop colour so the thumbnail's letterbox
    // padding blends into the shot seamlessly instead of guessing at
    // Blender's colour-managed output. A single corner pixel picked up a
    // faint vignette/gradient in the render and came out visibly off from
    // the bulk backdrop — average a strip near the top instead, safely
    // above the cap on every bottle, for a representative colour.
    const meta = await sharp(srcPath).metadata();
    const { data } = await sharp(srcPath)
      .extract({ left: 0, top: 20, width: meta.width, height: 60 })
      .resize(1, 1)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const backdrop = { r: data[0], g: data[1], b: data[2] };

    const img = sharp(srcPath);
    await img.clone().resize(PRODUCT_W, PRODUCT_H, { fit: 'cover' }).jpeg({ quality: 88 }).toFile(path.join(PRODUCTS_DIR, `${p.slug}.jpg`));
    await img.clone().resize(PRODUCT_W, PRODUCT_H, { fit: 'cover' }).webp({ quality: 84 }).toFile(path.join(PRODUCTS_DIR, `${p.slug}.webp`));

    await img.clone().resize(THUMB_SIZE, THUMB_SIZE, { fit: 'contain', background: backdrop }).jpeg({ quality: 88 }).toFile(path.join(THUMBS_DIR, `${p.slug}.jpg`));
    await img.clone().resize(THUMB_SIZE, THUMB_SIZE, { fit: 'contain', background: backdrop }).webp({ quality: 84 }).toFile(path.join(THUMBS_DIR, `${p.slug}.webp`));

    console.log('processed:', p.slug);
  }
  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });

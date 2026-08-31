import dotenv from 'dotenv';
import postgres from 'postgres';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

function parseProductTxt(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const data = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    data[key] = value;
  }
  return data;
}

function getImagesInFolder(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  return files
    .filter(f => /\.(jpe?g|png|webp|heic|jpg)$/i.test(f))
    .sort()
    .map(f => path.join(dirPath, f));
}

async function ensureColors() {
  const existingColors = await sql`SELECT id, color_name FROM colors`;
  const colorMap = new Map();
  existingColors.forEach(c => colorMap.set(c.color_name.toLowerCase(), c.id));

  // Add Wine if not present
  if (!colorMap.has('wine')) {
    const [inserted] = await sql`
      INSERT INTO colors (color_name, color_code, hex_code)
      VALUES ('Wine', 'WIN', '#5C1D24')
      RETURNING id, color_name
    `;
    console.log(`Added color: Wine (ID: ${inserted.id})`);
    colorMap.set('wine', inserted.id);
  }

  return colorMap;
}

async function uploadImageToCloudinary(filePath, folder = 'tia-products') {
  console.log(`  Uploading image to Cloudinary: ${path.basename(filePath)}...`);
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    format: 'jpg',
  });
  return result.secure_url;
}

async function main() {
  try {
    console.log('🚀 Starting product upload process...');

    const colorMap = await ensureColors();
    console.log('Available colors:', Object.fromEntries(colorMap));

    const sizes = await sql`SELECT id, size_name FROM sizes ORDER BY id`;
    console.log('Available sizes:', sizes.map(s => `${s.size_name} (ID: ${s.id})`));

    const uploadsDir = path.join(__dirname, 'product-uploads');

    // 1. Thee Vibee (Variant Product)
    console.log('\n========================================');
    console.log('📦 Processing Multi-Variant Product: Thee Vibee');
    console.log('========================================');

    const tvLongTxt = parseProductTxt(path.join(uploadsDir, 'Thee Vibee Long', 'product.txt'));
    const tvShortTxt = parseProductTxt(path.join(uploadsDir, 'Thee Vibee Short', 'product.txt'));

    const tvLongImages = getImagesInFolder(path.join(uploadsDir, 'Thee Vibee Long', 'images'));
    const tvShortImages = getImagesInFolder(path.join(uploadsDir, 'Thee Vibee Short', 'images'));

    console.log(`Thee Vibee Long has ${tvLongImages.length} images.`);
    console.log(`Thee Vibee Short has ${tvShortImages.length} images.`);

    // Insert Parent Product
    const [theeVibeeProduct] = await sql`
      INSERT INTO products (name, description, base_price, sku_prefix, category, gender, is_new_release, is_active)
      VALUES (
        'Thee Vibee',
        'Engineered for superior comfort and modern athletic style, Thee Vibee is a premium windbreaker set designed for versatility and everyday performance. Featuring high-grade weather-resistant fabric, clean contrast branding, and tailored silhouettes.',
        ${Number(tvShortTxt.price || 160000)},
        'TVB',
        'Lounge Set',
        'Male',
        true,
        true
      )
      RETURNING id, name
    `;
    console.log(` Created Product: ${theeVibeeProduct.name} (ID: ${theeVibeeProduct.id})`);

    // Variant 1: Thee Vibee Long
    const [tvLongVariant] = await sql`
      INSERT INTO product_variants (product_id, color_id, sku, name, is_active)
      VALUES (
        ${theeVibeeProduct.id},
        ${colorMap.get('black') || 1},
        'TVL-0',
        'Thee Vibee Long',
        true
      )
      RETURNING id, name
    `;
    console.log(`  Created Variant: ${tvLongVariant.name} (ID: ${tvLongVariant.id})`);

    // Sizes for Thee Vibee Long
    for (const size of sizes) {
      await sql`
        INSERT INTO variant_sizes (variant_id, size_id, stock_quantity)
        VALUES (${tvLongVariant.id}, ${size.id}, 10)
      `;
    }
    console.log(`  Added stock (10 per size) for ${tvLongVariant.name}`);

    // Images for Thee Vibee Long
    for (let i = 0; i < tvLongImages.length; i++) {
      const url = await uploadImageToCloudinary(tvLongImages[i]);
      await sql`
        INSERT INTO product_images (variant_id, image_url, is_primary)
        VALUES (${tvLongVariant.id}, ${url}, ${i === 0})
      `;
      console.log(`   Saved image ${i + 1}/${tvLongImages.length} (Primary: ${i === 0})`);
    }

    // Variant 2: Thee Vibee Short
    const [tvShortVariant] = await sql`
      INSERT INTO product_variants (product_id, color_id, sku, name, is_active)
      VALUES (
        ${theeVibeeProduct.id},
        ${colorMap.get('black') || 1},
        'TVS-0',
        'Thee Vibee Short',
        true
      )
      RETURNING id, name
    `;
    console.log(`  Created Variant: ${tvShortVariant.name} (ID: ${tvShortVariant.id})`);

    // Sizes for Thee Vibee Short
    for (const size of sizes) {
      await sql`
        INSERT INTO variant_sizes (variant_id, size_id, stock_quantity)
        VALUES (${tvShortVariant.id}, ${size.id}, 10)
      `;
    }
    console.log(`  Added stock (10 per size) for ${tvShortVariant.name}`);

    // Images for Thee Vibee Short
    for (let i = 0; i < tvShortImages.length; i++) {
      const url = await uploadImageToCloudinary(tvShortImages[i]);
      await sql`
        INSERT INTO product_images (variant_id, image_url, is_primary)
        VALUES (${tvShortVariant.id}, ${url}, ${i === 0})
      `;
      console.log(`   Saved image ${i + 1}/${tvShortImages.length} (Primary: ${i === 0})`);
    }

    // 2. Standalone Products
    const standaloneProducts = [
      { folder: 'Bubble Gum', colorKey: 'pink' },
      { folder: 'Butterflies', colorKey: 'blue' },
      { folder: 'Capri 101', colorKey: 'black' },
      { folder: 'Capri Nudy Chocolate', colorKey: 'brown' },
      { folder: 'Clean Girl', colorKey: 'cream' },
      { folder: 'Dark Wine', colorKey: 'wine' },
      { folder: 'Double Bubble', colorKey: 'black' },
      { folder: 'Dusty Rose', colorKey: 'pink' },
      { folder: 'Lets Go Padel', colorKey: 'blue' },
      { folder: 'Spicy Wine', colorKey: 'wine' },
    ];

    for (const item of standaloneProducts) {
      console.log('\n========================================');
      console.log(`📦 Processing Product: ${item.folder}`);
      console.log('========================================');

      const txtPath = path.join(uploadsDir, item.folder, 'product.txt');
      const imgDir = path.join(uploadsDir, item.folder, 'images');

      if (!fs.existsSync(txtPath)) {
        console.warn(`⚠️ product.txt missing for ${item.folder}, skipping.`);
        continue;
      }

      const pData = parseProductTxt(txtPath);
      const images = getImagesInFolder(imgDir);

      if (images.length === 0) {
        console.warn(`⚠️ No images found for ${item.folder}, skipping.`);
        continue;
      }

      const colorId = colorMap.get(item.colorKey) || 1;
      const basePrice = Number(pData.price || 100000);
      const skuPrefix = pData.sku_prefix || item.folder.substring(0, 3).toUpperCase();

      // Insert Product
      const [product] = await sql`
        INSERT INTO products (name, description, base_price, sku_prefix, category, gender, is_new_release, is_active)
        VALUES (
          ${pData.name || item.folder},
          ${pData.description || ''},
          ${basePrice},
          ${skuPrefix},
          ${pData.category || 'Lounge Set'},
          ${pData.gender || 'Female'},
          true,
          true
        )
        RETURNING id, name
      `;
      console.log(` Created Product: ${product.name} (ID: ${product.id})`);

      // Insert Variant
      const [variant] = await sql`
        INSERT INTO product_variants (product_id, color_id, sku, name, is_active)
        VALUES (
          ${product.id},
          ${colorId},
          ${`${skuPrefix}-0`},
          ${product.name},
          true
        )
        RETURNING id, name
      `;
      console.log(`  Created Variant: ${variant.name} (ID: ${variant.id})`);

      // Insert Sizes
      for (const size of sizes) {
        await sql`
          INSERT INTO variant_sizes (variant_id, size_id, stock_quantity)
          VALUES (${variant.id}, ${size.id}, ${Number(pData.stock_per_size || 10)})
        `;
      }
      console.log(`  Added stock (${pData.stock_per_size || 10} per size) for ${variant.name}`);

      // Upload and Insert Images
      for (let i = 0; i < images.length; i++) {
        const url = await uploadImageToCloudinary(images[i]);
        await sql`
          INSERT INTO product_images (variant_id, image_url, is_primary)
          VALUES (${variant.id}, ${url}, ${i === 0})
        `;
        console.log(`   Saved image ${i + 1}/${images.length} (Primary: ${i === 0})`);
      }
    }

    console.log('\n✨ All products successfully processed and uploaded!');

    // Verification queries
    console.log('\n--- VERIFICATION ---');
    const uploadedProducts = await sql`
      SELECT p.id, p.name, p.category, p.gender, p.base_price, COUNT(DISTINCT pv.id) as variant_count, COUNT(DISTINCT pi.id) as image_count
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN product_images pi ON pi.variant_id = pv.id
      GROUP BY p.id, p.name, p.category, p.gender, p.base_price
      ORDER BY p.id DESC
      LIMIT 15
    `;
    console.table(uploadedProducts);

  } catch (error) {
    console.error('❌ Error during upload:', error);
  } finally {
    await sql.end();
  }
}

main();

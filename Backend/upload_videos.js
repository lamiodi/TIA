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

const isForce = process.argv.includes('--force') || process.argv.includes('-f');

// Common aliases mapping folder names to DB product names
const ALIAS_MAP = {
  'bubble double': 'Double Bubble',
  'double bubble': 'Double Bubble',
  'capri nude': 'Capri Nudy Chocolate',
  'capri nudy': 'Capri Nudy Chocolate',
  'capri nudy chocolate': 'Capri Nudy Chocolate',
  'clean girl': 'Clean Girl',
  'dark wine': 'Dark Wine',
  'spicy wine': 'Spicy Wine',
  'capri 101': 'Capri 101',
  'wear corporate': 'Wear Corporate',
  'thee vibee long': 'Thee Vibee Pant, Jacket, Roundneck T Shirt',
  'thee vibee short': 'Thee Vibee Short, Jacket, Roundneck T-shirt',
};

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|mkv|avi)$/i;

function findVideosInDir(folderPath) {
  if (!fs.existsSync(folderPath)) return [];
  const files = [];

  // 1. Direct folder contents
  try {
    const directFiles = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const file of directFiles) {
      if (file.isFile() && VIDEO_EXTENSIONS.test(file.name)) {
        files.push(path.join(folderPath, file.name));
      }
    }
  } catch (err) {}

  // 2. Subfolder "videos"
  const videosSubDir = path.join(folderPath, 'videos');
  if (fs.existsSync(videosSubDir)) {
    try {
      const vFiles = fs.readdirSync(videosSubDir, { withFileTypes: true });
      for (const file of vFiles) {
        if (file.isFile() && VIDEO_EXTENSIONS.test(file.name)) {
          files.push(path.join(videosSubDir, file.name));
        }
      }
    } catch (err) {}
  }

  // 3. Subfolder "images"
  const imagesSubDir = path.join(folderPath, 'images');
  if (fs.existsSync(imagesSubDir)) {
    try {
      const iFiles = fs.readdirSync(imagesSubDir, { withFileTypes: true });
      for (const file of iFiles) {
        if (file.isFile() && VIDEO_EXTENSIONS.test(file.name)) {
          files.push(path.join(imagesSubDir, file.name));
        }
      }
    } catch (err) {}
  }

  return files;
}

async function uploadVideoToCloudinary(filePath, folder = 'tia-products/videos', maxRetries = 3) {
  const fileName = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`  ☁️  Uploading "${fileName}" (${sizeMB} MB) to Cloudinary...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'video',
        timeout: 600000,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✅ Uploaded in ${elapsed}s! URL: ${result.secure_url}`);
      return result?.secure_url || result?.url || null;
    } catch (err) {
      console.warn(`  ⚠️ Attempt ${attempt}/${maxRetries} failed: ${err.message || err}. Retrying in 3s...`);
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  return null;
}

async function main() {
  try {
    console.log('🎬 ========================================================');
    console.log('   TIA PRODUCT VIDEO UPLOADER');
    console.log('========================================================\n');
    if (isForce) {
      console.log('⚡ Force mode enabled: will re-upload and overwrite existing videos.\n');
    }

    // Ensure columns exist
    await sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS video_url TEXT;`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;`;

    // Fetch existing products and variants from DB
    const dbProducts = await sql`
      SELECT p.id as product_id, p.name as product_name, pv.id as variant_id, pv.name as variant_name, pv.video_url
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      ORDER BY p.id ASC
    `;

    const uploadsDir = path.join(__dirname, 'product-uploads');
    if (!fs.existsSync(uploadsDir)) {
      console.error(`❌ Uploads directory not found: ${uploadsDir}`);
      return;
    }

    const entries = fs.readdirSync(uploadsDir, { withFileTypes: true });
    const targetFolders = entries.filter(e => e.isDirectory()).map(e => e.name);

    console.log(`Found ${targetFolders.length} product folders in ${uploadsDir}:\n`);

    let updatedCount = 0;
    let skippedExistingCount = 0;
    let missingDbCount = 0;
    let noVideoCount = 0;

    for (const folderName of targetFolders) {
      console.log(`\n📁 Checking folder: "${folderName}"`);
      const folderPath = path.join(uploadsDir, folderName);
      const videos = findVideosInDir(folderPath);

      if (videos.length === 0) {
        console.log(`   ℹ️ No video files found in "${folderName}". (Paste .mp4/.mov here when ready)`);
        noVideoCount++;
        continue;
      }

      const videoFile = videos[0];
      console.log(`   📹 Found video: ${path.basename(videoFile)}`);

      // Match against DB product
      const normalizedFolderName = folderName.trim().toLowerCase();
      const aliasTarget = ALIAS_MAP[normalizedFolderName]?.toLowerCase() || normalizedFolderName;

      // Find matching product in DB
      let matched = dbProducts.find(p => 
        p.product_name?.trim().toLowerCase() === aliasTarget ||
        p.product_name?.trim().toLowerCase() === normalizedFolderName ||
        p.variant_name?.trim().toLowerCase() === aliasTarget ||
        p.variant_name?.trim().toLowerCase() === normalizedFolderName
      );

      // Fallback: check if product name contains folder name or vice versa
      if (!matched) {
        matched = dbProducts.find(p => 
          p.product_name && (
            p.product_name.toLowerCase().includes(normalizedFolderName) ||
            normalizedFolderName.includes(p.product_name.toLowerCase())
          )
        );
      }

      if (!matched) {
        console.warn(`   ⚠️ No product found in database matching "${folderName}". Skipping DB update.`);
        missingDbCount++;
        continue;
      }

      console.log(`   🔗 Matched to DB Product: "${matched.product_name}" (Product ID: ${matched.product_id}, Variant ID: ${matched.variant_id})`);

      // If already has video and not forced, skip re-uploading
      if (matched.video_url && !isForce) {
        console.log(`   ⏭️ Product already has video attached (${matched.video_url}). Skipping. (Use --force to overwrite)`);
        skippedExistingCount++;
        continue;
      }

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadVideoToCloudinary(videoFile);

      if (!cloudinaryUrl) {
        console.error(`   ❌ Failed to get Cloudinary URL for ${videoFile}`);
        continue;
      }

      // Update Database
      if (matched.variant_id) {
        await sql`
          UPDATE product_variants
          SET video_url = ${cloudinaryUrl}
          WHERE id = ${matched.variant_id}
        `;
      }

      await sql`
        UPDATE products
        SET video_url = ${cloudinaryUrl}
        WHERE id = ${matched.product_id}
      `;

      console.log(`   💾 Database successfully updated for "${matched.product_name}"!`);
      updatedCount++;
    }

    console.log('\n========================================================');
    console.log('📊 UPLOAD SUMMARY');
    console.log('========================================================');
    console.log(`✅ Successfully uploaded and updated: ${updatedCount}`);
    console.log(`⏭️ Skipped (already has video):       ${skippedExistingCount}`);
    console.log(`ℹ️ Folders with no video file:       ${noVideoCount}`);
    console.log(`⚠️ Folders with no matching DB item:  ${missingDbCount}`);

    // Verification
    console.log('\n--- Current Videos in Database ---');
    const productsWithVideos = await sql`
      SELECT p.id, p.name, pv.id as variant_id, pv.video_url
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE pv.video_url IS NOT NULL OR p.video_url IS NOT NULL
      ORDER BY p.id ASC
    `;
    console.table(productsWithVideos);

  } catch (error) {
    console.error('❌ Error in video uploader:', error);
  } finally {
    await sql.end();
  }
}

main();

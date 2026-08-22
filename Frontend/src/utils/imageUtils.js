/**
 * Cloudinary Image Optimization & Responsive Delivery Utility
 * 
 * Provides automated format selection (AVIF/WebP), intelligent compression (q_auto:good),
 * responsive scaling, and low-quality placeholders (LQIP) to dramatically reduce payload size
 * and speed up image loading across the application.
 */

/**
 * Optimizes a Cloudinary image URL with specified transformations.
 * If the URL is not from Cloudinary, it is returned as-is.
 * 
 * @param {string} url - The image URL to optimize
 * @param {Object} options - Transformation options
 * @param {number} [options.width] - Target width in pixels
 * @param {number} [options.height] - Target height in pixels
 * @param {string} [options.quality='auto:good'] - Cloudinary quality mode ('auto', 'auto:good', 'auto:eco', or 1-100)
 * @param {string} [options.format='auto'] - Delivery format ('auto' gives AVIF/WebP automatically)
 * @param {string} [options.crop] - Crop mode ('limit', 'fill', 'scale', 'fit', 'thumb')
 * @param {string} [options.dpr='auto'] - Device pixel ratio
 * @param {number} [options.blur] - Blur effect value (for low-res placeholders)
 * @param {string} [options.gravity] - Gravity anchor for cropping (e.g., 'auto', 'center')
 * @returns {string} - The optimized image URL
 */
export function optimizeCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url || '';

  // Return non-Cloudinary URLs unmodified
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const {
    width,
    height,
    quality = 'auto:good',
    format = 'auto',
    crop = (width && height) ? 'fill' : (width || height) ? 'limit' : undefined,
    dpr = 'auto',
    blur,
    gravity = (crop === 'fill') ? 'auto' : undefined,
  } = options;

  const transforms = [];

  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (width) transforms.push(`w_${Math.round(width)}`);
  if (height) transforms.push(`h_${Math.round(height)}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  if (dpr) transforms.push(`dpr_${dpr}`);
  if (blur) transforms.push(`e_blur:${blur}`);

  const transformString = transforms.join(',');
  if (!transformString) return url;

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + 8); // includes '/upload/'
  let suffix = url.substring(uploadIndex + 8);

  // Check if first segment contains existing transformations (e.g. f_auto,q_auto...)
  const segments = suffix.split('/');
  if (
    segments.length > 1 &&
    (segments[0].includes('f_') ||
      segments[0].includes('q_') ||
      segments[0].includes('w_') ||
      segments[0].includes('h_') ||
      segments[0].includes('c_') ||
      segments[0].includes(','))
  ) {
    // Strip existing transformation segment to apply updated ones
    suffix = segments.slice(1).join('/');
  }

  return `${prefix}${transformString}/${suffix}`;
}

/**
 * Generates an optimized thumbnail URL (ideal for cart, drawer, checkout summaries, suggestion rows).
 * Reduces multi-megabyte source images down to ~5KB - 15KB.
 */
export function getThumbnailUrl(url, width = 160, height = null) {
  return optimizeCloudinaryUrl(url, {
    width,
    height: height || width,
    quality: 'auto:good',
    crop: height ? 'fill' : 'limit',
  });
}

/**
 * Generates an optimized product card image URL (ideal for grids, shop all, search results, new releases).
 * Reduces 5MB-10MB source images down to ~30KB - 70KB.
 */
export function getCardImageUrl(url, width = 600) {
  return optimizeCloudinaryUrl(url, {
    width,
    quality: 'auto:good',
    crop: 'limit',
  });
}

/**
 * Generates an optimized high-resolution image URL (ideal for product detail galleries & zoom).
 */
export function getDetailImageUrl(url, width = 1000) {
  return optimizeCloudinaryUrl(url, {
    width,
    quality: 'auto:good',
    crop: 'limit',
  });
}

/**
 * Generates an optimized hero banner image URL.
 */
export function getHeroImageUrl(url, width = 1200) {
  return optimizeCloudinaryUrl(url, {
    width,
    quality: 'auto:good',
    crop: 'limit',
  });
}

/**
 * Generates a super lightweight Low-Quality Image Placeholder (LQIP) URL (~500 bytes)
 * with blur for instant loading and progressive enhancement.
 */
export function getPlaceholderBlurUrl(url) {
  return optimizeCloudinaryUrl(url, {
    width: 30,
    quality: 'auto:eco',
    blur: 1000,
    crop: 'limit',
  });
}

/**
 * Generates a responsive srcset string for high-DPI and multi-device support.
 */
export function getSrcSet(url, widths = [320, 480, 640, 800, 1000]) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return '';
  }

  return widths
    .map((w) => `${optimizeCloudinaryUrl(url, { width: w, quality: 'auto:good', crop: 'limit' })} ${w}w`)
    .join(', ');
}

export default {
  optimizeCloudinaryUrl,
  getThumbnailUrl,
  getCardImageUrl,
  getDetailImageUrl,
  getHeroImageUrl,
  getPlaceholderBlurUrl,
  getSrcSet,
};

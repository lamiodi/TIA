import React, { useState, useEffect } from 'react';
import {
  optimizeCloudinaryUrl,
  getThumbnailUrl,
  getCardImageUrl,
  getDetailImageUrl,
  getHeroImageUrl,
  getSrcSet,
} from '../utils/imageUtils';

const DEFAULT_FALLBACK = 'https://via.placeholder.com/400x500?text=No+Image';

/**
 * High-performance OptimizedImage component
 * Features:
 * - Automated Cloudinary format selection (AVIF/WebP) & perceptual compression
 * - Responsive srcset generation
 * - Native lazy loading for off-screen images + eager/fetchpriority="high" for LCP
 * - Shimmer skeleton state during download
 * - Smooth opacity fade-in transition
 * - Graceful fallback on broken/missing images
 */
const OptimizedImage = ({
  src,
  alt = 'Product image',
  preset = 'card', // 'card' | 'thumbnail' | 'detail' | 'hero' | 'none'
  width,
  height,
  priority = false,
  className = '',
  imgClassName = '',
  aspectRatio,
  fallbackSrc = DEFAULT_FALLBACK,
  useSrcSet = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  onError,
  onLoad,
  style,
  ...restProps
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Compute optimized URL based on preset or explicit dimensions
  const optimizedSrc = React.useMemo(() => {
    if (!src) return fallbackSrc;

    if (width || height) {
      return optimizeCloudinaryUrl(src, { width, height, quality: 'auto:good' });
    }

    switch (preset) {
      case 'thumbnail':
        return getThumbnailUrl(src, 160);
      case 'detail':
        return getDetailImageUrl(src, 1000);
      case 'hero':
        return getHeroImageUrl(src, 1200);
      case 'card':
        return getCardImageUrl(src, 600);
      case 'none':
      default:
        return optimizeCloudinaryUrl(src, { quality: 'auto:good' });
    }
  }, [src, preset, width, height, fallbackSrc]);

  // Compute responsive srcset if requested
  const srcSet = React.useMemo(() => {
    if (!useSrcSet || !src) return undefined;
    return getSrcSet(src);
  }, [useSrcSet, src]);

  const handleLoad = (e) => {
    setLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    if (onError) {
      onError(e);
    } else {
      e.target.src = fallbackSrc;
    }
  };

  // Reset loaded state when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-stone-100 ${className}`}
      style={{
        aspectRatio: aspectRatio || undefined,
        ...style,
      }}
    >
      {/* Shimmer skeleton until image is fully loaded */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 animate-pulse" />
      )}

      <img
        src={error ? fallbackSrc : optimizedSrc}
        srcSet={error ? undefined : srcSet}
        sizes={useSrcSet && !error ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
        {...restProps}
      />
    </div>
  );
};

export default React.memo(OptimizedImage);

import React from 'react';

const ProductSchema = ({ productData, selectedVariant, selectedSize, isProduct, currentUrl }) => {
  if (!productData || !productData.data) return null;

  const { type, data } = productData;
  const isProductType = type === "product";
  
  // Extract product information
  const name = data?.name || "Unnamed Product";
  const description = data?.description || "No description available";
  const images = isProductType 
    ? Array.isArray(selectedVariant?.images) ? selectedVariant.images : []
    : Array.isArray(data?.images) ? data.images : [];
  
  // Get price information
  const rawPrice = isProductType ? data?.price : data?.price || 0;
  const price = Number.parseFloat(rawPrice) || 0;
  
  // Get SKU - use variant ID for products, bundle ID for bundles
  const sku = isProductType 
    ? selectedVariant?.variant_id?.toString() || ""
    : data?.bundle_id?.toString() || "";
  
  // Determine availability
  const availability = "https://schema.org/InStock"; // Assuming in stock based on UI

  // Get product URL
  const productUrl = currentUrl || `https://www.thetiabrand.org/product/${data?.product_id || data?.bundle_id || ""}`;

  // Create structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "image": images.length > 0 ? images : ["https://www.thetiabrand.org/images/placeholder.jpg"],
    "description": description,
    "brand": {
      "@type": "Brand",
      "name": "The Tia Brand"
    },
    "sku": sku,
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "NGN",
      "price": price,
      "availability": availability,
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export default ProductSchema;
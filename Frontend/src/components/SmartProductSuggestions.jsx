import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Plus, Check, ShoppingBag, ArrowRight, Zap, Star, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import imgWhite from '../assets/im/IMG_6222.PNG';
import imgBlack from '../assets/im/IMG_6254.PNG';
import imgGrey from '../assets/im/IMG_6255.PNG';
import { getThumbnailUrl, getCardImageUrl } from '../utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

// Curated high-converting catalog with REAL database product and variant IDs
const DEFAULT_SUGGESTIONS = [
  {
    id: 17,
    variant_id: 8,
    size_id: 4,
    name: 'TIA Signature Boxers (Obsidian Black)',
    category: 'BRIEFS',
    price: 75000,
    originalPrice: 85000,
    image: imgBlack,
    rating: 4.9,
    reviewsCount: 128,
    badge: 'Best Seller',
    description: 'Ultra-breathable micro-modal stretch for everyday luxury.'
  },
  {
    id: 24,
    variant_id: 16,
    size_id: 4,
    name: 'TIA Luxe Lounge Set (Minimalist Grey)',
    category: 'LOUNGE SETS',
    price: 103850,
    originalPrice: 120000,
    image: imgGrey,
    rating: 5.0,
    reviewsCount: 94,
    badge: 'Popular',
    description: 'Coordinated organic cotton fleece set tailored for relaxed elegance.'
  },
  {
    id: 23,
    variant_id: 9,
    size_id: 4,
    name: 'TIA Pure Cotton Briefs (Classic White)',
    category: 'BRIEFS',
    price: 75000,
    originalPrice: 85000,
    image: imgWhite,
    rating: 4.8,
    reviewsCount: 76,
    badge: 'Trending',
    description: 'Seamless ergonomic design offering maximum support and breathability.'
  }
];

export const SmartProductSuggestions = ({ 
  type = 'cart-drawer', // 'cart-drawer' | 'frequently-bought-together' | 'you-may-also-like'
  currentProductId = null,
  currentProductPrice = 0,
  currentProductName = '',
  currentProductImage = '',
  currentVariant = null,
  currentSize = null,
  isProduct = true,
  className = '' 
}) => {
  const cartContext = useCart() || {};
  const addItem = cartContext.addItem;
  const addItems = cartContext.addItems;
  const openCart = cartContext.openCart;
  const isCartLoading = cartContext.isCartLoading;

  const { currency, exchangeRate } = useContext(CurrencyContext) || {};
  const [liveCatalog, setLiveCatalog] = useState([]);
  const [addedItems, setAddedItems] = useState({});
  const [isMainSelected, setIsMainSelected] = useState(true);
  const [selectedBundleIds, setSelectedBundleIds] = useState([]);
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [bundleSuccess, setBundleSuccess] = useState(false);

  // Price formatter
  const formatPrice = (amount) => {
    const numericAmount = Number(amount) || 0;
    if (currency === 'USD') {
      const converted = numericAmount / (exchangeRate || 1529.26);
      return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₦${numericAmount.toLocaleString('en-NG')}`;
  };

  // Safe fallback to add items to guest cart in localStorage if context is not yet mounted
  const addToGuestCartDirect = (itemToAdd) => {
    try {
      const cartData = localStorage.getItem('guestCart');
      const guestCart = cartData ? JSON.parse(cartData) : { items: [], subtotal: 0, tax: 0, total: 0 };
      guestCart.items = Array.isArray(guestCart.items) ? guestCart.items : [];
      guestCart.items.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        quantity: itemToAdd.quantity || 1,
        price: itemToAdd.price,
        product_type: itemToAdd.product_type || 'single',
        variant_id: itemToAdd.variant_id || null,
        size_id: itemToAdd.size_id || null,
        is_preorder: false,
        name: itemToAdd.name,
        image: itemToAdd.image,
        color: itemToAdd.color || 'Classic',
        size: itemToAdd.size || 'L',
        item: {
          id: itemToAdd.id,
          name: itemToAdd.name,
          price: itemToAdd.price,
          original_price: itemToAdd.originalPrice || itemToAdd.price,
          image: itemToAdd.image,
          color: itemToAdd.color || 'Classic',
          size: itemToAdd.size || 'L',
          is_product: true,
          stock_quantity: 999
        }
      });
      guestCart.subtotal = guestCart.items.reduce((acc, ci) => acc + (Number(ci.price) || 0) * (ci.quantity || 1), 0);
      guestCart.tax = 0;
      guestCart.total = guestCart.subtotal;
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
    } catch (err) {
      console.warn('Direct guestCart write fallback error:', err);
    }
  };

  // Optionally fetch real live products from catalog
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/shopall`);
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data
            .filter(p => p.id && /^\d+$/.test(String(p.id)))
            .map(p => ({
              id: p.id,
              variant_id: p.variantId || null,
              size_id: 4,
              name: p.name,
              category: p.category,
              price: Number(p.price) || 0,
              originalPrice: Math.round((Number(p.price) || 0) * 1.15),
              image: p.image || imgBlack,
              rating: 4.9,
              reviewsCount: 88,
              badge: p.is_new_release ? 'New' : 'Popular',
              description: `${p.category || 'Luxury essential'} crafted for timeless style and comfort.`
            }));
          if (isMounted && formatted.length > 0) {
            setLiveCatalog(formatted);
          }
        }
      } catch {
        // Silently use curated catalog on error or offline
      }
    };

    fetchCatalog();
    return () => { isMounted = false; };
  }, []);

  // Filter out current product if provided, using live catalog or curated catalog with real IDs
  const activeCatalog = liveCatalog.length >= 3 ? liveCatalog : DEFAULT_SUGGESTIONS;
  const recommendations = activeCatalog.filter(item => String(item.id) !== String(currentProductId));

  // Initialize bundle selections
  useEffect(() => {
    if (type === 'frequently-bought-together') {
      setIsMainSelected(true);
      setSelectedBundleIds(recommendations.slice(0, 2).map(item => item.id));
    }
  }, [type, currentProductId, recommendations.length]);

  const handleQuickAdd = async (product, e) => {
    if (e) e.preventDefault();
    try {
      setAddedItems(prev => ({ ...prev, [product.id]: 'loading' }));

      const payload = {
        id: product.id,
        variant_id: product.variant_id || null,
        size_id: product.size_id || 4,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        product_type: 'single',
        color: product.color || 'Classic',
        size: currentSize || 'L',
        quantity: 1
      };

      if (typeof addItem === 'function') {
        await addItem(payload);
      } else {
        addToGuestCartDirect(payload);
      }

      setAddedItems(prev => ({ ...prev, [product.id]: 'success' }));
      if (typeof openCart === 'function') openCart();
      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('openCartModal'));

      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [product.id]: false }));
      }, 2500);
    } catch (err) {
      console.error('Failed to add recommendation to cart:', err);
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleToggleBundleItem = (id) => {
    setSelectedBundleIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleMainItem = () => {
    setIsMainSelected(prev => !prev);
  };

  // Mode 1: Cart Drawer Compact Recommendation List
  if (type === 'cart-drawer') {
    return (
      <div className={`pt-4 border-t border-stone-200 ${className}`}>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-stone-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900">
              Complete Your Look
            </h4>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">Curated Add-ons</span>
        </div>

        <div className="space-y-2.5">
          {recommendations.slice(0, 2).map((product) => {
            const isLoading = addedItems[product.id] === 'loading';
            const isSuccess = addedItems[product.id] === 'success';

            return (
              <div 
                key={product.id}
                className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all duration-200 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={getThumbnailUrl(product.image, 120)} 
                    alt="" 
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="w-11 h-13 object-cover rounded-md border border-stone-200 shrink-0 bg-stone-100"
                  />
                  <div className="min-w-0 pr-2">
                    <p className="text-[11px] font-semibold text-stone-900 truncate font-Jost">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono font-bold text-stone-900">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] font-mono line-through text-stone-400">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleQuickAdd(product, e)}
                  disabled={isLoading || isCartLoading}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 cursor-pointer border ${
                    isSuccess 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white hover:bg-stone-900 hover:text-white text-stone-900 border-stone-300 shadow-2xs'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" />
                      Added
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-stone-600" />
                      Adding
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      Add
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Mode 2: Frequently Bought Together (Product Details Page)
  if (type === 'frequently-bought-together') {
    const selectedItems = recommendations.filter(item => selectedBundleIds.includes(item.id));
    const totalSelectedCount = (isMainSelected ? 1 : 0) + selectedItems.length;
    // Set 10% discount applies when 2 or more complementary items are selected
    const bundleDiscountRate = totalSelectedCount >= 2 ? 0.10 : 0;

    const mainPrice = isMainSelected ? Number(currentProductPrice || 0) : 0;
    const recommendationsPrice = selectedItems.reduce((acc, curr) => acc + curr.price, 0);
    const bundleTotal = mainPrice + recommendationsPrice;
    const bundleSavings = bundleDiscountRate > 0 ? Math.round(bundleTotal * bundleDiscountRate) : 0;
    const finalBundlePrice = bundleTotal - bundleSavings;

    const handleAddBundleToCart = async () => {
      if (totalSelectedCount === 0 || isAddingBundle) return;
      try {
        setIsAddingBundle(true);

        const itemsToAdd = [];

        // Add main product if selected
        if (isMainSelected) {
          const rawPrice = Number(currentProductPrice) || 0;
          const discountedPrice = bundleDiscountRate > 0 
            ? Math.round(rawPrice * (1 - bundleDiscountRate))
            : rawPrice;

          itemsToAdd.push({
            id: currentProductId ? `prod-${currentProductId}` : 'current-product',
            variant_id: currentVariant?.variant_id || (currentProductId == 64 ? 57 : null),
            size_id: currentVariant?.sizes?.find(s => s.size_name === currentSize)?.size_id || 4,
            name: currentProductName || 'Current Item',
            price: discountedPrice,
            originalPrice: rawPrice,
            image: currentProductImage || '',
            color: currentVariant?.color_name || 'Obsidian',
            size: currentSize || 'L',
            product_type: isProduct ? 'single' : 'bundle',
            quantity: 1,
          });
        }

        // Add selected complementary recommendations
        for (const item of selectedItems) {
          const rawPrice = item.price;
          const discountedPrice = bundleDiscountRate > 0 
            ? Math.round(rawPrice * (1 - bundleDiscountRate))
            : rawPrice;

          itemsToAdd.push({
            id: item.id,
            variant_id: item.variant_id || null,
            size_id: item.size_id || 4,
            name: item.name,
            price: discountedPrice,
            originalPrice: rawPrice,
            image: item.image,
            color: 'Classic',
            size: currentSize || 'L',
            product_type: 'single',
            quantity: 1,
          });
        }

        if (typeof addItems === 'function') {
          await addItems(itemsToAdd);
        } else if (typeof addItem === 'function') {
          for (const item of itemsToAdd) {
            await addItem(item);
          }
        } else {
          for (const item of itemsToAdd) {
            addToGuestCartDirect(item);
          }
        }

        setBundleSuccess(true);

        // Open cart drawer immediately to provide immediate feedback
        if (typeof openCart === 'function') {
          openCart();
        }
        window.dispatchEvent(new Event('openCartModal'));
        window.dispatchEvent(new Event('cartUpdated'));

        setTimeout(() => {
          setBundleSuccess(false);
        }, 3000);
      } catch (err) {
        console.error('Failed to add bundle to cart:', err);
      } finally {
        setIsAddingBundle(false);
      }
    };

    return (
      <div className={`my-12 p-6 bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md text-stone-100 ${className}`}>
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-lg font-Cinzel font-semibold uppercase tracking-wider text-stone-100">
              Frequently Bought Together
            </h3>
            <p className="text-xs text-stone-400 font-Jost">
              Pair this item with complementary essentials & save 10% on the set
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Items Preview List */}
          <div className="lg:col-span-2 space-y-3">
            {/* Main Product Item */}
            <div 
              onClick={handleToggleMainItem}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                isMainSelected 
                  ? 'bg-white/5 border-amber-400/50 text-stone-100 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 text-stone-400 hover:border-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                isMainSelected ? 'bg-amber-400 border-amber-400 text-black' : 'border-white/30 bg-transparent'
              }`}>
                {isMainSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              {currentProductImage && (
                <img 
                  src={getThumbnailUrl(currentProductImage, 100)} 
                  alt="" 
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-12 object-cover rounded bg-stone-900 shrink-0 border border-white/10" 
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-stone-200 truncate font-Jost">
                  {currentProductName || 'Current Selected Item'} <span className="text-[10px] text-amber-400 font-mono font-normal">(This Item)</span>
                </p>
                <p className="text-xs font-mono text-amber-300 mt-0.5">
                  {formatPrice(currentProductPrice)}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.slice(0, 2).map((item) => {
              const isChecked = selectedBundleIds.includes(item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => handleToggleBundleItem(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                    isChecked 
                      ? 'bg-white/5 border-amber-400/40 text-stone-100 shadow-sm'
                      : 'bg-white/[0.02] border-white/5 text-stone-400 hover:border-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked ? 'bg-amber-400 border-amber-400 text-black' : 'border-white/30 bg-transparent'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <img 
                    src={getThumbnailUrl(item.image, 100)} 
                    alt="" 
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-12 object-cover rounded bg-stone-900 shrink-0 border border-white/10" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate font-Jost">{item.name}</p>
                    <p className="text-xs font-mono text-amber-300 mt-0.5">{formatPrice(item.price)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bundle Summary Card */}
          <div className="p-5 bg-black/50 rounded-xl border border-white/10 text-center flex flex-col justify-center space-y-4">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-stone-400 uppercase block">
                Total Price for Set
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xl font-mono font-bold text-amber-300">
                  {formatPrice(finalBundlePrice)}
                </span>
                {bundleSavings > 0 && (
                  <span className="text-xs font-mono line-through text-stone-500">
                    {formatPrice(bundleTotal)}
                  </span>
                )}
              </div>
              {bundleSavings > 0 && (
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded-full border border-emerald-500/30">
                  Save {formatPrice(bundleSavings)} (10% Off)
                </span>
              )}
            </div>

            <button
              onClick={handleAddBundleToCart}
              disabled={totalSelectedCount === 0 || isAddingBundle}
              className={`w-full py-3 px-4 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-lg cursor-pointer ${
                bundleSuccess 
                  ? 'bg-emerald-400 text-black shadow-emerald-400/20'
                  : totalSelectedCount === 0
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-white/5'
                  : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/10'
              }`}
            >
              {isAddingBundle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Adding to Bag...
                </>
              ) : bundleSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Added to Bag!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  {totalSelectedCount === 0 ? 'Select Items to Add' : 'Add Selected to Bag'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mode 3: You May Also Like / Smart Recommendation Grid
  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-widest">Curated For You</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-Cinzel font-semibold uppercase tracking-wider text-stone-100">
              You May Also Like
            </h3>
          </div>
          <Link 
            to="/shop" 
            className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 group transition-colors"
          >
            Explore Catalog
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.slice(0, 6).map((product) => (
            <div 
              key={product.id}
              className="group bg-stone-900/60 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-400/40 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Product Media */}
              <div className="relative aspect-[4/5] bg-stone-950 overflow-hidden">
                <img 
                  src={getCardImageUrl(product.image, 500)} 
                  alt="" 
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-amber-400 text-black text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                    {product.badge}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    disabled={addedItems[product.id] === 'loading'}
                    className="w-full py-2.5 bg-white text-black hover:bg-amber-400 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95"
                  >
                    {addedItems[product.id] === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : addedItems[product.id] === 'success' ? (
                      <Check className="w-4 h-4 stroke-[3] text-emerald-800" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )}
                    {addedItems[product.id] === 'loading'
                      ? 'Adding...'
                      : addedItems[product.id] === 'success'
                      ? 'Added to Bag!'
                      : 'Quick Add to Bag'}
                  </button>
                </div>
              </div>

              {/* Product Information */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                    <span className="font-mono font-bold text-stone-200">{product.rating || 4.9}</span>
                    <span className="text-stone-500 text-[11px] font-mono">({product.reviewsCount || 42})</span>
                  </div>
                  <h4 className="text-sm font-semibold text-stone-100 font-Jost tracking-wide group-hover:text-amber-300 transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-stone-400 font-Jost mt-1 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-amber-300">
                    {formatPrice(product.price)}
                  </span>
                  <Link
                    to={`/product/${product.id}`}
                    className="text-xs font-mono text-stone-400 hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SmartProductSuggestions;

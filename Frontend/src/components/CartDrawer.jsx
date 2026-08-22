import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, Plus, Minus, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import SmartProductSuggestions from './SmartProductSuggestions';
import { getThumbnailUrl } from '../utils/imageUtils';

const CartDrawer = () => {
  const {
    isCartOpen,
    closeCart,
    cart,
    cartCount,
    isCartLoading,
    isUpdatingItem,
    updateQuantity,
    removeItem,
    clearCart,
    currency,
    exchangeRate,
  } = useCart();

  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  // Format price helper
  const formatPrice = (amount) => {
    const numericAmount = Number(amount) || 0;
    if (currency === 'USD') {
      const converted = numericAmount / (exchangeRate || 1529.26);
      return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₦${numericAmount.toLocaleString('en-NG')}`;
  };

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    closeCart();
    navigate('/cart');
  };

  const handleShopClick = () => {
    closeCart();
    navigate('/shop');
  };

  // Check if brief minimum condition blocks checkout
  const isCheckoutBlocked = Boolean(cart.warning);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-full sm:max-w-md bg-white text-stone-900 shadow-2xl flex flex-col border-l border-stone-200 animate-slideLeft transition-all duration-300"
          style={{
            backgroundColor: '#ffffff',
          }}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-Cinzel tracking-wider font-semibold uppercase text-stone-900">
                Shopping Bag
              </h2>
              <span className="bg-stone-100 text-stone-800 text-xs px-2.5 py-0.5 rounded-full font-mono border border-stone-200">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning Banner (Brief requirement, stock, etc.) */}
          {cart.warning && (
            <div className="bg-amber-50 border-b border-amber-200 p-3.5 px-4 sm:px-5 flex items-start gap-3 text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-Jost font-medium">{cart.warning}</div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-white">
            {isCartLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-stone-500">
                <Loader2 className="w-7 h-7 animate-spin text-stone-900" />
                <p className="text-xs uppercase tracking-widest font-mono text-stone-600">Updating Bag...</p>
              </div>
            ) : cart.items.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 mb-1">
                  <ShoppingBag className="w-8 h-8 stroke-1 text-stone-700" />
                </div>
                <h3 className="text-base font-Cinzel tracking-wide text-stone-900 uppercase font-semibold">
                  Your Bag is Empty
                </h3>
                <p className="text-xs text-stone-500 max-w-xs font-Jost leading-relaxed">
                  Discover our exclusive luxury collection and find your perfect fit.
                </p>
                <button
                  onClick={handleShopClick}
                  className="mt-4 px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-all duration-300 shadow-md flex items-center gap-2 group cursor-pointer active:scale-95"
                >
                  Explore Collection
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {cart.items.map((cartItem) => {
                  const isBundle = cartItem.product_type === 'bundle' || Boolean(cartItem.bundle_id);
                  const itemData = cartItem.item || {};
                  const productName = itemData.name || cartItem.name || (isBundle ? 'Exclusive Bundle' : 'Luxury Product');
                  const image = itemData.image || cartItem.image || (itemData.images && itemData.images[0]) || 'https://via.placeholder.com/150';
                  const unitPrice = Number(cartItem.price) || Number(itemData.price) || 0;
                  const itemTotal = unitPrice * cartItem.quantity;
                  const isUpdating = isUpdatingItem === cartItem.id;

                  return (
                    <div
                      key={cartItem.id}
                      className="bg-stone-50/90 border border-stone-200 rounded-xl p-3 sm:p-3.5 flex gap-3.5 hover:border-stone-300 transition-all duration-200 group relative shadow-xs"
                    >
                      {/* Image */}
                      <div className="w-20 h-24 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200 relative">
                        <img
                          src={getThumbnailUrl(image, 160)}
                          alt={productName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {cartItem.is_preorder && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded tracking-tighter uppercase shadow-xs">
                            Pre-order
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-stone-900 truncate tracking-wide font-Jost">
                              {productName}
                            </h4>
                            <button
                              onClick={() => removeItem(cartItem.id)}
                              className="text-stone-400 hover:text-red-600 p-1.5 -mr-1 rounded-full hover:bg-stone-200/50 transition-colors touch-manipulation cursor-pointer"
                              title="Remove item"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Product Options */}
                          <div className="mt-1 space-y-0.5 text-[11px] text-stone-600 font-Jost">
                            {itemData.color && (
                              <p>
                                <span className="text-stone-500 font-medium">Color:</span> {itemData.color}
                              </p>
                            )}
                            {itemData.size && (
                              <p>
                                <span className="text-stone-500 font-medium">Size:</span> {itemData.size}
                              </p>
                            )}

                            {/* Bundle items list */}
                            {isBundle && itemData.items && Array.isArray(itemData.items) && (
                              <div className="mt-1.5 bg-white p-2 rounded border border-stone-200 space-y-0.5 shadow-2xs">
                                <span className="text-[10px] text-stone-900 font-mono font-bold uppercase tracking-wider block">
                                  Bundle Contents:
                                </span>
                                {itemData.items.map((bItem, bIdx) => (
                                  <div key={bIdx} className="text-[10px] text-stone-600 truncate">
                                    • {bItem.color_name || bItem.color || 'Color'} ({bItem.size_name || bItem.size || 'Size'})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-stone-300 bg-white rounded-lg overflow-hidden shadow-2xs">
                            <button
                              onClick={() => updateQuantity(cartItem.id, Math.max(1, cartItem.quantity - 1))}
                              disabled={isUpdating || cartItem.quantity <= 1}
                              className="p-2 sm:p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors touch-manipulation cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-mono text-stone-900 font-semibold min-w-[24px] text-center">
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto text-stone-900" /> : cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                              disabled={isUpdating}
                              className="p-2 sm:p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors touch-manipulation cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <span className="text-xs font-bold text-stone-900 font-mono">
                              {formatPrice(itemTotal)}
                            </span>
                            {cartItem.quantity > 1 && (
                              <span className="block text-[10px] text-stone-500 font-mono">
                                ({formatPrice(unitPrice)} each)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Smart Product Recommendations inside Bag */}
                <SmartProductSuggestions type="cart-drawer" className="mt-6" />
              </div>
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cart.items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/90 space-y-4 sticky bottom-0 z-10 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
              {/* Summary lines */}
              <div className="space-y-1.5 text-xs font-Jost">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="text-stone-900 font-mono font-medium">{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.tax > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Tax (5%)</span>
                    <span className="text-stone-900 font-mono font-medium">{formatPrice(cart.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-stone-900 pt-2 border-t border-stone-200">
                  <span className="font-Cinzel tracking-wider font-bold">ESTIMATED TOTAL</span>
                  <span className="text-stone-900 font-mono text-base font-bold">{formatPrice(cart.total)}</span>
                </div>
                <p className="text-[10px] text-stone-500 text-center pt-0.5 font-mono">
                  Taxes & shipping calculated at checkout
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckoutClick}
                  disabled={isCheckoutBlocked}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-md active:scale-[0.99] touch-manipulation cursor-pointer min-h-[46px] ${
                    isCheckoutBlocked
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300 shadow-none'
                      : 'bg-stone-900 hover:bg-black text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleViewCartClick}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-[11px] uppercase tracking-wider font-semibold transition-all text-center touch-manipulation cursor-pointer active:scale-95 min-h-[42px]"
                  >
                    View Bag Details
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-red-50 border border-stone-300 hover:border-red-300 text-stone-600 hover:text-red-600 text-[11px] uppercase tracking-wider font-semibold transition-all text-center touch-manipulation cursor-pointer active:scale-95 min-h-[42px]"
                  >
                    Clear Bag
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;

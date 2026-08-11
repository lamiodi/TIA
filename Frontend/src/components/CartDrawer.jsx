import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, Plus, Minus, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-stone-950 text-stone-100 shadow-2xl flex flex-col border-l border-white/10 animate-slideLeft"
          style={{
            background: 'linear-gradient(180deg, rgba(18, 18, 18, 0.98) 0%, rgba(10, 10, 10, 0.99) 100%)',
          }}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-Cinzel tracking-wider font-semibold uppercase text-stone-100">
                SHOPPING BAG
              </h2>
              <span className="bg-white/10 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-mono">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning Banner (Brief requirement, stock, etc.) */}
          {cart.warning && (
            <div className="bg-amber-950/70 border-b border-amber-500/30 p-3.5 px-5 flex items-start gap-3 text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-Jost">{cart.warning}</div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {isCartLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-stone-400">
                <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                <p className="text-xs uppercase tracking-widest font-mono">Updating Bag...</p>
              </div>
            ) : cart.items.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 mb-2">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="text-base font-Cinzel tracking-wide text-stone-200 uppercase">Your Bag is Empty</h3>
                <p className="text-xs text-stone-400 max-w-xs font-Jost">
                  Discover our exclusive luxury collection and find your perfect fit.
                </p>
                <button
                  onClick={handleShopClick}
                  className="mt-4 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold uppercase tracking-widest rounded-full transition-all duration-300 shadow-lg shadow-amber-400/10 flex items-center gap-2 group"
                >
                  Explore Collection
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
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
                      className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 flex gap-3.5 hover:border-white/20 transition-all duration-200 group relative"
                    >
                      {/* Image */}
                      <div className="w-20 h-24 bg-stone-900 rounded-lg overflow-hidden shrink-0 border border-white/5 relative">
                        <img
                          src={image}
                          alt={productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {cartItem.is_preorder && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded tracking-tighter uppercase">
                            Pre-order
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-medium text-stone-100 truncate tracking-wide font-Jost">
                              {productName}
                            </h4>
                            <button
                              onClick={() => removeItem(cartItem.id)}
                              className="text-stone-500 hover:text-red-400 p-1 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Product Options */}
                          <div className="mt-1 space-y-0.5 text-[11px] text-stone-400 font-Jost">
                            {itemData.color && (
                              <p>
                                <span className="text-stone-500">Color:</span> {itemData.color}
                              </p>
                            )}
                            {itemData.size && (
                              <p>
                                <span className="text-stone-500">Size:</span> {itemData.size}
                              </p>
                            )}

                            {/* Bundle items list */}
                            {isBundle && itemData.items && Array.isArray(itemData.items) && (
                              <div className="mt-1.5 bg-black/30 p-1.5 rounded border border-white/5 space-y-0.5">
                                <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider block">
                                  Bundle Contents:
                                </span>
                                {itemData.items.map((bItem, bIdx) => (
                                  <div key={bIdx} className="text-[10px] text-stone-300 truncate">
                                    • {bItem.color_name || bItem.color || 'Color'} ({bItem.size_name || bItem.size || 'Size'})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="mt-3 flex items-center justify-between">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-white/15 bg-black/40 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(cartItem.id, Math.max(1, cartItem.quantity - 1))}
                              disabled={isUpdating || cartItem.quantity <= 1}
                              className="p-1.5 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:text-stone-400 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-mono text-stone-200 min-w-[20px] text-center">
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto text-amber-400" /> : cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                              disabled={isUpdating}
                              className="p-1.5 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:text-stone-400 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <span className="text-xs font-semibold text-amber-300 font-mono">
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
              </div>
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cart.items.length > 0 && (
            <div className="p-5 border-t border-white/10 bg-black/60 space-y-4">
              {/* Summary lines */}
              <div className="space-y-1.5 text-xs font-Jost">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span className="text-stone-200 font-mono">{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.tax > 0 && (
                  <div className="flex justify-between text-stone-400">
                    <span>Tax (5%)</span>
                    <span className="text-stone-200 font-mono">{formatPrice(cart.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-stone-100 pt-2 border-t border-white/10">
                  <span className="font-Cinzel tracking-wider">ESTIMATED TOTAL</span>
                  <span className="text-amber-300 font-mono text-base">{formatPrice(cart.total)}</span>
                </div>
                <p className="text-[10px] text-stone-500 text-center pt-1 font-mono">
                  Taxes & shipping calculated at checkout
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckoutClick}
                  disabled={isCheckoutBlocked}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                    isCheckoutBlocked
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-white/5'
                      : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/10'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleViewCartClick}
                    className="w-full py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-[11px] uppercase tracking-wider font-semibold transition-all text-center"
                  >
                    View Bag Details
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full py-2.5 px-3 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-stone-400 hover:text-red-400 text-[11px] uppercase tracking-wider font-semibold transition-all text-center"
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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://tia-backend-r331.onrender.com/api'
  : '/api';

export const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const currencyContext = useContext(CurrencyContext) || {
    currency: 'NGN',
    exchangeRate: 1,
    country: 'Nigeria',
  };
  const { currency = 'NGN', exchangeRate = 1, country = 'Nigeria' } = currencyContext;

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [], warning: null });
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isUpdatingItem, setIsUpdatingItem] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  // Helper token decode
  const decodeToken = useCallback((token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }, []);

  const getToken = useCallback(() => {
    if (user && user.token) return user.token;
    return localStorage.getItem('token');
  }, [user]);

  const getUserId = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    const tokenData = decodeToken(token);
    return tokenData?.id;
  }, [getToken, decodeToken]);

  // Helper to check brief item
  const isBriefItem = useCallback((item) => {
    if (!item || !item.item) return false;
    const name = (item.item.name || '').toLowerCase();
    const category = (item.item.category || '').toLowerCase();

    return (
      name.includes('brief') ||
      name.includes('boxer') ||
      name.includes('underwear') ||
      name.includes('trunk') ||
      name.includes('jordan') ||
      name.includes('micheal') ||
      name.includes('michael') ||
      category.includes('brief') ||
      category.includes('underwear') ||
      category.includes('intimates')
    );
  }, []);

  // Validate brief requirement (3 minimum unless mixed with gymwear)
  const validateBriefQuantity = useCallback(
    (cartItems) => {
      const briefItems = cartItems.filter(isBriefItem);
      const totalBriefQuantity = briefItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const nonBriefItems = cartItems.filter((item) => !isBriefItem(item));

      const hasGymwear = cartItems.some((item) =>
        item.item?.category && item.item.category.toLowerCase().includes('gymwear')
      );
      const hasSingleBrief = cartItems.some((item) => isBriefItem(item) && item.quantity === 1);
      const meetsMinimumCombination = hasGymwear && hasSingleBrief;
      const isGymwearOnlyCart = hasGymwear && briefItems.length === 0;

      const hasInsufficientBriefs =
        briefItems.length > 0 && totalBriefQuantity < 3 && !meetsMinimumCombination && !isGymwearOnlyCart;

      return {
        briefItems,
        totalBriefQuantity,
        hasInsufficientBriefs,
      };
    },
    [isBriefItem]
  );

  // Load guest cart
  const loadGuestCart = useCallback(() => {
    try {
      const guestCartStr = localStorage.getItem('guestCart');
      if (guestCartStr) {
        const parsed = JSON.parse(guestCartStr);
        const validation = validateBriefQuantity(parsed.items || []);
        let warning = null;
        if (validation.hasInsufficientBriefs) {
          const rem = 3 - validation.totalBriefQuantity;
          warning = `Minimum order quantity for briefs is 3 units. Please add ${rem} more brief${rem > 1 ? 's' : ''} to meet the requirement.`;
        }
        setCart({ ...parsed, warning });
        setIsGuest(true);
      } else {
        setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [], warning: null });
        setIsGuest(true);
      }
    } catch {
      setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [], warning: null });
      setIsGuest(true);
    } finally {
      setIsCartLoading(false);
    }
  }, [validateBriefQuantity]);

  // Save guest cart
  const saveGuestCart = useCallback((updatedCart) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(updatedCart));
    } catch (e) {
      console.error('Error saving guest cart:', e);
    }
  }, []);

  // Fetch cart (logged in or guest)
  const fetchCart = useCallback(async () => {
    const token = getToken();
    if (!token) {
      loadGuestCart();
      return;
    }

    try {
      const userId = getUserId();
      if (!userId) {
        loadGuestCart();
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/cart/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Country': country,
        },
      });

      if (res.status === 200 && res.data && Array.isArray(res.data.items)) {
        const validation = validateBriefQuantity(res.data.items);
        let warning = null;
        if (validation.hasInsufficientBriefs) {
          const rem = 3 - validation.totalBriefQuantity;
          warning = `Minimum order quantity for briefs is 3 units. Please add ${rem} more brief${rem > 1 ? 's' : ''} to meet the requirement.`;
        }
        setCart({ ...res.data, warning });
        setIsGuest(false);
      } else {
        loadGuestCart();
      }
    } catch {
      loadGuestCart();
    } finally {
      setIsCartLoading(false);
    }
  }, [getToken, getUserId, country, loadGuestCart, validateBriefQuantity]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Listen to custom events ('cartUpdated', 'openCartModal', 'storage')
  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCart();
    };

    const handleOpenCart = () => {
      fetchCart();
      setIsCartOpen(true);
    };

    window.addEventListener('cartUpdated', handleCartUpdated);
    window.addEventListener('openCartModal', handleOpenCart);
    window.addEventListener('storage', handleCartUpdated);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
      window.removeEventListener('openCartModal', handleOpenCart);
      window.removeEventListener('storage', handleCartUpdated);
    };
  }, [fetchCart]);

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId, newQuantity) => {
      if (newQuantity < 1 || isUpdatingItem === itemId) return;
      setIsUpdatingItem(itemId);

      try {
        if (isGuest) {
          const updatedItems = cart.items.map((item) =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          );
          const subtotal = updatedItems.reduce(
            (sum, item) => sum + item.quantity * (item.item?.price || item.price || 0),
            0
          );
          const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
          const total = subtotal + tax;

          const validation = validateBriefQuantity(updatedItems);
          let warning = null;
          if (validation.hasInsufficientBriefs) {
            const rem = 3 - validation.totalBriefQuantity;
            warning = `Minimum order quantity for briefs is 3 units. Please add ${rem} more brief${rem > 1 ? 's' : ''} to meet the requirement.`;
          }

          const updatedCart = { ...cart, items: updatedItems, subtotal, tax, total, warning };
          setCart(updatedCart);
          saveGuestCart(updatedCart);
          window.dispatchEvent(new Event('cartUpdated'));
          return;
        }

        // Authenticated user
        const token = getToken();
        if (!token) return;

        // Optimistic update
        setCart((prev) => {
          const updatedItems = prev.items.map((item) =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          );
          const subtotal = updatedItems.reduce(
            (sum, item) => sum + item.quantity * (item.item?.price || item.price || 0),
            0
          );
          const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
          const total = subtotal + tax;

          const validation = validateBriefQuantity(updatedItems);
          let warning = null;
          if (validation.hasInsufficientBriefs) {
            const rem = 3 - validation.totalBriefQuantity;
            warning = `Minimum order quantity for briefs is 3 units. Please add ${rem} more brief${rem > 1 ? 's' : ''} to meet the requirement.`;
          }

          return { ...prev, items: updatedItems, subtotal, tax, total, warning };
        });

        await axios.put(
          `${API_BASE_URL}/cart/${itemId}`,
          { quantity: newQuantity },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-User-Country': country,
            },
          }
        );

        fetchCart();
      } catch (err) {
        console.error('Failed to update quantity:', err);
        fetchCart();
      } finally {
        setIsUpdatingItem(null);
      }
    },
    [isGuest, cart, country, saveGuestCart, validateBriefQuantity, getToken, fetchCart, isUpdatingItem]
  );

  // Remove item
  const removeItem = useCallback(
    async (itemId) => {
      try {
        if (isGuest) {
          const remaining = cart.items.filter((item) => item.id !== itemId);
          const subtotal = remaining.reduce(
            (sum, item) => sum + item.quantity * (item.item?.price || item.price || 0),
            0
          );
          const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
          const total = subtotal + tax;

          const validation = validateBriefQuantity(remaining);
          let warning = null;
          if (validation.hasInsufficientBriefs) {
            const rem = 3 - validation.totalBriefQuantity;
            warning = `Minimum order quantity for briefs is 3 units. Please add ${rem} more brief${rem > 1 ? 's' : ''} to meet the requirement.`;
          }

          const updatedCart = { ...cart, items: remaining, subtotal, tax, total, warning };
          setCart(updatedCart);
          saveGuestCart(updatedCart);
          window.dispatchEvent(new Event('cartUpdated'));
          return;
        }

        const token = getToken();
        if (!token) return;

        setCart((prev) => {
          const remaining = prev.items.filter((item) => item.id !== itemId);
          const subtotal = remaining.reduce(
            (sum, item) => sum + item.quantity * (item.item?.price || item.price || 0),
            0
          );
          const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
          const total = subtotal + tax;

          const validation = validateBriefQuantity(remaining);
          let warning = null;
          if (validation.hasInsufficientBriefs) {
            const rem = 3 - validation.totalBriefQuantity;
            warning = `Minimum order quantity for briefs is 3 units. Please add ${rem} more brief${rem > 1 ? 's' : ''} to meet the requirement.`;
          }

          return { ...prev, items: remaining, subtotal, tax, total, warning };
        });

        await axios.delete(`${API_BASE_URL}/cart/${itemId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        fetchCart();
      } catch (err) {
        console.error('Failed to remove item:', err);
        fetchCart();
      }
    },
    [isGuest, cart, country, saveGuestCart, validateBriefQuantity, getToken, fetchCart]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      if (isGuest) {
        const emptyCart = { cartId: null, subtotal: 0, tax: 0, total: 0, items: [], warning: null };
        setCart(emptyCart);
        saveGuestCart(emptyCart);
        window.dispatchEvent(new Event('cartUpdated'));
        return;
      }

      const token = getToken();
      const userId = getUserId();
      if (!token || !userId) return;

      setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [], warning: null });

      try {
        await axios.delete(`${API_BASE_URL}/cart/clear/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        await axios.post(`${API_BASE_URL}/cart/clear/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      fetchCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
      fetchCart();
    }
  }, [isGuest, saveGuestCart, getToken, getUserId, fetchCart]);

  // Total item count across all lines
  const cartCount = cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <CartContext.Provider
      value={{
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        cart,
        cartCount,
        isCartLoading,
        isUpdatingItem,
        isGuest,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
        currency,
        exchangeRate,
        country,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

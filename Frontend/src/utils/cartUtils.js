// Cart utility functions for localStorage management

// Constants
const GUEST_CART_KEY = 'tia_guest_cart';

/**
 * Get the guest cart from localStorage
 * @returns {Object} The guest cart object or an empty cart if none exists
 */
export const getGuestCart = () => {
  try {
    const cartData = localStorage.getItem(GUEST_CART_KEY);
    if (!cartData) {
      return { items: [], total: 0 };
    }
    return JSON.parse(cartData);
  } catch (error) {
    console.error('Error getting guest cart:', error);
    return { items: [], total: 0 };
  }
};

/**
 * Save the guest cart to localStorage
 * @param {Object} cart - The cart object to save
 */
export const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

/**
 * Clear the guest cart from localStorage
 */
export const clearGuestCart = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Error clearing guest cart:', error);
  }
};

/**
 * Add an item to the guest cart
 * @param {Object} item - The item to add to the cart
 * @returns {Object} The updated cart
 */
export const addItemToGuestCart = (item) => {
  const cart = getGuestCart();
  
  // Check if the item is a bundle
  if (item.product_type === 'bundle') {
    // For bundles, check if the same bundle already exists
    const existingItemIndex = cart.items.findIndex(
      cartItem => cartItem.product_type === 'bundle' && cartItem.bundle_id === item.bundle_id
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if the bundle already exists
      cart.items[existingItemIndex].quantity += item.quantity || 1;
    } else {
      // Add new bundle to cart
      cart.items.push({
        ...item,
        quantity: item.quantity || 1,
        temp_id: Date.now() // Add a temporary ID for frontend tracking
      });
    }
  } else {
    // For single products, check if the same variant and size already exists
    const existingItemIndex = cart.items.findIndex(
      cartItem => cartItem.product_type === 'single' && 
                 cartItem.variant_id === item.variant_id && 
                 cartItem.size_id === item.size_id
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if the item already exists
      cart.items[existingItemIndex].quantity += item.quantity || 1;
    } else {
      // Add new item to cart
      cart.items.push({
        ...item,
        quantity: item.quantity || 1,
        temp_id: Date.now() // Add a temporary ID for frontend tracking
      });
    }
  }
  
  // Recalculate cart total
  cart.total = calculateCartTotal(cart.items);
  
  // Save updated cart
  saveGuestCart(cart);
  return cart;
};

/**
 * Update an item in the guest cart
 * @param {string|number} itemId - The ID of the item to update
 * @param {Object} updates - The updates to apply to the item
 * @returns {Object} The updated cart
 */
export const updateGuestCartItem = (itemId, updates) => {
  const cart = getGuestCart();
  
  const itemIndex = cart.items.findIndex(item => 
    item.temp_id === itemId || item.id === itemId
  );
  
  if (itemIndex >= 0) {
    cart.items[itemIndex] = {
      ...cart.items[itemIndex],
      ...updates
    };
    
    // Recalculate cart total
    cart.total = calculateCartTotal(cart.items);
    
    // Save updated cart
    saveGuestCart(cart);
  }
  
  return cart;
};

/**
 * Remove an item from the guest cart
 * @param {string|number} itemId - The ID of the item to remove
 * @returns {Object} The updated cart
 */
export const removeGuestCartItem = (itemId) => {
  const cart = getGuestCart();
  
  cart.items = cart.items.filter(item => 
    item.temp_id !== itemId && item.id !== itemId
  );
  
  // Recalculate cart total
  cart.total = calculateCartTotal(cart.items);
  
  // Save updated cart
  saveGuestCart(cart);
  return cart;
};

/**
 * Calculate the total price of the cart
 * @param {Array} items - The cart items
 * @returns {number} The total price
 */
export const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

/**
 * Format cart items for API submission
 * @param {Array} items - The cart items from localStorage
 * @returns {Array} Formatted cart items for the API
 */
export const formatCartItemsForApi = (items) => {
  return items.map(item => {
    if (item.product_type === 'bundle') {
      return {
        is_bundle: true,
        bundle_id: parseInt(item.bundle_id, 10),
        quantity: parseInt(item.quantity, 10),
        bundle_items: Array.isArray(item.items) ? item.items.map(bundleItem => ({
          variant_id: parseInt(bundleItem.variant_id, 10),
          size_id: parseInt(bundleItem.size_id, 10)
        })) : []
      };
    } else {
      return {
        is_bundle: false,
        variant_id: parseInt(item.variant_id, 10),
        size_id: parseInt(item.size_id, 10),
        quantity: parseInt(item.quantity, 10)
      };
    }
  });
};
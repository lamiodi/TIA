import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  updateCartItemPost,
  removeFromCart,
  clearCart,
  clearCartPost,
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart
} from '../controllers/cartController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get cart for a user
router.get('/:userId', authenticateToken, getCart);

// Get guest cart
router.get('/guest/:guestId', getGuestCart);

// Add item to cart (requires login)
router.post('/', authenticateToken, addToCart);

// Add item to guest cart
router.post('/guest', addToGuestCart);

// Update cart item quantity (requires login)
router.put('/:id', authenticateToken, updateCartItem);
router.post('/:id', authenticateToken, updateCartItemPost); // POST fallback

// Update guest cart item quantity
router.put('/guest/:id', updateGuestCartItem);

// Remove item from cart (requires login)
router.delete('/:id', authenticateToken, removeFromCart);

// Remove item from guest cart
router.delete('/guest/:id', removeGuestCartItem);

// Clear cart for a user (requires login)
router.delete('/clear/:userId', authenticateToken, clearCart);
router.post('/clear/:userId', authenticateToken, clearCartPost); // POST fallback

// Clear guest cart
router.delete('/guest/clear/:guestId', clearGuestCart);

export default router;
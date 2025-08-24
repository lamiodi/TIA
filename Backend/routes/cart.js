import express from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItem,
  updateCartItemPost,
  removeFromCart, 
  clearCart,
  clearCartPost
} from '../controllers/cartController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get cart for a user
router.get('/:userId', authenticateToken, getCart);

// Add item to cart (requires login)
router.post('/', authenticateToken, addToCart);

// Update cart item quantity (requires login)
router.put('/:id', authenticateToken, updateCartItem);
router.post('/:id', authenticateToken, updateCartItemPost); // POST fallback

// Remove item from cart (requires login)
router.delete('/:id', authenticateToken, removeFromCart);

// Clear cart for a user (requires login)
router.delete('/clear/:userId', authenticateToken, clearCart);
router.post('/clear/:userId', authenticateToken, clearCartPost); // POST fallback

export default router;
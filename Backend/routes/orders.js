import express from 'express';
import {
  createOrder,
  verifyOrderByReference,
  cancelOrder,
  getOrdersByUser,
  getOrderById,
  getGuestOrderById
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/verify/:reference', verifyOrderByReference);
router.delete('/:orderId', cancelOrder);
router.get('/user/:userId', authenticateToken, getOrdersByUser);
router.get('/guest/:id', getGuestOrderById); // New route for guest orders
router.get('/:id', authenticateToken, getOrderById);

export default router;
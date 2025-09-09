import express from 'express';
import {
  createOrder,
  verifyOrderByReference,
  cancelOrder,
  getOrdersByUser,
  getOrderById,
  guestOrderLookup
} from '../controllers/orderController.js';
const router = express.Router();
router.post('/', createOrder);
router.get('/verify/:reference', verifyOrderByReference); 
router.post('/guest-lookup', guestOrderLookup);
router.delete('/:orderId', cancelOrder);
router.get('/user/:userId', getOrdersByUser);
router.get('/:id', getOrderById);
export default router;
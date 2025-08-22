import express from 'express';
import {
  createDiscount,
  getDiscounts,
  updateDiscount,
  deleteDiscount,
  validateCoupon
} from '../controllers/adminDiscountController.js';
import { 
  getAllUsersForAdmin, 
  getUserAddresses, 
  getUserOrders, 
  getAllOrdersForAdmin, 
  updateOrderStatus, 
  setDeliveryFee,
  getOrderItemsForAdmin,
  getOrderBundleItemsForAdmin,
  getOrderShippingAddress,
  getOrderBillingAddress,
  getCompleteOrderDetails, 
  deleteOrder,
  getAnalyticsData,

} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.get('/analytics', authenticateToken, requireAdmin, getAnalyticsData);
router.get('/users', authenticateToken, requireAdmin, getAllUsersForAdmin); // Get all users for admin
router.get('/addresses/user/:userId', authenticateToken, requireAdmin, getUserAddresses); // Get all addresses for a specific user
router.get('/orders/user/:userId', authenticateToken, requireAdmin, getUserOrders); // Get all orders for a specific user
router.get('/orders', authenticateToken, requireAdmin, getAllOrdersForAdmin); // Get all orders for admin
router.get('/orders/complete/:orderId', getCompleteOrderDetails); // Get complete order details
router.get('/orders/:orderId/items', authenticateToken, requireAdmin, getOrderItemsForAdmin); // Get order items for admin
router.get('/orders/:orderId/bundle-items', authenticateToken, requireAdmin, getOrderBundleItemsForAdmin); // Get order bundle items for admin 
router.get('/orders/:orderId/shipping-address', authenticateToken, requireAdmin, getOrderShippingAddress); // Get order shipping address for admin
router.get('/orders/:orderId/billing-address', authenticateToken, requireAdmin, getOrderBillingAddress); // Get order billing address for admin
router.put('/orders/:orderId/status', authenticateToken, requireAdmin, updateOrderStatus); // Update order status
router.delete('/orders/:orderId', authenticateToken, requireAdmin, deleteOrder); // Delete an order by ID
// Add this route to your adminRoutes.js
router.put('/orders/:orderId/delivery-fee', authenticateToken, requireAdmin, setDeliveryFee);


// Discount management routes
router.post('/discounts', authenticateToken, requireAdmin, createDiscount);
router.get('/discounts', authenticateToken, requireAdmin, getDiscounts);
router.put('/discounts/:id', authenticateToken, requireAdmin, updateDiscount);
router.delete('/discounts/:id', authenticateToken, requireAdmin, deleteDiscount);
// Public route for coupon validation (no admin required)
router.post('/discounts/validate', validateCoupon);




export default router;
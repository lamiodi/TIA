import express from 'express';
import { getUserProfile, updateUserProfile, getUserOrders, updateUserPassword } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// User profile routes
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);
router.get('/orders', authenticateToken, getUserOrders);
router.put('/password', authenticateToken, updateUserPassword);

export default router;
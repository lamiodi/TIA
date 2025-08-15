import express from 'express';
import { initializePayment, verifyPayment } from '../controllers/paystackController.js';

const router = express.Router();

// Initialize payment
router.post('/initialize', initializePayment);

// Verify payment (callback from Paystack)
router.get('/verify', verifyPayment);

export default router;
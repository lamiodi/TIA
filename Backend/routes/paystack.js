import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { initializePayment, verifyPayment, initializeDeliveryFeePayment, verifyDeliveryFeePayment, } from '../controllers/paystackController.js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Validate environment configuration
if (!PAYSTACK_SECRET_KEY) {
  console.error('CRITICAL: PAYSTACK_SECRET_KEY environment variable is not set');
  throw new Error('Paystack secret key not configured - check environment variables');
}

const router = express.Router();

// Initialize payment
router.post('/initialize', initializePayment);

// Verify payment (callback from Paystack)
router.get('/verify', verifyPayment);


// New delivery fee routes
router.post('/delivery-fee/initialize', initializeDeliveryFeePayment);
router.get('/delivery-fee/verify', verifyDeliveryFeePayment);
router.post('/delivery-fee/verify', verifyDeliveryFeePayment);

export default router;
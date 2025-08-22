import express from 'express';
import { initializePayment, verifyPayment, initializeDeliveryFeePayment, verifyDeliveryFeePayment, } from '../controllers/paystackController.js';

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
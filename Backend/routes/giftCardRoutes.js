
import express from 'express';
import { purchaseGiftCard, verifyGiftCardPayment, downloadReceipt } from '../controllers/giftCardController.js';

const router = express.Router();

router.post('/purchase', purchaseGiftCard);
router.get('/verify', verifyGiftCardPayment);
router.get('/receipt/:reference', downloadReceipt);

export default router;

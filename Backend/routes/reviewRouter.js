import express from 'express';
import { getReviewsByProductId, submitReview, voteReview } from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import upload from '../utils/multer.js';

const router = express.Router();

// Configure multer with additional validations
const uploadWithValidation = upload.array('images', 3); // Max 3 images

// Middleware to validate file types and sizes
const validateImages = (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();
  const filetypes = /jpeg|jpg|png/;
  const maxSize = 9 * 1024 * 1024; // 9MB
  for (const file of req.files) {
    const mimetype = filetypes.test(file.mimetype);
    if (!mimetype) {
      return res.status(400).json({ error: 'Only JPEG and PNG images are allowed' });
    }
    if (file.size > maxSize) {
      return res.status(400).json({ error: 'Each image must be less than 9MB' });
    }
  }
  next();
};

// Get reviews for a product (no authentication required)
router.get('/', getReviewsByProductId);

// Submit a new review (authenticated, with up to 3 images)
router.post('/', authenticateToken, uploadWithValidation, validateImages, submitReview);

// Vote on a review (authenticated)
router.post('/:id/vote', authenticateToken, voteReview);

export default router;
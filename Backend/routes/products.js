 // Backend/routes/products.js
   import express from 'express';
   import { getProductById, uploadProduct, getSiblingBundle } from '../controllers/productController.js';
   import upload from '../utils/multer.js';
   import { cacheMiddleware, invalidateCache } from '../utils/apiCache.js';

   const router = express.Router();

   const multiFieldUpload = upload.fields([
     { name: 'images_0', maxCount: 5 },
     { name: 'images_1', maxCount: 5 },
     { name: 'images_2', maxCount: 5 },
     { name: 'images_3', maxCount: 5 },
     { name: 'images_4', maxCount: 5 },
   ]);

   router.get('/:id', cacheMiddleware(60), getProductById);
   router.get('/:id/sibling-bundle', cacheMiddleware(60), getSiblingBundle);
   router.post('/', multiFieldUpload, (req, res, next) => {
     invalidateCache(); // Clear product cache on upload
     next();
   }, uploadProduct);

   export default router;

   
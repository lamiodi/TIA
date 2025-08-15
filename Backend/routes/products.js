 // Backend/routes/products.js
   import express from 'express';
   import { getProductById, uploadProduct } from '../controllers/productController.js';
   import upload from '../utils/multer.js';

   const router = express.Router();

   const multiFieldUpload = upload.fields([
     { name: 'images_0', maxCount: 5 },
     { name: 'images_1', maxCount: 5 },
     { name: 'images_2', maxCount: 5 },
     { name: 'images_3', maxCount: 5 },
     { name: 'images_4', maxCount: 5 },
   ]);

   router.get('/:id', getProductById);
   router.post('/', multiFieldUpload, uploadProduct);

   export default router;
   
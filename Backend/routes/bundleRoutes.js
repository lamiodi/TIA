// Backend/routes/bundleRoutes.js
import express from 'express';
import { createBundle, getSkuPrefixes, getProducts } from '../controllers/bundleController.js';
import upload from '../utils/multer.js';

const router = express.Router();

router.post('/',  upload.array('images', 5), createBundle);
router.get('/sku-prefixes',  getSkuPrefixes);
router.get('/products', getProducts);

export default router;

// routes/shopallRoutes.js
import express from 'express';
import { getShopAll } from '../controllers/shop/getShopAll.js';
import { searchProducts } from '../controllers/shop/searchController.js'; // Import from new controller
const router = express.Router();

router.get('/', getShopAll);
router.get('/search', searchProducts); // New search route using separate controller

export default router;
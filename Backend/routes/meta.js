// routes/metaRoutes.js
import express from 'express';
import { getSizes, getColors } from '../controllers/metaController.js';

const router = express.Router();

router.get('/sizes', getSizes);
router.get('/colors', getColors);

export default router;

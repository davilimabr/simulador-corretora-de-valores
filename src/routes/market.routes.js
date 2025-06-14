import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { clockTick, addWatch, removeWatch, moveWatch, listWatch } from '../controllers/marketController.js';

const router = Router();
router.post('/clock', authMiddleware, clockTick);
router.post('/watchlist', authMiddleware, addWatch);
router.delete('/watchlist/:ticker', authMiddleware, removeWatch);
router.put('/watchlist/:ticker/move', authMiddleware, moveWatch);
router.get('/watchlist', authMiddleware, listWatch);
export default router;

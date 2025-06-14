import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { listarCarteira } from '../controllers/walletController.js';

const router = Router();
router.get('/', authMiddleware, listarCarteira);
export default router;

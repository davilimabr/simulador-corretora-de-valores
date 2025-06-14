import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { deposito, retirada, extrato } from '../controllers/accountController.js';

const router = Router();
router.post('/deposit', authMiddleware, deposito);
router.post('/withdraw', authMiddleware, retirada);
router.get('/statement', authMiddleware, extrato);
export default router;

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import marketRoutes from './market.routes.js';
import ordersRoutes from './orders.routes.js';
import walletRoutes from './wallet.routes.js';
import accountRoutes from './account.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/market', marketRoutes);
router.use('/orders', ordersRoutes);
router.use('/wallet', walletRoutes);
router.use('/account', accountRoutes);
export default router;

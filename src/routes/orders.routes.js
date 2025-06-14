import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { registrarCompra, executarCompra, listarCompras, registrarVenda, executarVenda, listarVendas } from '../controllers/ordersController.js';

const router = Router();
// compras
router.post('/buy', authMiddleware, registrarCompra);
router.post('/buy/:orderId/execute', authMiddleware, executarCompra);
router.get('/buy', authMiddleware, listarCompras);
// vendas
router.post('/sell', authMiddleware, registrarVenda);
router.post('/sell/:orderId/execute', authMiddleware, executarVenda);
router.get('/sell', authMiddleware, listarVendas);
export default router;

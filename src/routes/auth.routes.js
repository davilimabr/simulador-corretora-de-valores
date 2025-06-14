import { Router } from 'express';
import { register, login, logout, requestResetToken, resetPassword, changePassword } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/pwd-token', requestResetToken);
router.post('/reset-password', resetPassword);
router.post('/change-password', authMiddleware, changePassword);
export default router;

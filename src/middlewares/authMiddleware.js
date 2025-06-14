import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Usuario } from '../models/index.js';

dotenv.config();

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Usuario.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'Usuário inválido' });
    req.user = user; // anexa usuário à request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Usuario, AcaoInteresse } from '../models/index.js';
import sequelize from '../config/database.js';
import { getRandomTickers } from '../utils/tickersValidos.js';
import { isValidEmail, isStrongPassword } from '../utils/fieldsValidators.js';

dotenv.config();

export async function register(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Formato de email inválido.' });
  if (!isStrongPassword(senha)) return res.status(400).json({
      error: 'A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.'
    });
  const t = await sequelize.transaction();
  try {
    const existing = await Usuario.findOne({ where: { email }, transaction: t });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const user = await Usuario.create({ email, senhaHash }, { transaction: t });
    
    const randomTickers = getRandomTickers();
    const acoesInteresse = randomTickers.map((ticker, index) => ({
      usuarioId: user.id,
      ticker: ticker,
      ordem: index + 1,
    }));
    await AcaoInteresse.bulkCreate(acoesInteresse, { transaction: t });
    await t.commit();

    return res.status(201).json({ userId: user.id, message: 'Conta criada com sucesso' });
  } catch (err) {
    await t.rollback();
    console.error('Erro no registro de novo usuário:', err);
    return res.status(500).json({ error: 'Erro interno no servidor ao tentar registrar.' });
  }
}

export async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  const user = await Usuario.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  const match = await bcrypt.compare(senha, user.senhaHash);
  if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token, userId: user.id, ultimaHoraNegociacao: user.ultimaHoraNegociacao });
}

export function logout(_req, res) {
  return res.json({ message: 'Logout realizado com sucesso' });
}

export async function requestResetToken(req, res) {
  const { email } = req.body;
  const user = await Usuario.findOne({ where: { email } });
  if (user) {
    user.tokenRecSenha = Math.random().toString(36).substring(2, 10);
    user.dataTokenRS = new Date();
    await user.save();
    console.log(`Token para reset de senha (envio simulado): ${user.tokenRecSenha}`);
  }
  return res.json({ message: 'Se o email estiver registrado, você receberá instruções.' });
}

export async function resetPassword(req, res) {
  const { tokenRecSenha, novaSenha } = req.body;
  if (!tokenRecSenha || !novaSenha) return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
  if (!isStrongPassword(novaSenha)) return res.status(400).json({
    error: 'A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.'
  });
  const user = await Usuario.findOne({ where: { tokenRecSenha } });
  if (!user) return res.status(400).json({ error: 'Token inválido ou expirado' });
  const diff = (Date.now() - new Date(user.dataTokenRS).getTime()) / 1000 / 60; // minutos
  if (diff > 60) return res.status(400).json({ error: 'Token expirado' });
  user.senhaHash = await bcrypt.hash(novaSenha, 10);
  user.tokenRecSenha = null;
  await user.save();
  return res.json({ message: 'Senha redefinida com sucesso' });
}

export async function changePassword(req, res) {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha) return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  if (!isStrongPassword(novaSenha)) return res.status(400).json({
    error: 'A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.'
  });
  const user = req.user;
  const match = await bcrypt.compare(senhaAtual, user.senhaHash);
  if (!match) return res.status(400).json({ error: 'Senha atual incorreta' });
  user.senhaHash = await bcrypt.hash(novaSenha, 10);
  await user.save();
  return res.json({ message: 'Senha alterada com sucesso' });
}

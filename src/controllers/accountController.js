import { ContaCorrente } from '../models/index.js';

export async function deposito(req, res) {
  const { descricao, valor } = req.body;
  if (typeof valor !== 'number' || valor <= 0 || isNaN(valor)) return res.status(400).json({ error: 'Valor inválido' });
  const ult = await ContaCorrente.findOne({ where: { usuarioId: req.user.id }, order: [['dataHora','DESC']] });
  const saldoAtual = parseFloat(ult?.saldoApos ?? 0);
  const novoSaldo = saldoAtual + valor;
  const lanc = await ContaCorrente.create({ usuarioId: req.user.id, dataHora: new Date(), descricao, tipo: 'deposito', valor, saldoApos: novoSaldo });
  res.json({ lancamentoId: lanc.id, ...lanc.toJSON(), message: 'Depósito registrado com sucesso' });
}

export async function retirada(req, res) {
  const { descricao, valor } = req.body;
  if (typeof valor !== 'number' || valor <= 0 || isNaN(valor)) return res.status(400).json({ error: 'Valor inválido' });
  const ult = await ContaCorrente.findOne({ where: { usuarioId: req.user.id }, order: [['dataHora','DESC']] });
  const saldoAtual = parseFloat(ult?.saldoApos ?? 0);
  if (saldoAtual < valor) return res.status(400).json({ error: 'Saldo insuficiente' });
  const novoSaldo = saldoAtual - valor;
  const lanc = await ContaCorrente.create({ usuarioId: req.user.id, dataHora: new Date(), descricao, tipo: 'retirada', valor, saldoApos: novoSaldo });
  res.json({ lancamentoId: lanc.id, ...lanc.toJSON(), message: 'Retirada registrada com sucesso' });
}

export async function extrato(req, res) {
  const lancs = await ContaCorrente.findAll({ where: { usuarioId: req.user.id }, order: [['dataHora','ASC']] });
  res.json(lancs);
}

import { OrdemCompra, OrdemVenda, CarteiraItem } from '../models/index.js';
import { executePendingOrders } from '../services/orderExecutionService.js';
import { loadMarketSnapshot } from '../services/priceService.js';

export async function registrarCompra(req, res) {
  const { ticker, quantidade, modo, precoReferencia } = req.body;
  if (quantidade <= 0) return res.status(400).json({ error: 'Quantidade inválida' });
  const ordem = await OrdemCompra.create({ usuarioId: req.user.id, ticker, quantidade, modo, precoReferencia: modo==='mercado'?null:precoReferencia });
  if (modo === 'mercado') {
    const minute = parseInt(req.user.ultimaHoraNegociacao.split(':')[1], 10);
    const market = await loadMarketSnapshot(minute);
    await executePendingOrders(req.user.id, market);
    await ordem.reload();
    return res.status(201).json(ordem);
  }
  return res.status(201).json({ ...ordem.toJSON(), message: 'Ordem de compra registrada' });
}

export async function executarCompra(req, res) {
  const { orderId } = req.params;
  const id = parseInt(orderId, 10);
  const ordem = await OrdemCompra.findOne({ where: { id, usuarioId: req.user.id, status: 'pendente' } });
  if (!ordem) return res.status(404).json({ error: 'Ordem não encontrada' });
  const minute = parseInt(req.user.ultimaHoraNegociacao.split(':')[1], 10);
  const market = await loadMarketSnapshot(minute);
  await executePendingOrders(req.user.id, market);
  await ordem.reload();
  return res.json(ordem);
}

export async function listarCompras(req, res) {
  const { status } = req.query;
  const where = { usuarioId: req.user.id };
  if (status && status !== 'todas') where.status = status;
  const ordens = await OrdemCompra.findAll({ where, order: [['createdAt','DESC']] });
  res.json(ordens);
}

export async function registrarVenda(req, res) {
  const { ticker, quantidade, modo, precoReferencia } = req.body;
  if (quantidade <= 0) return res.status(400).json({ error: 'Quantidade inválida' });
  const itemCarteira = await CarteiraItem.findOne({ where: { usuarioId: req.user.id, ticker } });
  if (!itemCarteira || itemCarteira.quantidade < quantidade) {
    return res.status(400).json({ error: "Quantidade de ações na carteira insuficiente para essa ordem." });
  }
  const ordem = await OrdemVenda.create({ usuarioId: req.user.id, ticker, quantidade, modo, precoReferencia: modo==='mercado'?null:precoReferencia });
  if (modo === 'mercado') {
    const minute = parseInt(req.user.ultimaHoraNegociacao.split(':')[1], 10);
    const market = await loadMarketSnapshot(minute);
    await executePendingOrders(req.user.id, market);
    await ordem.reload();
    return res.status(201).json(ordem);
  }
  return res.status(201).json({ ...ordem.toJSON(), message: 'Ordem de venda registrada' });
}

export async function executarVenda(req, res) {
  const { orderId } = req.params;
  const id = parseInt(orderId, 10);
  const ordem = await OrdemVenda.findOne({ where: { id, usuarioId: req.user.id, status: 'pendente' } });
  if (!ordem) return res.status(404).json({ error: 'Ordem não encontrada' });
  const minute = parseInt(req.user.ultimaHoraNegociacao.split(':')[1], 10);
  const market = await loadMarketSnapshot(minute);
  await executePendingOrders(req.user.id, market);
  await ordem.reload();
  return res.json(ordem);
}

export async function listarVendas(req, res) {
  const { status } = req.query;
  const where = { usuarioId: req.user.id };
  if (status && status !== 'todas') where.status = status;
  const ordens = await OrdemVenda.findAll({ where, order: [['createdAt','DESC']] });
  res.json(ordens);
}

import { OrdemCompra, OrdemVenda, CarteiraItem, ContaCorrente } from '../models/index.js';
import { executePendingOrders } from '../services/orderExecutionService.js';
import { loadMarketSnapshot } from '../services/priceService.js';
import { isTickerValido } from '../utils/tickersValidos.js';

async function getSaldoAtual(usuarioId) {
  const ultLanc = await ContaCorrente.findOne({
    where: { usuarioId },
    order: [['dataHora', 'DESC']],
  });
  return parseFloat(ultLanc?.saldoApos ?? 0);
}

export async function registrarCompra(req, res) {
  const { ticker, quantidade, modo, precoReferencia } = req.body;
  if (!isTickerValido(ticker)) return res.status(400).json({ error: `O ticker '${ticker}' não é válido.` });
  if (!ticker || !quantidade || !modo)  return res.status(400).json({ error: 'Ticker, quantidade e modo são obrigatórios.' });
  if (typeof quantidade !== 'number' || !Number.isInteger(quantidade) || quantidade <= 0) 
    return res.status(400).json({ error: 'A quantidade deve ser um número inteiro positivo.' });
  if (!['mercado', 'abaixo_de_preco'].includes(modo)) return res.status(400).json({ error: 'Modo inválido.' });
  if ((modo === 'abaixo_de_preco') && (typeof precoReferencia !== 'number' || precoReferencia <= 0))
    return res.status(400).json({ error: 'O preço de referência é obrigatório e deve ser positivo para o modo "abaixo_de_preco".' });
  
  try {
    const minute = parseInt(req.user.ultimaHoraNegociacao.split(':')[1], 10);
    const market = await loadMarketSnapshot(minute);
    const acaoNoMercado = market.find((m) => m.ticker === ticker);
    if (!acaoNoMercado) return res.status(404).json({ error: `O ticker '${ticker}' não foi encontrado no mercado.` });
    const saldoAtual = await getSaldoAtual(req.user.id);
    const precoAtual = acaoNoMercado.precoAtual;
    const valorEstimado = modo === 'mercado' ? quantidade * precoAtual : quantidade * precoReferencia;
    if (saldoAtual < valorEstimado) return res.status(400).json({ error: 'Saldo insuficiente para registrar a ordem de compra.' });
    const ordem = await OrdemCompra.create({ usuarioId: req.user.id, ticker, quantidade, modo, precoReferencia: modo==='mercado'?null:precoReferencia });
    if (modo === 'mercado') {
      await executePendingOrders(req.user.id, market);
      await ordem.reload();
      return res.status(201).json(ordem);
    }
    return res.status(201).json({ ...ordem.toJSON(), message: 'Ordem de compra registrada' });
  } catch (error) {
    console.error('Erro ao registrar ordem de compra:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
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
  if (!isTickerValido(ticker)) return res.status(400).json({ error: `O ticker '${ticker}' não é válido.` });
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

import { advanceClock } from '../services/clockService.js';
import { loadMarketSnapshot } from '../services/priceService.js';
import sequelize, { AcaoInteresse, Usuario } from '../models/index.js';
import { executePendingOrders } from '../services/orderExecutionService.js';
import { isTickerValido } from '../utils/tickersValidos.js';

export async function clockTick(req, res) {
  const inc = parseInt(req.body.incrementoMinutos || 1, 10);
  const user = req.user;
  user.ultimaHoraNegociacao = advanceClock(user.ultimaHoraNegociacao, inc);
  await user.save();
  const minute = parseInt(user.ultimaHoraNegociacao.split(':')[1], 10);
  const market = await loadMarketSnapshot(minute);
  await executePendingOrders(user.id, market);
  return res.json({ novaHoraNegociacao: user.ultimaHoraNegociacao, acoes: market });
}

export async function addWatch(req, res) {
  const { ticker } = req.body;
  if (!isTickerValido(ticker)) return res.status(400).json({ error: `O ticker '${ticker}' não é válido.` });
  const existing = await AcaoInteresse.findOne({ where: { usuarioId: req.user.id, ticker } });
  if (existing) return res.status(400).json({ error: 'Ação já está na lista' });
  const ordemMax = await AcaoInteresse.max('ordem', { where: { usuarioId: req.user.id } });
  const acao = await AcaoInteresse.create({ usuarioId: req.user.id, ticker, ordem: (ordemMax || 0) + 1 });
  return res.status(201).json({ id: acao.id, ticker: acao.ticker, message: 'Ação adicionada à lista' });
}

export async function removeWatch(req, res) {
  const { ticker } = req.params;
  if (!isTickerValido(ticker)) return res.status(400).json({ error: `O ticker '${ticker}' não é válido.` });
  const deleted = await AcaoInteresse.destroy({ where: { usuarioId: req.user.id, ticker } });
  if (!deleted) return res.status(404).json({ error: 'Ação não encontrada' });
  return res.json({ message: `Ação ${ticker} removida da lista` });
}

export async function moveWatch(req, res) {
  const { tickerA, tickerB } = req.body;
  const usuarioId = req.user.id;
  if (!isTickerValido(tickerA) || !isTickerValido(tickerB)) return res.status(400).json({ error: `Ticker(s) inválido(s)` });
  if ((!tickerA || !tickerB) || (tickerA === tickerB)) return res.status(200).json({ message: 'Não foi fornecido dois tickers ou são iguais, ordem mantida' });
  const t = await sequelize.transaction();
  try {
    const acaoA = await AcaoInteresse.findOne({ where: { usuarioId, ticker: tickerA }, transaction: t });
    const acaoB = await AcaoInteresse.findOne({ where: { usuarioId, ticker: tickerB }, transaction: t });
    if (!acaoA || !acaoB) {
      await t.rollback();
      return res.status(404).json({ error: `Ação(s) ${acaoA ? tickerB : tickerA} não encontrada(s)` });
    }
    const tempOrdem = acaoA.ordem;
    acaoA.ordem = acaoB.ordem;
    acaoB.ordem = tempOrdem;
    await Promise.all([ acaoA.save({ transaction: t }), acaoB.save({ transaction: t }) ]);
    await t.commit();
    return res.json({ message: `Ações ${tickerA} e ${tickerB} movidas com sucesso`, acaoA, acaoB });
  } catch (err) {
    await t.rollback();
    console.error('Erro ao mover ações', err);
    return res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
}

export async function listWatch(req, res) {
  const user = req.user;
  const minute = parseInt(user.ultimaHoraNegociacao.split(':')[1], 10);
  const watch = await AcaoInteresse.findAll({ where: { usuarioId: user.id }, order: [['ordem', 'ASC']] });
  const market = await loadMarketSnapshot(minute);
  const responseAcoes = watch.map((w) => market.find((m) => m.ticker === w.ticker)).filter(Boolean);
  return res.json({ horaNegociacao: user.ultimaHoraNegociacao, acoes: responseAcoes });
}

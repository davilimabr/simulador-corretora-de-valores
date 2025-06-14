import { advanceClock } from '../services/clockService.js';
import { loadMarketSnapshot } from '../services/priceService.js';
import { AcaoInteresse, Usuario } from '../models/index.js';
import { executePendingOrders } from '../services/orderExecutionService.js';

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
  const existing = await AcaoInteresse.findOne({ where: { usuarioId: req.user.id, ticker } });
  if (existing) return res.status(400).json({ error: 'Ação já está na lista' });
  const ordemMax = await AcaoInteresse.max('ordem', { where: { usuarioId: req.user.id } });
  const acao = await AcaoInteresse.create({ usuarioId: req.user.id, ticker, ordem: (ordemMax || 0) + 1 });
  return res.status(201).json({ id: acao.id, ticker: acao.ticker, message: 'Ação adicionada à lista' });
}

export async function removeWatch(req, res) {
  const { ticker } = req.params;
  const deleted = await AcaoInteresse.destroy({ where: { usuarioId: req.user.id, ticker } });
  if (!deleted) return res.status(404).json({ error: 'Ação não encontrada' });
  return res.json({ message: `Ação ${ticker} removida da lista` });
}

export async function moveWatch(req, res) {
  const { ticker } = req.params;
  const { novaOrdem } = req.body;
  const acao = await AcaoInteresse.findOne({ where: { usuarioId: req.user.id, ticker } });
  if (!acao) return res.status(404).json({ error: 'Ação não encontrada' });
  acao.ordem = novaOrdem;
  await acao.save();
  return res.json({ ticker, novaOrdem, message: 'Ordem atualizada' });
}

export async function listWatch(req, res) {
  const user = req.user;
  const minute = parseInt(user.ultimaHoraNegociacao.split(':')[1], 10);
  let watch = await AcaoInteresse.findAll({ where: { usuarioId: user.id }, order: [['ordem', 'ASC']] });
  if (watch.length === 0) {
    // gera 10 tickers random
    const closing = await (await fetch('https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/tickers.json')).json();
    watch = closing.sort(() => 0.5 - Math.random()).slice(0, 10);
    await Promise.all(watch.map((w, idx) => AcaoInteresse.create({ usuarioId: user.id, ticker: w.ticker, ordem: idx + 1 })));
    watch = await AcaoInteresse.findAll({ where: { usuarioId: user.id }, order: [['ordem', 'ASC']] });
  }
  const market = await loadMarketSnapshot(minute);
  const responseAcoes = watch.map((w) => market.find((m) => m.ticker === w.ticker)).filter(Boolean);
  return res.json({ horaNegociacao: user.ultimaHoraNegociacao, acoes: responseAcoes });
}

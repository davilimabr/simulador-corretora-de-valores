import { OrdemCompra, OrdemVenda, CarteiraItem, ContaCorrente } from '../models/index.js';
import sequelize from '../config/database.js';

export async function executePendingOrders(usuarioId, marketData) {
  // marketData: array { ticker, precoAtual }
  const t = await sequelize.transaction();
  try {
    // COMPRA
    const compPendentes = await OrdemCompra.findAll({ where: { usuarioId, status: 'pendente' }, transaction: t, lock: t.LOCK.UPDATE });
    for (const ordem of compPendentes) {
      const precoAtual = marketData.find((m) => m.ticker === ordem.ticker)?.precoAtual;
      if (!precoAtual) continue;
      const condicao = ordem.modo === 'mercado' || precoAtual <= ordem.precoReferencia;
      if (!condicao) continue;
      await processCompra(ordem, precoAtual, t);
    }

    // VENDA
    const vendPendentes = await OrdemVenda.findAll({ where: { usuarioId, status: 'pendente' }, transaction: t, lock: t.LOCK.UPDATE });
    for (const ordem of vendPendentes) {
      const precoAtual = marketData.find((m) => m.ticker === ordem.ticker)?.precoAtual;
      if (!precoAtual) continue;
      const condicao = ordem.modo === 'mercado' || precoAtual >= ordem.precoReferencia;
      if (!condicao) continue;
      await processVenda(ordem, precoAtual, t);
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    console.error('Erro executando ordens pendentes', err);
  }
}

async function processCompra(ordem, precoExecucao, t) {
  const valorTotal = ordem.quantidade * precoExecucao;
  // Busca último saldo
  const ultLanc = await ContaCorrente.findOne({ where: { usuarioId: ordem.usuarioId }, order: [['dataHora','DESC']], transaction: t });
  const saldoAtual = parseFloat(ultLanc?.saldoApos ?? 0);
  if (saldoAtual < valorTotal) return; // fundos insuficientes
  const novoSaldo = saldoAtual - valorTotal;
  await ContaCorrente.create({
    usuarioId: ordem.usuarioId,
    dataHora: new Date(),
    descricao: `Compra ${ordem.quantidade} ${ordem.ticker}`,
    tipo: 'retirada',
    valor: valorTotal,
    saldoApos: novoSaldo
  }, { transaction: t });
  // Atualiza carteira
  const item = await CarteiraItem.findOne({ where: { usuarioId: ordem.usuarioId, ticker: ordem.ticker }, transaction: t, lock: t.LOCK.UPDATE });
  if (!item) {
    await CarteiraItem.create({ usuarioId: ordem.usuarioId, ticker: ordem.ticker, quantidade: ordem.quantidade, precoCompraMedio: precoExecucao }, { transaction: t });
  } else {
    const totalAnterior = parseFloat(item.quantidade) * parseFloat(item.precoCompraMedio);
    const novoTotal = totalAnterior + valorTotal;
    const novaQtde = parseInt(item.quantidade) + parseInt(ordem.quantidade);
    item.quantidade = novaQtde;
    item.precoCompraMedio = novoTotal / novaQtde;
    await item.save({ transaction: t });
  }
  // fecha ordem
  ordem.status = 'executada';
  ordem.precoExecucao = precoExecucao;
  ordem.dataHoraExecucao = new Date();
  await ordem.save({ transaction: t });
}

async function processVenda(ordem, precoExecucao, t) {
  const item = await CarteiraItem.findOne({ where: { usuarioId: ordem.usuarioId, ticker: ordem.ticker }, transaction: t, lock: t.LOCK.UPDATE });
  if (!item || item.quantidade < ordem.quantidade) return; // não possui ações suficientes
  const valorTotal = ordem.quantidade * precoExecucao;
  // débito na carteira
  item.quantidade -= ordem.quantidade;
  await item.save({ transaction: t });
  // crédito conta corrente
  const ultLanc = await ContaCorrente.findOne({ where: { usuarioId: ordem.usuarioId }, order: [['dataHora','DESC']], transaction: t });
  const saldoAtual = parseFloat(ultLanc?.saldoApos ?? 0);
  const novoSaldo = saldoAtual + valorTotal;
  await ContaCorrente.create({
    usuarioId: ordem.usuarioId,
    dataHora: new Date(),
    descricao: `Venda ${ordem.quantidade} ${ordem.ticker}`,
    tipo: 'deposito',
    valor: valorTotal,
    saldoApos: novoSaldo
  }, { transaction: t });
  // fecha ordem
  ordem.status = 'executada';
  ordem.precoExecucao = precoExecucao;
  ordem.dataHoraExecucao = new Date();
  await ordem.save({ transaction: t });
}

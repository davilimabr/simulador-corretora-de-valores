import { CarteiraItem } from '../models/index.js';
import { loadMarketSnapshot } from '../services/priceService.js';

export async function listarCarteira(req, res) {
  const user = req.user;
  const minute = parseInt(user.ultimaHoraNegociacao.split(':')[1], 10);
  const market = await loadMarketSnapshot(minute);
  const itens = await CarteiraItem.findAll({ where: { usuarioId: user.id } });
  const acoesCarteira = itens.map((i) => {
    const m = market.find((mm) => mm.ticker === i.ticker);
    const precoCompraMedio = parseFloat(i.precoCompraMedio); 
    const valorTotalAtual = i.quantidade * m.precoAtual;
    const ganhoPerdaUnitaria = m.precoAtual - precoCompraMedio; // Cálculo agora é preciso
    return {
      tickerAcao: i.ticker,
      qtde: i.quantidade,
      precoCompraMedio: precoCompraMedio,
      precoAtual: m.precoAtual,
      valorTotalAtual,
      ganhoPerdaUnitaria: Number(ganhoPerdaUnitaria.toFixed(4)), // pode manter 4 casas para consistência
      ganhoPerdaTotal: Number((ganhoPerdaUnitaria * i.quantidade).toFixed(2)),
      variacaoNominalDia: m.variacaoNominal,
      variacaoPercentualDia: m.variacaoPercentual
    };
  });
  const totalGanhosPerdas = acoesCarteira.reduce((acc, a) => acc + a.ganhoPerdaTotal, 0);
  res.json({ horaNegociacao: user.ultimaHoraNegociacao, totalGanhosPerdas, acoesCarteira });
}

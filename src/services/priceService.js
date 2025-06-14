import fetch from 'node-fetch';
import moment from 'moment';

const BASE_URL = 'https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main';

export async function getClosingPrices() {
  const resp = await fetch(`${BASE_URL}/tickers.json`);
  return await resp.json();
}

export async function getMinutePrices(minute) {
  const resp = await fetch(`${BASE_URL}/${minute}.json`);
  return await resp.json();
}

export function mapPricesWithVariation(minutePrices, closingPrices) {
  return minutePrices.map((p) => {
    const close = closingPrices.find((c) => c.ticker === p.ticker)?.fechamento ?? p.preco;
    const variacaoNominal = Number((p.preco - close).toFixed(2));
    const variacaoPercentual = Number(((variacaoNominal / close) * 100).toFixed(2));
    return {
      ticker: p.ticker,
      precoAtual: p.preco,
      variacaoNominal,
      variacaoPercentual,
      corVariacao: variacaoNominal >= 0 ? 'verde' : 'vermelho'
    };
  });
}

export async function loadMarketSnapshot(minute) {
  const [minutePrices, closing] = await Promise.all([
    getMinutePrices(minute),
    getClosingPrices()
  ]);
  return mapPricesWithVariation(minutePrices, closing);
}

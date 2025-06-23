const allTickerSymbols = [
  "ALOS3", "ABEV3", "ASAI3", "AURE3", "AZZA3", "B3SA3", "BBSE3", "BBDC3",
  "BBDC4", "BRAP4", "BBAS3", "BRKM5", "BRAV3", "BRFS3", "BPAC11", "CXSE3",
  "CMIG4", "COGN3", "CPLE6", "CSAN3", "CPFE3", "CMIN3", "CVCB3", "CYRE3",
  "DIRR3", "ELET3", "ELET6", "EMBR3", "ENGI11", "ENEV3", "EGIE3", "EQTL3",
  "FLRY3", "GGBR4", "GOAU4", "NTCO3", "HAPV3", "HYPE3", "IGTI11", "IRBR3",
  "ISAE4", "ITSA4", "ITUB4", "JBSS3", "KLBN11", "RENT3", "LREN3", "MGLU3",
  "POMO4", "MRFG3", "BEEF3", "MRVE3", "MULT3", "PCAR3", "PETR3", "PETR4",
  "RECV3", "PRIO3", "PETZ3", "PSSA3", "RADL3", "RAIZ4", "RDOR3", "RAIL3",
  "SBSP3", "SANB11", "STBP3", "SMTO3", "CSNA3", "SLCE3", "SMFT3", "SUZB3",
  "TAEE11", "VIVT3", "TIMS3", "TOTS3", "UGPA3", "USIM5", "VALE3", "VAMO3",
  "VBBR3", "VIVA3", "WEGE3", "YDUQ3"
];

const tickersForRandomSelection = allTickerSymbols
  .filter(ticker => ticker !== 'PETR4' && ticker !== 'MGLU3'); // Excluindo PETR4 e MGLU3 pra teste no Postman

/**
 * Verifica se uma string corresponde a um ticker válido.
 * @param {string} ticker O ticker a ser validado.
 * @returns {boolean} Retorna true se o ticker for válido, caso contrário, false.
 */
export function isTickerValido(ticker) {
  if (!ticker) return false;
  return allTickerSymbols.includes(ticker);
}

/**
 * Retorna 10 tickers aleatórios da lista de seleção.
 * @returns {string[]} Um array com 10 tickers aleatórios.
 */
export function getRandomTickers() {
  const shuffled = [...tickersForRandomSelection].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
}

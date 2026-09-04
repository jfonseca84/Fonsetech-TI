/**
 * Identidade do produto.
 *
 * O sistema de chamados e um produto com nome proprio: FonseDesk. A Fonsetech
 * e a empresa que o desenvolve e opera. Manter os dois separados aqui e o que
 * permite, na evolucao para SaaS, vender o FonseDesk para outras empresas de TI
 * sem que o nome da Fonsetech apareca no painel do cliente delas.
 *
 * Regra pratica: no painel logado, use PRODUTO. Na landing e nos textos
 * institucionais, use EMPRESA.
 */
export const PRODUTO = {
  nome: 'FonseDesk',
  // exibido em caixa alta na sidebar
  marca: 'FONSEDESK',
  descritor: 'Chamados de TI',
  descritorCurto: 'CHAMADOS DE TI',
  empresa: 'Fonsetech TI',
  assinatura: 'por Fonsetech TI'
};

/** Titulo de aba: "Chamados · FonseDesk" */
export function titulo(pagina) {
  return pagina ? `${pagina} · ${PRODUTO.nome}` : PRODUTO.nome;
}

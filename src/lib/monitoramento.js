/**
 * Captura erros nao tratados do navegador e envia um resumo minimo para o
 * servidor (console estruturado em produção), sem depender de um provedor
 * externo. Nao envia dados de formulario nem estado da aplicacao — apenas
 * mensagem, stack e a rota onde ocorreu.
 */
function enviar(payload) {
  try {
    fetch('/api/client-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch {
    // Ambiente sem fetch ou offline: ignora, o erro ja foi ao console local.
  }
}

export function registrarErrosGlobais() {
  window.addEventListener('error', (evento) => {
    const erro = evento.error;
    enviar({
      tipo: 'erro',
      mensagem: erro?.message || evento.message || 'Erro desconhecido',
      pilha: erro?.stack ? String(erro.stack).slice(0, 2000) : null,
      rota: window.location.pathname
    });
  });

  window.addEventListener('unhandledrejection', (evento) => {
    const razao = evento.reason;
    enviar({
      tipo: 'promise_rejeitada',
      mensagem: razao?.message || String(razao) || 'Rejeição não tratada',
      pilha: razao?.stack ? String(razao.stack).slice(0, 2000) : null,
      rota: window.location.pathname
    });
  });
}

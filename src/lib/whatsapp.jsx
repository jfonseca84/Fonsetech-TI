import Icone from '../ui/Icone.jsx';

/**
 * Sanitiza o número para o padrão internacional do WhatsApp.
 * Se tiver 10 ou 11 dígitos (DDD + número brasileiro), adiciona o DDI 55.
 */
export function limparNumeroWhatsapp(numero) {
  if (!numero) return '';
  const limpo = String(numero).replace(/\D/g, '');
  if (!limpo) return '';
  if (limpo.startsWith('55') && limpo.length >= 12) return limpo;
  if (limpo.length === 10 || limpo.length === 11) return `55${limpo}`;
  return limpo;
}

/**
 * Gera URL oficial wa.me para abertura de conversa no WhatsApp.
 */
export function gerarLinkWhatsapp(numero, mensagem = '') {
  const numLimpo = limparNumeroWhatsapp(numero);
  if (!numLimpo) return '';
  const url = `https://wa.me/${numLimpo}`;
  if (mensagem) {
    return `${url}?text=${encodeURIComponent(mensagem)}`;
  }
  return url;
}

/**
 * Abre o WhatsApp diretamente no navegador/computador.
 */
export function abrirWhatsapp(numero, mensagem = '') {
  const link = gerarLinkWhatsapp(numero, mensagem);
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Botão discreto e elegante com a identidade do Fonsedesk para ação rápida do WhatsApp.
 */
export function BotaoWhatsapp({
  numero,
  mensagem = '',
  rotulo = 'WhatsApp',
  compacto = false,
  iconeApenas = false,
  estilo = {}
}) {
  const numLimpo = limparNumeroWhatsapp(numero);
  if (!numLimpo) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    abrirWhatsapp(numero, mensagem);
  };

  const estiloBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: compacto ? 4 : 6,
    padding: iconeApenas ? '6px 7px' : (compacto ? '4px 9px' : '6px 12px'),
    fontSize: compacto ? 11 : 12,
    fontWeight: 600,
    color: '#059669',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 7,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all .15s ease',
    whiteSpace: 'nowrap',
    ...estilo
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Abrir WhatsApp (${numero})`}
      style={estiloBase}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#059669';
        e.currentTarget.style.color = '#ffffff';
        e.currentTarget.style.borderColor = '#059669';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#ecfdf5';
        e.currentTarget.style.color = '#059669';
        e.currentTarget.style.borderColor = '#a7f3d0';
      }}
    >
      <Icone nome="whatsapp" tamanho={compacto || iconeApenas ? 13 : 15} />
      {!iconeApenas && <span>{rotulo}</span>}
    </button>
  );
}

export default BotaoWhatsapp;

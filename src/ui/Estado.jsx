import { c, card } from './tokens.js';
import Icone from './Icone.jsx';

export function Carregando({ texto = 'Carregando...', altura = 200 }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: altura, gap: 12 }}>
      <span style={{
        width: 26, height: 26, borderRadius: '50%',
        border: '2.5px solid rgba(29, 95, 245, 0.18)', borderTopColor: c.azul,
        animation: 'fsGirar .7s linear infinite', display: 'block'
      }} />
      <span style={{ fontSize: 13, color: c.texto3 }}>{texto}</span>
      <style>{'@keyframes fsGirar { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

export function Erro({ mensagem, aoTentar }) {
  return (
    <div role="alert" style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px',
      borderRadius: 12, background: 'rgba(220, 38, 38, 0.06)',
      border: '1px solid rgba(220, 38, 38, 0.24)'
    }}>
      <Icone nome="alerta" tamanho={18} cor="#b91c1c" largura={2} style={{ flex: 'none', marginTop: 1 }} />
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#b91c1c' }}>Não foi possível carregar</div>
        <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.6, color: c.texto2 }}>{mensagem}</p>
        {aoTentar && (
          <button onClick={aoTentar} style={{
            marginTop: 12, padding: '9px 14px', borderRadius: 9, background: c.branco,
            border: '1px solid ' + c.borda3, fontSize: 13, fontWeight: 600,
            color: '#2c3853', cursor: 'pointer', fontFamily: 'inherit'
          }}>Tentar novamente</button>
        )}
      </div>
    </div>
  );
}

export function Vazio({ titulo, texto, icone = 'info' }) {
  return (
    <div style={{ ...card, padding: '44px 22px', textAlign: 'center' }}>
      <Icone nome={icone} tamanho={30} cor={c.texto4} largura={1.5} />
      <div style={{ marginTop: 12, fontSize: 14.5, fontWeight: 700, color: '#2c3853' }}>{titulo}</div>
      {texto && <p style={{ margin: '8px auto 0', maxWidth: 380, fontSize: 12.5, lineHeight: 1.6, color: c.texto3 }}>{texto}</p>}
    </div>
  );
}

export function Aviso({ children, tom = 'ok' }) {
  const tons = {
    ok:   { bg: 'rgba(34, 192, 122, 0.08)', bd: 'rgba(34, 192, 122, 0.3)', fg: c.verdeTexto, ic: 'check' },
    info: { bg: 'rgba(29, 95, 245, 0.05)',  bd: 'rgba(29, 95, 245, 0.2)',  fg: '#2c3853',    ic: 'info' },
    erro: { bg: 'rgba(220, 38, 38, 0.07)',  bd: 'rgba(220, 38, 38, 0.26)', fg: '#b91c1c',    ic: 'alerta' }
  };
  const t = tons[tom];
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
      borderRadius: 10, background: t.bg, border: '1px solid ' + t.bd,
      fontSize: 13, fontWeight: 600, color: t.fg
    }}>
      <Icone nome={t.ic} tamanho={16} largura={2.2} style={{ flex: 'none' }} />
      {children}
    </div>
  );
}

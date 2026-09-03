import { c, iniciais } from '../ui/tokens.js';

export default function Cabecalho({ titulo, subtitulo, acao, nome, detalhe, tomAvatar = 'cliente' }) {
  const tons = {
    cliente: { bg: '#dce6f9', fg: c.azulEscuro },
    admin:   { bg: '#e6dcf9', fg: c.roxo }
  };
  const t = tons[tomAvatar];

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 20, flexWrap: 'wrap'
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.9px', color: c.tinta }}>{titulo}</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13.5, color: c.texto3 }}>{subtitulo}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {acao}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 11, paddingLeft: 14,
          borderLeft: '1px solid rgba(20, 45, 100, 0.12)'
        }}>
          <span style={{
            flex: 'none', width: 38, height: 38, borderRadius: '50%', background: t.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13.5, fontWeight: 800, color: t.fg
          }}>{iniciais(nome)}</span>
          <span style={{ display: 'block', lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: c.tinta }}>{nome || '—'}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: c.texto3, marginTop: 2 }}>{detalhe}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

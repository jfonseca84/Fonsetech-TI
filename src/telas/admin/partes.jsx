import { c, card, TONS } from '../../ui/tokens.js';

export function Painel({ titulo, acao, children, style }) {
  return (
    <section style={{ ...card, padding: '22px 24px', ...style }}>
      {(titulo || acao) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: c.tinta }}>{titulo}</h2>
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

export function SeloStatus({ status, compacto }) {
  const t = TONS[status] || TONS['Aberto'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
      fontSize: compacto ? 11 : 11.5, fontWeight: 700,
      padding: compacto ? '5px 10px' : '6px 11px', borderRadius: 999,
      color: t.fg, background: t.bg
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot, display: 'block' }} />
      {status}
    </span>
  );
}

export function Dado({ rotulo, valor, mono: usarMono }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.9, color: c.texto4 }}>{rotulo}</div>
      <div style={{
        marginTop: 6, fontSize: usarMono ? 12.5 : 13, fontWeight: 600, color: '#2c3853',
        fontFamily: usarMono ? "'JetBrains Mono', monospace" : 'inherit', wordBreak: 'break-word'
      }}>{valor || '—'}</div>
    </div>
  );
}

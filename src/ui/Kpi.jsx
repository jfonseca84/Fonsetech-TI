import { c, card } from './tokens.js';

export default function Kpi({ rotulo, valor, dica, tom }) {
  return (
    <div style={{ ...card, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: c.texto3 }}>{rotulo}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: tom, display: 'block' }} />
      </div>
      <div style={{ marginTop: 14, fontSize: 30, fontWeight: 800, letterSpacing: '-1.2px', color: c.tinta }}>{valor}</div>
      <div style={{ marginTop: 5, fontSize: 12, color: c.texto3 }}>{dica}</div>
    </div>
  );
}

import { useState } from 'react';
import { c, TONS, PRIO_FG, mono, dataBR } from './tokens.js';

/** Linha de chamado usada no cliente e no admin. */
export default function LinhaChamado({ chamado, aoAbrir, mostrarEmpresa }) {
  const [h, setH] = useState(false);
  const tom = TONS[chamado.status] || TONS['Aberto'];
  const maquina = chamado.maquinas?.nome || chamado.equipamento_livre;

  return (
    <button
      type="button" onClick={() => aoAbrir(chamado)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: '100%', display: 'grid', gap: 4, textAlign: 'left',
        padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
        background: h ? c.cardAlt : c.branco,
        border: '1px solid ' + (h ? 'rgba(29, 95, 245, 0.3)' : c.borda),
        transition: 'background .18s ease, border-color .18s ease',
        fontFamily: 'inherit'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: c.texto3 }}>{chamado.numero}</span>
        <span style={{
          fontSize: 10.5, fontWeight: 700, padding: '4px 9px', borderRadius: 999,
          color: tom.fg, background: tom.bg
        }}>{chamado.status}</span>
        {chamado.prioridade !== 'Média' && (
          <span style={{ fontSize: 10.5, fontWeight: 700, color: PRIO_FG[chamado.prioridade] }}>
            {chamado.prioridade.toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: c.tinta, textWrap: 'pretty' }}>{chamado.titulo}</div>
      <div style={{ fontSize: 11.5, color: c.texto4 }}>
        {mostrarEmpresa && chamado.empresas?.razao_social ? chamado.empresas.razao_social + ' · ' : ''}
        {chamado.categoria}
        {maquina ? ' · ' + maquina : ''}
        {' · '}{dataBR(chamado.aberto_em)}
      </div>
    </button>
  );
}

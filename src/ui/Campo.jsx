import { useState } from 'react';
import { c, rotulo } from './tokens.js';

const base = {
  height: 48, padding: '0 14px', fontSize: 14, color: c.tinta,
  background: c.fundoCampo, border: '1px solid ' + c.borda2,
  borderRadius: 10, outline: 'none', width: '100%', fontFamily: 'inherit',
  transition: 'border-color .2s ease, box-shadow .2s ease'
};

const foco = {
  borderColor: c.azul, boxShadow: '0 0 0 3px rgba(29, 95, 245, 0.12)', background: c.branco
};

export function Campo({ label, alto, opcoes, compacto, style, ...props }) {
  const [focado, setFocado] = useState(false);
  const est = {
    ...base,
    ...(compacto ? { height: 44, fontSize: 13.5, padding: '0 12px' } : null),
    ...(focado ? foco : null),
    ...(alto ? { height: 'auto', padding: '13px 14px', lineHeight: 1.6, resize: 'vertical' } : null),
    ...style
  };
  const ev = { onFocus: () => setFocado(true), onBlur: () => setFocado(false) };

  let controle;
  if (opcoes) {
    controle = (
      <select {...props} {...ev} style={{ ...est, padding: compacto ? '0 12px' : '0 12px', cursor: 'pointer' }}>
        {opcoes.map((o) => {
          const v = typeof o === 'string' ? o : o.valor;
          const t = typeof o === 'string' ? o : o.texto;
          return <option key={v} value={v}>{t}</option>;
        })}
      </select>
    );
  } else if (alto) {
    controle = <textarea rows={alto} {...props} {...ev} style={est} />;
  } else {
    controle = <input {...props} {...ev} style={est} />;
  }

  if (!label) return controle;
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={rotulo}>{label}</span>
      {controle}
    </label>
  );
}

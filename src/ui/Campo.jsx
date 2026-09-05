import { useState, useId } from 'react';
import { c, rotulo as estiloRotulo } from './tokens.js';

const base = {
  height: 48, padding: '0 14px', fontSize: 14, color: c.tinta,
  background: c.fundoCampo, border: '1px solid ' + c.borda2,
  borderRadius: 10, outline: 'none', width: '100%', fontFamily: 'inherit',
  transition: 'border-color .2s ease, box-shadow .2s ease'
};

const foco = {
  borderColor: c.azul, boxShadow: '0 0 0 3px rgba(29, 95, 245, 0.12)', background: c.branco
};

export function Campo({
  label,
  rotulo,
  valor,
  value,
  onChange,
  tipo,
  type,
  obrigatorio,
  required,
  desabilitado,
  disabled,
  dica,
  erro,
  alto,
  opcoes,
  compacto,
  style,
  id,
  ...props
}) {
  const [focado, setFocado] = useState(false);
  const idGerado = useId();
  const campoId = id || idGerado;

  const textoRotulo = label !== undefined ? label : rotulo;
  const isObrigatorio = Boolean(obrigatorio || required);
  const isDesabilitado = Boolean(desabilitado || disabled);
  const inputType = tipo || type || 'text';
  const valorFinal = valor !== undefined ? valor : (value !== undefined ? value : '');

  const lidarMudanca = (e) => {
    if (!onChange) return;
    // Se 'valor' foi fornecido ou 'rotulo' foi usado sem a prop 'value',
    // a convenção da tela é receber o valor direto v (ex: v => setForm({ ...form, campo: v }))
    if (valor !== undefined || (rotulo !== undefined && value === undefined)) {
      onChange(e.target.value);
    } else {
      // Caso padrão do React: passa o evento sintético
      onChange(e);
    }
  };

  const est = {
    ...base,
    ...(compacto ? { height: 44, fontSize: 13.5, padding: '0 12px' } : null),
    ...(focado ? foco : null),
    ...(alto ? { height: 'auto', padding: '13px 14px', lineHeight: 1.6, resize: 'vertical' } : null),
    ...(isDesabilitado ? { opacity: 0.65, cursor: 'not-allowed', background: '#f1f5f9' } : null),
    ...(erro ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.15)' } : null),
    ...style
  };

  const ev = {
    onFocus: (e) => {
      setFocado(true);
      if (props.onFocus) props.onFocus(e);
    },
    onBlur: (e) => {
      setFocado(false);
      if (props.onBlur) props.onBlur(e);
    }
  };

  const ariaProps = {
    ...(dica ? { 'aria-describedby': `${campoId}-dica` } : null),
    ...(erro ? { 'aria-invalid': true, 'aria-errormessage': `${campoId}-erro` } : null)
  };

  let controle;
  if (opcoes) {
    controle = (
      <select
        id={campoId}
        value={valorFinal}
        onChange={lidarMudanca}
        disabled={isDesabilitado}
        required={isObrigatorio}
        {...props}
        {...ev}
        {...ariaProps}
        style={{ ...est, padding: compacto ? '0 12px' : '0 12px', cursor: isDesabilitado ? 'not-allowed' : 'pointer' }}
      >
        {opcoes.map((o) => {
          const v = typeof o === 'string' ? o : o.valor;
          const t = typeof o === 'string' ? o : o.texto;
          return <option key={v} value={v}>{t}</option>;
        })}
      </select>
    );
  } else if (alto) {
    controle = (
      <textarea
        id={campoId}
        rows={alto}
        value={valorFinal}
        onChange={lidarMudanca}
        disabled={isDesabilitado}
        required={isObrigatorio}
        {...props}
        {...ev}
        {...ariaProps}
        style={est}
      />
    );
  } else {
    controle = (
      <input
        id={campoId}
        type={inputType}
        value={valorFinal}
        onChange={lidarMudanca}
        disabled={isDesabilitado}
        required={isObrigatorio}
        {...props}
        {...ev}
        {...ariaProps}
        style={est}
      />
    );
  }

  if (!textoRotulo && !dica && !erro) {
    return controle;
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {textoRotulo && (
        <label
          htmlFor={campoId}
          style={{
            ...estiloRotulo,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <span>{textoRotulo}</span>
          {isObrigatorio && (
            <span style={{ color: '#dc2626', fontSize: 13, fontWeight: 700 }} title="Campo obrigatório">*</span>
          )}
        </label>
      )}
      {controle}
      {dica && (
        <span
          id={`${campoId}-dica`}
          style={{ fontSize: 11.5, color: '#6b7896', lineHeight: 1.4, margin: '2px 0 0' }}
        >
          {dica}
        </span>
      )}
      {erro && (
        <span
          id={`${campoId}-erro`}
          style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 500, lineHeight: 1.4, margin: '2px 0 0' }}
        >
          {erro}
        </span>
      )}
    </div>
  );
}

export default Campo;


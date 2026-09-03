import { c } from './tokens.js';

export default function Chip({ ativo, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      style={{
        padding: '9px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background .2s ease, border-color .2s ease',
        ...(ativo
          ? { background: c.azul, color: c.branco, border: '1px solid ' + c.azul }
          : { background: c.branco, color: c.texto2, border: '1px solid ' + c.borda3 })
      }}
    >
      {children}
    </button>
  );
}

import { useEffect } from 'react';
import { c } from './tokens.js';
import Icone from './Icone.jsx';

export default function Modal({ aberto, aoFechar, largura = 620, children }) {
  useEffect(() => {
    if (!aberto) return;
    const esc = (e) => { if (e.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div
      onClick={aoFechar}
      role="presentation"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(11, 25, 55, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40, zIndex: 60
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: largura, maxHeight: '86vh', overflow: 'auto',
          background: c.branco, borderRadius: 16,
          boxShadow: '0 30px 70px rgba(11, 25, 55, 0.4)'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function BotaoFechar({ onClick }) {
  return (
    <button
      type="button" onClick={onClick} aria-label="Fechar"
      style={{
        flex: 'none', width: 34, height: 34, borderRadius: 9, background: c.fundo,
        border: '1px solid rgba(20, 45, 100, 0.12)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: c.texto2, cursor: 'pointer'
      }}
    >
      <Icone nome="fechar" tamanho={15} largura={2.2} />
    </button>
  );
}

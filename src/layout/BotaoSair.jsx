import { useState } from 'react';
import Icone from '../ui/Icone.jsx';

export default function BotaoSair({ aoSair, corInativa }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button" onClick={aoSair}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 9, border: 0, fontFamily: 'inherit',
        fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
        background: h ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        color: h ? '#ffffff' : corInativa,
        transition: 'background .2s ease, color .2s ease'
      }}
    >
      <Icone nome="sair" tamanho={15} />
      Sair
    </button>
  );
}

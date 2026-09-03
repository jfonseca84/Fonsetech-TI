import { useState } from 'react';
import { c, botao } from './tokens.js';
import Icone from './Icone.jsx';

const hovers = {
  primario:   { background: c.azulHover, transform: 'translateY(-1px)' },
  secundario: { borderColor: 'rgba(29, 95, 245, 0.42)', background: c.cardAlt },
  roxo:       { background: c.roxoHover }
};

export default function Botao({ tipo = 'primario', icone, iconeDepois, children, style, ...props }) {
  const [h, setH] = useState(false);
  const base = botao[tipo] || botao.primario;
  const est = { ...base, ...(h && !props.disabled ? hovers[tipo] : null), ...style };
  return (
    <button
      {...props}
      style={est}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {icone && <Icone nome={icone} tamanho={15} largura={2} />}
      {children}
      {iconeDepois && <Icone nome={iconeDepois} tamanho={15} largura={2.2} />}
    </button>
  );
}

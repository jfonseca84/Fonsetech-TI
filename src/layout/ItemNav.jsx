import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Icone from '../ui/Icone.jsx';

export default function ItemNav({ para, icone, rotulo, corInativa, fim }) {
  const [h, setH] = useState(false);
  return (
    <NavLink
      to={para}
      end={fim}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        textAlign: 'left', padding: '9px 12px', border: 0, borderRadius: 9,
        fontSize: 12, fontWeight: 600, textDecoration: 'none', lineHeight: 1.2,
        transition: 'background .2s ease, color .2s ease',
        ...(isActive
          ? { background: 'rgba(255, 255, 255, 0.14)', color: '#ffffff' }
          : h
            ? { background: 'rgba(255, 255, 255, 0.07)', color: '#ffffff' }
            : { background: 'transparent', color: corInativa })
      })}
    >
      <span style={{ display: 'flex', width: 16, height: 16, flex: 'none' }}>
        <Icone nome={icone} tamanho={16} />
      </span>
      {rotulo}
    </NavLink>
  );
}

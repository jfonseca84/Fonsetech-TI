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
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: 10,
        fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
        transition: 'background .2s ease, color .2s ease',
        ...(isActive
          ? { background: 'rgba(255, 255, 255, 0.14)', color: '#ffffff' }
          : h
            ? { background: 'rgba(255, 255, 255, 0.07)', color: '#ffffff' }
            : { background: 'transparent', color: corInativa })
      })}
    >
      <span style={{ display: 'flex', width: 18, height: 18, flex: 'none' }}>
        <Icone nome={icone} tamanho={18} />
      </span>
      {rotulo}
    </NavLink>
  );
}

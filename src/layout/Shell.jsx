import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { c } from '../ui/tokens.js';
import { Marca } from '../ui/Icone.jsx';
import Icone from '../ui/Icone.jsx';
import ItemNav from './ItemNav.jsx';
import BotaoSair from './BotaoSair.jsx';
import { PRODUTO } from '../ui/marca.js';
import { useSessao } from '../auth/SessaoProvider.jsx';

/**
 * Estrutura das duas areas autenticadas. O visual (gradiente, cor da nav,
 * eyebrow e cartao do rodape) muda por variante, mas a geometria e a mesma
 * dos prototipos: coluna fixa de 246px + main rolavel.
 */
const VARIANTES = {
  cliente: {
    fundo: c.sidebarCliente, navInativa: c.navCliente, eyebrow: 'CHAMADOS DE TI',
    marca: '#8fc0ff', selo: 'rgba(88, 150, 255, 0.22)', seloBorda: 'rgba(140, 185, 255, 0.34)',
    rodapeBg: 'rgba(30, 70, 150, 0.42)', rodapeBorda: 'rgba(140, 185, 255, 0.2)', eyebrowCor: '#7ba7e8'
  },
  admin: {
    fundo: c.sidebarAdmin, navInativa: c.navAdmin, eyebrow: 'PAINEL ADMINISTRATIVO',
    marca: '#7ba7e0', selo: 'rgba(60, 110, 200, 0.22)', seloBorda: 'rgba(100, 145, 220, 0.3)',
    rodapeBg: 'rgba(15, 40, 90, 0.42)', rodapeBorda: 'rgba(100, 145, 220, 0.18)', eyebrowCor: '#5f8ac0'
  }
};

export default function Shell({ variante, itens, rodape, cabecalho }) {
  const v = VARIANTES[variante];
  const { sair } = useSessao();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu mobile sempre que a rota muda (clique em item ou navegacao programatica).
  useEffect(() => setMenuAberto(false), [pathname]);

  return (
    <div className="fs-shell" style={{
      display: 'grid', gridTemplateColumns: 'minmax(0, 246px) minmax(0, 1fr)',
      minHeight: '100vh', background: c.fundo, color: c.tinta
    }}>
      <aside className="fs-shell-aside" style={{
        background: v.fundo, padding: '18px 16px', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span style={{
              flex: 'none', width: 32, height: 32, borderRadius: 9, background: v.selo,
              border: '1px solid ' + v.seloBorda, display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Marca cor={v.marca} />
            </span>
            <span style={{ display: 'block', lineHeight: 1 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', color: c.branco }}>{PRODUTO.marca}</span>
              <span style={{ display: 'block', fontSize: 8, fontWeight: 700, letterSpacing: '1.6px', color: v.eyebrowCor, marginTop: 4 }}>{v.eyebrow}</span>
            </span>
          </div>
          <button
            type="button"
            className="fs-shell-menu-btn"
            onClick={() => setMenuAberto((a) => !a)}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            style={{
              display: 'none', flex: 'none', width: 34, height: 34, borderRadius: 9,
              background: v.selo, border: '1px solid ' + v.seloBorda,
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <Icone nome={menuAberto ? 'fechar' : 'menu'} tamanho={17} cor={c.branco} />
          </button>
        </div>

        <nav
          className={'fs-shell-nav' + (menuAberto ? ' fs-shell-nav-aberto' : '')}
          style={{ marginTop: 20, display: 'grid', gap: 2 }}
          onClick={() => setMenuAberto(false)}
        >
          {itens.map((i) => (
            <ItemNav key={i.para} para={i.para} fim={i.fim} icone={i.icone} rotulo={i.rotulo} corInativa={v.navInativa} />
          ))}
        </nav>

        <div className="fs-shell-rodape" style={{ marginTop: 'auto', paddingTop: 16 }}>
          {rodape && (
            <div className="fs-shell-cartao" style={{
              padding: '11px 13px', borderRadius: 11,
              background: v.rodapeBg, border: '1px solid ' + v.rodapeBorda
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.1, color: v.eyebrowCor }}>{rodape.rotulo}</div>
              <div style={{ marginTop: 5, fontSize: 13, fontWeight: 700, color: c.branco }}>{rodape.valor}</div>
              <div style={{ marginTop: 3, fontSize: 11, color: variante === 'cliente' ? '#93aed4' : '#7f9ecb' }}>{rodape.dica}</div>
            </div>
          )}
          <BotaoSair aoSair={sair} corInativa={v.navInativa} />
          <div style={{
            marginTop: 10, fontSize: 9, letterSpacing: 0.4, textAlign: 'center',
            color: variante === 'cliente' ? 'rgba(147, 174, 212, 0.7)' : 'rgba(127, 158, 203, 0.7)'
          }}>{PRODUTO.assinatura}</div>
        </div>
      </aside>

      <main className="fs-shell-main" style={{ padding: '26px 34px 44px', minWidth: 0 }}>
        {cabecalho}
        <Outlet />
      </main>
    </div>
  );
}

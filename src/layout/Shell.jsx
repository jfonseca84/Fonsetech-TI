import { Outlet } from 'react-router-dom';
import { c } from '../ui/tokens.js';
import { Marca } from '../ui/Icone.jsx';
import ItemNav from './ItemNav.jsx';
import BotaoSair from './BotaoSair.jsx';
import { useSessao } from '../auth/SessaoProvider.jsx';

/**
 * Estrutura das duas areas autenticadas. O visual (gradiente, cor da nav,
 * eyebrow e cartao do rodape) muda por variante, mas a geometria e a mesma
 * dos prototipos: coluna fixa de 246px + main rolavel.
 */
const VARIANTES = {
  cliente: {
    fundo: c.sidebarCliente, navInativa: c.navCliente, eyebrow: 'CENTRAL DE CHAMADOS',
    marca: '#8fc0ff', selo: 'rgba(88, 150, 255, 0.22)', seloBorda: 'rgba(140, 185, 255, 0.34)',
    rodapeBg: 'rgba(30, 70, 150, 0.42)', rodapeBorda: 'rgba(140, 185, 255, 0.2)', eyebrowCor: '#7ba7e8'
  },
  admin: {
    fundo: c.sidebarAdmin, navInativa: c.navAdmin, eyebrow: 'PAINEL ADMINISTRATIVO',
    marca: '#c4b5fd', selo: 'rgba(124, 58, 237, 0.28)', seloBorda: 'rgba(167, 139, 250, 0.4)',
    rodapeBg: 'rgba(70, 40, 140, 0.36)', rodapeBorda: 'rgba(167, 139, 250, 0.22)', eyebrowCor: '#a78bfa'
  }
};

export default function Shell({ variante, itens, rodape, cabecalho }) {
  const v = VARIANTES[variante];
  const { sair } = useSessao();

  return (
    <div className="fs-shell" style={{
      display: 'grid', gridTemplateColumns: 'minmax(0, 246px) minmax(0, 1fr)',
      minHeight: '100vh', background: c.fundo, color: c.tinta
    }}>
      <aside className="fs-shell-aside" style={{
        background: v.fundo, padding: '26px 20px', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{
            flex: 'none', width: 38, height: 38, borderRadius: 10, background: v.selo,
            border: '1px solid ' + v.seloBorda, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Marca cor={v.marca} />
          </span>
          <span style={{ display: 'block', lineHeight: 1 }}>
            <span style={{ display: 'block', fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', color: c.branco }}>FONSETECH</span>
            <span style={{ display: 'block', fontSize: 8.5, fontWeight: 700, letterSpacing: '2px', color: v.eyebrowCor, marginTop: 5 }}>{v.eyebrow}</span>
          </span>
        </div>

        <nav className="fs-shell-nav" style={{ marginTop: 34, display: 'grid', gap: 5 }}>
          {itens.map((i) => (
            <ItemNav key={i.para} para={i.para} fim={i.fim} icone={i.icone} rotulo={i.rotulo} corInativa={v.navInativa} />
          ))}
        </nav>

        <div className="fs-shell-rodape" style={{ marginTop: 'auto', paddingTop: 26 }}>
          {rodape && (
            <div className="fs-shell-cartao" style={{
              padding: '15px 16px', borderRadius: 12,
              background: v.rodapeBg, border: '1px solid ' + v.rodapeBorda
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: v.eyebrowCor }}>{rodape.rotulo}</div>
              <div style={{ marginTop: 8, fontSize: 14.5, fontWeight: 700, color: c.branco }}>{rodape.valor}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: variante === 'cliente' ? '#93aed4' : '#a89ccb' }}>{rodape.dica}</div>
            </div>
          )}
          <BotaoSair aoSair={sair} corInativa={v.navInativa} />
        </div>
      </aside>

      <main className="fs-shell-main" style={{ padding: '26px 34px 44px', minWidth: 0 }}>
        {cabecalho}
        <Outlet />
      </main>
    </div>
  );
}

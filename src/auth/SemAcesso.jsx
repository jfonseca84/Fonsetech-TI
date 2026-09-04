import { useState } from 'react';
import { useSessao } from './SessaoProvider.jsx';
import { c, card } from '../ui/tokens.js';
import Icone from '../ui/Icone.jsx';

const botao = {
  padding: '10px 15px', borderRadius: 9, fontSize: 13, fontWeight: 600,
  fontFamily: 'inherit', cursor: 'pointer', border: '1px solid ' + c.borda3,
  background: c.branco, color: '#2c3853'
};

/**
 * Tela de saida para quem esta autenticado mas nao tem perfil valido
 * (ou o perfil nao pode ser lido). Sempre oferece uma forma de sair da
 * sessao, para o usuario nunca ficar preso sem alternativa.
 */
export default function SemAcesso({ mensagem }) {
  const { sair, recarregarPerfil } = useSessao();
  const [saindo, setSaindo] = useState(false);

  async function sairAgora() {
    setSaindo(true);
    await sair();
    window.location.replace('/login');
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 30, background: '#f4f7fc' }}>
      <div style={{ ...card, width: '100%', maxWidth: 440, padding: '26px 28px' }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 11, background: 'rgba(220, 38, 38, 0.08)'
        }}>
          <Icone nome="alerta" tamanho={20} cor="#b91c1c" largura={2} />
        </span>
        <h1 style={{ margin: '16px 0 0', fontSize: 17, fontWeight: 700, color: c.tinta }}>
          Acesso não liberado
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.6, color: c.texto2 }}>
          {mensagem || 'Não foi possível carregar seu perfil.'}
        </p>
        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={recarregarPerfil} style={botao}>Tentar novamente</button>
          <button
            type="button" onClick={sairAgora} disabled={saindo}
            style={{ ...botao, background: c.azul, borderColor: c.azul, color: c.branco }}
          >{saindo ? 'Saindo...' : 'Sair da conta'}</button>
          <a href="/" style={{ ...botao, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}

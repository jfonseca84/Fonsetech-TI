import { useMemo } from 'react';
import { c, card } from '../../ui/tokens.js';
import { usarDados } from '../../dados/usarDados.js';
import { listarMateriais } from '../../dados/consultas.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import { Carregando, Erro, Vazio } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';

export default function Downloads() {
  const { perfil } = useSessao();
  const { dados, carregando, erro, recarregar } = usarDados(() => listarMateriais(['programa', 'software', 'driver', 'ferramenta']), [], []);

  const listaAcessivel = useMemo(() => {
    const planoCliente = perfil?.empresas?.plano || 'Profissional';
    const niveis = { 'Básico': 1, 'Profissional': 2, 'Premium': 3 };
    const nivelCliente = niveis[planoCliente] || 1;

    return (dados || []).filter((m) => {
      // 1. Público
      if (!m.disponibilidade || m.disponibilidade === 'todos' || m.disponibilidade === 'todas') {
        return true;
      }
      // 2. Exclusivo para empresa específica
      if (m.disponibilidade === 'empresa' || m.disponibilidade === 'por_empresa') {
        return m.empresa_id === perfil?.empresa_id;
      }
      // 3. Exclusivo para plano específico
      if (m.disponibilidade === 'plano' || m.disponibilidade === 'por_plano') {
        const minNivel = niveis[m.plano_minimo] || 1;
        return nivelCliente >= minNivel;
      }
      return true;
    });
  }, [dados, perfil]);

  if (carregando) return <Carregando altura={320} />;
  if (erro) return <div style={{ marginTop: 26 }}><Erro mensagem={erro} aoTentar={recarregar} /></div>;

  if (!listaAcessivel.length) {
    return (
      <div style={{ marginTop: 24 }}>
        <Vazio
          titulo="Nenhum programa disponível"
          texto="Os instaladores liberados para sua empresa aparecem aqui."
          icone="download"
        />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
      {listaAcessivel.map((p) => (
        <div key={p.id} style={{
          display: 'flex', flexDirection: 'column', ...card, padding: '22px 22px 20px',
          borderColor: p.destaque ? 'rgba(29, 95, 245, 0.34)' : c.borda
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <span style={{
              flex: 'none', width: 42, height: 42, borderRadius: 11,
              background: 'rgba(29, 95, 245, 0.08)', border: '1px solid rgba(29, 95, 245, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icone nome="download" tamanho={20} cor={c.azulEscuro} largura={1.7} />
            </span>
            {p.destaque && (
              <span style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, padding: '4px 9px',
                borderRadius: 999, color: c.azulEscuro, background: 'rgba(29, 95, 245, 0.1)'
              }}>RECOMENDADO</span>
            )}
          </div>

          <h3 style={{ margin: '16px 0 0', fontSize: 15.5, fontWeight: 700, lineHeight: 1.35, textWrap: 'pretty' }}>{p.titulo}</h3>
          <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.6, color: c.texto3, textWrap: 'pretty' }}>{p.descricao}</p>

          <div style={{ marginTop: 16, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: c.texto4 }}>
            {p.versao && <span>Versão {p.versao}</span>}
            {p.tamanho && <span>{p.tamanho}</span>}
            {p.sistema && <span>{p.sistema}</span>}
          </div>

          {p.link_externo ? (
            <a
              href={p.link_externo} target="_blank" rel="noopener noreferrer"
              style={{
                marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 9, padding: 12, borderRadius: 10, background: c.azul, color: c.branco,
                fontSize: 13.5, fontWeight: 700, textDecoration: 'none'
              }}
            >
              <Icone nome="download" tamanho={15} largura={2} />
              Baixar instalador
            </a>
          ) : (
            <span style={{
              marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 9, padding: 12, borderRadius: 10, background: c.fundo,
              border: '1px solid ' + c.borda, fontSize: 13.5, fontWeight: 600,
              color: c.texto5, cursor: 'not-allowed'
            }}>
              <Icone nome="relogio" tamanho={15} largura={2} />
              Disponível em breve
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

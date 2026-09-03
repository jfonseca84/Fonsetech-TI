import { useState } from 'react';
import { c, card, iniciais } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { listarPerfis, listarEmpresas, alternarAtivo } from '../../dados/consultas.js';
import { Carregando, Erro, Vazio, Aviso } from '../../ui/Estado.jsx';
import Chip from '../../ui/Chip.jsx';
import Icone from '../../ui/Icone.jsx';

export default function Clientes() {
  const perfis = usarDados(listarPerfis, [], []);
  const emp = usarDados(listarEmpresas, [], []);
  const [filtro, setFiltro] = useState('Todos');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [ocupado, setOcupado] = useState('');

  async function alternar(p) {
    setErro('');
    setOk('');
    setOcupado(p.id);
    try {
      await alternarAtivo(p.id, !p.ativo);
      setOk(p.ativo ? 'Acesso de ' + p.nome + ' desativado.' : 'Acesso de ' + p.nome + ' reativado.');
      perfis.recarregar();
    } catch (e) {
      setErro(traduzir(e));
    } finally {
      setOcupado('');
    }
  }

  if (perfis.carregando) return <Carregando altura={320} />;
  if (perfis.erro) return <div style={{ marginTop: 26 }}><Erro mensagem={perfis.erro} aoTentar={perfis.recarregar} /></div>;

  const clientes = (perfis.dados || []).filter((p) => p.role === 'cliente');
  const lista = filtro === 'Todos' ? clientes
    : clientes.filter((p) => (filtro === 'Ativos' ? p.ativo : !p.ativo));

  return (
    <>
      {(erro || ok) && (
        <div style={{ marginTop: 22, maxWidth: 620 }}>
          {erro && <Erro mensagem={erro} />}
          {ok && <Aviso>{ok}</Aviso>}
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        {['Todos', 'Ativos', 'Desativados'].map((f) => (
          <Chip key={f} ativo={filtro === f} onClick={() => setFiltro(f)}>{f}</Chip>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: c.texto4 }}>
          {(emp.dados || []).length} empresas cadastradas
        </span>
      </div>

      {lista.length === 0 ? (
        <div style={{ marginTop: 18 }}>
          <Vazio
            titulo="Nenhum usuário nesta seleção"
            texto="Novos acessos são criados no painel do Supabase e vinculados a uma empresa."
            icone="pessoas"
          />
        </div>
      ) : (
        <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
          {lista.map((p) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px',
              ...card, borderRadius: 12, flexWrap: 'wrap',
              opacity: p.ativo ? 1 : 0.62
            }}>
              <span style={{
                flex: 'none', width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.22)',
                display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: c.roxo
              }}>{iniciais(p.nome)}</span>

              <span style={{ minWidth: 160, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{p.nome}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: c.texto4, marginTop: 3 }}>
                  {p.empresas?.razao_social || 'Sem empresa'}
                  {p.telefone ? ' · ' + p.telefone : ''}
                </span>
              </span>

              <span style={{
                flex: 'none', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999,
                color: p.ativo ? c.verdeTexto : '#b91c1c',
                background: p.ativo ? 'rgba(34, 192, 122, 0.12)' : 'rgba(220, 38, 38, 0.09)'
              }}>{p.ativo ? 'Ativo' : 'Desativado'}</span>

              <button
                onClick={() => alternar(p)} disabled={ocupado === p.id}
                style={{
                  flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 15px', borderRadius: 9, background: c.branco,
                  border: '1px solid ' + c.borda3, fontSize: 12.5, fontWeight: 600,
                  color: p.ativo ? '#b91c1c' : c.verdeTexto, cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                <Icone nome={p.ativo ? 'fechar' : 'check'} tamanho={14} largura={2.2} />
                {ocupado === p.id ? 'Aguarde...' : (p.ativo ? 'Desativar' : 'Reativar')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: 24, maxWidth: 640, padding: '18px 20px', borderRadius: 12,
        background: 'rgba(29, 95, 245, 0.05)', border: '1px solid rgba(29, 95, 245, 0.2)',
        display: 'flex', gap: 12
      }}>
        <Icone nome="info" tamanho={17} cor={c.azulEscuro} largura={2} style={{ flex: 'none', marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: c.texto2, textWrap: 'pretty' }}>
          A criação de novos acessos exige chave privilegiada e por isso acontece no
          painel do Supabase (Authentication) ou por uma rota de servidor — nunca pelo
          navegador. Aqui você ativa e desativa acessos já existentes.
        </p>
      </div>
    </>
  );
}

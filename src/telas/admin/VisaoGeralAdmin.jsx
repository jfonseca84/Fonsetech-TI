import { useNavigate } from 'react-router-dom';
import { c, card, PRIO_FG, horaBR } from '../../ui/tokens.js';
import { usarDados } from '../../dados/usarDados.js';
import { listarChamados, acoesRecentes } from '../../dados/consultas.js';
import { Carregando, Erro } from '../../ui/Estado.jsx';
import Kpi from '../../ui/Kpi.jsx';
import LinhaChamado from '../../ui/LinhaChamado.jsx';

const PRIOS = ['Urgente', 'Alta', 'Média', 'Baixa'];

export default function VisaoGeralAdmin() {
  const navegar = useNavigate();
  const ch = usarDados(listarChamados, [], []);
  const log = usarDados(() => acoesRecentes(6), [], []);

  if (ch.carregando) return <Carregando altura={320} />;
  if (ch.erro) return <div style={{ marginTop: 26 }}><Erro mensagem={ch.erro} aoTentar={ch.recarregar} /></div>;

  const lista = ch.dados || [];
  const abertos = lista.filter((x) => x.status !== 'Resolvido');
  const semResp = abertos.filter((x) => !x.responsavel_id);
  const urgentes = abertos.filter((x) => x.status === 'Urgente' || x.prioridade === 'Urgente');
  const hoje = new Date().toDateString();
  const resolvidosHoje = lista.filter((x) => x.resolvido_em && new Date(x.resolvido_em).toDateString() === hoje);
  const empresas = new Set(lista.map((x) => x.empresa_id));

  const fila = [...abertos].sort((a, b) => {
    const p = PRIOS.indexOf(a.prioridade) - PRIOS.indexOf(b.prioridade);
    return p !== 0 ? p : new Date(a.aberto_em) - new Date(b.aberto_em);
  }).slice(0, 5);

  const porPrio = PRIOS.map((p) => ({ p, n: abertos.filter((x) => x.prioridade === p).length }));
  const maior = Math.max(1, ...porPrio.map((x) => x.n));

  return (
    <>
      <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(178px, 1fr))', gap: 16 }}>
        <Kpi rotulo="FILA ABERTA" valor={abertos.length} dica="chamados ativos" tom={c.roxoClaro} />
        <Kpi rotulo="SEM RESPONSÁVEL" valor={semResp.length} dica="aguardando atribuição" tom="#f0a020" />
        <Kpi rotulo="URGENTES" valor={urgentes.length} dica="prioridade máxima" tom="#dc2626" />
        <Kpi rotulo="RESOLVIDOS HOJE" valor={resolvidosHoje.length} dica="concluídos no dia" tom={c.verde} />
        <Kpi rotulo="EMPRESAS ATIVAS" valor={empresas.size} dica="com chamados" tom={c.azul} />
      </div>

      <div className="fs-grid-2" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700 }}>Fila de atendimento</h2>
            <button
              onClick={() => navegar('/admin/chamados')}
              style={{ background: 'none', border: 0, fontSize: 12.5, fontWeight: 700, color: c.roxo, cursor: 'pointer', fontFamily: 'inherit' }}
            >Ver todos</button>
          </div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {fila.map((x) => (
              <LinhaChamado key={x.id} chamado={x} mostrarEmpresa aoAbrir={() => navegar('/admin/chamados')} />
            ))}
            {fila.length === 0 && (
              <p style={{ margin: 0, fontSize: 13, color: c.texto3 }}>Nenhum chamado aberto no momento.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ ...card, padding: '22px 24px' }}>
            <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700 }}>Por prioridade</h2>
            <div style={{ marginTop: 18, display: 'grid', gap: 13 }}>
              {porPrio.map(({ p, n }) => (
                <div key={p}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ fontWeight: 700, color: PRIO_FG[p] }}>{p}</span>
                    <span style={{ color: c.texto3 }}>{n}</span>
                  </div>
                  <div style={{ marginTop: 6, height: 7, borderRadius: 4, background: 'rgba(20, 45, 100, 0.07)', overflow: 'hidden' }}>
                    <div style={{
                      width: (n / maior * 100) + '%', height: '100%', borderRadius: 4,
                      background: PRIO_FG[p], opacity: 0.85, transition: 'width .4s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: '22px 24px' }}>
            <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700 }}>Últimas ações</h2>
            <div style={{ marginTop: 16, display: 'grid', gap: 13 }}>
              {(log.dados || []).map((a) => (
                <div key={a.id} style={{ display: 'flex', gap: 11 }}>
                  <span style={{ flex: 'none', width: 8, height: 8, borderRadius: '50%', background: c.roxoClaro, marginTop: 5 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2c3853', textWrap: 'pretty' }}>{a.texto}</div>
                    <div style={{ marginTop: 3, fontSize: 10.5, color: c.texto4 }}>
                      {a.chamados?.numero ? a.chamados.numero + ' · ' : ''}{a.autor_nome} · {horaBR(a.criado_em)}
                    </div>
                  </div>
                </div>
              ))}
              {(log.dados || []).length === 0 && (
                <p style={{ margin: 0, fontSize: 12.5, color: c.texto3 }}>Sem movimentações registradas.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

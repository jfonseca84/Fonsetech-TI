import { useNavigate } from 'react-router-dom';
import { c, card } from '../../ui/tokens.js';
import { usarDados } from '../../dados/usarDados.js';
import { listarChamados, listarAgendamentos } from '../../dados/consultas.js';
import { Carregando, Erro, Vazio } from '../../ui/Estado.jsx';
import Kpi from '../../ui/Kpi.jsx';
import LinhaChamado from '../../ui/LinhaChamado.jsx';
import Icone from '../../ui/Icone.jsx';

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export default function VisaoGeral() {
  const navegar = useNavigate();
  const ch = usarDados(listarChamados, [], []);
  const ag = usarDados(listarAgendamentos, [], []);

  if (ch.carregando) return <Carregando altura={320} />;
  if (ch.erro) return <div style={{ marginTop: 26 }}><Erro mensagem={ch.erro} aoTentar={ch.recarregar} /></div>;

  const lista = ch.dados || [];
  const abertos = lista.filter((x) => x.status !== 'Resolvido');
  const emAtend = lista.filter((x) => x.status === 'Em atendimento');
  const urgentes = lista.filter((x) => x.status === 'Urgente' || x.prioridade === 'Urgente');
  const resolvidos = lista.filter((x) => x.status === 'Resolvido');

  const proximos = (ag.dados || [])
    .filter((a) => a.status !== 'Cancelado' && new Date(a.data + 'T00:00:00') >= new Date(new Date().toDateString()))
    .slice(0, 3);

  return (
    <>
      <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
        <Kpi rotulo="CHAMADOS ABERTOS" valor={abertos.length} dica="aguardando conclusão" tom={c.azul} />
        <Kpi rotulo="EM ATENDIMENTO" valor={emAtend.length} dica="equipe trabalhando" tom="#38bdf8" />
        <Kpi rotulo="URGENTES" valor={urgentes.length} dica="prioridade máxima" tom="#dc2626" />
        <Kpi rotulo="RESOLVIDOS" valor={resolvidos.length} dica="histórico da empresa" tom={c.verde} />
      </div>

      <div className="fs-grid-2" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700 }}>Chamados recentes</h2>
            <button
              onClick={() => navegar('/dashboard/chamados')}
              style={{ background: 'none', border: 0, fontSize: 12.5, fontWeight: 700, color: c.azulEscuro, cursor: 'pointer', fontFamily: 'inherit' }}
            >Ver todos</button>
          </div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {lista.slice(0, 4).map((x) => (
              <LinhaChamado key={x.id} chamado={x} aoAbrir={() => navegar('/dashboard/chamados')} />
            ))}
            {lista.length === 0 && (
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: c.texto3 }}>
                Nenhum chamado registrado ainda. Use <strong>Abrir chamado</strong> para o primeiro registro.
              </p>
            )}
          </div>
        </div>

        <div style={{ ...card, padding: '22px 24px' }}>
          <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700 }}>Próximos agendamentos</h2>
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {proximos.map((a) => {
              const d = new Date(a.data + 'T00:00:00');
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <span style={{
                    flex: 'none', width: 46, height: 46, borderRadius: 11,
                    background: 'rgba(29, 95, 245, 0.08)', border: '1px solid rgba(29, 95, 245, 0.16)',
                    display: 'grid', placeItems: 'center', lineHeight: 1
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: c.azulEscuro }}>{String(d.getDate()).padStart(2, '0')}</span>
                    <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.6, color: c.texto4, marginTop: 2 }}>{MESES[d.getMonth()]}</span>
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>
                      {a.tipo === 'visita' ? 'Visita técnica' : 'Reunião ' + (a.formato || '').toLowerCase()}
                    </span>
                    <span style={{ display: 'block', fontSize: 11.5, color: c.texto4, marginTop: 3 }}>
                      {(a.hora || '').slice(0, 5)} · {a.assunto}
                    </span>
                  </span>
                </div>
              );
            })}
            {proximos.length === 0 && (
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: c.texto3 }}>
                Sem agendamentos futuros. Solicite uma visita ou reunião na aba Agendamentos.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

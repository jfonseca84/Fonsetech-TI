import { useState } from 'react';
import { c, card, dataBR } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { listarAgendamentos, atualizarAgendamento } from '../../dados/consultas.js';
import { Carregando, Erro, Vazio, Aviso } from '../../ui/Estado.jsx';
import Chip from '../../ui/Chip.jsx';
import Icone from '../../ui/Icone.jsx';

const TONS_AG = {
  'Solicitado': { fg: '#a16207', bg: 'rgba(240, 160, 32, 0.14)' },
  'Confirmado': { fg: '#14804a', bg: 'rgba(34, 192, 122, 0.12)' },
  'Concluído':  { fg: '#55637f', bg: 'rgba(20, 45, 100, 0.07)' },
  'Cancelado':  { fg: '#b91c1c', bg: 'rgba(220, 38, 38, 0.09)' }
};

export default function AgendaAdmin() {
  const { dados, carregando, erro, recarregar } = usarDados(listarAgendamentos, [], []);
  const [filtro, setFiltro] = useState('Solicitado');
  const [msg, setMsg] = useState('');
  const [falha, setFalha] = useState('');
  const [ocupado, setOcupado] = useState('');

  async function mudar(a, status) {
    setMsg('');
    setFalha('');
    setOcupado(a.id);
    try {
      await atualizarAgendamento(a.id, { status });
      setMsg('Agendamento marcado como ' + status.toLowerCase() + '.');
      recarregar();
    } catch (e) {
      setFalha(traduzir(e));
    } finally {
      setOcupado('');
    }
  }

  if (carregando) return <Carregando altura={320} />;
  if (erro) return <div style={{ marginTop: 26 }}><Erro mensagem={erro} aoTentar={recarregar} /></div>;

  const lista = filtro === 'Todos' ? dados : dados.filter((a) => a.status === filtro);

  return (
    <>
      {(msg || falha) && (
        <div style={{ marginTop: 22, maxWidth: 620 }}>
          {falha && <Erro mensagem={falha} />}
          {msg && <Aviso>{msg}</Aviso>}
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        {['Solicitado', 'Confirmado', 'Concluído', 'Todos'].map((f) => (
          <Chip key={f} ativo={filtro === f} onClick={() => setFiltro(f)}>{f}</Chip>
        ))}
      </div>

      {lista.length === 0 ? (
        <div style={{ marginTop: 18 }}>
          <Vazio titulo="Nenhum agendamento nesta seleção" texto="As solicitações dos clientes aparecem aqui." icone="agenda" />
        </div>
      ) : (
        <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
          {lista.map((a) => {
            const t = TONS_AG[a.status] || TONS_AG['Solicitado'];
            const visita = a.tipo === 'visita';
            return (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px',
                ...card, borderRadius: 12, flexWrap: 'wrap'
              }}>
                <span style={{
                  flex: 'none', width: 40, height: 40, borderRadius: 11,
                  background: visita ? 'rgba(29, 95, 245, 0.08)' : 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid ' + (visita ? 'rgba(29, 95, 245, 0.18)' : 'rgba(124, 58, 237, 0.2)'),
                  display: 'grid', placeItems: 'center'
                }}>
                  <Icone nome={visita ? 'pino' : 'video'} tamanho={18} cor={visita ? c.azulEscuro : c.roxo} />
                </span>

                <span style={{ minWidth: 180, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>
                    {visita ? 'Visita técnica' : 'Reunião ' + (a.formato || '').toLowerCase()}
                    {' — '}{a.empresas?.razao_social}
                  </span>
                  <span style={{ display: 'block', fontSize: 11.5, color: c.texto4, marginTop: 3 }}>
                    {dataBR(a.data + 'T00:00:00')} · {(a.hora || '').slice(0, 5)} · {a.assunto}
                    {a.endereco ? ' · ' + a.endereco : ''}
                  </span>
                </span>

                <span style={{
                  flex: 'none', fontSize: 11, fontWeight: 700, padding: '5px 10px',
                  borderRadius: 999, color: t.fg, background: t.bg
                }}>{a.status}</span>

                {a.status !== 'Cancelado' && a.status !== 'Concluído' && (
                  <span style={{ flex: 'none', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {a.status === 'Solicitado' && (
                      <button
                        onClick={() => mudar(a, 'Confirmado')} disabled={ocupado === a.id}
                        style={{
                          padding: '10px 15px', borderRadius: 9, background: c.roxo, color: c.branco,
                          border: 0, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                        }}
                      >Confirmar</button>
                    )}
                    <button
                      onClick={() => mudar(a, 'Concluído')} disabled={ocupado === a.id}
                      style={{
                        padding: '10px 15px', borderRadius: 9, background: c.branco, color: '#2c3853',
                        border: '1px solid ' + c.borda3, fontSize: 12.5, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >Concluir</button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import { c, card, botao, dataBR } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import {
  listarAgendamentos,
  atualizarAgendamento,
  solicitarAgendamento,
  excluirAgendamento,
  listarEmpresas,
  criarLancamentoFinanceiro,
  registrarAuditoria
} from '../../dados/consultas.js';
import { Carregando, Erro, Vazio, Aviso } from '../../ui/Estado.jsx';
import Chip from '../../ui/Chip.jsx';
import Icone from '../../ui/Icone.jsx';
import Campo from '../../ui/Campo.jsx';
import { BotaoWhatsapp } from '../../lib/whatsapp.jsx';

const TONS_AG = {
  'solicitado': { fg: '#a16207', bg: 'rgba(240, 160, 32, 0.14)' },
  'confirmado': { fg: '#14804a', bg: 'rgba(34, 192, 122, 0.12)' },
  'concluido':  { fg: '#55637f', bg: 'rgba(20, 45, 100, 0.07)' },
  'cancelado':  { fg: '#b91c1c', bg: 'rgba(220, 38, 38, 0.09)' },
  'Solicitado': { fg: '#a16207', bg: 'rgba(240, 160, 32, 0.14)' },
  'Confirmado': { fg: '#14804a', bg: 'rgba(34, 192, 122, 0.12)' },
  'Concluído':  { fg: '#55637f', bg: 'rgba(20, 45, 100, 0.07)' },
  'Cancelado':  { fg: '#b91c1c', bg: 'rgba(220, 38, 38, 0.09)' }
};

export default function AgendaAdmin() {
  const agendamentosReq = usarDados(listarAgendamentos, [], []);
  const empresasReq = usarDados(listarEmpresas, [], []);

  const [filtro, setFiltro] = useState('Todos');
  const [msg, setMsg] = useState('');
  const [falha, setFalha] = useState('');
  const [ocupado, setOcupado] = useState('');

  // Modal Novo Agendamento
  const [modalNovo, setModalNovo] = useState(false);
  const [novoAg, setNovoAg] = useState({
    empresa_id: '',
    tipo: 'visita', // 'visita' | 'reuniao'
    data: new Date().toISOString().split('T')[0],
    hora: '09:00',
    duracao_minutos: 60,
    modalidade: 'presencial',
    formato: 'Presencial',
    assunto: '',
    endereco: '',
    contato_nome: '',
    contato_whatsapp: '',
    observacoes: '',
    cobranca_tipo: 'incluso_plano', // 'incluso_plano' | 'servico_adicional'
    cobranca_valor: 180.00
  });
  const [salvando, setSalvando] = useState(false);

  const dados = agendamentosReq.dados || [];
  const empresas = empresasReq.dados || [];

  async function mudar(a, status) {
    setMsg('');
    setFalha('');
    setOcupado(a.id);
    try {
      const jaCobrado = Boolean(a.cobranca_gerada || a.status === 'concluido');
      await atualizarAgendamento(a.id, {
        status,
        ...(status === 'concluido' && a.cobranca_tipo === 'servico_adicional' && Number(a.cobranca_valor) > 0 ? { cobranca_gerada: true } : {})
      });

      // Se foi concluída e tem cobrança de serviço adicional, cria o lançamento financeiro apenas 1 vez (idempotente)
      if (status === 'concluido' && a.cobranca_tipo === 'servico_adicional' && Number(a.cobranca_valor) > 0 && !jaCobrado) {
        await criarLancamentoFinanceiro({
          empresa_id: a.empresa_id,
          descricao: `Visita Técnica Presencial: ${a.assunto}`,
          valor: Number(a.cobranca_valor),
          data_vencimento: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          categoria: 'Visita Técnica',
          forma_pagamento: 'Boleto Bancário',
          status: 'pendente'
        });
        setMsg(`Agendamento concluído e cobrança de R$ ${Number(a.cobranca_valor).toFixed(2)} gerada no financeiro!`);
      } else if (status === 'concluido' && a.cobranca_tipo === 'servico_adicional' && jaCobrado) {
        setMsg('Agendamento já havia sido concluído anteriormente (cobrança já registrada).');
      } else {
        setMsg('Agendamento marcado como ' + status + '.');
      }

      await registrarAuditoria({
        empresaId: a.empresa_id,
        acao: `Alterou status do agendamento "${a.assunto}" para ${status}`,
        recurso: 'Agenda'
      });

      agendamentosReq.recarregar();
    } catch (e) {
      setFalha(traduzir(e));
    } finally {
      setOcupado('');
    }
  }

  async function handleCriarAgendamento(e) {
    e.preventDefault();
    if (!novoAg.empresa_id || !novoAg.assunto) {
      alert('Selecione a empresa cliente e preencha o assunto.');
      return;
    }
    setSalvando(true);
    try {
      const emp = empresas.find(item => item.id === novoAg.empresa_id);
      await solicitarAgendamento({
        ...novoAg,
        formato: novoAg.modalidade === 'presencial' ? 'Presencial' : 'Online',
        endereco: novoAg.endereco || emp?.endereco || 'Sede da Empresa',
        contato_nome: novoAg.contato_nome || emp?.responsavel_nome || '',
        contato_whatsapp: novoAg.contato_whatsapp || emp?.whatsapp || '',
        status: 'confirmado'
      });

      await registrarAuditoria({
        empresaId: novoAg.empresa_id,
        acao: `Agendou visita técnica/reunião para ${emp?.razao_social}: ${novoAg.assunto}`,
        recurso: 'Agenda'
      });

      setMsg(`Agendamento confirmado para ${emp?.razao_social}!`);
      setModalNovo(false);
      setNovoAg({
        empresa_id: '',
        tipo: 'visita',
        data: new Date().toISOString().split('T')[0],
        hora: '09:00',
        duracao_minutos: 60,
        modalidade: 'presencial',
        formato: 'Presencial',
        assunto: '',
        endereco: '',
        contato_nome: '',
        contato_whatsapp: '',
        observacoes: '',
        cobranca_tipo: 'incluso_plano',
        cobranca_valor: 180.00
      });
      agendamentosReq.recarregar();
    } catch (err) {
      alert('Erro ao criar agendamento: ' + err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id) {
    if (!confirm('Deseja realmente excluir este agendamento?')) return;
    try {
      await excluirAgendamento(id);
      agendamentosReq.recarregar();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  if (agendamentosReq.carregando && empresasReq.carregando) return <Carregando altura={320} />;
  if (agendamentosReq.erro) return <div style={{ marginTop: 26 }}><Erro mensagem={agendamentosReq.erro} aoTentar={agendamentosReq.recarregar} /></div>;

  const lista = filtro === 'Todos' ? dados : dados.filter((a) => a.status?.toLowerCase() === filtro.toLowerCase());

  return (
    <>
      {(msg || falha) && (
        <div style={{ marginTop: 22, maxWidth: 680 }}>
          {falha && <Erro mensagem={falha} />}
          {msg && <Aviso>{msg}</Aviso>}
        </div>
      )}

      {/* BARRA SUPERIOR */}
      <div style={{
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          {['Todos', 'Confirmado', 'Solicitado', 'Concluido', 'Cancelado'].map((f) => (
            <Chip key={f} ativo={filtro === f} onClick={() => setFiltro(f)}>{f}</Chip>
          ))}
        </div>

        <button
          onClick={() => setModalNovo(true)}
          style={{
            ...botao.primario,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            padding: '9px 18px'
          }}
        >
          <Icone nome="mais" tamanho={16} cor="#ffffff" />
          <span>Nova Visita Técnica / Reunião</span>
        </button>
      </div>

      {lista.length === 0 ? (
        <div style={{ marginTop: 20 }}>
          <Vazio titulo="Nenhum agendamento nesta seleção" texto="Agende visitas técnicas presenciais ou reuniões para empresas clientes." icone="agenda" />
        </div>
      ) : (
        <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
          {lista.map((a) => {
            const t = TONS_AG[a.status] || TONS_AG['solicitado'];
            const visita = a.tipo === 'visita';
            const contatoWhats = a.contato_whatsapp || a.empresas?.whatsapp;

            return (
              <div key={a.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                ...card,
                borderRadius: 12,
                flexWrap: 'wrap',
                borderLeft: '4px solid ' + (visita ? c.azul : c.roxo)
              }}>
                <span style={{
                  flex: 'none', width: 44, height: 44, borderRadius: 12,
                  background: visita ? 'rgba(29, 95, 245, 0.08)' : 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid ' + (visita ? 'rgba(29, 95, 245, 0.18)' : 'rgba(124, 58, 237, 0.2)'),
                  display: 'grid', placeItems: 'center'
                }}>
                  <Icone nome={visita ? 'pino' : 'video'} tamanho={20} cor={visita ? c.azulEscuro : c.roxo} />
                </span>

                <div style={{ minWidth: 220, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: c.tinta }}>
                      {a.assunto}
                    </span>
                    <span style={{ fontSize: 13, color: c.cinza }}>
                      — {a.empresas?.razao_social || 'Empresa Cliente'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: c.cinza, marginTop: 5 }}>
                    <span>📅 {dataBR(a.data + 'T00:00:00')} às {a.hora?.slice(0, 5)} ({a.duracao_minutos || 60} min)</span>
                    <span>📍 {a.formato || (visita ? 'Presencial' : 'Online')} - {a.endereco}</span>
                    {a.contato_nome && <span>👤 Contato: {a.contato_nome}</span>}
                  </div>

                  {a.cobranca_tipo === 'servico_adicional' && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                      Cobrança Adicional: R$ {Number(a.cobranca_valor || 0).toFixed(2)} (Não incluso no plano)
                    </div>
                  )}
                </div>

                <span style={{
                  flex: 'none', fontSize: 11, fontWeight: 700, padding: '5px 12px',
                  borderRadius: 999, color: t.fg, background: t.bg
                }}>
                  {a.status?.toUpperCase()}
                </span>

                {/* BOTÕES DE AÇÃO E WHATSAPP */}
                <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {contatoWhats && (
                    <BotaoWhatsapp
                      numero={contatoWhats}
                      compacto
                      rotulo="Avisar WhatsApp"
                      mensagem={`Olá ${a.contato_nome || ''}! Confirmamos o agendamento da Fonsetech TI:\n\n*${a.assunto}*\nData: ${dataBR(a.data + 'T00:00:00')} às ${a.hora?.slice(0, 5)}\nLocal: ${a.endereco}\n\nQualquer dúvida, fale conosco!`}
                    />
                  )}

                  {a.status?.toLowerCase() === 'solicitado' && (
                    <button
                      onClick={() => mudar(a, 'confirmado')}
                      disabled={ocupado === a.id}
                      style={{
                        padding: '8px 14px', borderRadius: 8, background: c.azul, color: '#ffffff',
                        border: 0, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Confirmar
                    </button>
                  )}

                  {a.status?.toLowerCase() !== 'concluido' && a.status?.toLowerCase() !== 'cancelado' && (
                    <button
                      onClick={() => mudar(a, 'concluido')}
                      disabled={ocupado === a.id}
                      style={{
                        padding: '8px 14px', borderRadius: 8, background: '#ecfdf5', color: '#065f46',
                        border: '1px solid #a7f3d0', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Concluir
                    </button>
                  )}

                  {a.status?.toLowerCase() !== 'cancelado' && (
                    <button
                      onClick={() => mudar(a, 'cancelado')}
                      disabled={ocupado === a.id}
                      style={{
                        padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c',
                        border: '1px solid #fecaca', fontSize: 12, cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                  )}

                  <button
                    onClick={() => handleExcluir(a.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 6
                    }}
                    title="Remover"
                  >
                    <Icone nome="lixeira" tamanho={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NOVO AGENDAMENTO */}
      {modalNovo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: 24,
            width: '100%',
            maxWidth: 660,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.tinta }}>Agendar Visita Técnica ou Reunião</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: c.cinza }}>Controle direto de agenda pelo administrador Fonsetech.</p>
              </div>
              <button onClick={() => setModalNovo(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.cinza }}>
                <Icone nome="fechar" tamanho={20} />
              </button>
            </div>

            <form onSubmit={handleCriarAgendamento}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Empresa Cliente</label>
                  <select
                    value={novoAg.empresa_id}
                    onChange={e => {
                      const empId = e.target.value;
                      const emp = empresas.find(item => item.id === empId);
                      setNovoAg({
                        ...novoAg,
                        empresa_id: empId,
                        endereco: emp?.endereco || novoAg.endereco,
                        contato_nome: emp?.responsavel_nome || novoAg.contato_nome,
                        contato_whatsapp: emp?.whatsapp || novoAg.contato_whatsapp
                      });
                    }}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                    required
                  >
                    <option value="">Selecione a empresa atendida...</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.razao_social} (Plano: {e.plano || 'Profissional'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Tipo de Compromisso</label>
                  <select
                    value={novoAg.tipo}
                    onChange={e => setNovoAg({ ...novoAg, tipo: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                  >
                    <option value="visita">Visita Técnica Presencial</option>
                    <option value="reuniao">Reunião de Alinhamento</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Modalidade</label>
                  <select
                    value={novoAg.modalidade}
                    onChange={e => setNovoAg({ ...novoAg, modalidade: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                  >
                    <option value="presencial">Presencial no Cliente</option>
                    <option value="online">Online (Google Meet / Teams)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo rotulo="Assunto / Motivo da Visita" valor={novoAg.assunto} onChange={v => setNovoAg({ ...novoAg, assunto: v })} placeholder="Ex: Manutenção preventiva em servidores e troca de switch" obrigatorio />
                </div>

                <Campo rotulo="Data" tipo="date" valor={novoAg.data} onChange={v => setNovoAg({ ...novoAg, data: v })} obrigatorio />
                <Campo rotulo="Horário de Início" tipo="time" valor={novoAg.hora} onChange={v => setNovoAg({ ...novoAg, hora: v })} obrigatorio />
                <Campo rotulo="Duração Prevista (min)" tipo="number" valor={novoAg.duracao_minutos} onChange={v => setNovoAg({ ...novoAg, duracao_minutos: Number(v) || 60 })} />

                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo rotulo="Endereço ou Link da Reunião" valor={novoAg.endereco} onChange={v => setNovoAg({ ...novoAg, endereco: v })} placeholder="Rua, número, sala ou link do Meet" />
                </div>

                <Campo rotulo="Contato no Local (Nome)" valor={novoAg.contato_nome} onChange={v => setNovoAg({ ...novoAg, contato_nome: v })} />
                <Campo rotulo="WhatsApp do Contato" valor={novoAg.contato_whatsapp} onChange={v => setNovoAg({ ...novoAg, contato_whatsapp: v })} dica="Ex: (51) 98888-1234" />

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Regra de Faturamento</label>
                  <select
                    value={novoAg.cobranca_tipo}
                    onChange={e => setNovoAg({ ...novoAg, cobranca_tipo: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                  >
                    <option value="incluso_plano">Incluso no Plano Contratado</option>
                    <option value="servico_adicional">Gerar Cobrança Adicional</option>
                  </select>
                </div>

                {novoAg.cobranca_tipo === 'servico_adicional' && (
                  <Campo rotulo="Valor Cobrado da Visita (R$)" tipo="number" valor={novoAg.cobranca_valor} onChange={v => setNovoAg({ ...novoAg, cobranca_valor: Number(v) || 0 })} />
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Observações Técnicas / Equipamentos Necessários</label>
                <textarea
                  rows={3}
                  value={novoAg.observacoes}
                  onChange={e => setNovoAg({ ...novoAg, observacoes: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + c.borda, fontSize: 13, fontFamily: 'inherit' }}
                  placeholder="Levar testador de cabo de rede, alicate de crimpagem e roteador de backup..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setModalNovo(false)} style={botao.secundario}>Cancelar</button>
                <button type="submit" disabled={salvando} style={botao.primario}>
                  {salvando ? 'Agendando...' : 'Confirmar e Salvar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

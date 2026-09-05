import { useState, useMemo } from 'react';
import { c, card, botao } from '../../ui/tokens.js';
import { usarDados } from '../../dados/usarDados.js';
import {
  listarLancamentosFinanceiros,
  criarLancamentoFinanceiro,
  atualizarLancamentoFinanceiro,
  excluirLancamentoFinanceiro,
  listarEmpresas,
  listarPlanos,
  registrarAuditoria
} from '../../dados/consultas.js';
import { Carregando, Vazio, Aviso } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';
import Chip from '../../ui/Chip.jsx';
import Campo from '../../ui/Campo.jsx';
import { BotaoWhatsapp } from '../../lib/whatsapp.jsx';

export default function FinanceiroAdmin() {
  const lancamentosReq = usarDados(listarLancamentosFinanceiros, [], []);
  const empresasReq = usarDados(listarEmpresas, [], []);
  const planosReq = usarDados(listarPlanos, [], []);

  const [abaAtiva, setAbaAtiva] = useState('lancamentos'); // 'lancamentos' | 'planos' | 'resumo'
  const [filtroStatus, setFiltroStatus] = useState('todos'); // todos, pendente, pago, vencido
  const [empresaFiltro, setEmpresaFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const [notificacao, setNotificacao] = useState('');

  // Modal Novo Lançamento
  const [modalNovo, setModalNovo] = useState(false);
  const [novoLancamento, setNovoLancamento] = useState({
    empresa_id: '',
    descricao: '',
    valor: 599.00,
    data_vencimento: new Date().toISOString().split('T')[0],
    categoria: 'Mensalidade',
    forma_pagamento: 'Boleto Bancário',
    status: 'pendente',
    observacoes: ''
  });
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);

  const lancamentos = lancamentosReq.dados || [];
  const empresas = empresasReq.dados || [];
  const planos = planosReq.dados || [];

  // Cálculos de Totais
  const metricas = useMemo(() => {
    const lancamentos = lancamentosReq.dados || [];
    const empresas = empresasReq.dados || [];
    let totalPrevisto = 0;
    let totalPago = 0;
    let totalVencido = 0;
    let totalPendente = 0;

    lancamentos.forEach(l => {
      const v = Number(l.valor) || 0;
      totalPrevisto += v;
      if (l.status === 'pago') totalPago += v;
      else if (l.status === 'vencido') totalVencido += v;
      else totalPendente += v;
    });

    // MRR: soma dos valores mensais das empresas ativas
    const mrr = empresas.filter(e => e.ativo).reduce((sum, e) => sum + (Number(e.valor_mensal) || 0), 0);

    return { totalPrevisto, totalPago, totalVencido, totalPendente, mrr };
  }, [lancamentosReq.dados, empresasReq.dados]);

  // Filtragem
  const lancamentosFiltrados = useMemo(() => {
    const lancamentos = lancamentosReq.dados || [];
    const t = busca.toLowerCase().trim();
    return lancamentos.filter(l => {
      const matchBusca = !t ||
        l.descricao?.toLowerCase().includes(t) ||
        l.empresas?.razao_social?.toLowerCase().includes(t);
      const matchStatus = filtroStatus === 'todos' || l.status === filtroStatus;
      const matchEmp = empresaFiltro === 'todas' || l.empresa_id === empresaFiltro;
      return matchBusca && matchStatus && matchEmp;
    });
  }, [lancamentosReq.dados, busca, filtroStatus, empresaFiltro]);

  async function handleCriarLancamento(e) {
    e.preventDefault();
    if (!novoLancamento.empresa_id || !novoLancamento.descricao) {
      alert('Selecione a empresa e informe a descrição.');
      return;
    }
    setSalvandoLancamento(true);
    try {
      await criarLancamentoFinanceiro({
        ...novoLancamento,
        valor: Number(novoLancamento.valor) || 0
      });
      const emp = empresas.find(e => e.id === novoLancamento.empresa_id);
      await registrarAuditoria({
        empresaId: novoLancamento.empresa_id,
        acao: `Criou lançamento financeiro: ${novoLancamento.descricao} (R$ ${novoLancamento.valor})`,
        recurso: 'Financeiro'
      });
      setNotificacao(`Lançamento para "${emp?.razao_social || 'Cliente'}" registrado com sucesso!`);
      setModalNovo(false);
      setNovoLancamento({
        empresa_id: '',
        descricao: '',
        valor: 599.00,
        data_vencimento: new Date().toISOString().split('T')[0],
        categoria: 'Mensalidade',
        forma_pagamento: 'Boleto Bancário',
        status: 'pendente',
        observacoes: ''
      });
      lancamentosReq.recarregar();
      setTimeout(() => setNotificacao(''), 4000);
    } catch (err) {
      alert('Erro ao registrar lançamento: ' + err.message);
    } finally {
      setSalvandoLancamento(false);
    }
  }

  async function handleMudarStatus(id, novoStatus) {
    try {
      const dataPagamento = novoStatus === 'pago' ? new Date().toISOString().split('T')[0] : null;
      await atualizarLancamentoFinanceiro(id, {
        status: novoStatus,
        data_pagamento: dataPagamento
      });
      lancamentosReq.recarregar();
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  }

  async function handleExcluir(id) {
    if (!confirm('Deseja realmente remover este lançamento financeiro?')) return;
    try {
      await excluirLancamentoFinanceiro(id);
      lancamentosReq.recarregar();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  if (lancamentosReq.carregando && empresasReq.carregando) return <Carregando altura={320} />;

  return (
    <>
      {notificacao && (
        <div style={{ marginTop: 18, maxWidth: 680 }}>
          <Aviso>{notificacao}</Aviso>
        </div>
      )}

      {/* CARDS DE RESUMO FINANCEIRO */}
      <div style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14
      }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 600, textTransform: 'uppercase' }}>MRR (Mensalidades Contratadas)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: c.azul, marginTop: 4 }}>
            R$ {metricas.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <span style={{ fontSize: 12, fontWeight: 500, color: c.cinza }}>/mês</span>
          </div>
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 600, textTransform: 'uppercase' }}>Total Recebido / Pago</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            R$ {metricas.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 600, textTransform: 'uppercase' }}>A Receber / Pendente</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            R$ {metricas.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 600, textTransform: 'uppercase' }}>Em Atraso / Vencidos</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            R$ {metricas.totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS: LANÇAMENTOS x PLANOS */}
      <div style={{
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
          <button
            onClick={() => setAbaAtiva('lancamentos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: abaAtiva === 'lancamentos' ? '#ffffff' : 'transparent',
              color: abaAtiva === 'lancamentos' ? c.azul : c.cinza,
              boxShadow: abaAtiva === 'lancamentos' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Icone nome="cifrao" tamanho={16} />
            <span>Contas a Receber ({lancamentos.length})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('planos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: abaAtiva === 'planos' ? '#ffffff' : 'transparent',
              color: abaAtiva === 'planos' ? c.azul : c.cinza,
              boxShadow: abaAtiva === 'planos' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Icone nome="predio" tamanho={16} />
            <span>Planos de Suporte ({planos.length})</span>
          </button>
        </div>

        {abaAtiva === 'lancamentos' && (
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
            <span>Novo Lançamento</span>
          </button>
        )}
      </div>

      {/* ABA LANÇAMENTOS */}
      {abaAtiva === 'lancamentos' && (
        <div style={{ marginTop: 16 }}>
          {/* BARRA DE FILTROS */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, maxWidth: 380 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#ffffff',
                border: '1px solid ' + c.borda,
                borderRadius: 8,
                padding: '0 12px',
                width: '100%',
                height: 40
              }}>
                <Icone nome="busca" tamanho={16} cor={c.cinza} />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou empresa..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={empresaFiltro}
                onChange={e => setEmpresaFiltro(e.target.value)}
                style={{
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid ' + c.borda,
                  fontSize: 13,
                  background: '#ffffff'
                }}
              >
                <option value="todas">Todas as Empresas</option>
                {empresas.map(e => (
                  <option key={e.id} value={e.id}>{e.razao_social}</option>
                ))}
              </select>

              {['todos', 'pendente', 'pago', 'vencido'].map(st => (
                <Chip
                  key={st}
                  ativo={filtroStatus === st}
                  onClick={() => setFiltroStatus(st)}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </Chip>
              ))}
            </div>
          </div>

          {/* TABELA DE LANÇAMENTOS */}
          {lancamentosFiltrados.length === 0 ? (
            <Vazio
              titulo="Nenhum lançamento financeiro nesta seleção"
              texto="Crie um novo lançamento ou altere os filtros de busca."
              icone="cifrao"
            />
          ) : (
            <div style={{ ...card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid ' + c.borda, textAlign: 'left', color: c.cinza }}>
                    <th style={{ padding: '12px 14px' }}>Empresa / Descrição</th>
                    <th style={{ padding: '12px 14px' }}>Categoria</th>
                    <th style={{ padding: '12px 14px' }}>Vencimento</th>
                    <th style={{ padding: '12px 14px' }}>Valor</th>
                    <th style={{ padding: '12px 14px' }}>Forma</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Ações / Notificação</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentosFiltrados.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid ' + c.borda }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: c.tinta }}>
                          {l.empresas?.razao_social || 'Empresa não vinculada'}
                        </div>
                        <div style={{ fontSize: 12, color: c.cinza, marginTop: 2 }}>
                          {l.descricao}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: c.cinza }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#f1f5f9',
                          color: c.tinta
                        }}>
                          {l.categoria}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: c.tinta, fontWeight: 500 }}>
                        {l.data_vencimento}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: c.tinta, fontSize: 14 }}>
                        R$ {Number(l.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 14px', color: c.cinza }}>
                        {l.forma_pagamento || 'Boleto'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: l.status === 'pago' ? '#ecfdf5' : l.status === 'vencido' ? '#fef2f2' : '#eff6ff',
                          color: l.status === 'pago' ? '#065f46' : l.status === 'vencido' ? '#991b1b' : '#1e40af'
                        }}>
                          {l.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {l.empresas?.whatsapp && l.status !== 'pago' && (
                            <BotaoWhatsapp
                              numero={l.empresas.whatsapp}
                              compacto
                              iconeApenas
                              mensagem={`Olá! Segue o lembrete da fatura da Fonsetech TI para ${l.empresas.razao_social}:\n\n*${l.descricao}*\nValor: R$ ${Number(l.valor).toFixed(2)}\nVencimento: ${l.data_vencimento}\n\nQualquer dúvida, estamos à disposição!`}
                            />
                          )}

                          {l.status !== 'pago' ? (
                            <button
                              onClick={() => handleMudarStatus(l.id, 'pago')}
                              style={{
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#065f46',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Dar Baixa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMudarStatus(l.id, 'pendente')}
                              style={{
                                background: '#f8fafc',
                                border: '1px solid ' + c.borda,
                                color: c.cinza,
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 11,
                                cursor: 'pointer'
                              }}
                            >
                              Reabrir
                            </button>
                          )}

                          <button
                            onClick={() => handleExcluir(l.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: 4
                            }}
                            title="Excluir Lançamento"
                          >
                            <Icone nome="lixeira" tamanho={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA GESTÃO DE PLANOS */}
      {abaAtiva === 'planos' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {planos.map(plano => {
              const empresasNoPlano = empresas.filter(e => e.plano === plano.nome);
              const receitaPlano = empresasNoPlano.reduce((sum, e) => sum + (Number(e.valor_mensal) || 0), 0);

              return (
                <div key={plano.id} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: c.tinta }}>
                        Plano {plano.nome}
                      </h4>
                      <div style={{ fontSize: 12, color: c.cinza, marginTop: 2 }}>
                        {plano.descricao}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      background: '#eff6ff',
                      color: c.azul
                    }}>
                      R$ {Number(plano.valor_mensal || 0).toFixed(2)}/mês
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: c.tinta, display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }}>
                    <div><strong>Máquinas inclusas:</strong> Até {plano.limite_maquinas || 'Ilimitadas'}</div>
                    <div><strong>Visitas presenciais:</strong> {plano.visitas_inclusas || 0} visita(s) / mês</div>
                    <div><strong>SLA de Atendimento:</strong> {plano.sla_horas ? `${plano.sla_horas} horas úteis` : 'Prioritário'}</div>
                  </div>

                  <div style={{
                    marginTop: 'auto',
                    paddingTop: 14,
                    borderTop: '1px solid ' + c.borda,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12
                  }}>
                    <span style={{ color: c.cinza }}>
                      <strong>{empresasNoPlano.length}</strong> empresa(s) cliente(s)
                    </span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>
                      R$ {receitaPlano.toFixed(2)}/mês
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL NOVO LANÇAMENTO */}
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
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.tinta }}>Novo Lançamento Financeiro</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: c.cinza }}>Cobrança ou fatura para cliente Fonsetech.</p>
              </div>
              <button onClick={() => setModalNovo(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.cinza }}>
                <Icone nome="fechar" tamanho={20} />
              </button>
            </div>

            <form onSubmit={handleCriarLancamento}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Empresa Cliente</label>
                  <select
                    value={novoLancamento.empresa_id}
                    onChange={e => {
                      const empId = e.target.value;
                      const selecionada = empresas.find(emp => emp.id === empId);
                      setNovoLancamento({
                        ...novoLancamento,
                        empresa_id: empId,
                        valor: selecionada ? (Number(selecionada.valor_mensal) || 599.00) : novoLancamento.valor
                      });
                    }}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                    required
                  >
                    <option value="">Selecione uma empresa cliente...</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.razao_social} (Plano: {e.plano || 'Profissional'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo rotulo="Descrição da Cobrança" valor={novoLancamento.descricao} onChange={v => setNovoLancamento({ ...novoLancamento, descricao: v })} placeholder="Ex: Mensalidade de Suporte TI - Setembro/2026" obrigatorio />
                </div>

                <Campo rotulo="Valor (R$)" tipo="number" valor={novoLancamento.valor} onChange={v => setNovoLancamento({ ...novoLancamento, valor: v })} obrigatorio />
                <Campo rotulo="Data de Vencimento" tipo="date" valor={novoLancamento.data_vencimento} onChange={v => setNovoLancamento({ ...novoLancamento, data_vencimento: v })} obrigatorio />

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Categoria</label>
                  <select
                    value={novoLancamento.categoria}
                    onChange={e => setNovoLancamento({ ...novoLancamento, categoria: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                  >
                    <option value="Mensalidade">Mensalidade Contrato</option>
                    <option value="Serviço Adicional">Serviço Adicional de TI</option>
                    <option value="Visita Técnica">Visita Técnica Presencial Extra</option>
                    <option value="Equipamento">Venda / Troca de Peças</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Forma de Pagamento</label>
                  <select
                    value={novoLancamento.forma_pagamento}
                    onChange={e => setNovoLancamento({ ...novoLancamento, forma_pagamento: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                  >
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Pix">Pix</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setModalNovo(false)} style={botao.secundario}>Cancelar</button>
                <button type="submit" disabled={salvandoLancamento} style={botao.primario}>
                  {salvandoLancamento ? 'Salvando...' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

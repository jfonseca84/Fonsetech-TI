import { useState, useMemo } from 'react';
import { c, card, botao } from '../../ui/tokens.js';
import { usarDados } from '../../dados/usarDados.js';
import {
  listarCrmLeads,
  criarCrmLead,
  atualizarCrmLead,
  excluirCrmLead,
  converterLeadEmCliente,
  listarPropostas,
  criarProposta,
  registrarAuditoria
} from '../../dados/consultas.js';
import { Carregando, Aviso } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';
import Campo from '../../ui/Campo.jsx';
import { BotaoWhatsapp } from '../../lib/whatsapp.jsx';

const ETAPAS = [
  { id: 'novo', titulo: 'Novo Lead', cor: '#64748b', bg: '#f8fafc' },
  { id: 'contato', titulo: 'Diagnóstico TI', cor: '#0284c7', bg: '#f0f9ff' },
  { id: 'proposta', titulo: 'Proposta Enviada', cor: '#d97706', bg: '#fffbeb' },
  { id: 'negociacao', titulo: 'Negociação', cor: '#7c3aed', bg: '#faf5ff' },
  { id: 'ganho', titulo: 'Ganho / Cliente', cor: '#16a34a', bg: '#f0fdf4' }
];

export default function CrmAdmin() {
  const leadsReq = usarDados(listarCrmLeads, [], []);
  const [busca, setBusca] = useState('');
  const [notificacao, setNotificacao] = useState('');

  // Modal Novo Lead
  const [modalNovoLead, setModalNovoLead] = useState(false);
  const [novoLead, setNovoLead] = useState({
    nome: '',
    empresa_nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    etapa: 'novo',
    origem: 'WhatsApp',
    valor_estimado: 599.00,
    probabilidade: 20,
    observacoes: ''
  });
  const [salvandoLead, setSalvandoLead] = useState(false);

  // Modal Detalhes / Propostas do Lead
  const [leadSelecionado, setLeadSelecionado] = useState(null);
  const [propostasLead, setPropostasLead] = useState([]);
  const [carregandoPropostas, setCarregandoPropostas] = useState(false);
  const [mostrarFormProposta, setMostrarFormProposta] = useState(false);
  const [novaProposta, setNovaProposta] = useState({
    titulo: 'Proposta de Suporte e Gestão de TI',
    valor_mensal: 599.00,
    servicos_inclusos: 'Helpdesk ilimitado, monitoramento de servidores, gestão de backups, suporte remoto e presencial.',
    validade_dias: 15
  });

  // Métricas do Funil
  const metricas = useMemo(() => {
    const leads = leadsReq.dados || [];
    const totalLeads = leads.length;
    const leadsAtivos = leads.filter(l => l.etapa !== 'ganho' && l.etapa !== 'perdido');
    const valorPipeline = leadsAtivos.reduce((acc, l) => acc + (Number(l.valor_estimado) || 0), 0);
    const ganhos = leads.filter(l => l.etapa === 'ganho');
    const valorGanhos = ganhos.reduce((acc, l) => acc + (Number(l.valor_estimado) || 0), 0);

    return {
      totalLeads,
      ativos: leadsAtivos.length,
      valorPipeline,
      ganhos: ganhos.length,
      valorGanhos
    };
  }, [leadsReq.dados]);

  // Filtragem
  const leadsFiltrados = useMemo(() => {
    const leads = leadsReq.dados || [];
    const t = busca.toLowerCase().trim();
    return leads.filter(l => {
      const matchBusca = !t ||
        l.nome?.toLowerCase().includes(t) ||
        l.empresa_nome?.toLowerCase().includes(t) ||
        l.email?.toLowerCase().includes(t) ||
        l.whatsapp?.includes(t);
      return matchBusca;
    });
  }, [leadsReq.dados, busca]);

  async function handleCriarLead(e) {
    e.preventDefault();
    if (!novoLead.nome || !novoLead.empresa_nome) {
      alert('Nome do contato e Nome da empresa são obrigatórios.');
      return;
    }
    setSalvandoLead(true);
    try {
      await criarCrmLead({
        ...novoLead,
        valor_estimado: Number(novoLead.valor_estimado) || 0,
        probabilidade: Number(novoLead.probabilidade) || 10
      });
      await registrarAuditoria({
        acao: `Criou lead ${novoLead.nome} (${novoLead.empresa_nome}) no CRM`,
        recurso: 'CRM'
      });
      setNotificacao(`Lead "${novoLead.empresa_nome}" cadastrado com sucesso!`);
      setModalNovoLead(false);
      setNovoLead({
        nome: '',
        empresa_nome: '',
        email: '',
        telefone: '',
        whatsapp: '',
        etapa: 'novo',
        origem: 'WhatsApp',
        valor_estimado: 599.00,
        probabilidade: 20,
        observacoes: ''
      });
      leadsReq.recarregar();
      setTimeout(() => setNotificacao(''), 4000);
    } catch (err) {
      alert('Erro ao criar lead: ' + err.message);
    } finally {
      setSalvandoLead(false);
    }
  }

  async function handleMudarEtapa(leadId, novaEtapa) {
    try {
      await atualizarCrmLead(leadId, { etapa: novaEtapa });
      leadsReq.recarregar();
    } catch (err) {
      alert('Erro ao mover lead: ' + err.message);
    }
  }

  async function handleConverterEmCliente(lead) {
    if (!confirm(`Deseja converter o lead "${lead.empresa_nome || lead.nome}" em cliente ativo agora? Isso criará a Empresa e o acesso no FonseDesk.`)) {
      return;
    }
    try {
      const novaEmpresa = await converterLeadEmCliente(lead.id, {
        razao_social: lead.empresa_nome || lead.nome,
        nome_fantasia: lead.empresa_nome || lead.nome,
        telefone: lead.telefone,
        whatsapp: lead.whatsapp,
        email: lead.email,
        valor_mensal: lead.valor_estimado || 599.00,
        plano: 'Profissional'
      });
      await registrarAuditoria({
        empresaId: novaEmpresa.id,
        acao: `Converteu lead CRM "${lead.nome}" em empresa cliente ativa`,
        recurso: 'CRM / Empresas'
      });
      setNotificacao(`Parabéns! Empresa "${novaEmpresa.razao_social}" criada como cliente ativa!`);
      leadsReq.recarregar();
      setTimeout(() => setNotificacao(''), 5000);
    } catch (err) {
      alert('Erro na conversão: ' + err.message);
    }
  }

  async function abrirDetalhesLead(lead) {
    setLeadSelecionado(lead);
    setCarregandoPropostas(true);
    setMostrarFormProposta(false);
    try {
      const props = await listarPropostas(lead.id);
      setPropostasLead(props);
    } catch {
      setPropostasLead([]);
    } finally {
      setCarregandoPropostas(false);
    }
  }

  async function handleCriarProposta(e) {
    e.preventDefault();
    if (!leadSelecionado) return;
    try {
      const hoje = new Date();
      hoje.setDate(hoje.getDate() + Number(novaProposta.validade_dias || 15));
      const validadeAte = hoje.toISOString().split('T')[0];

      await criarProposta({
        lead_id: leadSelecionado.id,
        empresa_id: leadSelecionado.empresa_id || null,
        titulo: novaProposta.titulo,
        valor_mensal: Number(novaProposta.valor_mensal) || 0,
        servicos_inclusos: novaProposta.servicos_inclusos,
        validade_ate: validadeAte,
        status: 'enviada'
      });

      // Atualiza etapa do lead para proposta enviada
      await atualizarCrmLead(leadSelecionado.id, { etapa: 'proposta' });
      await registrarAuditoria({
        acao: `Criou proposta comercial para ${leadSelecionado.empresa_nome}`,
        recurso: 'CRM'
      });

      setNotificacao('Proposta registrada e lead movido para "Proposta Enviada"!');
      setMostrarFormProposta(false);
      abrirDetalhesLead(leadSelecionado);
      leadsReq.recarregar();
      setTimeout(() => setNotificacao(''), 4000);
    } catch (err) {
      alert('Erro ao criar proposta: ' + err.message);
    }
  }

  async function handleExcluirLead(id, nome) {
    if (!confirm(`Deseja realmente remover o lead "${nome}"?`)) return;
    try {
      await excluirCrmLead(id);
      leadsReq.recarregar();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  if (leadsReq.carregando) return <Carregando altura={320} />;

  return (
    <>
      {notificacao && (
        <div style={{ marginTop: 18, maxWidth: 680 }}>
          <Aviso>{notificacao}</Aviso>
        </div>
      )}

      {/* MÉTRICAS DO FUNIL NO TOPO */}
      <div style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14
      }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 600, textTransform: 'uppercase' }}>Leads Ativos no Funil</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: c.tinta, marginTop: 4 }}>
            {metricas.ativos} <span style={{ fontSize: 13, fontWeight: 500, color: c.cinza }}>de {metricas.totalLeads}</span>
          </div>
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 600, textTransform: 'uppercase' }}>Valor em Negociação</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: c.azul, marginTop: 4 }}>
            R$ {metricas.valorPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <span style={{ fontSize: 12, fontWeight: 500, color: c.cinza }}>/mês</span>
          </div>
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 600, textTransform: 'uppercase' }}>Clientes Convertidos</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {metricas.ganhos} <span style={{ fontSize: 12, fontWeight: 500, color: c.cinza }}>empresas</span>
          </div>
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 600, textTransform: 'uppercase' }}>Receita Mensal Conquistada</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            R$ {metricas.valorGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <span style={{ fontSize: 12, fontWeight: 500, color: c.cinza }}>/mês</span>
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES: BUSCA E NOVO LEAD */}
      <div style={{
        marginTop: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, maxWidth: 420 }}>
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
              placeholder="Buscar por contato, empresa, e-mail..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setModalNovoLead(true)}
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
            <span>Novo Lead Comercial</span>
          </button>
        </div>
      </div>

      {/* PIPELINE KANBAN DAS ETAPAS */}
      <div style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))',
        gap: 14,
        overflowX: 'auto',
        paddingBottom: 16
      }}>
        {ETAPAS.map(etapa => {
          const leadsDaEtapa = leadsFiltrados.filter(l => l.etapa === etapa.id);
          const totalEtapa = leadsDaEtapa.reduce((sum, l) => sum + (Number(l.valor_estimado) || 0), 0);

          return (
            <div
              key={etapa.id}
              style={{
                background: etapa.bg,
                borderRadius: 12,
                border: '1px solid ' + c.borda,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 480
              }}
            >
              {/* Topo da Coluna */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: '2px solid ' + etapa.cor
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.tinta }}>
                  {etapa.titulo}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#ffffff',
                  color: etapa.cor,
                  padding: '2px 7px',
                  borderRadius: 10,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                }}>
                  {leadsDaEtapa.length}
                </span>
              </div>

              <div style={{ fontSize: 11, color: c.cinza, marginBottom: 12, fontWeight: 500 }}>
                R$ {totalEtapa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              {/* Lista de Leads da Coluna */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {leadsDaEtapa.map(lead => (
                  <div
                    key={lead.id}
                    style={{
                      ...card,
                      padding: 12,
                      borderLeft: '4px solid ' + etapa.cor,
                      background: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: c.tinta }}>
                        {lead.empresa_nome}
                      </div>
                      <span style={{ fontSize: 11, color: c.cinza }}>
                        {lead.probabilidade}%
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: c.cinza, marginTop: 4 }}>
                      Contato: <strong>{lead.nome}</strong>
                    </div>

                    <div style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      fontWeight: 700,
                      color: c.azul
                    }}>
                      <span>R$ {Number(lead.valor_estimado || 0).toFixed(2)}/mês</span>
                      <span style={{ fontSize: 10, color: c.cinza, fontWeight: 400 }}>{lead.origem}</span>
                    </div>

                    {/* Botões de Ação do Lead */}
                    <div style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px solid ' + c.borda,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 4
                    }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {lead.whatsapp && (
                          <BotaoWhatsapp
                            numero={lead.whatsapp}
                            compacto
                            iconeApenas
                            mensagem={`Olá ${lead.nome}, tudo bem? Sou da Fonsetech TI, referente à proposta de suporte para a ${lead.empresa_nome}.`}
                          />
                        )}
                        <button
                          onClick={() => abrirDetalhesLead(lead)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid ' + c.borda,
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            cursor: 'pointer',
                            color: c.tinta
                          }}
                          title="Ver Propostas e Detalhes"
                        >
                          Propostas
                        </button>
                      </div>

                      {/* Seção Mover Etapa ou Converter */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {lead.etapa !== 'ganho' && (
                          <button
                            onClick={() => handleConverterEmCliente(lead)}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#065f46',
                              borderRadius: 6,
                              padding: '4px 7px',
                              fontSize: 10.5,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Converter diretamente em Cliente Empresa Ativa"
                          >
                            + Cliente
                          </button>
                        )}

                        <select
                          value={lead.etapa}
                          onChange={e => handleMudarEtapa(lead.id, e.target.value)}
                          style={{
                            fontSize: 10,
                            padding: '3px 4px',
                            borderRadius: 6,
                            border: '1px solid ' + c.borda,
                            background: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="novo">Novo</option>
                          <option value="contato">Diagnóstico</option>
                          <option value="proposta">Proposta</option>
                          <option value="negociacao">Negociação</option>
                          <option value="ganho">Ganho</option>
                        </select>

                        <button
                          onClick={() => handleExcluirLead(lead.id, lead.empresa_nome)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Remover Lead"
                        >
                          <Icone nome="lixeira" tamanho={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL NOVO LEAD */}
      {modalNovoLead && (
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
            maxWidth: 640,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.tinta }}>Novo Lead Comercial</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: c.cinza }}>Oportunidade de contratação de suporte e gestão de TI.</p>
              </div>
              <button onClick={() => setModalNovoLead(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.cinza }}>
                <Icone nome="fechar" tamanho={20} />
              </button>
            </div>

            <form onSubmit={handleCriarLead}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Campo rotulo="Nome da Empresa" valor={novoLead.empresa_nome} onChange={v => setNovoLead({ ...novoLead, empresa_nome: v })} obrigatorio />
                <Campo rotulo="Nome do Contato" valor={novoLead.nome} onChange={v => setNovoLead({ ...novoLead, nome: v })} obrigatorio />
                <Campo rotulo="WhatsApp de Contato" valor={novoLead.whatsapp} onChange={v => setNovoLead({ ...novoLead, whatsapp: v })} dica="Ex: (51) 98888-1234" />
                <Campo rotulo="Telefone Fixo" valor={novoLead.telefone} onChange={v => setNovoLead({ ...novoLead, telefone: v })} />
                <Campo rotulo="E-mail" tipo="email" valor={novoLead.email} onChange={v => setNovoLead({ ...novoLead, email: v })} />
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Origem do Lead</label>
                  <select
                    value={novoLead.origem}
                    onChange={e => setNovoLead({ ...novoLead, origem: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                  >
                    <option value="WhatsApp">WhatsApp Direto</option>
                    <option value="Indicação">Indicação de Cliente</option>
                    <option value="Site / Formulário">Site Oficial Fonsetech</option>
                    <option value="Prospecção Ativa">Prospecção Ativa</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <Campo rotulo="Valor Estimado Mensal (R$)" tipo="number" valor={novoLead.valor_estimado} onChange={v => setNovoLead({ ...novoLead, valor_estimado: v })} />
                <Campo rotulo="Probabilidade (%)" tipo="number" valor={novoLead.probabilidade} onChange={v => setNovoLead({ ...novoLead, probabilidade: v })} />
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Observações / Necessidade da Empresa</label>
                <textarea
                  rows={3}
                  value={novoLead.observacoes}
                  onChange={e => setNovoLead({ ...novoLead, observacoes: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid ' + c.borda, fontFamily: 'inherit', fontSize: 13 }}
                  placeholder="Ex: Empresa com 15 computadores precisando de migração de servidor e backup em nuvem..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setModalNovoLead(false)} style={botao.secundario}>Cancelar</button>
                <button type="submit" disabled={salvandoLead} style={botao.primario}>
                  {salvandoLead ? 'Salvando...' : 'Adicionar ao Funil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO LEAD & PROPOSTAS COMERCIAIS */}
      {leadSelecionado && (
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
            maxWidth: 780,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.tinta }}>
                  {leadSelecionado.empresa_nome}
                </h3>
                <div style={{ fontSize: 13, color: c.cinza, marginTop: 4 }}>
                  Contato: {leadSelecionado.nome} • {leadSelecionado.whatsapp || leadSelecionado.email}
                </div>
              </div>
              <button onClick={() => setLeadSelecionado(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.cinza }}>
                <Icone nome="fechar" tamanho={20} />
              </button>
            </div>

            {/* Ações Rápidas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {leadSelecionado.whatsapp && (
                <BotaoWhatsapp
                  numero={leadSelecionado.whatsapp}
                  rotulo="Falar no WhatsApp"
                  mensagem={`Olá ${leadSelecionado.nome}, aqui é da Fonsetech TI. Gostaria de dar sequência à proposta para a ${leadSelecionado.empresa_nome}.`}
                />
              )}
              <button
                onClick={() => setMostrarFormProposta(!mostrarFormProposta)}
                style={{
                  ...botao.primario,
                  fontSize: 12,
                  padding: '7px 14px'
                }}
              >
                + Gerar Proposta Comercial
              </button>
              {leadSelecionado.etapa !== 'ganho' && (
                <button
                  onClick={() => {
                    handleConverterEmCliente(leadSelecionado);
                    setLeadSelecionado(null);
                  }}
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Converter em Cliente Empresa
                </button>
              )}
            </div>

            {/* FORMULÁRIO DE NOVA PROPOSTA */}
            {mostrarFormProposta && (
              <form onSubmit={handleCriarProposta} style={{ ...card, padding: 18, marginBottom: 20, background: '#f8fafc', border: '1px solid ' + c.azul }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: c.tinta }}>
                  Nova Proposta Comercial
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <Campo rotulo="Título da Proposta" valor={novaProposta.titulo} onChange={v => setNovaProposta({ ...novaProposta, titulo: v })} obrigatorio />
                  <Campo rotulo="Valor Mensal do Suporte (R$)" tipo="number" valor={novaProposta.valor_mensal} onChange={v => setNovaProposta({ ...novaProposta, valor_mensal: v })} />
                  <Campo rotulo="Validade (Dias)" tipo="number" valor={novaProposta.validade_dias} onChange={v => setNovaProposta({ ...novaProposta, validade_dias: v })} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Serviços Inclusos na Proposta</label>
                  <textarea
                    rows={3}
                    value={novaProposta.servicos_inclusos}
                    onChange={e => setNovaProposta({ ...novaProposta, servicos_inclusos: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + c.borda, fontSize: 13, fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <button type="button" onClick={() => setMostrarFormProposta(false)} style={botao.secundario}>Cancelar</button>
                  <button type="submit" style={botao.primario}>Salvar e Registrar Proposta</button>
                </div>
              </form>
            )}

            {/* HISTÓRICO DE PROPOSTAS DO LEAD */}
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: c.tinta }}>
              Propostas Geradas ({propostasLead.length})
            </h4>

            {carregandoPropostas ? (
              <div style={{ padding: 20, textAlign: 'center', color: c.cinza }}>Carregando propostas...</div>
            ) : propostasLead.length === 0 ? (
              <div style={{ ...card, padding: 24, textAlign: 'center', color: c.cinza }}>
                Nenhuma proposta registrada para este lead ainda. Clique no botão acima para criar a primeira proposta!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {propostasLead.map(prop => (
                  <div key={prop.id} style={{ ...card, padding: 16, borderLeft: '4px solid ' + c.azul }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: c.tinta }}>{prop.titulo}</div>
                        <div style={{ fontSize: 12, color: c.cinza, marginTop: 2 }}>
                          Validade até: {prop.validade_ate}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: c.azul }}>
                          R$ {Number(prop.valor_mensal || 0).toFixed(2)}/mês
                        </div>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: prop.status === 'aprovada' ? '#ecfdf5' : '#eff6ff',
                          color: prop.status === 'aprovada' ? '#065f46' : '#1e40af'
                        }}>
                          {prop.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p style={{ margin: '10px 0 0', fontSize: 13, color: c.tinta, lineHeight: 1.5 }}>
                      {prop.servicos_inclusos}
                    </p>

                    {leadSelecionado.whatsapp && (
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <BotaoWhatsapp
                          numero={leadSelecionado.whatsapp}
                          compacto
                          rotulo="Enviar Proposta por WhatsApp"
                          mensagem={`Olá ${leadSelecionado.nome}! Segue o resumo da proposta comercial da Fonsetech TI:\n\n*${prop.titulo}*\nValor: R$ ${Number(prop.valor_mensal).toFixed(2)}/mês\nServiços: ${prop.servicos_inclusos}\nValidade até: ${prop.validade_ate}\n\nFicamos à disposição para quaisquer dúvidas!`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

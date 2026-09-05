import { useState, useEffect, useCallback } from 'react';
import { c, card, botao } from '../../ui/tokens.js';
import Icone from '../../ui/Icone.jsx';
import Chip from '../../ui/Chip.jsx';
import Campo from '../../ui/Campo.jsx';
import { BotaoWhatsapp } from '../../lib/whatsapp.jsx';
import {
  listarUsuariosEmpresa,
  criarUsuarioEmpresa,
  atualizarUsuarioEmpresa,
  redefinirSenhaUsuario,
  listarChamados,
  listarAgendamentos,
  listarLancamentosFinanceiros,
  listarMaquinas,
  salvarEmpresa,
  registrarAuditoria
} from '../../dados/consultas.js';

export default function PerfilEmpresa360({ empresa, emFechar, emAtualizar }) {
  const [abaAtiva, setAbaAtiva] = useState('resumo'); // resumo, usuarios, chamados, agenda, financeiro, maquinas
  const [usuarios, setUsuarios] = useState([]);
  const [chamados, setChamados] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [maquinas, setMaquinas] = useState([]);

  // Estados de formulário de novo usuário
  const [mostrarModalNovoUsuario, setMostrarModalNovoUsuario] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', password: '', telefone: '', whatsapp: '', cargo: '', role: 'cliente' });
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erroUsuario, setErroUsuario] = useState('');

  // Estados de edição de dados da empresa
  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [dadosForm, setDadosForm] = useState({ ...empresa });
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!empresa?.id) return;
    try {
      const [u, ch, ag, fin, maq] = await Promise.all([
        listarUsuariosEmpresa(empresa.id).catch(() => []),
        listarChamados().then(list => list.filter(item => item.empresa_id === empresa.id)).catch(() => []),
        listarAgendamentos().then(list => list.filter(item => item.empresa_id === empresa.id)).catch(() => []),
        listarLancamentosFinanceiros(empresa.id).catch(() => []),
        listarMaquinas().then(list => list.filter(item => item.empresa_id === empresa.id)).catch(() => [])
      ]);
      setUsuarios(u);
      setChamados(ch);
      setAgendamentos(ag);
      setFinanceiro(fin);
      setMaquinas(maq);
    } catch {
      // Ignora erro geral
    }
  }, [empresa?.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleSalvarNovoUsuario(e) {
    e.preventDefault();
    if (!novoUsuario.nome || !novoUsuario.email) {
      setErroUsuario('Nome e E-mail são obrigatórios.');
      return;
    }
    if (!novoUsuario.password || novoUsuario.password.length < 8) {
      setErroUsuario('Defina uma senha com pelo menos 8 caracteres.');
      return;
    }
    setSalvandoUsuario(true);
    setErroUsuario('');
    try {
      await criarUsuarioEmpresa({ ...novoUsuario, empresa_id: empresa.id });
      await registrarAuditoria({
        empresaId: empresa.id,
        acao: `Criou usuário ${novoUsuario.nome} (${novoUsuario.email}) para a empresa`,
        recurso: 'Usuários'
      });
      setMensagemSucesso(`Usuário ${novoUsuario.nome} adicionado com sucesso!`);
      setNovoUsuario({ nome: '', email: '', password: '', telefone: '', whatsapp: '', cargo: '', role: 'cliente' });
      setMostrarModalNovoUsuario(false);
      carregarDados();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err) {
      setErroUsuario(err.message || 'Erro ao criar usuário.');
    } finally {
      setSalvandoUsuario(false);
    }
  }

  async function handleAlternarAtivoUsuario(usuario) {
    try {
      await atualizarUsuarioEmpresa(usuario.id, { ativo: !usuario.ativo });
      carregarDados();
    } catch (err) {
      alert('Erro ao alterar status do usuário: ' + err.message);
    }
  }

  async function handleRedefinirSenha(usuario) {
    try {
      await redefinirSenhaUsuario(usuario.email);
      alert(`Link de redefinição de senha enviado para ${usuario.email}!`);
    } catch (err) {
      alert('Erro ao solicitar redefinição: ' + err.message);
    }
  }

  async function handleSalvarEmpresa(e) {
    e.preventDefault();
    setSalvandoEmpresa(true);
    try {
      const atualizada = await salvarEmpresa(empresa.id, dadosForm);
      await registrarAuditoria({
        empresaId: empresa.id,
        acao: `Atualizou os dados cadastrais da empresa ${dadosForm.razao_social}`,
        recurso: 'Empresas'
      });
      setEditandoEmpresa(false);
      if (emAtualizar) emAtualizar(atualizada);
    } catch (err) {
      alert('Erro ao salvar dados da empresa: ' + err.message);
    } finally {
      setSalvandoEmpresa(false);
    }
  }

  const situacaoCor = {
    'Em dia': { bg: '#ecfdf5', texto: '#065f46', borda: '#a7f3d0' },
    'A vencer': { bg: '#fffbeb', texto: '#92400e', borda: '#fde68a' },
    'Em atraso': { bg: '#fef2f2', texto: '#991b1b', borda: '#fecaca' }
  }[empresa.situacao_financeira || 'Em dia'] || { bg: '#f1f5f9', texto: '#334155', borda: '#cbd5e1' };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        width: '100%',
        maxWidth: 1060,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid ' + c.borda
      }}>
        {/* CABEÇALHO DO MODAL */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid ' + c.borda,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: 'linear-gradient(135deg, ' + c.azul + ', ' + c.roxo + ')',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(45,108,223,0.25)'
            }}>
              <Icone nome="predio" tamanho={24} cor="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: c.tinta }}>
                  {empresa.razao_social}
                </h2>
                {empresa.nome_fantasia && (
                  <span style={{ fontSize: 13, color: c.cinza, fontWeight: 500 }}>
                    ({empresa.nome_fantasia})
                  </span>
                )}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 9px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: situacaoCor.bg,
                  color: situacaoCor.texto,
                  border: '1px solid ' + situacaoCor.borda
                }}>
                  ● {empresa.situacao_financeira || 'Em dia'}
                </span>
                <span style={{
                  padding: '3px 9px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: '#eff6ff',
                  color: c.azul,
                  border: '1px solid #bfdbfe'
                }}>
                  Plano {empresa.plano || 'Profissional'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: 12, color: c.cinza }}>
                {empresa.cnpj && <span>CNPJ: {empresa.cnpj}</span>}
                {empresa.cidade && <span>• {empresa.cidade}/{empresa.estado || 'RS'}</span>}
                {empresa.telefone && <span>• Tel: {empresa.telefone}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {empresa.whatsapp && (
              <BotaoWhatsapp numero={empresa.whatsapp} mensagem={`Olá ${empresa.responsavel_nome || ''}, tudo bem? Sou da Fonsetech TI.`} rotulo="WhatsApp Empresa" />
            )}
            <button
              onClick={emFechar}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: c.cinza,
                padding: 6,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center'
              }}
              title="Fechar"
            >
              <Icone nome="fechar" tamanho={20} />
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS 360 */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid ' + c.borda,
          background: '#f8fafc',
          padding: '0 16px',
          gap: 4
        }}>
          {[
            { id: 'resumo', rotulo: 'Resumo & Contrato', icone: 'predio' },
            { id: 'usuarios', rotulo: `Usuários (${usuarios.length})`, icone: 'usuario' },
            { id: 'chamados', rotulo: `Chamados (${chamados.length})`, icone: 'ticket' },
            { id: 'agenda', rotulo: `Agenda & Visitas (${agendamentos.length})`, icone: 'agenda' },
            { id: 'financeiro', rotulo: `Financeiro (${financeiro.length})`, icone: 'cifrao' },
            { id: 'maquinas', rotulo: `Máquinas (${maquinas.length})`, icone: 'monitor' }
          ].map(aba => {
            const ativo = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '12px 14px',
                  fontSize: 13,
                  fontWeight: ativo ? 600 : 500,
                  color: ativo ? c.azul : c.cinza,
                  background: ativo ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderBottom: ativo ? `2px solid ${c.azul}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all .15s ease'
                }}
              >
                <Icone nome={aba.icone} tamanho={16} cor={ativo ? c.azul : c.cinza} />
                <span>{aba.rotulo}</span>
              </button>
            );
          })}
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {mensagemSucesso && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '10px 16px',
              borderRadius: 8,
              marginBottom: 18,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Icone nome="check" tamanho={16} cor="#059669" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {/* ABA RESUMO */}
          {abaAtiva === 'resumo' && (
            <div>
              {!editandoEmpresa ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>
                      Dados Cadastrais e Contratuais
                    </h3>
                    <button
                      onClick={() => setEditandoEmpresa(true)}
                      style={{
                        ...botao.secundario,
                        fontSize: 12,
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Icone nome="editar" tamanho={14} />
                      <span>Editar Cadastro</span>
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 16
                  }}>
                    {/* Bloco 1: Identificação */}
                    <div style={{ ...card, padding: 18, background: '#fafafa' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', color: c.cinza, letterSpacing: '0.04em' }}>
                        Identificação e Contato
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        <div><strong>Razão Social:</strong> {empresa.razao_social}</div>
                        <div><strong>Nome Fantasia:</strong> {empresa.nome_fantasia || '—'}</div>
                        <div><strong>CNPJ:</strong> {empresa.cnpj || '—'}</div>
                        <div><strong>Inscrição Estadual:</strong> {empresa.inscricao_estadual || '—'}</div>
                        <div><strong>E-mail Comercial:</strong> {empresa.email || '—'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong>WhatsApp:</strong> {empresa.whatsapp || '—'}
                          {empresa.whatsapp && <BotaoWhatsapp numero={empresa.whatsapp} compacto iconeApenas />}
                        </div>
                        <div><strong>Telefone:</strong> {empresa.telefone || '—'}</div>
                        <div><strong>Endereço:</strong> {empresa.endereco || '—'}</div>
                        <div><strong>Cidade / UF:</strong> {empresa.cidade || '—'} / {empresa.estado || '—'} - CEP: {empresa.cep || '—'}</div>
                      </div>
                    </div>

                    {/* Bloco 2: Responsável Principal */}
                    <div style={{ ...card, padding: 18, background: '#fafafa' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', color: c.cinza, letterSpacing: '0.04em' }}>
                        Responsável Legal / Contato
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        <div><strong>Nome:</strong> {empresa.responsavel_nome || empresa.gerente_geral || '—'}</div>
                        <div><strong>Cargo:</strong> {empresa.responsavel_cargo || 'Gerente / Diretor'}</div>
                        <div><strong>E-mail:</strong> {empresa.responsavel_email || empresa.email || '—'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong>WhatsApp Direto:</strong> {empresa.responsavel_whatsapp || empresa.whatsapp || '—'}
                          {(empresa.responsavel_whatsapp || empresa.whatsapp) && (
                            <BotaoWhatsapp numero={empresa.responsavel_whatsapp || empresa.whatsapp} compacto iconeApenas />
                          )}
                        </div>
                        <div><strong>Diretoria:</strong> {empresa.diretor || '—'}</div>
                        <div><strong>Tem TI Interno:</strong> {empresa.tem_ti_interno ? `Sim (${empresa.responsavel_ti || 'Equipe interna'})` : 'Não (Terceirizado com Fonsetech)'}</div>
                      </div>
                    </div>

                    {/* Bloco 3: Dados Contratuais e Financeiros */}
                    <div style={{ ...card, padding: 18, background: '#fafafa' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', color: c.cinza, letterSpacing: '0.04em' }}>
                        Contrato e Parceria
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        <div><strong>Plano Contratado:</strong> <span style={{ color: c.azul, fontWeight: 700 }}>{empresa.plano || 'Profissional'}</span></div>
                        <div><strong>Mensalidade:</strong> R$ {Number(empresa.valor_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div><strong>Início do Contrato:</strong> {empresa.inicio_contrato || '—'}</div>
                        <div><strong>Renovação:</strong> {empresa.renovacao_contrato || '—'}</div>
                        <div><strong>Condições Comerciais:</strong> {empresa.condicoes_comerciais || 'Padrão mensal'}</div>
                        <div><strong>Status da Conta:</strong> {empresa.status_cliente || 'Ativo'}</div>
                      </div>
                    </div>

                    {/* Bloco 4: Notas Internas */}
                    <div style={{ ...card, padding: 18, background: '#fafafa' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', color: c.cinza, letterSpacing: '0.04em' }}>
                        Observações Internas (Equipe Fonsetech)
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: c.tinta, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {empresa.obs_internas || empresa.observacoes || 'Nenhuma observação interna registrada.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORMULÁRIO DE EDIÇÃO */
                <form onSubmit={handleSalvarEmpresa} style={{ ...card, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>Editar Dados da Empresa</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setEditandoEmpresa(false)} style={botao.secundario}>Cancelar</button>
                      <button type="submit" disabled={salvandoEmpresa} style={botao.primario}>
                        {salvandoEmpresa ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <Campo rotulo="Razão Social" valor={dadosForm.razao_social || ''} onChange={v => setDadosForm({ ...dadosForm, razao_social: v })} obrigatorio />
                    <Campo rotulo="Nome Fantasia" valor={dadosForm.nome_fantasia || ''} onChange={v => setDadosForm({ ...dadosForm, nome_fantasia: v })} />
                    <Campo rotulo="CNPJ" valor={dadosForm.cnpj || ''} onChange={v => setDadosForm({ ...dadosForm, cnpj: v })} />
                    <Campo rotulo="Inscrição Estadual" valor={dadosForm.inscricao_estadual || ''} onChange={v => setDadosForm({ ...dadosForm, inscricao_estadual: v })} />
                    <Campo rotulo="E-mail Comercial" valor={dadosForm.email || ''} onChange={v => setDadosForm({ ...dadosForm, email: v })} />
                    <Campo rotulo="Telefone Principal" valor={dadosForm.telefone || ''} onChange={v => setDadosForm({ ...dadosForm, telefone: v })} />
                    <Campo rotulo="WhatsApp Principal" valor={dadosForm.whatsapp || ''} onChange={v => setDadosForm({ ...dadosForm, whatsapp: v })} dica="Com DDD, ex: (51) 98888-1234" />
                    <Campo rotulo="Site / Portal" valor={dadosForm.site || ''} onChange={v => setDadosForm({ ...dadosForm, site: v })} />
                    <Campo rotulo="Endereço" valor={dadosForm.endereco || ''} onChange={v => setDadosForm({ ...dadosForm, endereco: v })} />
                    <Campo rotulo="Cidade" valor={dadosForm.cidade || ''} onChange={v => setDadosForm({ ...dadosForm, cidade: v })} />
                    <Campo rotulo="Estado" valor={dadosForm.estado || ''} onChange={v => setDadosForm({ ...dadosForm, estado: v })} />
                    <Campo rotulo="CEP" valor={dadosForm.cep || ''} onChange={v => setDadosForm({ ...dadosForm, cep: v })} />
                    <Campo rotulo="Responsável Nome" valor={dadosForm.responsavel_nome || ''} onChange={v => setDadosForm({ ...dadosForm, responsavel_nome: v })} />
                    <Campo rotulo="Responsável Cargo" valor={dadosForm.responsavel_cargo || ''} onChange={v => setDadosForm({ ...dadosForm, responsavel_cargo: v })} />
                    <Campo rotulo="Responsável WhatsApp" valor={dadosForm.responsavel_whatsapp || ''} onChange={v => setDadosForm({ ...dadosForm, responsavel_whatsapp: v })} />
                    
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Plano Contratado</label>
                      <select
                        value={dadosForm.plano || 'Profissional'}
                        onChange={e => setDadosForm({ ...dadosForm, plano: e.target.value })}
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                      >
                        <option value="Básico">Básico (R$ 299/mês)</option>
                        <option value="Profissional">Profissional (R$ 599/mês)</option>
                        <option value="Premium">Premium (R$ 999/mês)</option>
                        <option value="Enterprise">Enterprise (Sob consulta)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Situação Financeira</label>
                      <select
                        value={dadosForm.situacao_financeira || 'Em dia'}
                        onChange={e => setDadosForm({ ...dadosForm, situacao_financeira: e.target.value })}
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                      >
                        <option value="Em dia">🟢 Em dia</option>
                        <option value="A vencer">🟡 A vencer</option>
                        <option value="Em atraso">🔴 Em atraso</option>
                      </select>
                    </div>

                    <Campo rotulo="Valor Mensal (R$)" tipo="number" valor={dadosForm.valor_mensal || 0} onChange={v => setDadosForm({ ...dadosForm, valor_mensal: parseFloat(v) || 0 })} />
                    <Campo rotulo="Início do Contrato" tipo="date" valor={dadosForm.inicio_contrato || ''} onChange={v => setDadosForm({ ...dadosForm, inicio_contrato: v })} />
                    <Campo rotulo="Renovação do Contrato" tipo="date" valor={dadosForm.renovacao_contrato || ''} onChange={v => setDadosForm({ ...dadosForm, renovacao_contrato: v })} />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Observações Internas da TI</label>
                    <textarea
                      rows={3}
                      value={dadosForm.obs_internas || ''}
                      onChange={e => setDadosForm({ ...dadosForm, obs_internas: e.target.value })}
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid ' + c.borda, fontFamily: 'inherit', fontSize: 13 }}
                      placeholder="Informações técnicas de rede, senhas de roteador, preferências de atendimento..."
                    />
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ABA USUÁRIOS */}
          {abaAtiva === 'usuarios' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>
                    Usuários da Empresa no FonseDesk
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: c.cinza }}>
                    Colaboradores autorizados a abrir e acompanhar chamados nesta empresa.
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModalNovoUsuario(true)}
                  style={{
                    ...botao.primario,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icone nome="mais" tamanho={16} />
                  <span>Novo Usuário</span>
                </button>
              </div>

              {/* MODAL ADICIONAR USUÁRIO */}
              {mostrarModalNovoUsuario && (
                <form onSubmit={handleSalvarNovoUsuario} style={{ ...card, padding: 18, marginBottom: 20, background: '#f8fafc', border: '1px solid ' + c.azul }}>
                  <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: c.tinta }}>
                    Cadastrar Login para esta Empresa
                  </h4>
                  {erroUsuario && (
                    <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{erroUsuario}</div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <Campo rotulo="Nome do Usuário" valor={novoUsuario.nome} onChange={v => setNovoUsuario({ ...novoUsuario, nome: v })} obrigatorio />
                    <Campo rotulo="E-mail de Acesso" tipo="email" valor={novoUsuario.email} onChange={v => setNovoUsuario({ ...novoUsuario, email: v })} obrigatorio />
                    <Campo rotulo="Senha de Acesso" tipo="password" valor={novoUsuario.password} onChange={v => setNovoUsuario({ ...novoUsuario, password: v })} obrigatorio dica="Mínimo de 8 caracteres" />
                    <Campo rotulo="Cargo / Função" valor={novoUsuario.cargo} onChange={v => setNovoUsuario({ ...novoUsuario, cargo: v })} />
                    <Campo rotulo="Telefone" valor={novoUsuario.telefone} onChange={v => setNovoUsuario({ ...novoUsuario, telefone: v })} />
                    <Campo rotulo="WhatsApp" valor={novoUsuario.whatsapp} onChange={v => setNovoUsuario({ ...novoUsuario, whatsapp: v })} />
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Papel / Permissão</label>
                      <select
                        value={novoUsuario.role}
                        onChange={e => setNovoUsuario({ ...novoUsuario, role: e.target.value })}
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                      >
                        <option value="cliente_admin">Administrador do Cliente (Vê todos os chamados da empresa)</option>
                        <option value="cliente">Usuário Comum (Abre chamados e vê os seus)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                    <button type="button" onClick={() => setMostrarModalNovoUsuario(false)} style={botao.secundario}>Cancelar</button>
                    <button type="submit" disabled={salvandoUsuario} style={botao.primario}>
                      {salvandoUsuario ? 'Cadastrando...' : 'Confirmar e Criar Usuário'}
                    </button>
                  </div>
                </form>
              )}

              {/* LISTAGEM DE USUÁRIOS */}
              <div style={{ ...card, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid ' + c.borda, textAlign: 'left', color: c.cinza }}>
                      <th style={{ padding: '10px 14px' }}>Nome / Cargo</th>
                      <th style={{ padding: '10px 14px' }}>E-mail</th>
                      <th style={{ padding: '10px 14px' }}>Telefone / WhatsApp</th>
                      <th style={{ padding: '10px 14px' }}>Papel</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: c.cinza }}>
                          Nenhum usuário cadastrado especificamente para esta empresa.
                        </td>
                      </tr>
                    ) : (
                      usuarios.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid ' + c.borda }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: c.tinta }}>
                            <div>{u.nome}</div>
                            {u.cargo && <div style={{ fontSize: 11, color: c.cinza, fontWeight: 400 }}>{u.cargo}</div>}
                          </td>
                          <td style={{ padding: '12px 14px', color: c.tinta }}>{u.email}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{u.whatsapp || u.telefone || '—'}</span>
                              {u.whatsapp && <BotaoWhatsapp numero={u.whatsapp} compacto iconeApenas />}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <Chip
                              tom={u.role === 'cliente_admin' ? 'roxo' : 'cinza'}
                              rotulo={u.role === 'cliente_admin' ? 'Admin Empresa' : 'Usuário'}
                            />
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: u.ativo ? '#ecfdf5' : '#fef2f2',
                              color: u.ativo ? '#065f46' : '#991b1b'
                            }}>
                              {u.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleRedefinirSenha(u)}
                                style={{
                                  ...botao.secundario,
                                  fontSize: 11,
                                  padding: '4px 8px'
                                }}
                                title="Enviar e-mail para redefinir senha"
                              >
                                Redefinir Senha
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAlternarAtivoUsuario(u)}
                                style={{
                                  background: u.ativo ? '#fef2f2' : '#ecfdf5',
                                  color: u.ativo ? '#b91c1c' : '#047857',
                                  border: '1px solid ' + (u.ativo ? '#fecaca' : '#a7f3d0'),
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  cursor: 'pointer'
                                }}
                              >
                                {u.ativo ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA CHAMADOS */}
          {abaAtiva === 'chamados' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>
                  Histórico de Chamados ({chamados.length})
                </h3>
              </div>

              <div style={{ ...card, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid ' + c.borda, textAlign: 'left', color: c.cinza }}>
                      <th style={{ padding: '10px 14px' }}>#</th>
                      <th style={{ padding: '10px 14px' }}>Título</th>
                      <th style={{ padding: '10px 14px' }}>Categoria</th>
                      <th style={{ padding: '10px 14px' }}>Prioridade</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px' }}>Cobrança</th>
                      <th style={{ padding: '10px 14px' }}>Aberto em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chamados.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: c.cinza }}>
                          Nenhum chamado aberto para esta empresa.
                        </td>
                      </tr>
                    ) : (
                      chamados.map(cItem => (
                        <tr key={cItem.id} style={{ borderBottom: '1px solid ' + c.borda }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: c.azul }}>#{cItem.numero}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 500, color: c.tinta }}>{cItem.titulo}</td>
                          <td style={{ padding: '12px 14px', color: c.cinza }}>{cItem.categoria}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <Chip
                              tom={cItem.prioridade === 'Urgente' ? 'vermelho' : cItem.prioridade === 'Alta' ? 'laranja' : 'azul'}
                              rotulo={cItem.prioridade}
                            />
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <Chip
                              tom={cItem.status === 'Concluído' ? 'verde' : cItem.status === 'Em andamento' ? 'azul' : 'amarelo'}
                              rotulo={cItem.status}
                            />
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {cItem.cobranca_tipo === 'servico_adicional' ? (
                              <span style={{ color: '#b91c1c', fontWeight: 600, fontSize: 12 }}>
                                Adicional: R$ {Number(cItem.cobranca_valor || 0).toFixed(2)} ({cItem.cobranca_status})
                              </span>
                            ) : (
                              <span style={{ color: '#047857', fontSize: 12 }}>Incluso no plano</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', color: c.cinza, fontSize: 12 }}>
                            {new Date(cItem.aberto_em).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA AGENDA */}
          {abaAtiva === 'agenda' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>
                  Visitas Técnicas & Reuniões ({agendamentos.length})
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                {agendamentos.length === 0 ? (
                  <div style={{ ...card, padding: 30, textAlign: 'center', color: c.cinza, gridColumn: '1 / -1' }}>
                    Nenhum agendamento registrado para esta empresa.
                  </div>
                ) : (
                  agendamentos.map(ag => (
                    <div key={ag.id} style={{ ...card, padding: 16, borderLeft: '4px solid ' + (ag.status === 'confirmado' ? '#10b981' : c.azul) }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: c.tinta, fontSize: 14 }}>
                          {ag.assunto}
                        </span>
                        <Chip
                          tom={ag.status === 'confirmado' ? 'verde' : ag.status === 'concluido' ? 'cinza' : 'azul'}
                          rotulo={ag.status}
                        />
                      </div>
                      <div style={{ fontSize: 12, color: c.cinza, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div><strong>Data e Hora:</strong> {ag.data} às {ag.hora} ({ag.duracao_minutos || 60} min)</div>
                        <div><strong>Formato / Local:</strong> {ag.formato || ag.modalidade} — {ag.endereco}</div>
                        {ag.contato_nome && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong>Contato no local:</strong> {ag.contato_nome}
                            {ag.contato_whatsapp && <BotaoWhatsapp numero={ag.contato_whatsapp} compacto iconeApenas />}
                          </div>
                        )}
                        {ag.observacoes && <div><strong>Notas:</strong> {ag.observacoes}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ABA FINANCEIRO */}
          {abaAtiva === 'financeiro' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>
                    Contas a Receber & Lançamentos
                  </h3>
                  <div style={{ fontSize: 13, color: c.cinza, marginTop: 4 }}>
                    Contrato: R$ {Number(empresa.valor_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês • Situação: <strong style={{ color: situacaoCor.texto }}>{empresa.situacao_financeira || 'Em dia'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ ...card, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid ' + c.borda, textAlign: 'left', color: c.cinza }}>
                      <th style={{ padding: '10px 14px' }}>Descrição</th>
                      <th style={{ padding: '10px 14px' }}>Categoria</th>
                      <th style={{ padding: '10px 14px' }}>Vencimento</th>
                      <th style={{ padding: '10px 14px' }}>Valor</th>
                      <th style={{ padding: '10px 14px' }}>Forma</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeiro.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: c.cinza }}>
                          Nenhum lançamento financeiro registrado.
                        </td>
                      </tr>
                    ) : (
                      financeiro.map(fin => (
                        <tr key={fin.id} style={{ borderBottom: '1px solid ' + c.borda }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: c.tinta }}>{fin.descricao}</td>
                          <td style={{ padding: '12px 14px', color: c.cinza }}>{fin.categoria}</td>
                          <td style={{ padding: '12px 14px' }}>{fin.data_vencimento}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: c.tinta }}>
                            R$ {Number(fin.valor || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 14px', color: c.cinza }}>{fin.forma_pagamento || 'Boleto'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: fin.status === 'pago' ? '#ecfdf5' : fin.status === 'vencido' ? '#fef2f2' : '#eff6ff',
                              color: fin.status === 'pago' ? '#065f46' : fin.status === 'vencido' ? '#991b1b' : '#1e40af'
                            }}>
                              {fin.status?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA MÁQUINAS */}
          {abaAtiva === 'maquinas' && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: c.tinta }}>
                Parque de Máquinas & Equipamentos ({maquinas.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {maquinas.length === 0 ? (
                  <div style={{ ...card, padding: 30, textAlign: 'center', color: c.cinza, gridColumn: '1 / -1' }}>
                    Nenhuma máquina cadastrada para esta empresa no inventário.
                  </div>
                ) : (
                  maquinas.map(m => (
                    <div key={m.id} style={{ ...card, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <Icone nome="monitor" tamanho={20} cor={c.azul} />
                        <div>
                          <div style={{ fontWeight: 700, color: c.tinta, fontSize: 14 }}>{m.nome}</div>
                          <div style={{ fontSize: 12, color: c.cinza }}>Usuário: {m.usuario || 'Geral'} ({m.setor})</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: c.cinza, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div><strong>Modelo:</strong> {m.modelo || 'Desktop'}</div>
                        <div><strong>Processador:</strong> {m.cpu || '—'}</div>
                        <div><strong>Memória / Disco:</strong> {m.memoria || '—'} / {m.disco || '—'}</div>
                        <div><strong>IP:</strong> {m.ip || 'DHCP'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

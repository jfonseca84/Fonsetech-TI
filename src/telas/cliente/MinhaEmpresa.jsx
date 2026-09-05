import { useEffect, useState } from 'react';
import { c, card } from '../../ui/tokens.js';
import { traduzir } from '../../dados/usarDados.js';
import {
  salvarEmpresa,
  listarUsuariosEmpresa,
  criarUsuarioEmpresa,
  alternarAtivo
} from '../../dados/consultas.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import { Campo } from '../../ui/Campo.jsx';
import Botao from '../../ui/Botao.jsx';
import Chip from '../../ui/Chip.jsx';
import { Erro, Aviso, Carregando } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';

export default function MinhaEmpresa() {
  const { perfil, recarregarPerfil } = useSessao();
  const emp = perfil?.empresas;

  const [f, setF] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  // Equipe / Usuários da Empresa
  const [usuarios, setUsuarios] = useState([]);
  const [modalNovoColaborador, setModalNovoColaborador] = useState(false);
  const [novoColab, setNovoColab] = useState({ nome: '', email: '', password: '', telefone: '', cargo: '', role: 'cliente' });
  const [salvandoColab, setSalvandoColab] = useState(false);

  const eAdminCliente = perfil?.role === 'cliente_admin' || perfil?.role === 'admin';

  useEffect(() => {
    if (!emp) return;
    setF({
      razao_social: emp.razao_social || '',
      cnpj: emp.cnpj || '',
      endereco: emp.endereco || '',
      email: emp.email || '',
      telefone: emp.telefone || '',
      tem_ti_interno: !!emp.tem_ti_interno,
      responsavel_ti: emp.responsavel_ti || '',
      gerente_geral: emp.gerente_geral || '',
      diretor: emp.diretor || ''
    });

    if (perfil?.empresa_id) {
      carregarEquipe(perfil.empresa_id);
    }
  }, [emp, perfil?.empresa_id]);

  async function carregarEquipe(empresaId) {
    try {
      const u = await listarUsuariosEmpresa(empresaId);
      setUsuarios(u);
    } catch {
      setUsuarios([]);
    }
  }

  if (!f) return <Carregando altura={320} />;

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setOk('');
    if (!f.razao_social.trim()) {
      setErro('A razão social é obrigatória.');
      return;
    }
    if (f.tem_ti_interno && !f.responsavel_ti.trim()) {
      setErro('Informe o nome do responsável técnico de TI.');
      return;
    }
    setSalvando(true);
    try {
      await salvarEmpresa(perfil.empresa_id, {
        razao_social: f.razao_social.trim(),
        cnpj: f.cnpj.trim() || null,
        endereco: f.endereco.trim() || null,
        email: f.email.trim() || null,
        telefone: f.telefone.trim() || null,
        tem_ti_interno: f.tem_ti_interno,
        responsavel_ti: f.tem_ti_interno ? f.responsavel_ti.trim() : null,
        gerente_geral: f.gerente_geral.trim() || null,
        diretor: f.diretor.trim() || null
      });
      setOk('Cadastro da empresa atualizado com sucesso.');
      if (recarregarPerfil) recarregarPerfil();
    } catch (er) {
      setErro(traduzir(er));
    } finally {
      setSalvando(false);
    }
  }

  async function handleCriarColaborador(e) {
    e.preventDefault();
    if (!novoColab.nome || !novoColab.email) {
      alert('Nome e e-mail são obrigatórios.');
      return;
    }
    if (!novoColab.password || novoColab.password.length < 8) {
      alert('Defina uma senha com pelo menos 8 caracteres.');
      return;
    }
    setSalvandoColab(true);
    try {
      await criarUsuarioEmpresa({
        ...novoColab,
        empresa_id: perfil.empresa_id
      });
      setOk(`Colaborador ${novoColab.nome} adicionado com sucesso!`);
      setModalNovoColaborador(false);
      setNovoColab({ nome: '', email: '', password: '', telefone: '', cargo: '', role: 'cliente' });
      carregarEquipe(perfil.empresa_id);
    } catch (err) {
      alert('Erro ao cadastrar colaborador: ' + err.message);
    } finally {
      setSalvandoColab(false);
    }
  }

  async function handleAlternarStatusUsuario(id, novoStatus, nome) {
    if (id === perfil?.id) {
      alert('Você não pode desativar seu próprio acesso.');
      return;
    }
    const acaoTexto = novoStatus ? 'ativar' : 'desativar';
    if (!confirm(`Deseja realmente ${acaoTexto} o acesso do colaborador "${nome}"?`)) return;
    try {
      await alternarAtivo(id, novoStatus);
      carregarEquipe(perfil.empresa_id);
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message);
    }
  }

  return (
    <div style={{ marginTop: 24, maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* CARD DO PLANO CONTRATADO */}
      <div style={{
        ...card,
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
            Contrato de Suporte Fonsetech TI
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
            Plano {emp?.plano || 'Profissional'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
            Status da conta: <strong style={{ color: '#a7f3d0' }}>{emp?.situacao_financeira || 'Em dia'}</strong>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Atendimento Especializado</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Helpdesk & Monitoramento</div>
        </div>
      </div>

      {/* FORMULÁRIO CADASTRAL */}
      <form onSubmit={enviar} style={{ ...card, padding: '26px 28px', display: 'grid', gap: 18 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>Dados Cadastrais</h3>

        <div className="fs-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <Campo label="Razão social" value={f.razao_social} onChange={set('razao_social')} />
          <Campo label="CNPJ" placeholder="00.000.000/0000-00" value={f.cnpj} onChange={set('cnpj')} />
        </div>

        <Campo label="Endereço" placeholder="Rua, número, complemento" value={f.endereco} onChange={set('endereco')} />

        <div className="fs-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="E-mail de contato" type="email" value={f.email} onChange={set('email')} />
          <Campo label="Telefone" placeholder="(00) 00000-0000" value={f.telefone} onChange={set('telefone')} />
        </div>

        <div style={{
          padding: '20px 22px', borderRadius: 12, background: c.fundoCampo,
          border: '1px solid ' + c.borda, display: 'grid', gap: 18
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icone nome="pessoas" tamanho={17} cor={c.azulEscuro} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2c3853' }}>Responsáveis</span>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2c3853' }}>
              A empresa possui responsável técnico de TI?
            </span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[{ v: true, t: 'Sim, temos TI interno' }, { v: false, t: 'Não temos' }].map((o) => (
                <button
                  key={String(o.v)} type="button"
                  onClick={() => setF((s) => ({ ...s, tem_ti_interno: o.v }))}
                  style={{
                    padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background .2s ease, border-color .2s ease',
                    ...(f.tem_ti_interno === o.v
                      ? { background: 'rgba(29, 95, 245, 0.08)', color: c.azulEscuro, border: '1px solid rgba(29, 95, 245, 0.4)' }
                      : { background: c.branco, color: c.texto2, border: '1px solid ' + c.borda3 })
                  }}
                >{o.t}</button>
              ))}
            </div>
          </div>

          {f.tem_ti_interno && (
            <Campo
              label="Nome do responsável técnico de TI"
              placeholder="Ex.: Bruno Alves"
              value={f.responsavel_ti} onChange={set('responsavel_ti')}
            />
          )}

          <div className="fs-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Campo label="Nome do gerente geral" value={f.gerente_geral} onChange={set('gerente_geral')} />
            <Campo label="Nome do diretor" value={f.diretor} onChange={set('diretor')} />
          </div>
        </div>

        {erro && <Erro mensagem={erro} />}
        {ok && <Aviso>{ok}</Aviso>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: c.texto4 }}>
            Estes dados orientam o atendimento e a emissão de documentos.
          </span>
          <Botao type="submit" disabled={salvando} icone="check">
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </Botao>
        </div>
      </form>

      {/* GESTÃO DE COLABORADORES DA EMPRESA */}
      <div style={{ ...card, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>
              Colaboradores com Acesso ({usuarios.length})
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: c.cinza }}>
              Membros da sua empresa que podem abrir chamados no FonseDesk.
            </p>
          </div>

          {eAdminCliente && (
            <button
              onClick={() => setModalNovoColaborador(true)}
              style={{
                background: c.azul,
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Icone nome="mais" tamanho={14} cor="#ffffff" />
              <span>Adicionar Colaborador</span>
            </button>
          )}
        </div>

        {/* MODAL ADICIONAR COLABORADOR */}
        {modalNovoColaborador && (
          <form onSubmit={handleCriarColaborador} style={{
            background: '#f8fafc',
            border: '1px solid ' + c.borda,
            borderRadius: 10,
            padding: 16,
            marginBottom: 16
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 700, color: c.tinta }}>
              Novo Acesso para Colaborador
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <Campo label="Nome Completo" value={novoColab.nome} onChange={e => setNovoColab({ ...novoColab, nome: e.target.value })} required />
              <Campo label="E-mail Corporativo" type="email" value={novoColab.email} onChange={e => setNovoColab({ ...novoColab, email: e.target.value })} required />
              <Campo label="Senha de Acesso" type="password" value={novoColab.password} onChange={e => setNovoColab({ ...novoColab, password: e.target.value })} required dica="Mínimo de 8 caracteres" />
              <Campo label="Cargo / Setor" value={novoColab.cargo} onChange={e => setNovoColab({ ...novoColab, cargo: e.target.value })} placeholder="Ex: Financeiro" />
              <Campo label="Telefone / WhatsApp" value={novoColab.telefone} onChange={e => setNovoColab({ ...novoColab, telefone: e.target.value })} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.tinta }}>Papel no FonseDesk</label>
                <select
                  value={novoColab.role}
                  onChange={e => setNovoColab({ ...novoColab, role: e.target.value === 'cliente_admin' ? 'cliente_admin' : 'cliente' })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid ' + c.borda,
                    background: '#ffffff',
                    fontSize: 13,
                    color: c.tinta
                  }}
                >
                  <option value="cliente">Usuário (Abertura e acompanhamento de chamados)</option>
                  <option value="cliente_admin">Admin da Empresa (Gerencia equipe e visualiza plano)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => setModalNovoColaborador(false)} style={{ background: '#ffffff', border: '1px solid ' + c.borda, padding: '7px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={salvandoColab} style={{ background: c.azul, color: '#ffffff', border: 'none', padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {salvandoColab ? 'Salvando...' : 'Confirmar e Criar'}
              </button>
            </div>
          </form>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {usuarios.map(u => (
            <div key={u.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid ' + c.borda
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: c.tinta }}>{u.nome}</div>
                <div style={{ fontSize: 12, color: c.cinza }}>
                  {u.email} {u.cargo ? `• ${u.cargo}` : ''} {u.telefone ? `• ${u.telefone}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Chip
                  tom={u.role === 'cliente_admin' ? 'roxo' : 'cinza'}
                  rotulo={u.role === 'cliente_admin' ? 'Admin da Empresa' : 'Usuário'}
                />
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: u.ativo ? '#ecfdf5' : '#fef2f2',
                  color: u.ativo ? '#065f46' : '#991b1b'
                }}>
                  {u.ativo ? 'Ativo' : 'Inativo'}
                </span>

                {eAdminCliente && u.id !== perfil?.id && (
                  <button
                    type="button"
                    onClick={() => handleAlternarStatusUsuario(u.id, !u.ativo, u.nome)}
                    style={{
                      background: 'transparent',
                      border: '1px solid ' + c.borda,
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      color: u.ativo ? '#991b1b' : '#065f46',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                    title={u.ativo ? 'Desativar acesso' : 'Ativar acesso'}
                  >
                    {u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { c, card, botao, iniciais } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import {
  listarEmpresas,
  listarPerfis,
  alternarAtivo,
  criarEmpresa,
  registrarAuditoria
} from '../../dados/consultas.js';
import { Carregando, Vazio, Aviso } from '../../ui/Estado.jsx';
import Chip from '../../ui/Chip.jsx';
import Icone from '../../ui/Icone.jsx';
import Campo from '../../ui/Campo.jsx';
import { BotaoWhatsapp } from '../../lib/whatsapp.jsx';
import PerfilEmpresa360 from './PerfilEmpresa360.jsx';

export default function Clientes() {
  const emp = usarDados(listarEmpresas, [], []);
  const perfis = usarDados(listarPerfis, [], []);

  const [visao, setVisao] = useState('empresas'); // 'empresas' | 'usuarios'
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('Todas'); // Todas, Em dia, A vencer, Em atraso
  const [empresaSelecionada360, setEmpresaSelecionada360] = useState(null);

  // Modal nova empresa
  const [mostrarModalNovaEmpresa, setMostrarModalNovaEmpresa] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    responsavel_nome: '',
    responsavel_cargo: '',
    responsavel_email: '',
    responsavel_whatsapp: '',
    cidade: 'Lajeado',
    estado: 'RS',
    endereco: '',
    plano: 'Profissional',
    valor_mensal: 599.00,
    situacao_financeira: 'Em dia',
    inicio_contrato: new Date().toISOString().split('T')[0]
  });
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [ok, setOk] = useState('');
  const [ocupado, setOcupado] = useState('');

  // Filtragem de empresas
  const empresasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return (emp.dados || []).filter(e => {
      const matchBusca = !termo ||
        (e.razao_social && e.razao_social.toLowerCase().includes(termo)) ||
        (e.nome_fantasia && e.nome_fantasia.toLowerCase().includes(termo)) ||
        (e.cnpj && e.cnpj.includes(termo)) ||
        (e.cidade && e.cidade.toLowerCase().includes(termo)) ||
        (e.responsavel_nome && e.responsavel_nome.toLowerCase().includes(termo));
      
      const matchSituacao = filtroSituacao === 'Todas' || e.situacao_financeira === filtroSituacao;
      return matchBusca && matchSituacao;
    });
  }, [emp.dados, busca, filtroSituacao]);

  // Filtragem de usuários
  const usuariosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return (perfis.dados || []).filter(p => {
      return !termo ||
        (p.nome && p.nome.toLowerCase().includes(termo)) ||
        (p.email && p.email.toLowerCase().includes(termo)) ||
        (p.empresas?.razao_social && p.empresas.razao_social.toLowerCase().includes(termo));
    });
  }, [perfis.dados, busca]);

  async function handleSalvarNovaEmpresa(e) {
    e.preventDefault();
    if (!novaEmpresa.razao_social) {
      setErroForm('A Razão Social é obrigatória.');
      return;
    }
    setSalvandoEmpresa(true);
    setErroForm('');
    try {
      const criada = await criarEmpresa({
        ...novaEmpresa,
        valor_mensal: Number(novaEmpresa.valor_mensal || 0),
        ativo: true
      });
      await registrarAuditoria({
        empresaId: criada.id,
        acao: `Cadastrou a empresa ${criada.razao_social}`,
        recurso: 'Empresas'
      });
      setOk(`Empresa "${criada.razao_social}" cadastrada com sucesso!`);
      setMostrarModalNovaEmpresa(false);
      emp.recarregar();
      setTimeout(() => setOk(''), 4000);
    } catch (err) {
      setErroForm(err.message || 'Erro ao criar empresa.');
    } finally {
      setSalvandoEmpresa(false);
    }
  }

  async function alternarUsuario(p) {
    setOcupado(p.id);
    try {
      await alternarAtivo(p.id, !p.ativo);
      perfis.recarregar();
      setOk(p.ativo ? `Acesso de ${p.nome} desativado.` : `Acesso de ${p.nome} reativado.`);
      setTimeout(() => setOk(''), 3000);
    } catch (e) {
      alert(traduzir(e));
    } finally {
      setOcupado('');
    }
  }

  if (emp.carregando && perfis.carregando) return <Carregando altura={320} />;

  return (
    <>
      {ok && (
        <div style={{ marginTop: 18, maxWidth: 700 }}>
          <Aviso>{ok}</Aviso>
        </div>
      )}

      {/* BARRA SUPERIOR DE AÇÕES & BUSCA */}
      <div style={{
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Alternância de Abas: Empresas x Usuários */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
          <button
            onClick={() => setVisao('empresas')}
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
              background: visao === 'empresas' ? '#ffffff' : 'transparent',
              color: visao === 'empresas' ? c.azul : c.cinza,
              boxShadow: visao === 'empresas' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Icone nome="predio" tamanho={16} />
            <span>Empresas ({emp.dados?.length || 0})</span>
          </button>
          <button
            onClick={() => setVisao('usuarios')}
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
              background: visao === 'usuarios' ? '#ffffff' : 'transparent',
              color: visao === 'usuarios' ? c.azul : c.cinza,
              boxShadow: visao === 'usuarios' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Icone nome="pessoas" tamanho={16} />
            <span>Todos os Usuários ({perfis.dados?.length || 0})</span>
          </button>
        </div>

        {/* Botão de Cadastro Rápido */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setMostrarModalNovaEmpresa(true)}
            style={{
              ...botao.primario,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13,
              padding: '10px 18px'
            }}
          >
            <Icone nome="mais" tamanho={16} cor="#ffffff" />
            <span>Nova Empresa</span>
          </button>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div style={{
        marginTop: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260, maxWidth: 420 }}>
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
              placeholder={visao === 'empresas' ? "Buscar por Razão Social, CNPJ, Cidade..." : "Buscar por Nome, E-mail ou Empresa..."}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' }}
            />
            {busca && (
              <button onClick={() => setBusca('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.cinza }}>
                <Icone nome="fechar" tamanho={14} />
              </button>
            )}
          </div>
        </div>

        {visao === 'empresas' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: c.cinza, fontWeight: 500 }}>Financeiro:</span>
            {['Todas', 'Em dia', 'A vencer', 'Em atraso'].map(sit => (
              <Chip
                key={sit}
                ativo={filtroSituacao === sit}
                onClick={() => setFiltroSituacao(sit)}
              >
                {sit}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* MODAL / FORMULÁRIO DE NOVA EMPRESA */}
      {mostrarModalNovaEmpresa && (
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
            maxWidth: 720,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.tinta }}>Cadastrar Nova Empresa Cliente</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: c.cinza }}>Criação do tenant corporativo no FonseDesk.</p>
              </div>
              <button onClick={() => setMostrarModalNovaEmpresa(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.cinza }}>
                <Icone nome="fechar" tamanho={20} />
              </button>
            </div>

            {erroForm && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvarNovaEmpresa}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Campo rotulo="Razão Social" valor={novaEmpresa.razao_social} onChange={v => setNovaEmpresa({ ...novaEmpresa, razao_social: v })} obrigatorio />
                <Campo rotulo="Nome Fantasia" valor={novaEmpresa.nome_fantasia} onChange={v => setNovaEmpresa({ ...novaEmpresa, nome_fantasia: v })} />
                <Campo rotulo="CNPJ" valor={novaEmpresa.cnpj} onChange={v => setNovaEmpresa({ ...novaEmpresa, cnpj: v })} placeholder="00.000.000/0001-00" />
                <Campo rotulo="Inscrição Estadual" valor={novaEmpresa.inscricao_estadual} onChange={v => setNovaEmpresa({ ...novaEmpresa, inscricao_estadual: v })} />
                <Campo rotulo="Telefone" valor={novaEmpresa.telefone} onChange={v => setNovaEmpresa({ ...novaEmpresa, telefone: v })} />
                <Campo rotulo="WhatsApp" valor={novaEmpresa.whatsapp} onChange={v => setNovaEmpresa({ ...novaEmpresa, whatsapp: v })} dica="Com DDD, ex: (51) 98888-1234" />
                <Campo rotulo="E-mail" tipo="email" valor={novaEmpresa.email} onChange={v => setNovaEmpresa({ ...novaEmpresa, email: v })} />
                <Campo rotulo="Site" valor={novaEmpresa.site} onChange={v => setNovaEmpresa({ ...novaEmpresa, site: v })} placeholder="https://..." />
                <Campo rotulo="Responsável" valor={novaEmpresa.responsavel_nome} onChange={v => setNovaEmpresa({ ...novaEmpresa, responsavel_nome: v })} />
                <Campo rotulo="Cargo do responsável" valor={novaEmpresa.responsavel_cargo} onChange={v => setNovaEmpresa({ ...novaEmpresa, responsavel_cargo: v })} />
                <Campo rotulo="E-mail do responsável" tipo="email" valor={novaEmpresa.responsavel_email} onChange={v => setNovaEmpresa({ ...novaEmpresa, responsavel_email: v })} />
                <Campo rotulo="WhatsApp do responsável" valor={novaEmpresa.responsavel_whatsapp} onChange={v => setNovaEmpresa({ ...novaEmpresa, responsavel_whatsapp: v })} dica="Com DDD, ex: (51) 98888-1234" />
                <Campo rotulo="Cidade" valor={novaEmpresa.cidade} onChange={v => setNovaEmpresa({ ...novaEmpresa, cidade: v })} />
                <Campo rotulo="Endereço Completo" valor={novaEmpresa.endereco} onChange={v => setNovaEmpresa({ ...novaEmpresa, endereco: v })} />
                
                <Campo
                  rotulo="Plano de TI Contratado"
                  valor={novaEmpresa.plano}
                  onChange={v => setNovaEmpresa({ ...novaEmpresa, plano: v })}
                  opcoes={[
                    { valor: 'Básico', texto: 'Plano Básico (R$ 299/mês)' },
                    { valor: 'Profissional', texto: 'Plano Profissional (R$ 599/mês)' },
                    { valor: 'Premium', texto: 'Plano Premium (R$ 999/mês)' },
                    { valor: 'Enterprise', texto: 'Plano Enterprise (Sob medida)' }
                  ]}
                />

                <Campo rotulo="Valor Mensal (R$)" tipo="number" valor={novaEmpresa.valor_mensal} onChange={v => setNovaEmpresa({ ...novaEmpresa, valor_mensal: v })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setMostrarModalNovaEmpresa(false)} style={botao.secundario}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvandoEmpresa} style={botao.primario}>
                  {salvandoEmpresa ? 'Cadastrando...' : 'Confirmar e Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISÃO: LISTA DE EMPRESAS */}
      {visao === 'empresas' && (
        <div style={{ marginTop: 20 }}>
          {empresasFiltradas.length === 0 ? (
            <Vazio
              titulo="Nenhuma empresa encontrada"
              texto="Cadastre uma nova empresa cliente ou altere os termos de busca."
              icone="predio"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {empresasFiltradas.map(e => {
                const situacaoBadge = {
                  'Em dia': { bg: '#ecfdf5', texto: '#065f46', borda: '#a7f3d0' },
                  'A vencer': { bg: '#fffbeb', texto: '#92400e', borda: '#fde68a' },
                  'Em atraso': { bg: '#fef2f2', texto: '#991b1b', borda: '#fecaca' }
                }[e.situacao_financeira || 'Em dia'] || { bg: '#f1f5f9', texto: '#334155', borda: '#cbd5e1' };

                return (
                  <div
                    key={e.id}
                    onClick={() => setEmpresaSelecionada360(e)}
                    style={{
                      ...card,
                      padding: 20,
                      cursor: 'pointer',
                      transition: 'transform .15s ease, box-shadow .15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={el => {
                      el.currentTarget.style.transform = 'translateY(-2px)';
                      el.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={el => {
                      el.currentTarget.style.transform = 'translateY(0)';
                      el.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                    }}
                  >
                    {/* Linha superior: Razão e Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.tinta }}>
                          {e.razao_social}
                        </h4>
                        {e.nome_fantasia && (
                          <div style={{ fontSize: 12, color: c.cinza, fontWeight: 500, marginTop: 2 }}>
                            {e.nome_fantasia}
                          </div>
                        )}
                      </div>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: situacaoBadge.bg,
                        color: situacaoBadge.texto,
                        border: '1px solid ' + situacaoBadge.borda,
                        whiteSpace: 'nowrap'
                      }}>
                        {e.situacao_financeira || 'Em dia'}
                      </span>
                    </div>

                    {/* Informações centrais */}
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: c.cinza }}>
                      {e.cnpj && <div><strong>CNPJ:</strong> {e.cnpj}</div>}
                      {e.responsavel_nome && <div><strong>Responsável:</strong> {e.responsavel_nome}</div>}
                      {e.cidade && <div><strong>Local:</strong> {e.cidade}/{e.estado || 'RS'}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#eff6ff',
                          color: c.azul
                        }}>
                          Plano {e.plano || 'Profissional'}
                        </span>
                        <span style={{ fontWeight: 700, color: c.tinta, fontSize: 13 }}>
                          R$ {Number(e.valor_mensal || 0).toFixed(2)}/mês
                        </span>
                      </div>
                    </div>

                    {/* Rodapé do Card com Ações */}
                    <div style={{
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: '1px solid ' + c.borda,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: c.azul, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>Ver Perfil 360º</span>
                        <Icone nome="seta" tamanho={13} />
                      </span>

                      {e.whatsapp && (
                        <BotaoWhatsapp
                          numero={e.whatsapp}
                          compacto
                          rotulo="WhatsApp"
                          mensagem={`Olá ${e.responsavel_nome || ''}, tudo bem? Sou da Fonsetech TI.`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISÃO: TODOS OS USUÁRIOS */}
      {visao === 'usuarios' && (
        <div style={{ marginTop: 20 }}>
          {usuariosFiltrados.length === 0 ? (
            <Vazio
              titulo="Nenhum usuário encontrado"
              texto="Altere o termo de busca para localizar usuários."
              icone="pessoas"
            />
          ) : (
            <div style={{ ...card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid ' + c.borda, textAlign: 'left', color: c.cinza }}>
                    <th style={{ padding: '12px 16px' }}>Usuário</th>
                    <th style={{ padding: '12px 16px' }}>Empresa</th>
                    <th style={{ padding: '12px 16px' }}>Contato</th>
                    <th style={{ padding: '12px 16px' }}>Papel</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid ' + c.borda }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: p.role === 'admin' ? 'rgba(45,108,223,0.1)' : 'rgba(124, 58, 237, 0.1)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                            color: p.role === 'admin' ? c.azul : c.roxo
                          }}>
                            {iniciais(p.nome)}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: c.tinta }}>{p.nome}</div>
                            <div style={{ fontSize: 11.5, color: c.cinza }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: c.tinta }}>
                        {p.empresas?.razao_social ? (
                          <span style={{ fontWeight: 500 }}>{p.empresas.razao_social}</span>
                        ) : (
                          <span style={{ color: c.cinza, fontStyle: 'italic' }}>Equipe Interna Fonsetech</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{p.whatsapp || p.telefone || '—'}</span>
                          {p.whatsapp && <BotaoWhatsapp numero={p.whatsapp} compacto iconeApenas />}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Chip
                          tom={p.role === 'admin' ? 'azul' : p.role === 'cliente_admin' ? 'roxo' : 'cinza'}
                          rotulo={p.role === 'admin' ? 'Admin Fonsetech' : p.role === 'cliente_admin' ? 'Admin Cliente' : 'Usuário'}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: p.ativo ? '#ecfdf5' : '#fef2f2',
                          color: p.ativo ? '#065f46' : '#991b1b'
                        }}>
                          {p.ativo ? 'Ativo' : 'Desativado'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => alternarUsuario(p)}
                          disabled={ocupado === p.id}
                          style={{
                            background: p.ativo ? '#fef2f2' : '#ecfdf5',
                            color: p.ativo ? '#b91c1c' : '#047857',
                            border: '1px solid ' + (p.ativo ? '#fecaca' : '#a7f3d0'),
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 11.5,
                            cursor: 'pointer'
                          }}
                        >
                          {p.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL PERFIL 360 DO CLIENTE */}
      {empresaSelecionada360 && (
        <PerfilEmpresa360
          empresa={empresaSelecionada360}
          emFechar={() => setEmpresaSelecionada360(null)}
          emAtualizar={empAtualizada => {
            setEmpresaSelecionada360(empAtualizada);
            emp.recarregar();
          }}
        />
      )}
    </>
  );
}

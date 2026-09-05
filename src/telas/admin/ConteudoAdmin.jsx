import { useState, useMemo } from 'react';
import { c, card, botao } from '../../ui/tokens.js';
import { usarDados } from '../../dados/usarDados.js';
import {
  listarMateriaisAdmin,
  criarMaterialAdmin,
  salvarMaterialAdmin,
  excluirMaterialAdmin,
  listarEmpresas,
  registrarAuditoria
} from '../../dados/consultas.js';
import { Carregando, Vazio, Aviso } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';
import Campo from '../../ui/Campo.jsx';

export default function ConteudoAdmin() {
  const materiaisReq = usarDados(listarMateriaisAdmin, [], []);
  const empresasReq = usarDados(listarEmpresas, [], []);

  const [abaAtiva, setAbaAtiva] = useState('cursos'); // 'cursos' | 'downloads'
  const [busca, setBusca] = useState('');
  const [notificacao, setNotificacao] = useState('');

  // Modal Novo / Edição de Material
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);
  const [form, setForm] = useState({
    tipo: 'curso', // 'curso', 'apostila', 'apresentacao', 'software', 'driver', 'ferramenta'
    titulo: '',
    descricao: '',
    categoria: 'Segurança da Informação',
    nivel: 'Básico',
    paginas: 24,
    link_externo: '',
    arquivo_path: '',
    versao: '1.0',
    tamanho: '5.2 MB',
    sistema: 'Windows 10 / 11',
    destaque: false,
    disponibilidade: 'todos', // 'todos' | 'plano' | 'empresa'
    plano_minimo: 'Básico',
    empresa_id: '',
    publicado: true
  });
  const [salvando, setSalvando] = useState(false);

  const empresas = empresasReq.dados || [];

  const listaFiltrada = useMemo(() => {
    const materiais = materiaisReq.dados || [];
    const t = busca.toLowerCase().trim();
    const tipos = abaAtiva === 'cursos'
      ? ['curso', 'apostila', 'apresentacao']
      : ['software', 'driver', 'ferramenta'];

    return materiais.filter(m => {
      const matchTipo = tipos.includes(m.tipo);
      const matchBusca = !t ||
        m.titulo?.toLowerCase().includes(t) ||
        m.descricao?.toLowerCase().includes(t) ||
        m.categoria?.toLowerCase().includes(t);
      return matchTipo && matchBusca;
    });
  }, [materiaisReq.dados, abaAtiva, busca]);

  function abrirNovo() {
    setItemEdicao(null);
    setForm({
      tipo: abaAtiva === 'cursos' ? 'curso' : 'software',
      titulo: '',
      descricao: '',
      categoria: abaAtiva === 'cursos' ? 'Segurança da Informação' : 'Suporte Remoto',
      nivel: 'Básico',
      paginas: 20,
      link_externo: '',
      arquivo_path: '',
      versao: '1.0',
      tamanho: '10 MB',
      sistema: 'Windows 10 / 11 (64-bit)',
      destaque: false,
      disponibilidade: 'todos',
      plano_minimo: 'Básico',
      empresa_id: '',
      publicado: true
    });
    setModalAberto(true);
  }

  function abrirEditar(item) {
    setItemEdicao(item);
    setForm({
      ...item,
      disponibilidade: item.disponibilidade || 'todos',
      plano_minimo: item.plano_minimo || 'Básico'
    });
    setModalAberto(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!form.titulo) {
      alert('Informe o título do material.');
      return;
    }
    setSalvando(true);
    try {
      if (itemEdicao) {
        await salvarMaterialAdmin(itemEdicao.id, form);
        await registrarAuditoria({
          acao: `Atualizou material "${form.titulo}" (${form.tipo})`,
          recurso: 'Cursos & Downloads'
        });
        setNotificacao(`Material "${form.titulo}" atualizado com sucesso!`);
      } else {
        await criarMaterialAdmin(form);
        await registrarAuditoria({
          acao: `Publicou novo material "${form.titulo}" (${form.tipo})`,
          recurso: 'Cursos & Downloads'
        });
        setNotificacao(`Novo material "${form.titulo}" publicado com sucesso!`);
      }
      setModalAberto(false);
      materiaisReq.recarregar();
      setTimeout(() => setNotificacao(''), 4000);
    } catch (err) {
      alert('Erro ao salvar material: ' + err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id, titulo) {
    if (!confirm(`Deseja realmente remover o material "${titulo}"?`)) return;
    try {
      await excluirMaterialAdmin(id);
      materiaisReq.recarregar();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  async function handleAlternarPublicado(item) {
    try {
      await salvarMaterialAdmin(item.id, { publicado: !item.publicado });
      materiaisReq.recarregar();
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message);
    }
  }

  if (materiaisReq.carregando) return <Carregando altura={320} />;

  return (
    <>
      {notificacao && (
        <div style={{ marginTop: 18, maxWidth: 680 }}>
          <Aviso>{notificacao}</Aviso>
        </div>
      )}

      {/* BARRA SUPERIOR DE AÇÕES & ABAS */}
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
            onClick={() => setAbaAtiva('cursos')}
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
              background: abaAtiva === 'cursos' ? '#ffffff' : 'transparent',
              color: abaAtiva === 'cursos' ? c.azul : c.cinza,
              boxShadow: abaAtiva === 'cursos' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Icone nome="curso" tamanho={16} />
            <span>Cursos, Apostilas & Treinamentos</span>
          </button>
          <button
            onClick={() => setAbaAtiva('downloads')}
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
              background: abaAtiva === 'downloads' ? '#ffffff' : 'transparent',
              color: abaAtiva === 'downloads' ? c.azul : c.cinza,
              boxShadow: abaAtiva === 'downloads' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Icone nome="download" tamanho={16} />
            <span>Downloads, Softwares & Drivers</span>
          </button>
        </div>

        <button
          onClick={() => abrirNovo()}
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
          <span>{abaAtiva === 'cursos' ? 'Publicar Novo Curso/Apostila' : 'Adicionar Novo Software/Driver'}</span>
        </button>
      </div>

      {/* BUSCA */}
      <div style={{ marginTop: 16, maxWidth: 400 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#ffffff',
          border: '1px solid ' + c.borda,
          borderRadius: 8,
          padding: '0 12px',
          height: 40
        }}>
          <Icone nome="busca" tamanho={16} cor={c.cinza} />
          <input
            type="text"
            placeholder="Buscar por título, categoria ou descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' }}
          />
        </div>
      </div>

      {/* LISTAGEM DE MATERIAIS */}
      <div style={{ marginTop: 20 }}>
        {listaFiltrada.length === 0 ? (
          <Vazio
            titulo={abaAtiva === 'cursos' ? 'Nenhum curso ou apostila cadastrada' : 'Nenhum download cadastrado'}
            texto="Clique no botão acima para disponibilizar materiais técnicos para os clientes."
            icone={abaAtiva === 'cursos' ? 'curso' : 'download'}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {listaFiltrada.map(m => (
              <div key={m.id} style={{
                ...card,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: m.destaque ? '4px solid ' + c.azul : '1px solid ' + c.borda
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: c.azul,
                      marginBottom: 4
                    }}>
                      {m.categoria || m.tipo}
                    </span>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: c.tinta }}>
                      {m.titulo}
                    </h4>
                  </div>

                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: m.publicado ? '#ecfdf5' : '#fef2f2',
                    color: m.publicado ? '#065f46' : '#991b1b'
                  }}>
                    {m.publicado ? 'Publicado' : 'Oculto'}
                  </span>
                </div>

                <p style={{ margin: '8px 0', fontSize: 12.5, color: c.cinza, lineHeight: 1.5, flex: 1 }}>
                  {m.descricao}
                </p>

                {/* Metadados */}
                <div style={{
                  fontSize: 12,
                  color: c.cinza,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  margin: '8px 0',
                  padding: '8px 10px',
                  background: '#f8fafc',
                  borderRadius: 6
                }}>
                  {abaAtiva === 'cursos' ? (
                    <>
                      <div><strong>Nível:</strong> {m.nivel || 'Iniciante'}</div>
                      <div><strong>Formato:</strong> {m.paginas ? `${m.paginas} páginas` : 'Apostila Completa'}</div>
                    </>
                  ) : (
                    <>
                      <div><strong>Versão:</strong> {m.versao || '1.0'} ({m.tamanho || 'Auto'})</div>
                      <div><strong>Sistema:</strong> {m.sistema || 'Windows'}</div>
                    </>
                  )}
                  <div>
                    <strong>Acesso:</strong> {
                      m.disponibilidade === 'plano' ? `Plano ${m.plano_minimo || 'Profissional'}+` :
                      m.disponibilidade === 'empresa' ? 'Empresa específica' : 'Todos os clientes'
                    }
                  </div>
                </div>

                {/* Rodapé e Botões */}
                <div style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid ' + c.borda,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => handleAlternarPublicado(m)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      color: m.publicado ? '#b91c1c' : '#047857',
                      cursor: 'pointer'
                    }}
                  >
                    {m.publicado ? 'Ocultar' : 'Publicar'}
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => abrirEditar(m)}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid ' + c.borda,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(m.id, m.titulo)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        padding: 4
                      }}
                      title="Excluir"
                    >
                      <Icone nome="lixeira" tamanho={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL FORMULÁRIO MATERIAL */}
      {modalAberto && (
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
            maxWidth: 680,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.tinta }}>
                  {itemEdicao ? 'Editar Material Técnico' : 'Novo Material Técnico'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: c.cinza }}>
                  Conteúdo disponibilizado na área exclusiva do cliente.
                </p>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.cinza }}>
                <Icone nome="fechar" tamanho={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Tipo de Conteúdo</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                  >
                    <option value="curso">Curso Completo</option>
                    <option value="apostila">Apostila / Manual PDF</option>
                    <option value="apresentacao">Apresentação de Slides</option>
                    <option value="software">Software / Utilitário</option>
                    <option value="driver">Driver / Instalador</option>
                    <option value="ferramenta">Ferramenta de Suporte</option>
                  </select>
                </div>

                <Campo rotulo="Categoria" valor={form.categoria} onChange={v => setForm({ ...form, categoria: v })} placeholder="Ex: Segurança da Informação, LGPD, Suporte" obrigatorio />

                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo rotulo="Título do Material" valor={form.titulo} onChange={v => setForm({ ...form, titulo: v })} placeholder="Ex: Cartilha de Segurança contra Phishing e Ransomware" obrigatorio />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo rotulo="Link Externo / Download Direto" valor={form.link_externo || ''} onChange={v => setForm({ ...form, link_externo: v })} placeholder="https://..." dica="Link direto para o instalador, Google Drive ou YouTube" />
                </div>

                {['curso', 'apostila', 'apresentacao'].includes(form.tipo) ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Nível</label>
                      <select
                        value={form.nivel || 'Básico'}
                        onChange={e => setForm({ ...form, nivel: e.target.value })}
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                      >
                        <option value="Básico">Básico</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                      </select>
                    </div>
                    <Campo rotulo="Páginas / Aulas" type="number" valor={form.paginas || 20} onChange={v => setForm({ ...form, paginas: Number(v) || 0 })} />
                  </>
                ) : (
                  <>
                    <Campo rotulo="Versão" valor={form.versao || ''} onChange={v => setForm({ ...form, versao: v })} placeholder="Ex: 3.2.1" />
                    <Campo rotulo="Tamanho" valor={form.tamanho || ''} onChange={v => setForm({ ...form, tamanho: v })} placeholder="Ex: 14.8 MB" />
                    <Campo rotulo="Sistema Operacional" valor={form.sistema || ''} onChange={v => setForm({ ...form, sistema: v })} placeholder="Ex: Windows 10/11, macOS, Linux" />
                  </>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Regra de Disponibilidade</label>
                  <select
                    value={form.disponibilidade}
                    onChange={e => setForm({ ...form, disponibilidade: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                  >
                    <option value="todos">Disponível para Todos os Clientes</option>
                    <option value="plano">Restrito por Plano Contratado</option>
                    <option value="empresa">Restrito a Empresa Específica</option>
                  </select>
                </div>

                {form.disponibilidade === 'plano' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Plano Mínimo Exigido</label>
                    <select
                      value={form.plano_minimo || 'Básico'}
                      onChange={e => setForm({ ...form, plano_minimo: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                    >
                      <option value="Básico">A partir do Plano Básico</option>
                      <option value="Profissional">A partir do Plano Profissional</option>
                      <option value="Premium">Exclusivo Plano Premium</option>
                    </select>
                  </div>
                )}

                {form.disponibilidade === 'empresa' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Empresa Permitida</label>
                    <select
                      value={form.empresa_id || ''}
                      onChange={e => setForm({ ...form, empresa_id: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid ' + c.borda }}
                    >
                      <option value="">Selecione a empresa...</option>
                      {empresas.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.razao_social}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.tinta, marginBottom: 6 }}>Descrição do Material</label>
                <textarea
                  rows={3}
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + c.borda, fontSize: 13, fontFamily: 'inherit' }}
                  placeholder="Resumo do conteúdo, instruções de uso ou benefícios para a equipe..."
                />
              </div>

              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.destaque}
                    onChange={e => setForm({ ...form, destaque: e.target.checked })}
                  />
                  <span>Destacar no topo da lista</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.publicado}
                    onChange={e => setForm({ ...form, publicado: e.target.checked })}
                  />
                  <span>Publicar imediatamente</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setModalAberto(false)} style={botao.secundario}>Cancelar</button>
                <button type="submit" disabled={salvando} style={botao.primario}>
                  {salvando ? 'Salvando...' : 'Salvar e Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

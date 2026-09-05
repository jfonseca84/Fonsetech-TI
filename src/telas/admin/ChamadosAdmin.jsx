import { useState } from 'react';
import { c, card, TONS, mono, horaBR, STATUS, PRIORIDADES } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { listarChamados, atualizarChamado, listarHistorico, comentar, listarAdmins, listarEmpresas, listarAnexosChamado, urlAnexoChamado, listarMaquinasEmpresa } from '../../dados/consultas.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import { Carregando, Erro, Vazio, Aviso } from '../../ui/Estado.jsx';
import Modal, { BotaoFechar } from '../../ui/Modal.jsx';
import Botao from '../../ui/Botao.jsx';
import { Campo } from '../../ui/Campo.jsx';
import LinhaChamado from '../../ui/LinhaChamado.jsx';
import Icone from '../../ui/Icone.jsx';

export default function ChamadosAdmin() {
  const { perfil } = useSessao();
  const ch = usarDados(listarChamados, [], []);
  const emp = usarDados(listarEmpresas, [], []);
  const adm = usarDados(listarAdmins, [], []);

  const [busca, setBusca] = useState('');
  const [fEmpresa, setFEmpresa] = useState('');
  const [fPrio, setFPrio] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [hist, setHist] = useState([]);
  const [carHist, setCarHist] = useState(false);
  const [anexos, setAnexos] = useState([]);
  const [maquinasEmpresa, setMaquinasEmpresa] = useState([]);
  const [resposta, setResposta] = useState('');
  const [interno, setInterno] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [okForm, setOkForm] = useState('');

  async function abrir(x) {
    setDetalhe(x);
    setResposta('');
    setInterno(false);
    setErroForm('');
    setOkForm('');
    setCarHist(true);
    setAnexos([]);
    setMaquinasEmpresa([]);
    try {
      setHist(await listarHistorico(x.id));
      setAnexos(await listarAnexosChamado(x.id));
      if (x.empresa_id) setMaquinasEmpresa(await listarMaquinasEmpresa(x.empresa_id));
    } catch (e) {
      setErroForm(traduzir(e));
    } finally {
      setCarHist(false);
    }
  }

  async function abrirAnexo(anexo) {
    try {
      const url = await urlAnexoChamado(anexo.arquivo_path);
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setErroForm(traduzir(e));
    }
  }

  async function mudar(campo, valor) {
    setSalvando(true);
    setErroForm('');
    setOkForm('');
    try {
      const atualizado = await atualizarChamado(detalhe.id, { [campo]: valor || null });
      setDetalhe(atualizado);
      setHist(await listarHistorico(detalhe.id));
      ch.recarregar();
      setOkForm('Chamado atualizado.');
    } catch (e) {
      setErroForm(traduzir(e));
    } finally {
      setSalvando(false);
    }
  }

  async function responder(e) {
    e.preventDefault();
    if (!resposta.trim()) return;
    setSalvando(true);
    setErroForm('');
    try {
      const nova = await comentar(detalhe.id, perfil.id, perfil.nome, resposta.trim(), interno);
      setHist((h) => [...h, nova]);
      setResposta('');
      setOkForm(interno ? 'Nota interna registrada.' : 'Resposta enviada ao cliente.');
    } catch (er) {
      setErroForm(traduzir(er));
    } finally {
      setSalvando(false);
    }
  }

  if (ch.carregando) return <Carregando altura={320} />;
  if (ch.erro) return <div style={{ marginTop: 26 }}><Erro mensagem={ch.erro} aoTentar={ch.recarregar} /></div>;

  const termo = busca.trim().toLowerCase();
  const lista = (ch.dados || []).filter((x) => {
    if (fEmpresa && x.empresa_id !== fEmpresa) return false;
    if (fPrio && x.prioridade !== fPrio) return false;
    if (fStatus && x.status !== fStatus) return false;
    if (termo && !((x.titulo + ' ' + x.numero + ' ' + (x.empresas?.razao_social || '')).toLowerCase().includes(termo))) return false;
    return true;
  });

  const tom = detalhe ? (TONS[detalhe.status] || TONS['Aberto']) : null;

  return (
    <>
      <div style={{ marginTop: 24, ...card, padding: '18px 20px', display: 'grid', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
            <Icone nome="busca" tamanho={16} cor="#8794b0" largura={1.8} />
          </span>
          <Campo
            placeholder="Buscar por título, número ou empresa"
            value={busca} onChange={(e) => setBusca(e.target.value)}
            compacto style={{ paddingLeft: 40 }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Campo
            compacto value={fEmpresa} onChange={(e) => setFEmpresa(e.target.value)}
            opcoes={[{ valor: '', texto: 'Todas as empresas' }, ...(emp.dados || []).map((x) => ({ valor: x.id, texto: x.razao_social }))]}
          />
          <Campo
            compacto value={fPrio} onChange={(e) => setFPrio(e.target.value)}
            opcoes={[{ valor: '', texto: 'Todas as prioridades' }, ...PRIORIDADES]}
          />
          <Campo
            compacto value={fStatus} onChange={(e) => setFStatus(e.target.value)}
            opcoes={[{ valor: '', texto: 'Todos os status' }, ...STATUS]}
          />
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {lista.map((x) => <LinhaChamado key={x.id} chamado={x} mostrarEmpresa aoAbrir={abrir} />)}
      </div>

      {lista.length === 0 && (
        <div style={{ marginTop: 18 }}>
          <Vazio titulo="Nenhum chamado encontrado" texto="Ajuste a busca ou os filtros acima." icone="ticket" />
        </div>
      )}

      <Modal aberto={!!detalhe} aoFechar={() => setDetalhe(null)} largura={960}>
        {detalhe && (
          <>
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 16, padding: '24px 26px', borderBottom: '1px solid ' + c.borda
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 12, color: c.texto3 }}>{detalhe.numero}</div>
                <h2 style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', textWrap: 'pretty' }}>{detalhe.titulo}</h2>
                <div style={{ marginTop: 10, fontSize: 12.5, color: c.texto3 }}>
                  {detalhe.empresas?.razao_social} · aberto por {detalhe.autor?.nome} · {horaBR(detalhe.aberto_em)}
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999, color: tom.fg, background: tom.bg }}>
                    {detalhe.status}
                  </span>
                  <span style={{ fontSize: 11.5, color: c.texto4 }}>{detalhe.categoria}</span>
                  {(detalhe.maquinas?.nome || detalhe.equipamento_livre) && (
                    <span style={{ fontSize: 11.5, color: c.texto4 }}>
                      {detalhe.maquinas?.nome || detalhe.equipamento_livre}
                      {detalhe.usuario_equipamento ? ' · ' + detalhe.usuario_equipamento : ''}
                    </span>
                  )}
                </div>
              </div>
              <BotaoFechar onClick={() => setDetalhe(null)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 auto', minWidth: 0, padding: '24px 26px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14,
                padding: '18px 20px', borderRadius: 12, background: c.fundoCampo, border: '1px solid ' + c.borda
              }}>
                <Campo
                  label="Status" compacto opcoes={STATUS} value={detalhe.status}
                  disabled={salvando} onChange={(e) => mudar('status', e.target.value)}
                />
                <Campo
                  label="Prioridade" compacto opcoes={PRIORIDADES} value={detalhe.prioridade}
                  disabled={salvando} onChange={(e) => mudar('prioridade', e.target.value)}
                />
                <Campo
                  label="Responsável" compacto
                  value={detalhe.responsavel_id || ''}
                  disabled={salvando}
                  onChange={(e) => mudar('responsavel_id', e.target.value)}
                  opcoes={[{ valor: '', texto: 'Não atribuído' }, ...(adm.dados || []).map((a) => ({ valor: a.id, texto: a.nome }))]}
                />
              </div>

              <p style={{ margin: '22px 0 0', fontSize: 14, lineHeight: 1.7, color: c.texto2, textWrap: 'pretty' }}>{detalhe.descricao}</p>

              {anexos.length > 0 && (
                <>
                  <h3 style={{ margin: '22px 0 0', fontSize: 12, fontWeight: 700, letterSpacing: 1, color: c.texto3 }}>ANEXOS</h3>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {anexos.map((a) => (
                      <button
                        key={a.id} type="button" onClick={() => abrirAnexo(a)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 8,
                          background: c.fundoCampo, border: '1px solid ' + c.borda, cursor: 'pointer',
                          fontSize: 12, color: c.azulEscuro, fontFamily: 'inherit', maxWidth: 220
                        }}
                        title={a.nome_original}
                      >
                        <Icone nome="documento" tamanho={13} style={{ flex: 'none' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome_original}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <h3 style={{ margin: '26px 0 0', fontSize: 12, fontWeight: 700, letterSpacing: 1, color: c.texto3 }}>HISTÓRICO</h3>
              {carHist ? <Carregando altura={120} texto="Carregando histórico..." /> : (
                <div style={{ marginTop: 14, display: 'grid', gap: 14 }}>
                  {hist.map((h) => (
                    <div key={h.id} style={{ display: 'flex', gap: 12 }}>
                      <span style={{
                        flex: 'none', width: 9, height: 9, borderRadius: '50%',
                        background: h.interno ? '#f0a020' : c.roxo, marginTop: 5
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2c3853', textWrap: 'pretty' }}>
                          {h.texto}
                          {h.interno && (
                            <span style={{
                              marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '3px 7px',
                              borderRadius: 999, color: '#a16207', background: 'rgba(240, 160, 32, 0.14)'
                            }}>INTERNA</span>
                          )}
                        </div>
                        <div style={{ marginTop: 3, fontSize: 11, color: c.texto4 }}>
                          {h.autor_nome} · {horaBR(h.criado_em)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {hist.length === 0 && <p style={{ margin: 0, fontSize: 12.5, color: c.texto3 }}>Sem movimentações.</p>}
                </div>
              )}

              <form onSubmit={responder} style={{ marginTop: 24, display: 'grid', gap: 12 }}>
                <Campo
                  label="Responder" alto={3}
                  placeholder="Escreva a atualização do atendimento."
                  value={resposta} onChange={(e) => setResposta(e.target.value)}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: c.texto2, cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={interno}
                    onChange={(e) => setInterno(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: c.roxo, cursor: 'pointer' }}
                  />
                  Nota interna (o cliente não vê)
                </label>
                {erroForm && <Erro mensagem={erroForm} />}
                {okForm && <Aviso>{okForm}</Aviso>}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Botao
                    type="submit" tipo="roxo" disabled={salvando || !resposta.trim()} iconeDepois="seta"
                    style={{ fontSize: 13.5, padding: '12px 18px' }}
                  >
                    {salvando ? 'Enviando...' : 'Enviar'}
                  </Botao>
                </div>
              </form>
            </div>

            <div style={{
              flex: 'none', width: 260, padding: '24px 22px', alignSelf: 'stretch',
              borderLeft: '1px solid ' + c.borda, background: c.fundoCampo
            }}>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 1, color: c.texto3 }}>EMPRESA</h3>
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: c.tinta, textWrap: 'pretty' }}>
                {detalhe.empresas?.razao_social}
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {detalhe.empresas?.plano && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, color: c.roxo, background: 'rgba(124, 58, 237, 0.1)' }}>
                    {detalhe.empresas.plano}
                  </span>
                )}
                {detalhe.empresas?.status_cliente && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, color: c.verdeTexto, background: 'rgba(34, 192, 122, 0.12)' }}>
                    {detalhe.empresas.status_cliente}
                  </span>
                )}
              </div>

              {(detalhe.empresas?.responsavel_nome) && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: c.texto4 }}>RESPONSÁVEL</div>
                  <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 600, color: '#2c3853' }}>{detalhe.empresas.responsavel_nome}</div>
                  {detalhe.empresas.responsavel_cargo && (
                    <div style={{ fontSize: 11.5, color: c.texto4 }}>{detalhe.empresas.responsavel_cargo}</div>
                  )}
                  {detalhe.empresas.responsavel_email && (
                    <div style={{ marginTop: 4, fontSize: 11.5, color: c.texto3, overflowWrap: 'anywhere' }}>{detalhe.empresas.responsavel_email}</div>
                  )}
                  {detalhe.empresas.responsavel_whatsapp && (
                    <div style={{ fontSize: 11.5, color: c.texto3 }}>{detalhe.empresas.responsavel_whatsapp}</div>
                  )}
                </div>
              )}

              {(detalhe.empresas?.telefone || detalhe.empresas?.whatsapp) && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: c.texto4 }}>CONTATO DA EMPRESA</div>
                  {detalhe.empresas.telefone && <div style={{ marginTop: 5, fontSize: 11.5, color: c.texto3 }}>{detalhe.empresas.telefone}</div>}
                  {detalhe.empresas.whatsapp && <div style={{ fontSize: 11.5, color: c.texto3 }}>{detalhe.empresas.whatsapp}</div>}
                </div>
              )}

              {(detalhe.empresas?.endereco || detalhe.empresas?.cidade) && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: c.texto4 }}>ENDEREÇO</div>
                  {detalhe.empresas.endereco && (
                    <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.5, color: c.texto3 }}>{detalhe.empresas.endereco}</div>
                  )}
                  {(detalhe.empresas.cidade || detalhe.empresas.estado) && (
                    <div style={{ fontSize: 11.5, color: c.texto3 }}>
                      {[detalhe.empresas.cidade, detalhe.empresas.estado].filter(Boolean).join(' / ')}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: c.texto4 }}>
                  MÁQUINAS ({maquinasEmpresa.length})
                </div>
                {maquinasEmpresa.length === 0 ? (
                  <div style={{ marginTop: 5, fontSize: 11.5, color: c.texto4 }}>Nenhuma cadastrada.</div>
                ) : (
                  <div style={{ marginTop: 6, display: 'grid', gap: 3 }}>
                    {maquinasEmpresa.slice(0, 6).map((m) => (
                      <div key={m.id} style={{ fontSize: 11.5, color: c.texto3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.nome}{m.usuario ? ' — ' + m.usuario : ''}
                      </div>
                    ))}
                    {maquinasEmpresa.length > 6 && (
                      <div style={{ fontSize: 11, color: c.texto4 }}>+{maquinasEmpresa.length - 6} outra(s)</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
        )}
      </Modal>
    </>
  );
}

import { useState } from 'react';
import { c, TONS, mono, horaBR, STATUS } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { listarChamados, listarHistorico, comentar, listarAnexosChamado, urlAnexoChamado } from '../../dados/consultas.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import { Carregando, Erro, Vazio } from '../../ui/Estado.jsx';
import Chip from '../../ui/Chip.jsx';
import Modal, { BotaoFechar } from '../../ui/Modal.jsx';
import Botao from '../../ui/Botao.jsx';
import { Campo } from '../../ui/Campo.jsx';
import Icone from '../../ui/Icone.jsx';
import LinhaChamado from '../../ui/LinhaChamado.jsx';

const FILTROS = ['Todos', ...STATUS];

export default function MeusChamados() {
  const { perfil } = useSessao();
  const { dados, carregando, erro, recarregar } = usarDados(listarChamados, [], []);
  const [filtro, setFiltro] = useState('Todos');
  const [detalhe, setDetalhe] = useState(null);
  const [hist, setHist] = useState([]);
  const [carHist, setCarHist] = useState(false);
  const [anexos, setAnexos] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  async function abrir(ch) {
    setDetalhe(ch);
    setTexto('');
    setErroForm('');
    setCarHist(true);
    setAnexos([]);
    try {
      setHist(await listarHistorico(ch.id));
      setAnexos(await listarAnexosChamado(ch.id));
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

  async function responder(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setErroForm('');
    try {
      const nova = await comentar(detalhe.id, perfil.id, perfil.nome, texto.trim());
      setHist((h) => [...h, nova]);
      setTexto('');
    } catch (er) {
      setErroForm(traduzir(er));
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <Carregando altura={320} />;
  if (erro) return <div style={{ marginTop: 26 }}><Erro mensagem={erro} aoTentar={recarregar} /></div>;

  const lista = filtro === 'Todos' ? dados : dados.filter((x) => x.status === filtro);
  const tom = detalhe ? (TONS[detalhe.status] || TONS['Aberto']) : null;

  return (
    <>
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        {FILTROS.map((f) => (
          <Chip key={f} ativo={filtro === f} onClick={() => setFiltro(f)}>{f}</Chip>
        ))}
      </div>

      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {lista.map((x) => <LinhaChamado key={x.id} chamado={x} aoAbrir={abrir} />)}
      </div>

      {lista.length === 0 && (
        <div style={{ marginTop: 18 }}>
          <Vazio
            titulo={filtro === 'Todos' ? 'Nenhum chamado registrado' : 'Nenhum chamado com este status'}
            texto={filtro === 'Todos'
              ? 'Quando sua empresa abrir o primeiro chamado, ele aparece aqui com o histórico completo.'
              : 'Troque o filtro para ver os demais chamados da sua empresa.'}
            icone="ticket"
          />
        </div>
      )}

      <Modal aberto={!!detalhe} aoFechar={() => setDetalhe(null)}>
        {detalhe && (
          <>
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 16, padding: '24px 26px', borderBottom: '1px solid ' + c.borda
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 12, color: c.texto3 }}>{detalhe.numero}</div>
                <h2 style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', textWrap: 'pretty' }}>{detalhe.titulo}</h2>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999, color: tom.fg, background: tom.bg }}>
                    {detalhe.status}
                  </span>
                  <span style={{ fontSize: 11.5, color: c.texto4 }}>{detalhe.categoria}</span>
                  <span style={{ fontSize: 11.5, color: c.texto4 }}>Prioridade {detalhe.prioridade}</span>
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

            <div style={{ padding: '24px 26px' }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: c.texto2, textWrap: 'pretty' }}>{detalhe.descricao}</p>

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
                        background: c.azul, marginTop: 5
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2c3853', textWrap: 'pretty' }}>{h.texto}</div>
                        <div style={{ marginTop: 3, fontSize: 11, color: c.texto4 }}>
                          {h.autor_nome} · {horaBR(h.criado_em)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {hist.length === 0 && (
                    <p style={{ margin: 0, fontSize: 12.5, color: c.texto3 }}>Sem movimentações registradas.</p>
                  )}
                </div>
              )}

              {detalhe.status !== 'Resolvido' && (
                <form onSubmit={responder} style={{ marginTop: 24, display: 'grid', gap: 12 }}>
                  <Campo
                    label="Adicionar informação"
                    alto={3}
                    placeholder="Descreva o que mudou ou responda ao técnico."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                  />
                  {erroForm && <Erro mensagem={erroForm} />}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Botao type="submit" disabled={enviando || !texto.trim()} iconeDepois="seta">
                      {enviando ? 'Enviando...' : 'Enviar'}
                    </Botao>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

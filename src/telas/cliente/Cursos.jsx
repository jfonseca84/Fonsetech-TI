import { useState } from 'react';
import { c, card } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { listarMateriais, urlAssinada } from '../../dados/consultas.js';
import { Carregando, Erro, Vazio } from '../../ui/Estado.jsx';
import Chip from '../../ui/Chip.jsx';
import Botao from '../../ui/Botao.jsx';
import Icone from '../../ui/Icone.jsx';

const CATS = ['Todas', 'Segurança', 'Infraestrutura', 'Redes', 'Produtividade'];

export default function Cursos() {
  const { dados, carregando, erro, recarregar } = usarDados(() => listarMateriais(['pdf', 'ppt']), [], []);
  const [cat, setCat] = useState('Todas');
  const [leitura, setLeitura] = useState(null);
  const [url, setUrl] = useState('');
  const [carUrl, setCarUrl] = useState(false);
  const [erroUrl, setErroUrl] = useState('');

  async function abrir(m) {
    setLeitura(m);
    setUrl('');
    setErroUrl('');
    if (!m.arquivo_path) return;
    setCarUrl(true);
    try {
      setUrl(await urlAssinada(m.arquivo_path));
    } catch (e) {
      setErroUrl(traduzir(e));
    } finally {
      setCarUrl(false);
    }
  }

  function telaCheia() {
    const el = document.getElementById('fs-visualizador');
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
  }

  if (carregando) return <Carregando altura={320} />;
  if (erro) return <div style={{ marginTop: 26 }}><Erro mensagem={erro} aoTentar={recarregar} /></div>;

  /* ----- visualizador ocupando toda a área ----- */
  if (leitura) {
    const ppt = leitura.tipo === 'ppt';
    return (
      <div id="fs-visualizador" style={{
        marginTop: 24, display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 128px)', background: c.branco,
        border: '1px solid ' + c.borda, borderRadius: 14, overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + c.borda }}>
          <Botao tipo="secundario" icone="voltar" onClick={() => setLeitura(null)} style={{ padding: '9px 14px', fontSize: 13 }}>
            Voltar
          </Botao>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.3, textWrap: 'pretty' }}>{leitura.titulo}</h2>
              <div style={{ marginTop: 6, fontSize: 12, color: c.texto3 }}>
                {leitura.paginas ? leitura.paginas + (ppt ? ' slides · ' : ' páginas · ') : ''}
                {leitura.nivel} · {leitura.categoria}
              </div>
            </div>
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Botao tipo="secundario" icone="telaCheia" onClick={telaCheia} style={{ padding: '10px 15px' }}>
                Tela cheia
              </Botao>
              {url && (
                <a
                  href={url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 15px',
                    borderRadius: 9, background: c.azul, color: c.branco, fontSize: 13,
                    fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap'
                  }}
                >
                  <Icone nome="download" tamanho={14} largura={2} />
                  {ppt ? 'Baixar apresentação' : 'Baixar PDF'}
                </a>
              )}
            </div>
          </div>
        </div>

        <div style={{
          flex: 1, minHeight: 0, background: '#e8edf6', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          {carUrl && <Carregando texto="Preparando o material..." />}
          {!carUrl && url && (
            <iframe
              src={url} title={leitura.titulo} allowFullScreen
              style={{
                width: '100%', height: '100%', border: 0, borderRadius: 6,
                background: c.branco, boxShadow: '0 10px 30px rgba(20, 45, 100, 0.12)'
              }}
            />
          )}
          {!carUrl && !url && (
            <div style={{
              width: '100%', height: '100%', background: c.branco,
              border: '1px solid ' + c.borda2, borderRadius: 6,
              boxShadow: '0 10px 30px rgba(20, 45, 100, 0.12)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 14, padding: 34, textAlign: 'center'
            }}>
              <Icone nome={ppt ? 'ppt' : 'pdf'} tamanho={42} cor={c.texto4} largura={1.4} />
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#2c3853' }}>
                {erroUrl ? 'Não foi possível abrir' : (ppt ? 'Apresentação em preparação' : 'Apostila em preparação')}
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.62, color: c.texto3, maxWidth: 320 }}>
                {erroUrl || 'Este material ainda não foi publicado. Assim que estiver disponível, ele aparece aqui para leitura e download.'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ----- lista de materiais ----- */
  const lista = cat === 'Todas' ? dados : dados.filter((m) => m.categoria === cat);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        {CATS.map((f) => <Chip key={f} ativo={cat === f} onClick={() => setCat(f)}>{f}</Chip>)}
      </div>

      {lista.length === 0 ? (
        <div style={{ marginTop: 18 }}>
          <Vazio
            titulo="Nenhum material publicado"
            texto="As apostilas e apresentações aparecem aqui assim que a equipe Fonsetech publicá-las."
            icone="curso"
          />
        </div>
      ) : (
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
          {lista.map((m) => {
            const ppt = m.tipo === 'ppt';
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', ...card, padding: '22px 22px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{
                    flex: 'none', width: 42, height: 42, borderRadius: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ppt ? 'rgba(234, 88, 12, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid ' + (ppt ? 'rgba(234, 88, 12, 0.22)' : 'rgba(220, 38, 38, 0.2)')
                  }}>
                    <Icone nome={ppt ? 'ppt' : 'pdf'} tamanho={20} cor={ppt ? '#ea580c' : '#dc2626'} largura={1.7} />
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, padding: '4px 9px',
                      borderRadius: 999,
                      color: ppt ? '#c2410c' : '#b91c1c',
                      background: ppt ? 'rgba(234, 88, 12, 0.12)' : 'rgba(220, 38, 38, 0.09)'
                    }}>{ppt ? 'POWERPOINT' : 'PDF'}</span>
                    {m.nivel && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999,
                        color: m.nivel === 'Básico' ? c.verdeTexto : '#0369a1',
                        background: m.nivel === 'Básico' ? 'rgba(34, 192, 122, 0.12)' : 'rgba(56, 189, 248, 0.14)'
                      }}>{m.nivel}</span>
                    )}
                  </span>
                </div>
                <h3 style={{ margin: '16px 0 0', fontSize: 15.5, fontWeight: 700, lineHeight: 1.35, textWrap: 'pretty' }}>{m.titulo}</h3>
                <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.6, color: c.texto3, textWrap: 'pretty' }}>{m.descricao}</p>
                <div style={{ marginTop: 16, fontSize: 11.5, color: c.texto4 }}>
                  {m.paginas ? m.paginas + (ppt ? ' slides · ' : ' páginas · ') : ''}{m.nivel}
                </div>
                <Botao onClick={() => abrir(m)} icone="olho" style={{ marginTop: 18, width: '100%' }}>
                  {ppt ? 'Abrir apresentação' : 'Visualizar apostila'}
                </Botao>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

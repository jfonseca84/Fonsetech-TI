import { useMemo, useRef, useState } from 'react';
import { c, card } from '../../ui/tokens.js';
import { listarSiteImagens, salvarSiteImagem, removerSiteImagem, urlPublicaSite } from '../../dados/consultas.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { ESPACOS, TIPOS_ACEITOS, TAMANHO_MAXIMO } from '../../dados/espacosImagem.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import Botao from '../../ui/Botao.jsx';
import { Carregando, Erro, Aviso } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';
import { Painel } from './partes.jsx';

export default function ConfiguracoesSite() {
  const { perfil } = useSessao();
  const { dados, carregando, erro, recarregar } = usarDados(listarSiteImagens, [], []);
  const [msg, setMsg] = useState(null);

  const porSlug = useMemo(() => {
    const m = {};
    (dados || []).forEach((r) => { m[r.slug] = r; });
    return m;
  }, [dados]);

  return (
    <>
      <Painel style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
          <Icone nome="info" tamanho={17} cor={c.azul} largura={1.9} style={{ flex: 'none', marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: c.texto2 }}>
            As imagens enviadas aqui entram no site público na hora — sem nova publicação.
            Use JPG, PNG ou WebP de até 3 MB. O recorte preenche o espaço e apara o excesso,
            então deixe o assunto centralizado.
          </p>
        </div>
      </Painel>

      {msg && <div style={{ marginTop: 18 }}><Aviso tom={msg.tom}>{msg.texto}</Aviso></div>}
      {erro && <div style={{ marginTop: 18 }}><Erro mensagem={erro} aoTentar={recarregar} /></div>}

      {carregando ? (
        <div style={{ marginTop: 20 }}><Carregando /></div>
      ) : (
        <div style={{ marginTop: 20, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))' }}>
          {ESPACOS.map((e) => (
            <CartaoEspaco
              key={e.slug}
              espaco={e}
              registro={porSlug[e.slug]}
              autorId={perfil?.id}
              aoTerminar={(texto, tom = 'ok') => { setMsg({ tom, texto }); recarregar(); }}
            />
          ))}
        </div>
      )}
    </>
  );
}

function CartaoEspaco({ espaco, registro, autorId, aoTerminar }) {
  const entrada = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [previa, setPrevia] = useState('');

  const url = previa || (registro ? urlPublicaSite(registro.arquivo_path, registro.atualizado_em) : '');

  async function escolher(ev) {
    const arquivo = ev.target.files?.[0];
    ev.target.value = '';
    if (!arquivo) return;

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setErro('Formato não aceito. Envie JPG, PNG ou WebP.');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro('Arquivo acima de 3 MB. Comprima a imagem antes de enviar.');
      return;
    }

    setErro('');
    setEnviando(true);
    setPrevia(URL.createObjectURL(arquivo));
    try {
      await salvarSiteImagem(espaco.slug, arquivo, autorId);
      aoTerminar(espaco.titulo + ' atualizada no site.');
    } catch (err) {
      setPrevia('');
      setErro(traduzir(err));
    } finally {
      setEnviando(false);
    }
  }

  async function restaurar() {
    setEnviando(true);
    setErro('');
    try {
      await removerSiteImagem(espaco.slug);
      setPrevia('');
      aoTerminar(espaco.titulo + ' voltou para a imagem padrão.');
    } catch (err) {
      setErro(traduzir(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ ...card, padding: '20px 22px 22px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: c.tinta }}>{espaco.titulo}</h3>
          <div style={{ marginTop: 5, fontSize: 12, color: c.texto3 }}>{espaco.onde}</div>
        </div>
        <span style={{
          flex: 'none', fontSize: 10.5, fontWeight: 700, padding: '5px 10px', borderRadius: 999,
          color: registro ? '#14804a' : c.texto3,
          background: registro ? 'rgba(34, 192, 122, 0.12)' : 'rgba(20, 45, 100, 0.06)'
        }}>{registro ? 'PERSONALIZADA' : 'PADRÃO'}</span>
      </div>

      <div style={{
        marginTop: 16, aspectRatio: espaco.proporcao, borderRadius: 11, overflow: 'hidden',
        background: c.fundoCampo, border: '1px solid ' + c.borda2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
      }}>
        {url ? (
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Icone nome="monitor" tamanho={22} cor="#a9b6d0" largura={1.7} />
            <div style={{ marginTop: 9, fontSize: 11.5, color: c.texto4 }}>
              Usando a imagem padrão do site
            </div>
          </div>
        )}
        {enviando && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12.5, fontWeight: 700, color: c.azulEscuro
          }}>Enviando...</div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 11.5, color: c.texto4 }}>
        Recomendado: {espaco.tamanho}
      </div>

      {erro && <div style={{ marginTop: 12 }}><Aviso tom="erro">{erro}</Aviso></div>}

      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          ref={entrada} type="file" accept={TIPOS_ACEITOS.join(',')}
          onChange={escolher} style={{ display: 'none' }}
        />
        <Botao tipo="roxo" icone="download" disabled={enviando}
          onClick={() => entrada.current?.click()} style={{ padding: '11px 16px', fontSize: 13 }}>
          {registro ? 'Trocar imagem' : 'Enviar imagem'}
        </Botao>
        {registro && (
          <Botao tipo="secundario" disabled={enviando} onClick={restaurar} style={{ padding: '11px 15px', fontSize: 13 }}>
            Usar padrão
          </Botao>
        )}
      </div>
    </div>
  );
}

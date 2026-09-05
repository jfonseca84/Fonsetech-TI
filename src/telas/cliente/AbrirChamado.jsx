import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { c, card, CATEGORIAS, PRIORIDADES } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { listarMaquinas, abrirChamado, enviarAnexoChamado } from '../../dados/consultas.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import { Campo } from '../../ui/Campo.jsx';
import Botao from '../../ui/Botao.jsx';
import { Erro, Aviso, Carregando } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';

const OUTRA = '__outra__';
const TIPOS_ANEXO_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const TAMANHO_MAXIMO_ANEXO = 8 * 1024 * 1024; // 8 MB
const MAX_ANEXOS = 5;

function formatarTamanho(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AbrirChamado() {
  const { perfil } = useSessao();
  const navegar = useNavigate();
  const maq = usarDados(listarMaquinas, [], []);

  const [f, setF] = useState({
    titulo: '', categoria: CATEGORIAS[0], prioridade: 'Média',
    maquina: '', equipamentoLivre: '', usuario: '', descricao: ''
  });
  const [anexos, setAnexos] = useState([]);
  const entradaArquivo = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const semCadastro = f.maquina === OUTRA;

  function escolherArquivos(ev) {
    const escolhidos = Array.from(ev.target.files || []);
    ev.target.value = '';
    if (!escolhidos.length) return;

    if (anexos.length + escolhidos.length > MAX_ANEXOS) {
      setErro(`Máximo de ${MAX_ANEXOS} arquivos por chamado.`);
      return;
    }
    for (const arq of escolhidos) {
      if (!TIPOS_ANEXO_ACEITOS.includes(arq.type)) {
        setErro(`"${arq.name}" não é um formato aceito. Envie JPG, PNG, WebP ou PDF.`);
        return;
      }
      if (arq.size > TAMANHO_MAXIMO_ANEXO) {
        setErro(`"${arq.name}" passa de 8 MB. Comprima o arquivo antes de anexar.`);
        return;
      }
    }
    setErro('');
    setAnexos((s) => [...s, ...escolhidos]);
  }

  function removerAnexo(idx) {
    setAnexos((s) => s.filter((_, i) => i !== idx));
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setOk('');
    if (!f.titulo.trim() || !f.descricao.trim()) {
      setErro('Preencha o título e a descrição do problema.');
      return;
    }
    if (semCadastro && !f.equipamentoLivre.trim()) {
      setErro('Informe qual é o equipamento.');
      return;
    }
    setEnviando(true);
    try {
      const novo = await abrirChamado({
        empresa_id: perfil.empresa_id,
        aberto_por: perfil.id,
        titulo: f.titulo.trim(),
        categoria: f.categoria,
        descricao: f.descricao.trim(),
        prioridade: f.prioridade,
        status: f.prioridade === 'Urgente' ? 'Urgente' : 'Aberto',
        maquina_id: f.maquina && !semCadastro ? f.maquina : null,
        equipamento_livre: semCadastro ? f.equipamentoLivre.trim() : null,
        usuario_equipamento: f.usuario.trim() || null
      });

      let falhaAnexo = false;
      for (const arq of anexos) {
        try {
          await enviarAnexoChamado(novo.id, arq, perfil.id);
        } catch {
          falhaAnexo = true;
        }
      }

      setOk(falhaAnexo
        ? 'Chamado registrado, mas algum anexo falhou ao enviar. Você pode reenviá-lo depois pela tela "Meus chamados".'
        : 'Chamado registrado. Nossa equipe foi notificada.');
      setF({ titulo: '', categoria: CATEGORIAS[0], prioridade: 'Média', maquina: '', equipamentoLivre: '', usuario: '', descricao: '' });
      setAnexos([]);
      setTimeout(() => navegar('/dashboard/chamados'), 1400);
    } catch (er) {
      setErro(traduzir(er));
    } finally {
      setEnviando(false);
    }
  }

  if (maq.carregando) return <Carregando altura={320} />;

  const opcoesMaquina = [
    { valor: '', texto: 'Não se aplica' },
    ...(maq.dados || []).map((m) => ({
      valor: m.id,
      texto: m.nome + (m.usuario ? ' — ' + m.usuario : '') + (m.setor ? ' (' + m.setor + ')' : '')
    })),
    { valor: OUTRA, texto: 'Outro equipamento (não cadastrado)' }
  ];

  const escolhida = (maq.dados || []).find((m) => m.id === f.maquina);

  return (
    <form onSubmit={enviar} style={{ marginTop: 24, maxWidth: 720, ...card, padding: '26px 28px', display: 'grid', gap: 18 }}>
      <Campo
        label="Título do chamado"
        placeholder="Ex.: Internet caindo no setor financeiro"
        value={f.titulo} onChange={set('titulo')}
      />

      <div className="fs-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Campo label="Categoria" opcoes={CATEGORIAS} value={f.categoria} onChange={set('categoria')} />
        <Campo label="Prioridade" opcoes={PRIORIDADES} value={f.prioridade} onChange={set('prioridade')} />
      </div>

      <div style={{
        padding: '18px 20px', borderRadius: 12, background: c.fundoCampo,
        border: '1px solid ' + c.borda, display: 'grid', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icone nome="monitor" tamanho={17} cor={c.azulEscuro} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2c3853' }}>Equipamento com problema</span>
        </div>

        <Campo label="Máquina cadastrada" opcoes={opcoesMaquina} value={f.maquina} onChange={set('maquina')} />

        {escolhida && (
          <div style={{ fontSize: 11.5, lineHeight: 1.6, color: c.texto3 }}>
            {[escolhida.modelo, escolhida.sistema, escolhida.rede === 'Estático' && escolhida.ip ? 'IP ' + escolhida.ip : escolhida.rede]
              .filter(Boolean).join(' · ')}
          </div>
        )}

        {semCadastro && (
          <Campo
            label="Qual equipamento"
            placeholder="Ex.: notebook do setor de compras"
            value={f.equipamentoLivre} onChange={set('equipamentoLivre')}
          />
        )}

        <Campo
          label="Usuário do equipamento"
          placeholder="Ex.: João Ferreira"
          value={f.usuario} onChange={set('usuario')}
        />
      </div>

      <Campo
        label="Descrição do problema"
        alto={5}
        placeholder="Explique o que acontece, desde quando e o que já foi tentado."
        value={f.descricao} onChange={set('descricao')}
      />

      <div>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#2c3853', marginBottom: 8 }}>
          Anexos (opcional)
        </label>
        <input
          ref={entradaArquivo} type="file" multiple
          accept={TIPOS_ANEXO_ACEITOS.join(',')}
          onChange={escolherArquivos} style={{ display: 'none' }}
        />
        <Botao
          type="button" tipo="secundario" icone="download"
          onClick={() => entradaArquivo.current?.click()}
          disabled={anexos.length >= MAX_ANEXOS}
        >
          Anexar arquivo
        </Botao>
        <span style={{ marginLeft: 10, fontSize: 11.5, color: c.texto4 }}>
          JPG, PNG, WebP ou PDF · até 8 MB cada · máximo {MAX_ANEXOS} arquivos
        </span>

        {anexos.length > 0 && (
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {anexos.map((arq, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '9px 12px', borderRadius: 9, background: c.fundoCampo, border: '1px solid ' + c.borda
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <Icone nome="documento" tamanho={15} cor={c.texto3} style={{ flex: 'none' }} />
                  <span style={{ fontSize: 12.5, color: '#2c3853', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {arq.name}
                  </span>
                  <span style={{ flex: 'none', fontSize: 11, color: c.texto4 }}>{formatarTamanho(arq.size)}</span>
                </span>
                <button
                  type="button" onClick={() => removerAnexo(i)}
                  style={{ flex: 'none', background: 'none', border: 0, cursor: 'pointer', padding: 4, color: c.texto4 }}
                  aria-label={`Remover ${arq.name}`}
                >
                  <Icone nome="fechar" tamanho={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {erro && <Erro mensagem={erro} />}
      {ok && <Aviso>{ok}</Aviso>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, color: c.texto4 }}>
          Chamados urgentes têm retorno em até 1 hora útil.
        </span>
        <Botao type="submit" disabled={enviando} iconeDepois="seta">
          {enviando ? 'Enviando...' : 'Enviar chamado'}
        </Botao>
      </div>
    </form>
  );
}

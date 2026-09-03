import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { c, card, CATEGORIAS, PRIORIDADES } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { listarMaquinas, abrirChamado } from '../../dados/consultas.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import { Campo } from '../../ui/Campo.jsx';
import Botao from '../../ui/Botao.jsx';
import { Erro, Aviso, Carregando } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';

const OUTRA = '__outra__';

export default function AbrirChamado() {
  const { perfil } = useSessao();
  const navegar = useNavigate();
  const maq = usarDados(listarMaquinas, [], []);

  const [f, setF] = useState({
    titulo: '', categoria: CATEGORIAS[0], prioridade: 'Média',
    maquina: '', equipamentoLivre: '', usuario: '', descricao: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const semCadastro = f.maquina === OUTRA;

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
      await abrirChamado({
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
      setOk('Chamado registrado. Nossa equipe foi notificada.');
      setF({ titulo: '', categoria: CATEGORIAS[0], prioridade: 'Média', maquina: '', equipamentoLivre: '', usuario: '', descricao: '' });
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

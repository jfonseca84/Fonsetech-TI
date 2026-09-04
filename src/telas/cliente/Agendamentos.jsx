import { useState } from 'react';
import { c, card, dataBR } from '../../ui/tokens.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import { listarAgendamentos, solicitarAgendamento } from '../../dados/consultas.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import { Campo } from '../../ui/Campo.jsx';
import Botao from '../../ui/Botao.jsx';
import { Erro, Aviso } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';

const TONS_AG = {
  'Solicitado': { fg: '#a16207', bg: 'rgba(240, 160, 32, 0.14)' },
  'Confirmado': { fg: '#14804a', bg: 'rgba(34, 192, 122, 0.12)' },
  'Concluído':  { fg: '#55637f', bg: 'rgba(20, 45, 100, 0.07)' },
  'Cancelado':  { fg: '#b91c1c', bg: 'rgba(220, 38, 38, 0.09)' }
};

/** Data de hoje em AAAA-MM-DD no fuso do usuario (nao usar toISOString: ela converte para UTC). */
function hojeISO() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function Cabeca({ icone, cor, fundo, titulo, texto }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{
        flex: 'none', width: 38, height: 38, borderRadius: 10, background: fundo,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icone nome={icone} tamanho={18} cor={cor} />
      </span>
      <span>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{titulo}</span>
        <span style={{ display: 'block', fontSize: 12, color: c.texto3, marginTop: 3 }}>{texto}</span>
      </span>
    </div>
  );
}

export default function Agendamentos() {
  const { perfil } = useSessao();
  const hoje = hojeISO();
  const { dados, recarregar } = usarDados(listarAgendamentos, [], []);
  const [visita, setVisita] = useState({ data: '', hora: '', assunto: '', endereco: '' });
  const [reuniao, setReuniao] = useState({ data: '', hora: '', assunto: '', formato: 'Online' });
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(tipo, dados_) {
    setErro('');
    setOk('');
    if (!dados_.data || !dados_.hora || !dados_.assunto.trim()) {
      setErro('Informe data, horário e assunto.');
      return;
    }
    if (dados_.data < hoje) {
      setErro('A data precisa ser de hoje em diante.');
      return;
    }
    setEnviando(true);
    try {
      await solicitarAgendamento({
        empresa_id: perfil.empresa_id,
        solicitado_por: perfil.id,
        tipo,
        data: dados_.data,
        hora: dados_.hora,
        assunto: dados_.assunto.trim(),
        endereco: dados_.endereco?.trim() || null,
        formato: dados_.formato || null,
        status: 'Solicitado'
      });
      setOk(tipo === 'visita'
        ? 'Visita solicitada. Confirmamos o horário em breve.'
        : 'Reunião solicitada. Confirmamos o horário em breve.');
      if (tipo === 'visita') setVisita({ data: '', hora: '', assunto: '', endereco: '' });
      else setReuniao({ data: '', hora: '', assunto: '', formato: 'Online' });
      recarregar();
    } catch (e) {
      setErro(traduzir(e));
    } finally {
      setEnviando(false);
    }
  }

  const lista = (dados || []).filter((a) => a.status !== 'Cancelado');

  return (
    <>
      {(erro || ok) && (
        <div style={{ marginTop: 22, maxWidth: 640 }}>
          {erro && <Erro mensagem={erro} />}
          {ok && <Aviso>{ok}</Aviso>}
        </div>
      )}

      <div className="fs-grid-2" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <form
          onSubmit={(e) => { e.preventDefault(); enviar('visita', visita); }}
          style={{ ...card, padding: '24px 26px', display: 'grid', gap: 16 }}
        >
          <Cabeca
            icone="pino" cor={c.azulEscuro} fundo="rgba(29, 95, 245, 0.1)"
            titulo="Visita técnica" texto="Atendimento presencial na sua empresa"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Campo label="Data" type="date" min={hoje} compacto value={visita.data} onChange={(e) => setVisita((s) => ({ ...s, data: e.target.value }))} />
            <Campo label="Horário" type="time" compacto value={visita.hora} onChange={(e) => setVisita((s) => ({ ...s, hora: e.target.value }))} />
          </div>
          <Campo label="Assunto" compacto placeholder="Ex.: instalação de pontos de rede" value={visita.assunto} onChange={(e) => setVisita((s) => ({ ...s, assunto: e.target.value }))} />
          <Campo label="Endereço" compacto placeholder="Local do atendimento" value={visita.endereco} onChange={(e) => setVisita((s) => ({ ...s, endereco: e.target.value }))} />
          <Botao type="submit" disabled={enviando} iconeDepois="seta" style={{ height: 46 }}>Solicitar visita</Botao>
        </form>

        <form
          onSubmit={(e) => { e.preventDefault(); enviar('reuniao', reuniao); }}
          style={{ ...card, padding: '24px 26px', display: 'grid', gap: 16 }}
        >
          <Cabeca
            icone="video" cor={c.roxo} fundo="rgba(124, 58, 237, 0.1)"
            titulo="Reunião" texto="Alinhamento online ou presencial"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Campo label="Data" type="date" min={hoje} compacto value={reuniao.data} onChange={(e) => setReuniao((s) => ({ ...s, data: e.target.value }))} />
            <Campo label="Horário" type="time" compacto value={reuniao.hora} onChange={(e) => setReuniao((s) => ({ ...s, hora: e.target.value }))} />
          </div>
          <Campo label="Assunto" compacto placeholder="Ex.: revisão do plano de suporte" value={reuniao.assunto} onChange={(e) => setReuniao((s) => ({ ...s, assunto: e.target.value }))} />
          <Campo label="Formato" compacto opcoes={['Online', 'Presencial']} value={reuniao.formato} onChange={(e) => setReuniao((s) => ({ ...s, formato: e.target.value }))} />
          <Botao
            type="submit" disabled={enviando} tipo="roxo" iconeDepois="seta"
            style={{ height: 46, fontSize: 13.5, padding: '12px 18px' }}
          >Solicitar reunião</Botao>
        </form>
      </div>

      <div style={{ marginTop: 24, ...card, padding: '22px 24px' }}>
        <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700 }}>Agendamentos da empresa</h2>
        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          {lista.map((a) => {
            const t = TONS_AG[a.status] || TONS_AG['Solicitado'];
            return (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 14, padding: '13px 15px', borderRadius: 11,
                background: c.branco, border: '1px solid ' + c.borda, flexWrap: 'wrap'
              }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>
                    {a.tipo === 'visita' ? 'Visita técnica' : 'Reunião ' + (a.formato || '').toLowerCase()}
                  </span>
                  <span style={{ display: 'block', fontSize: 11.5, color: c.texto4, marginTop: 3 }}>
                    {dataBR(a.data + 'T00:00:00')} · {(a.hora || '').slice(0, 5)} · {a.assunto}
                  </span>
                </span>
                <span style={{
                  flex: 'none', fontSize: 11, fontWeight: 700, padding: '5px 10px',
                  borderRadius: 999, color: t.fg, background: t.bg
                }}>{a.status}</span>
              </div>
            );
          })}
          {lista.length === 0 && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: c.texto3 }}>
              Nenhum agendamento registrado. Use os formulários acima para solicitar.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

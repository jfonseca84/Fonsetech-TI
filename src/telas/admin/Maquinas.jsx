import { useMemo, useState } from 'react';
import { c, card } from '../../ui/tokens.js';
import { listarMaquinas, listarAcessoRemoto, listarEmpresas, criarMaquina } from '../../dados/consultas.js';
import { usarDados, traduzir } from '../../dados/usarDados.js';
import Botao from '../../ui/Botao.jsx';
import Modal, { BotaoFechar } from '../../ui/Modal.jsx';
import { Campo } from '../../ui/Campo.jsx';
import { Carregando, Erro, Vazio, Aviso } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';
import { Painel, Dado } from './partes.jsx';

export default function Maquinas() {
  const maq = usarDados(listarMaquinas, [], []);
  const acesso = usarDados(listarAcessoRemoto, [], []);
  const emp = usarDados(listarEmpresas, [], []);
  const [fEmpresa, setFEmpresa] = useState('');
  const [busca, setBusca] = useState('');
  const [novaAberta, setNovaAberta] = useState(false);
  const [msg, setMsg] = useState(null);

  const acessoPor = useMemo(() => {
    const m = {};
    (acesso.dados || []).forEach((a) => { m[a.maquina_id] = a; });
    return m;
  }, [acesso.dados]);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (maq.dados || []).filter((m) =>
      (!fEmpresa || m.empresa_id === fEmpresa) &&
      (!t || m.nome.toLowerCase().includes(t) || (m.usuario || '').toLowerCase().includes(t)));
  }, [maq.dados, fEmpresa, busca]);

  return (
    <>
      <Painel style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: c.texto3 }}>
            {(maq.dados || []).length} equipamento(s) no inventário
          </span>
          <Botao tipo="roxo" icone="mais" onClick={() => setNovaAberta(true)} style={{ padding: '11px 16px', fontSize: 13 }}>
            Cadastrar máquina
          </Botao>
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label style={{ position: 'relative', display: 'block', minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none', zIndex: 1 }}>
              <Icone nome="busca" tamanho={16} cor="#8794b0" largura={1.9} />
            </span>
            <Campo compacto value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou usuário" style={{ paddingLeft: 40 }} />
          </label>
          <Campo compacto value={fEmpresa} onChange={(e) => setFEmpresa(e.target.value)}
            opcoes={[{ valor: '', texto: 'Todas as empresas' }, ...(emp.dados || []).map((e) => ({ valor: e.id, texto: e.razao_social }))]} />
        </div>
      </Painel>

      {msg && <div style={{ marginTop: 18 }}><Aviso tom={msg.tom}>{msg.texto}</Aviso></div>}
      {maq.erro && <div style={{ marginTop: 18 }}><Erro mensagem={maq.erro} aoTentar={maq.recarregar} /></div>}

      <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
        {maq.carregando ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <Vazio icone="monitor" titulo="Nenhuma máquina cadastrada"
            texto="Cadastre os equipamentos para que o cliente possa selecioná-los ao abrir um chamado." />
        ) : lista.map((m) => (
          <CartaoMaquina key={m.id} m={m} acesso={acessoPor[m.id]} />
        ))}
      </div>

      <ModalNova
        aberto={novaAberta}
        aoFechar={() => setNovaAberta(false)}
        empresas={emp.dados || []}
        aoCriar={(nova) => {
          maq.recarregar();
          acesso.recarregar();
          setNovaAberta(false);
          setMsg({ tom: 'ok', texto: nova.nome + ' cadastrada no inventário.' });
        }}
      />
    </>
  );
}

function CartaoMaquina({ m, acesso }) {
  const [aberta, setAberta] = useState(false);
  const estatico = m.rede === 'Estático';

  return (
    <div style={{ ...card, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, minWidth: 0 }}>
          <span style={{
            flex: 'none', width: 42, height: 42, borderRadius: 11,
            background: 'rgba(29, 95, 245, 0.08)', border: '1px solid rgba(29, 95, 245, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icone nome="monitor" tamanho={19} cor={c.azul} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: c.tinta }}>{m.nome}</h3>
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: c.texto3 }}>
              <span style={{ fontWeight: 600, color: c.roxo }}>{m.empresas?.razao_social}</span>
              {m.usuario && <span>{m.usuario}</span>}
              {m.setor && <span>{m.setor}</span>}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999,
                color: estatico ? '#0369a1' : c.texto2,
                background: estatico ? 'rgba(56, 189, 248, 0.14)' : 'rgba(20, 45, 100, 0.06)'
              }}>{estatico ? 'IP FIXO' : 'DHCP'}</span>
            </div>
          </div>
        </div>
        <Botao tipo="secundario" onClick={() => setAberta((v) => !v)} style={{ padding: '10px 15px' }}>
          {aberta ? 'Ocultar ficha' : 'Ver ficha'}
        </Botao>
      </div>

      {aberta && (
        <>
          <div style={{
            marginTop: 20, paddingTop: 20, borderTop: '1px solid ' + c.borda,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14
          }}>
            <Dado rotulo="MODELO" valor={m.modelo} />
            <Dado rotulo="PROCESSADOR" valor={m.cpu} />
            <Dado rotulo="MEMÓRIA" valor={m.memoria} />
            <Dado rotulo="ARMAZENAMENTO" valor={m.disco} />
            <Dado rotulo="SISTEMA" valor={m.sistema} />
          </div>

          <div style={{ marginTop: 22, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: c.texto4 }}>REDE</div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
            <Dado rotulo="IP" valor={m.ip || 'Automático'} mono />
            <Dado rotulo="MÁSCARA" valor={m.mascara || 'Automática'} mono />
            <Dado rotulo="GATEWAY" valor={m.gateway} mono />
            <Dado rotulo="DNS" valor={m.dns} mono />
          </div>

          <div style={{ marginTop: 22, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: c.texto4 }}>ACESSO REMOTO</div>
          {acesso ? (
            <div style={{
              marginTop: 12, padding: '16px 18px', borderRadius: 11,
              background: 'rgba(124, 58, 237, 0.04)', border: '1px solid rgba(124, 58, 237, 0.2)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
                <Dado rotulo="FERRAMENTA" valor={acesso.ferramenta} />
                <Dado rotulo="ENDEREÇO / ID" valor={acesso.host} mono />
                <Dado rotulo="LOGIN" valor={acesso.login} mono />
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Icone nome="cadeado" tamanho={15} cor={c.roxo} largura={1.9} style={{ flex: 'none', marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: c.texto2 }}>
                  A senha é armazenada cifrada e não é exibida no navegador. Recupere-a pelo cofre
                  interno da equipe no momento do atendimento.
                </p>
              </div>
              {acesso.observacoes && (
                <p style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.6, color: c.texto2 }}>{acesso.observacoes}</p>
              )}
            </div>
          ) : (
            <p style={{ margin: '12px 0 0', fontSize: 12.5, color: c.texto3 }}>
              Nenhuma credencial de acesso remoto registrada para esta máquina.
            </p>
          )}
        </>
      )}
    </div>
  );
}

const VAZIO = {
  empresa_id: '', nome: '', usuario: '', setor: '', modelo: '', cpu: '', memoria: '',
  disco: '', sistema: '', rede: 'DHCP', ip: '', mascara: '', gateway: '', dns: '',
  ferramenta: 'AnyDesk', host: '', login: '', observacoes: ''
};

function ModalNova({ aberto, aoFechar, empresas, aoCriar }) {
  const [f, setF] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErro(''); };

  async function salvar(e) {
    e.preventDefault();
    if (!f.empresa_id || !f.nome.trim()) {
      setErro('Selecione a empresa e informe o nome da máquina.');
      return;
    }
    if (f.rede === 'Estático' && !f.ip.trim()) {
      setErro('IP fixo é obrigatório quando a rede é estática.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const nova = await criarMaquina({
        empresa_id: f.empresa_id, nome: f.nome.trim(),
        usuario: f.usuario.trim() || null, setor: f.setor.trim() || null,
        modelo: f.modelo.trim() || null, cpu: f.cpu.trim() || null,
        memoria: f.memoria.trim() || null, disco: f.disco.trim() || null,
        sistema: f.sistema.trim() || null, rede: f.rede,
        ip: f.ip.trim() || null, mascara: f.mascara.trim() || null,
        gateway: f.gateway.trim() || null, dns: f.dns.trim() || null
      }, {
        ferramenta: f.ferramenta,
        host: f.host.trim() || null,
        login: f.login.trim() || null,
        observacoes: f.observacoes.trim() || null
      });
      setF(VAZIO);
      aoCriar(nova);
    } catch (err) {
      setErro(traduzir(err));
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} largura={680}>
      <form onSubmit={salvar}>
        <div style={{ padding: '22px 26px', borderBottom: '1px solid ' + c.borda, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: c.tinta }}>Cadastrar máquina</h2>
            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: c.texto3 }}>
              Depois de cadastrada, o cliente pode selecioná-la ao abrir um chamado.
            </p>
          </div>
          <BotaoFechar onClick={aoFechar} />
        </div>

        <div style={{ padding: '20px 26px', display: 'grid', gap: 16 }}>
          <Campo label="Empresa" value={f.empresa_id} onChange={set('empresa_id')}
            opcoes={[{ valor: '', texto: 'Selecione a empresa' }, ...empresas.map((e) => ({ valor: e.id, texto: e.razao_social }))]} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            <Campo label="Nome da máquina" value={f.nome} onChange={set('nome')} placeholder="Ex.: Máquina 06" />
            <Campo label="Usuário" value={f.usuario} onChange={set('usuario')} placeholder="Ex.: João Ferreira" />
            <Campo label="Setor" value={f.setor} onChange={set('setor')} placeholder="Ex.: Comercial" />
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: c.texto4 }}>FICHA TÉCNICA</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            <Campo label="Modelo" value={f.modelo} onChange={set('modelo')} placeholder="Dell OptiPlex 3090" />
            <Campo label="Processador" value={f.cpu} onChange={set('cpu')} placeholder="Intel i5-11400" />
            <Campo label="Memória" value={f.memoria} onChange={set('memoria')} placeholder="16 GB" />
            <Campo label="Armazenamento" value={f.disco} onChange={set('disco')} placeholder="SSD 512 GB" />
            <Campo label="Sistema" value={f.sistema} onChange={set('sistema')} placeholder="Windows 11 Pro" />
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: c.texto4 }}>REDE</div>
          <Campo label="Configuração" opcoes={['DHCP', 'Estático']} value={f.rede} onChange={set('rede')} />
          {f.rede === 'Estático' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
              <Campo label="IP" value={f.ip} onChange={set('ip')} placeholder="192.168.0.106" />
              <Campo label="Máscara" value={f.mascara} onChange={set('mascara')} placeholder="255.255.255.0" />
              <Campo label="Gateway" value={f.gateway} onChange={set('gateway')} placeholder="192.168.0.1" />
              <Campo label="DNS" value={f.dns} onChange={set('dns')} placeholder="8.8.8.8 / 1.1.1.1" />
            </div>
          )}

          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: c.texto4 }}>ACESSO REMOTO</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            <Campo label="Ferramenta" opcoes={['AnyDesk', 'RDP', 'SSH', 'TeamViewer']} value={f.ferramenta} onChange={set('ferramenta')} />
            <Campo label="Endereço / ID" value={f.host} onChange={set('host')} placeholder="531 902 774" />
            <Campo label="Login" value={f.login} onChange={set('login')} placeholder="fonsetech.adm" />
          </div>
          <Campo label="Observações" alto={2} value={f.observacoes} onChange={set('observacoes')}
            placeholder="Instruções específicas de acesso a este equipamento." />

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 15px', borderRadius: 10,
            background: 'rgba(29, 95, 245, 0.05)', border: '1px solid rgba(29, 95, 245, 0.2)'
          }}>
            <Icone nome="cadeado" tamanho={15} cor={c.azul} largura={1.9} style={{ flex: 'none', marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: c.texto2 }}>
              A senha de acesso remoto não é preenchida aqui. Ela é gravada cifrada pelo cofre da
              equipe, para que nunca chegue ao navegador nem apareça no histórico do sistema.
            </p>
          </div>

          {erro && <Aviso tom="erro">{erro}</Aviso>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Botao tipo="secundario" type="button" onClick={aoFechar}>Cancelar</Botao>
            <Botao tipo="roxo" type="submit" disabled={salvando} icone="check" style={{ padding: '12px 18px' }}>
              {salvando ? 'Salvando...' : 'Cadastrar máquina'}
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  );
}

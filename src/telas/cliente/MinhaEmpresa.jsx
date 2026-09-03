import { useEffect, useState } from 'react';
import { c, card } from '../../ui/tokens.js';
import { traduzir } from '../../dados/usarDados.js';
import { salvarEmpresa } from '../../dados/consultas.js';
import { useSessao } from '../../auth/SessaoProvider.jsx';
import { Campo } from '../../ui/Campo.jsx';
import Botao from '../../ui/Botao.jsx';
import { Erro, Aviso, Carregando } from '../../ui/Estado.jsx';
import Icone from '../../ui/Icone.jsx';

export default function MinhaEmpresa() {
  const { perfil, recarregarPerfil } = useSessao();
  const emp = perfil?.empresas;

  const [f, setF] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (!emp) return;
    setF({
      razao_social: emp.razao_social || '',
      cnpj: emp.cnpj || '',
      endereco: emp.endereco || '',
      email: emp.email || '',
      telefone: emp.telefone || '',
      tem_ti_interno: !!emp.tem_ti_interno,
      responsavel_ti: emp.responsavel_ti || '',
      gerente_geral: emp.gerente_geral || '',
      diretor: emp.diretor || ''
    });
  }, [emp]);

  if (!f) return <Carregando altura={320} />;

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setOk('');
    if (!f.razao_social.trim()) {
      setErro('A razão social é obrigatória.');
      return;
    }
    if (f.tem_ti_interno && !f.responsavel_ti.trim()) {
      setErro('Informe o nome do responsável técnico de TI.');
      return;
    }
    setSalvando(true);
    try {
      await salvarEmpresa(perfil.empresa_id, {
        razao_social: f.razao_social.trim(),
        cnpj: f.cnpj.trim() || null,
        endereco: f.endereco.trim() || null,
        email: f.email.trim() || null,
        telefone: f.telefone.trim() || null,
        tem_ti_interno: f.tem_ti_interno,
        responsavel_ti: f.tem_ti_interno ? f.responsavel_ti.trim() : null,
        gerente_geral: f.gerente_geral.trim() || null,
        diretor: f.diretor.trim() || null
      });
      setOk('Cadastro atualizado.');
      if (recarregarPerfil) recarregarPerfil();
    } catch (er) {
      setErro(traduzir(er));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} style={{ marginTop: 24, maxWidth: 780, ...card, padding: '26px 28px', display: 'grid', gap: 18 }}>
      <div className="fs-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Campo label="Razão social" value={f.razao_social} onChange={set('razao_social')} />
        <Campo label="CNPJ" placeholder="00.000.000/0000-00" value={f.cnpj} onChange={set('cnpj')} />
      </div>

      <Campo label="Endereço" placeholder="Rua, número, complemento" value={f.endereco} onChange={set('endereco')} />

      <div className="fs-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Campo label="E-mail de contato" type="email" value={f.email} onChange={set('email')} />
        <Campo label="Telefone" placeholder="(00) 00000-0000" value={f.telefone} onChange={set('telefone')} />
      </div>

      <div style={{
        padding: '20px 22px', borderRadius: 12, background: c.fundoCampo,
        border: '1px solid ' + c.borda, display: 'grid', gap: 18
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icone nome="pessoas" tamanho={17} cor={c.azulEscuro} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2c3853' }}>Responsáveis</span>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2c3853' }}>
            A empresa possui responsável técnico de TI?
          </span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[{ v: true, t: 'Sim, temos TI interno' }, { v: false, t: 'Não temos' }].map((o) => (
              <button
                key={String(o.v)} type="button"
                onClick={() => setF((s) => ({ ...s, tem_ti_interno: o.v }))}
                style={{
                  padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background .2s ease, border-color .2s ease',
                  ...(f.tem_ti_interno === o.v
                    ? { background: 'rgba(29, 95, 245, 0.08)', color: c.azulEscuro, border: '1px solid rgba(29, 95, 245, 0.4)' }
                    : { background: c.branco, color: c.texto2, border: '1px solid ' + c.borda3 })
                }}
              >{o.t}</button>
            ))}
          </div>
        </div>

        {f.tem_ti_interno && (
          <Campo
            label="Nome do responsável técnico de TI"
            placeholder="Ex.: Bruno Alves"
            value={f.responsavel_ti} onChange={set('responsavel_ti')}
          />
        )}

        <div className="fs-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Nome do gerente geral" value={f.gerente_geral} onChange={set('gerente_geral')} />
          <Campo label="Nome do diretor" value={f.diretor} onChange={set('diretor')} />
        </div>
      </div>

      {erro && <Erro mensagem={erro} />}
      {ok && <Aviso>{ok}</Aviso>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, color: c.texto4 }}>
          Estes dados orientam o atendimento e a emissão de documentos.
        </span>
        <Botao type="submit" disabled={salvando} icone="check">
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </Botao>
      </div>
    </form>
  );
}

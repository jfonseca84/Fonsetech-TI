import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, estaConfigurado } from '../lib/supabase.js';
import { c } from '../ui/tokens.js';
import Icone, { Aspas } from '../ui/Icone.jsx';
import { PRODUTO } from '../ui/marca.js';

const DESTAQUES = [
  { icone: 'ticket',  titulo: 'Abertura de Chamados',   texto: 'Registre o problema com categoria, prioridade e anexos.' },
  { icone: 'grafico', titulo: 'Acompanhamento',         texto: 'Status e histórico de cada atendimento em tempo real.' },
  { icone: 'agenda',  titulo: 'Agendamento de Visitas', texto: 'Marque visitas técnicas e reuniões pelo painel.' },
  { icone: 'escudo',  titulo: 'Segurança',              texto: 'Acesso por convite e dados isolados por empresa.' }
];

const campo = {
  width: '100%', height: 46, padding: '0 16px 0 42px', fontSize: 14, color: c.tinta,
  background: c.fundoCampo, border: '1px solid ' + c.borda2, borderRadius: 11,
  outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s ease, box-shadow .2s ease'
};
const campoFoco = {
  borderColor: c.azul, boxShadow: '0 0 0 3px rgba(29, 95, 245, 0.12)', background: c.branco
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [foco, setFoco] = useState('');
  const [hovBtn, setHovBtn] = useState(false);
  const navegar = useNavigate();

  async function entrar(e) {
    e.preventDefault();
    setAviso('');
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha para continuar.');
      return;
    }
    setCarregando(true);
    setErro('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(), password: senha
    });
    setCarregando(false);
    if (error) {
      // Mensagem generica de proposito: nao revela se o e-mail existe.
      setErro('E-mail ou senha incorretos.');
      return;
    }
    // A rota "/" redireciona conforme o papel lido do perfil.
    navegar('/', { replace: true });
  }

  async function recuperar(e) {
    e.preventDefault();
    setErro('');
    if (!email.trim()) {
      setErro('Informe seu e-mail para receber o link de recuperação.');
      return;
    }
    setCarregando(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/login'
    });
    setCarregando(false);
    // Resposta identica com ou sem cadastro, para nao expor a base de e-mails.
    setAviso('Se este e-mail estiver cadastrado, enviamos o link de recuperação.');
  }

  return (
    <div className="fs-login" style={{
      minHeight: '100vh', display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.08fr) minmax(0, 1fr)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: c.tinta
    }}>
      <style>{`
        @media (max-width: 900px) {
          .fs-login { grid-template-columns: minmax(0, 1fr) !important; }
          .fs-login-painel { display: none !important; }
        }
      `}</style>

      {/* ---------- painel institucional ---------- */}
      <div className="fs-login-painel" style={{
        position: 'relative', background: c.loginPainel, overflow: 'hidden',
        padding: 'clamp(26px, 4vh, 52px) clamp(28px, 3.6vw, 58px)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          position: 'absolute', top: '-18%', right: '-14%', width: 460, height: 460,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(63,208,224,0.16), transparent 68%)'
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{
            width: 42, height: 42, borderRadius: 12, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(88, 150, 255, 0.22)', border: '1px solid rgba(140, 185, 255, 0.3)'
          }}>
            <Icone nome="losango" tamanho={20} cor="#8fc0ff" largura={1.8} />
          </span>
          <span style={{ display: 'block', lineHeight: 1 }}>
            <span style={{ display: 'block', fontSize: 21, fontWeight: 800, letterSpacing: '-0.4px', color: c.branco }}>{PRODUTO.marca}</span>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '2.2px', color: '#7ba7e8', marginTop: 5 }}>CHAMADOS DE TI</span>
          </span>
        </div>

        <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 'clamp(12px, 2vh, 24px)' }}>
          <h1 style={{
            margin: 0, maxWidth: 460, fontSize: 'clamp(28px, 3.2vw, 42px)', lineHeight: 1.14,
            fontWeight: 800, letterSpacing: '-1.6px', color: c.branco, textWrap: 'pretty'
          }}>Suporte técnico que resolve.</h1>
          <div style={{ width: 54, height: 4, borderRadius: 3, background: c.ciano, marginTop: 'clamp(14px, 2.2vh, 22px)' }} />
          <p style={{
            margin: 'clamp(14px, 2.2vh, 22px) 0 0', maxWidth: 460,
            fontSize: 'clamp(13px, 1.05vw, 15.5px)', lineHeight: 1.62, color: c.navCliente, textWrap: 'pretty'
          }}>
            O FonseDesk reúne abertura de chamados, acompanhamento e agendamentos
            em um só lugar, com prazo de resposta definido.
          </p>

          <div style={{
            marginTop: 'clamp(40px, 9vh, 96px)', display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'clamp(12px, 1.4vw, 20px)'
          }}>
            {DESTAQUES.map((d) => (
              <div key={d.titulo}>
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 9,
                  background: 'rgba(88, 150, 255, 0.2)', border: '1px solid rgba(140, 185, 255, 0.28)'
                }}>
                  <Icone nome={d.icone} tamanho={16} cor="#8fc0ff" />
                </span>
                <div style={{
                  marginTop: 11, fontSize: 'clamp(9.5px, 0.88vw, 13px)', fontWeight: 700,
                  lineHeight: 1.3, color: c.branco, overflowWrap: 'break-word'
                }}>{d.titulo}</div>
                <p style={{
                  margin: '6px 0 0', fontSize: 'clamp(10.5px, 0.76vw, 11.5px)',
                  lineHeight: 1.5, color: '#93aed4'
                }}>{d.texto}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', paddingTop: 'clamp(18px, 2.6vh, 30px)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, maxWidth: 480,
            background: 'rgba(30, 70, 150, 0.42)', border: '1px solid rgba(140, 185, 255, 0.2)',
            borderRadius: 12, padding: 'clamp(13px, 1.8vh, 18px) 20px'
          }}>
            <span style={{
              flex: 'none', width: 34, height: 34, borderRadius: 10,
              background: 'rgba(88, 150, 255, 0.22)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Aspas cor="#8fc0ff" />
            </span>
            <p style={{
              margin: 0, fontSize: 'clamp(12px, 0.92vw, 13.5px)', lineHeight: 1.55,
              fontWeight: 600, color: '#e4edfb', textWrap: 'pretty'
            }}>Mais que um sistema de tickets: um time de TI acompanhando sua operação.</p>
          </div>
        </div>
      </div>

      {/* ---------- formulário ---------- */}
      <div style={{
        position: 'relative', background: c.branco, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(24px, 4vh, 48px) clamp(28px, 3.4vw, 52px)', overflow: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: 372 }}>
          <h2 style={{
            margin: 0, textAlign: 'center', fontSize: 'clamp(22px, 2.1vw, 27px)',
            fontWeight: 800, letterSpacing: '-1px', color: c.tinta
          }}>Bem-vindo de volta!</h2>
          <p style={{ margin: '9px 0 0', textAlign: 'center', fontSize: 13, color: c.texto3 }}>
            Faça login para acessar o {PRODUTO.nome}
          </p>

          {!estaConfigurado && (
            <div style={{
              background: '#f0f6ff', border: '1px solid #bfdbfe', borderRadius: 10,
              padding: '12px 14px', marginTop: 14, textAlign: 'left'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icone nome="info" tamanho={14} cor="#2563eb" />
                Modo Demonstração (banco local)
              </div>
              <div style={{ fontSize: 11.5, color: '#4b5563', margin: '4px 0 10px' }}>
                Selecione um perfil para testar o sistema:
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@fonsetech.com.br'); setSenha('admin123'); }}
                  style={{
                    flex: 1, padding: '7px 10px', fontSize: 11.5, fontWeight: 700,
                    background: '#1d5ff5', color: '#fff', border: 0, borderRadius: 7, cursor: 'pointer'
                  }}
                >
                  Entrar como Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('marina@empresa.com.br'); setSenha('cliente123'); }}
                  style={{
                    flex: 1, padding: '7px 10px', fontSize: 11.5, fontWeight: 700,
                    background: '#ffffff', color: '#1d5ff5', border: '1px solid #93c5fd', borderRadius: 7, cursor: 'pointer'
                  }}
                >
                  Entrar como Cliente
                </button>
              </div>
            </div>
          )}

          <form onSubmit={entrar} style={{ marginTop: 'clamp(18px, 2.8vh, 28px)', display: 'grid', gap: 11 }}>
            <label style={{ position: 'relative', display: 'block' }}>
              <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
                <Icone nome="usuario" tamanho={17} cor="#8794b0" largura={1.7} />
              </span>
              <input
                type="email" name="email" autoComplete="email"
                placeholder="seuemail@empresa.com.br"
                value={email} onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFoco('email')} onBlur={() => setFoco('')}
                style={{ ...campo, ...(foco === 'email' ? campoFoco : null) }}
              />
            </label>

            <label style={{ position: 'relative', display: 'block' }}>
              <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
                <Icone nome="cadeado" tamanho={17} cor="#8794b0" largura={1.7} />
              </span>
              <input
                type={verSenha ? 'text' : 'password'} name="password" autoComplete="current-password"
                placeholder="Sua senha"
                value={senha} onChange={(e) => setSenha(e.target.value)}
                onFocus={() => setFoco('senha')} onBlur={() => setFoco('')}
                style={{ ...campo, paddingRight: 44, ...(foco === 'senha' ? campoFoco : null) }}
              />
              <button
                type="button" onClick={() => setVerSenha((v) => !v)}
                aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 0, borderRadius: 8, color: '#8794b0', cursor: 'pointer'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {verSenha && <path d="M4 20L20 4" />}
                </svg>
              </button>
            </label>

            {erro && (
              <div role="alert" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderRadius: 10, background: 'rgba(220, 38, 38, 0.07)',
                border: '1px solid rgba(220, 38, 38, 0.26)',
                fontSize: 13, fontWeight: 600, color: '#b91c1c'
              }}>
                <Icone nome="alerta" tamanho={16} largura={2} style={{ flex: 'none' }} />
                {erro}
              </div>
            )}

            {aviso && (
              <div role="status" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderRadius: 10, background: 'rgba(29, 95, 245, 0.05)',
                border: '1px solid rgba(29, 95, 245, 0.2)',
                fontSize: 12.5, fontWeight: 600, color: '#2c3853'
              }}>
                <Icone nome="info" tamanho={16} largura={2} style={{ flex: 'none' }} />
                {aviso}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: '#4a5872', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  style={{ width: 17, height: 17, accentColor: c.azul, cursor: 'pointer' }}
                />
                Lembrar de mim
              </label>
              <a
                href="#recuperar" onClick={recuperar}
                style={{ fontSize: 13.5, fontWeight: 600, color: c.azulEscuro, textDecoration: 'none' }}
              >Esqueci minha senha</a>
            </div>

            <button
              type="submit" disabled={carregando}
              onMouseEnter={() => setHovBtn(true)} onMouseLeave={() => setHovBtn(false)}
              style={{
                marginTop: 6, height: 48, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 11,
                background: carregando ? '#7ba0ee' : (hovBtn ? c.azulHover : c.azul),
                color: c.branco, fontSize: 14.5, fontWeight: 700, border: 0, borderRadius: 11,
                fontFamily: 'inherit', cursor: carregando ? 'default' : 'pointer',
                transform: hovBtn && !carregando ? 'translateY(-1px)' : 'none',
                boxShadow: hovBtn && !carregando
                  ? '0 16px 36px rgba(29, 95, 245, 0.44)'
                  : '0 12px 30px rgba(29, 95, 245, 0.32)',
                transition: 'background .22s ease, transform .22s ease, box-shadow .22s ease'
              }}
            >
              {!carregando && (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 3.5h4a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-4" />
                  <path d="M9.5 8L14 12l-4.5 4" />
                  <path d="M14 12H4" />
                </svg>
              )}
              {carregando ? 'Entrando...' : 'Entrar no sistema'}
            </button>
          </form>

          <div style={{
            marginTop: 'clamp(16px, 3vh, 30px)', paddingTop: 'clamp(12px, 2vh, 20px)',
            borderTop: '1px solid ' + c.borda
          }}>
            <p style={{
              margin: 0, fontSize: 11.5, lineHeight: 1.55, color: c.texto4, textAlign: 'center'
            }}>
              O acesso é liberado apenas por cadastro do administrador.
              Não há criação de conta pública.
            </p>
            <div style={{
              marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, fontSize: 12, fontWeight: 600, color: c.texto3
            }}>
              <Icone nome="losango" tamanho={12} largura={1.8} />
              {PRODUTO.nome} — {PRODUTO.assinatura}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: c.texto5, textAlign: 'center' }}>
              © 2026 Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

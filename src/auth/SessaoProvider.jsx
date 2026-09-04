import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, carregarPerfil, fazerLogin } from '../lib/supabase.js';
import { traduzir } from '../dados/usarDados.js';

const Ctx = createContext(null);
export const useSessao = () => useContext(Ctx);

const INICIAL = { carregando: true, autenticado: false, perfil: null, erro: '' };

export function SessaoProvider({ children }) {
  const [estado, setEstado] = useState(INICIAL);

  // Sincronização resiliente de sessão e perfil
  const sincronizar = useCallback(async (usuarioSugerido = null) => {
    setEstado((prev) => ({ ...prev, carregando: true, erro: '' }));
    try {
      let usuario = usuarioSugerido;

      if (!usuario) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          setEstado({ carregando: false, autenticado: false, perfil: null, erro: '' });
          return;
        }
        usuario = session.user;
      }

      if (!usuario) {
        setEstado({ carregando: false, autenticado: false, perfil: null, erro: '' });
        return;
      }

      const perfil = await carregarPerfil(usuario);
      setEstado({ carregando: false, autenticado: true, perfil, erro: '' });
    } catch (e) {
      console.error('[SessaoProvider] Falha ao sincronizar sessao/perfil:', e?.message || e);
      setEstado({ carregando: false, autenticado: true, perfil: null, erro: traduzir(e) });
    }
  }, []);

  // Monitora alterações do ciclo de autenticação do Supabase
  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!ativo) return;
        if (error || !session?.user) {
          setEstado({ carregando: false, autenticado: false, perfil: null, erro: '' });
          return;
        }
        const perfil = await carregarPerfil(session.user);
        if (!ativo) return;
        setEstado({ carregando: false, autenticado: true, perfil, erro: '' });
      } catch (e) {
        if (!ativo) return;
        console.error('[SessaoProvider] Erro na inicialização:', e?.message || e);
        setEstado({ carregando: false, autenticado: true, perfil: null, erro: traduzir(e) });
      }
    }

    inicializar();

    const { data: sub } = supabase.auth.onAuthStateChange(async (evento, sessao) => {
      if (!ativo) return;

      if (evento === 'SIGNED_OUT' || !sessao) {
        setEstado({ carregando: false, autenticado: false, perfil: null, erro: '' });
        return;
      }

      if (evento === 'TOKEN_REFRESHED') {
        return;
      }

      // SIGNED_IN ou USER_UPDATED: utiliza a sessão/usuário do próprio evento
      try {
        const perfil = await carregarPerfil(sessao.user);
        if (!ativo) return;
        setEstado({ carregando: false, autenticado: true, perfil, erro: '' });
      } catch (e) {
        if (!ativo) return;
        console.error('[SessaoProvider] Erro ao sincronizar evento ' + evento + ':', e?.message || e);
        setEstado({ carregando: false, autenticado: true, perfil: null, erro: traduzir(e) });
      }
    });

    return () => {
      ativo = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Login atômico e seguro: valida credenciais, extrai usuário/sessão, carrega perfil e atualiza estado
  const entrar = useCallback(async ({ email, password }) => {
    setEstado((prev) => ({ ...prev, carregando: true, erro: '' }));
    try {
      const { data, error } = await fazerLogin({ email, password });
      if (error) {
        setEstado((prev) => ({ ...prev, carregando: false }));
        return { data: null, perfil: null, error };
      }

      const usuario = data?.user || data?.session?.user;
      if (!usuario) {
        const err = new Error('Não foi possível identificar o usuário autenticado.');
        setEstado({ carregando: false, autenticado: false, perfil: null, erro: traduzir(err) });
        return { data: null, perfil: null, error: err };
      }

      const perfil = await carregarPerfil(usuario);
      setEstado({ carregando: false, autenticado: true, perfil, erro: '' });
      return { data, perfil, error: null };
    } catch (e) {
      console.error('[SessaoProvider] Erro durante o login:', e?.message || e);
      setEstado({ carregando: false, autenticado: false, perfil: null, erro: traduzir(e) });
      return { data: null, perfil: null, error: e };
    }
  }, []);

  // Encerramento de sessão
  const sair = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[SessaoProvider] Aviso ao encerrar sessão:', e?.message || e);
    }
    setEstado({ carregando: false, autenticado: false, perfil: null, erro: '' });
  }, []);

  return (
    <Ctx.Provider value={{
      ...estado,
      entrar,
      sair,
      recarregarPerfil: sincronizar
    }}>
      {children}
    </Ctx.Provider>
  );
}

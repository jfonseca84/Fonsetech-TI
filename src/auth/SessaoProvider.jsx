import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, carregarPerfil } from '../lib/supabase.js';
import { traduzir } from '../dados/usarDados.js';

const Ctx = createContext(null);
export const useSessao = () => useContext(Ctx);

const INICIAL = { carregando: true, autenticado: false, perfil: null, erro: '' };

export function SessaoProvider({ children }) {
  const [estado, setEstado] = useState(INICIAL);

  const sincronizar = useCallback(async () => {
    setEstado((prev) => ({ ...prev, carregando: true, erro: '' }));
    let autenticado = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      autenticado = !!session;
      if (!session) {
        setEstado({ carregando: false, autenticado: false, perfil: null, erro: '' });
        return;
      }
      const perfil = await carregarPerfil();
      setEstado({ carregando: false, autenticado: true, perfil, erro: '' });
    } catch (e) {
      console.error('[SessaoProvider] Falha ao sincronizar sessao/perfil:', e);
      setEstado({ carregando: false, autenticado, perfil: null, erro: traduzir(e) });
    }
  }, []);

  useEffect(() => {
    sincronizar();
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      // TOKEN_REFRESHED nao muda o perfil; evita recarga desnecessaria.
      if (evento !== 'TOKEN_REFRESHED') sincronizar();
    });
    return () => sub.subscription.unsubscribe();
  }, [sincronizar]);

  async function sair() {
    await supabase.auth.signOut();
    setEstado({ carregando: false, autenticado: false, perfil: null, erro: '' });
  }

  return (
    <Ctx.Provider value={{ ...estado, sair, recarregarPerfil: sincronizar }}>
      {children}
    </Ctx.Provider>
  );
}

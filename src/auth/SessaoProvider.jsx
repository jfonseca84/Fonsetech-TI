import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, carregarPerfil } from '../lib/supabase.js';

const Ctx = createContext(null);
export const useSessao = () => useContext(Ctx);

export function SessaoProvider({ children }) {
  const [estado, setEstado] = useState({ carregando: true, perfil: null, erro: '' });

  const sincronizar = useCallback(async () => {
    try {
      const perfil = await carregarPerfil();
      setEstado({ carregando: false, perfil, erro: '' });
    } catch (e) {
      setEstado({ carregando: false, perfil: null, erro: e.message });
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
    setEstado({ carregando: false, perfil: null, erro: '' });
  }

  return (
    <Ctx.Provider value={{ ...estado, sair, recarregarPerfil: sincronizar }}>
      {children}
    </Ctx.Provider>
  );
}

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nao configuradas. ' +
    'Copie .env.example para .env (local) ou cadastre no painel da Railway.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Le o perfil do usuario logado (define se e cliente ou admin, e de qual empresa).
export async function carregarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, role, ativo, empresa_id, empresas(id, razao_social, plano)')
    .eq('id', user.id)
    .single();
  if (error) {
    // PGRST116 = nenhuma linha retornada: o usuario existe no Auth mas nao
    // tem perfil vinculado, entao nao ha papel nem empresa para trabalhar.
    if (error.code === 'PGRST116') {
      throw new Error('Seu acesso ainda nao foi liberado. Fale com o administrador da Fonsetech.');
    }
    throw error;
  }
  if (!data.role) {
    throw new Error('Seu acesso esta sem perfil definido. Fale com o administrador da Fonsetech.');
  }
  if (!data.ativo) {
    throw new Error('Seu acesso esta desativado. Fale com o administrador da Fonsetech.');
  }
  return data;
}
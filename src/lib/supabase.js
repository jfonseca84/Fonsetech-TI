import { createClient } from '@supabase/supabase-js';
import { criarClienteMock } from './mockSupabase.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const estaConfigurado = Boolean(
  url &&
  anonKey &&
  !url.startsWith('%') &&
  !anonKey.startsWith('%') &&
  url.trim() !== '' &&
  anonKey.trim() !== ''
);

if (!estaConfigurado) {
  console.info(
    '[FonseDesk] Modo de demonstração ativo (dados em memória). ' +
    'Para conectar ao Supabase de produção, preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.'
  );
}

export const supabase = estaConfigurado
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : criarClienteMock();

/** Erro com texto ja pronto para o usuario (traduzir() nao mexe nele). */
function amigavel(mensagem) {
  const e = new Error(mensagem);
  e.amigavel = true;
  return e;
}

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
      throw amigavel('Seu acesso ainda não foi liberado. Fale com o administrador da Fonsetech.');
    }
    throw error;
  }
  if (!data.role) {
    throw amigavel('Seu acesso está sem perfil definido. Fale com o administrador da Fonsetech.');
  }
  if (!data.ativo) {
    throw amigavel('Seu acesso está desativado. Fale com o administrador da Fonsetech.');
  }
  return data;
}
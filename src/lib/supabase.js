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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('[carregarPerfil] Erro ao obter usuario do Auth:', userError);
    throw userError;
  }
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, role, ativo, empresa_id, empresas(id, razao_social, plano)')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[carregarPerfil] Erro ao consultar perfil na tabela profiles:', {
      userId: user.id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // PGRST116 = nenhuma linha retornada: o usuario existe no Auth mas nao
    // tem perfil vinculado, entao nao ha papel nem empresa para trabalhar.
    if (error.code === 'PGRST116') {
      throw amigavel('Usuário autenticado, mas seu perfil não foi encontrado na tabela "profiles". Verifique se o registro foi inserido no banco de dados.');
    }
    throw error;
  }

  if (!data.role) {
    throw amigavel('Seu acesso está sem papel (role) definido na tabela profiles.');
  }
  if (!data.ativo) {
    throw amigavel('Seu acesso está desativado (ativo = false). Solicite a ativação ao administrador.');
  }
  return data;
}
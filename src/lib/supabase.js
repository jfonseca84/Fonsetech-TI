import { createClient } from '@supabase/supabase-js';
import { criarClienteMock } from './mockSupabase.js';

function limparValor(val) {
  if (!val) return '';
  return String(val).trim().replace(/^["']|["']$/g, '').trim();
}

function limparUrl(val) {
  const limpo = limparValor(val);
  return limpo.replace(/\/+$/, '');
}

// 1. Prioridade: configuracao em tempo de execucao injetada pelo server.js (Railway runtime)
// 2. Variaveis de build do Vite (import.meta.env.VITE_* ou SUPABASE_*)
// 3. Fallback seguro padrao do projeto
const configWindow = typeof window !== 'undefined' ? (window.__FONSETTECH_CONFIG__ || {}) : {};

export const url = limparUrl(
  configWindow.supabaseUrl ||
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  'https://vceeaqswgasjsonixvqs.supabase.co'
);

export const anonKey = limparValor(
  configWindow.supabaseAnonKey ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  'sb_publishable_p7Oeenc-vd0_DF6BguRPCw_iUCcAdwP'
);

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
export function amigavel(mensagem) {
  const e = new Error(mensagem);
  e.amigavel = true;
  return e;
}

/**
 * Autenticacao resiliente:
 * 1. Tenta conexao direta com o Supabase Auth no navegador.
 * 2. Se o navegador sofrer bloqueio de rede (erro "Failed to fetch" comum em redes
 *    corporativas, adblockers, antivirus ou restricoes de DNS), aciona automaticamente
 *    o proxy de autenticacao seguro do servidor local (/api/auth/login) e sincroniza a sessao.
 */
export async function fazerLogin({ email, password }) {
  const e = (email || '').trim();
  const p = password || '';

  if (!estaConfigurado) {
    return supabase.auth.signInWithPassword({ email: e, password: p });
  }

  // 1. Tentativa direta pelo cliente Supabase do navegador
  try {
    const res = await supabase.auth.signInWithPassword({ email: e, password: p });

    // Se concluiu com sucesso ou com erro de credencial conhecida, retorna direto
    if (!res.error) {
      return { data: res.data, error: null };
    }

    const msg = (res.error.message || '').toLowerCase();
    const ehFalhaRede = /failed to fetch|networkerror|network request failed|connection refused|typeerror/i.test(msg);

    if (!ehFalhaRede) {
      return { data: null, error: res.error };
    }

    console.warn('[FonseDesk] Bloqueio ou falha de rede direta com Supabase (' + res.error.message + '). Acionando fallback pelo servidor...');
  } catch (err) {
    const msg = (err?.message || '').toLowerCase();
    const ehFalhaRede = /failed to fetch|networkerror|network request failed|connection refused|typeerror/i.test(msg);
    if (!ehFalhaRede) {
      return { data: null, error: err };
    }
    console.warn('[FonseDesk] Exceção de rede na autenticação direta. Acionando fallback pelo servidor...');
  }

  // 2. Fallback resiliente via endpoint /api/auth/login do mesmo dominio
  try {
    const resposta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e, password: p })
    });

    const dados = await resposta.json();

    if (!resposta.ok || dados.error) {
      const err = new Error(dados.error?.message || dados.message || 'Credenciais inválidas.');
      err.status = resposta.status;
      return { data: null, error: err };
    }

    if (dados.session) {
      // Sincroniza a sessao com o cliente Supabase no browser
      const { data: setRes, error: setErr } = await supabase.auth.setSession(dados.session);
      if (setErr) {
        console.warn('[FonseDesk] Aviso ao aplicar sessao:', setErr);
      }
      return { data: setRes || dados, error: null };
    }

    return { data: dados, error: null };
  } catch (proxyErr) {
    console.error('[FonseDesk] Falha no fallback de autenticacao:', proxyErr);
    return {
      data: null,
      error: amigavel('Não foi possível conectar ao servidor de autenticação. Verifique sua conexão com a internet ou as variáveis de ambiente no Railway.')
    };
  }
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
      throw amigavel('Usuário autenticado no Supabase Auth, mas seu perfil ainda não foi registrado na tabela "profiles". Um administrador deve vincular o perfil.');
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
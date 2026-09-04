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
const metaEnv = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : {};

export const url = limparUrl(
  configWindow.supabaseUrl ||
  metaEnv.VITE_SUPABASE_URL ||
  metaEnv.SUPABASE_URL ||
  'https://vceeaqswgasjsonixvqs.supabase.co'
);

export const anonKey = limparValor(
  configWindow.supabaseAnonKey ||
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.SUPABASE_ANON_KEY ||
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
      const { data: setRes, error: setErr } = await supabase.auth.setSession({
        access_token: dados.session.access_token,
        refresh_token: dados.session.refresh_token
      });
      if (setErr) {
        console.warn('[FonseDesk] Aviso ao aplicar sessao:', setErr);
      }
      return {
        data: {
          session: setRes?.session || dados.session,
          user: setRes?.user || dados.user || dados.session?.user
        },
        error: null
      };
    }

    return { data: dados, error: null };
  } catch (proxyErr) {
    console.error('[FonseDesk] Falha no fallback de autenticacao:', proxyErr);
    return {
      data: null,
      error: amigavel('Não foi possível conectar ao serviço de autenticação. Tente novamente em alguns instantes.')
    };
  }
}

// Le o perfil do usuario logado (define se e cliente ou admin, e de qual empresa).
// Aceita opcionalmente o usuario ou ID ja obtido (do signInWithPassword ou do evento de auth)
// para evitar chamadas redundantes e perigosas a supabase.auth.getUser().
export async function carregarPerfil(usuarioOuId = null) {
  let userId = null;

  if (typeof usuarioOuId === 'string' && usuarioOuId.trim()) {
    userId = usuarioOuId.trim();
  } else if (usuarioOuId && typeof usuarioOuId === 'object') {
    userId = usuarioOuId.id || usuarioOuId.user?.id || null;
  }

  // 1. Se nao recebeu o ID diretamente, tenta obter da sessao ativa com getSession()
  if (!userId) {
    try {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (sessionErr) {
      console.warn('[carregarPerfil] Aviso ao consultar getSession:', sessionErr?.message || sessionErr);
    }
  }

  // 2. Se ainda nao encontrou, tenta getUser() de forma segura sem quebrar a sessao
  if (!userId) {
    try {
      const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
      if (!userError && user?.id) {
        userId = user.id;
      }
    } catch (userErr) {
      // Ignora erro de sessao ausente aqui (nao ha usuario conectado)
      const msg = userErr?.message || '';
      if (!/session missing/i.test(msg)) {
        console.warn('[carregarPerfil] Aviso ao consultar getUser:', msg);
      }
    }
  }

  // Se nao ha usuario autenticado identificado, retorna null graciosamente sem estourar excecao
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, role, ativo, empresa_id, empresas(id, razao_social, plano)')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[carregarPerfil] Erro ao consultar perfil na tabela profiles:', {
      userId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // PGRST116 = nenhuma linha retornada: o usuario existe no Auth mas nao
    // tem perfil vinculado, entao nao ha papel nem empresa para trabalhar.
    if (error.code === 'PGRST116') {
      throw amigavel('Sua conta não possui permissões cadastradas no sistema. Entre em contato com o administrador.');
    }
    throw error;
  }

  if (!data.role) {
    throw amigavel('Sua conta não possui nível de acesso configurado. Entre em contato com o administrador.');
  }
  if (!data.ativo) {
    throw amigavel('Sua conta está inativa. Entre em contato com o administrador do sistema.');
  }
  return data;
}
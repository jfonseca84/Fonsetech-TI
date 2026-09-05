import express from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');
const port = process.env.PORT || 3000;

if (!fs.existsSync(dist)) {
  console.error('[fonsetech] pasta dist/ nao encontrada. Rode "npm run build" antes de "npm start".');
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
// Railway fica atras de um unico proxy reverso: confia so no primeiro hop
// do X-Forwarded-For, para o rate limit contar por IP real do visitante
// e nao pelo IP do proxy (que seria igual para todo mundo).
app.set('trust proxy', 1);
app.use(compression());
app.use(express.json());

// Trava por tentativas de login: nao substitui o rate limit do proprio
// Supabase Auth, mas barra brute-force na nossa camada antes de gastar a
// cota deles, e funciona mesmo se o fallback de rede (linha 89) for usado.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' } }
});

// Limite generoso para nao travar log legitimo de erro em uso normal,
// so para impedir que o endpoint vire uma forma barata de flood no log.
const limiteClientLog = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false
});

// Criacao de usuario e mais sensivel (usa a service_role): limite mais
// apertado que os outros, ainda generoso para uso administrativo normal.
const limiteCriarUsuario = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

// Sanitizacao segura de configuracoes publicas
function limparValor(val) {
  if (!val) return '';
  return String(val).trim().replace(/^["']|["']$/g, '').trim();
}

function limparUrl(val) {
  const limpo = limparValor(val);
  return limpo.replace(/\/+$/, '');
}

function obterConfigPublica() {
  const supabaseUrl = limparUrl(
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://vceeaqswgasjsonixvqs.supabase.co'
  );
  const supabaseAnonKey = limparValor(
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_p7Oeenc-vd0_DF6BguRPCw_iUCcAdwP'
  );
  return { supabaseUrl, supabaseAnonKey };
}

// cabecalhos de seguranca basicos
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// healthcheck da Railway
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));

// Diagnostico de conexao com Supabase (para identificar problemas de rede/env)
app.get('/api/supabase-status', async (req, res) => {
  const { supabaseUrl, supabaseAnonKey } = obterConfigPublica();
  try {
    const resp = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
    });
    return res.json({
      ok: true,
      supabaseReachable: resp.ok || resp.status < 500,
      status: resp.status,
      configured: Boolean(supabaseUrl && supabaseAnonKey)
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      supabaseReachable: false,
      error: err.message,
      configured: Boolean(supabaseUrl && supabaseAnonKey)
    });
  }
});

// Config publicas consumidas pelo frontend (apenas Anon Key publica e URL)
app.get('/api/config', (req, res) => {
  res.json(obterConfigPublica());
});

// Log estruturado de erros nao tratados do navegador (sem provedor externo).
// Aceita apenas os campos esperados, com tamanho limitado, para nao virar
// um jeito de gravar lixo arbitrario no log do servidor.
app.post('/api/client-log', limiteClientLog, (req, res) => {
  const corpo = req.body || {};
  const tipo = corpo.tipo === 'promise_rejeitada' ? 'promise_rejeitada' : 'erro';
  const mensagem = String(corpo.mensagem || 'Erro desconhecido').slice(0, 500);
  const pilha = corpo.pilha ? String(corpo.pilha).slice(0, 2000) : null;
  const rota = String(corpo.rota || '').slice(0, 200);

  console.error('[client-log]', JSON.stringify({ tipo, mensagem, rota, pilha, em: new Date().toISOString() }));
  res.status(204).end();
});

// Proxy de autenticacao resiliente:
// Usado quando o navegador do cliente sofre bloqueio de rede direto para *.supabase.co
// (ex: adblockers, firewalls corporativos ou restricoes de DNS no browser).
// Utiliza estritamente a Anon Key publica, preservando total seguranca.
app.post('/api/auth/login', limiteLogin, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: { message: 'Informe e-mail e senha.' } });
  }

  const { supabaseUrl, supabaseAnonKey } = obterConfigPublica();
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: { message: 'Supabase não configurado no servidor.' } });
  }

  try {
    const authResp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: String(email).trim(), password: String(password) })
    });

    const data = await authResp.json();

    if (!authResp.ok) {
      return res.status(authResp.status).json({
        error: {
          message: data.msg || data.error_description || data.message || 'Credenciais inválidas.',
          code: data.code || authResp.status
        }
      });
    }

    // Sucesso: retorna a sessao do Supabase Auth para o cliente aplicar
    return res.json({
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        token_type: data.token_type,
        user: data.user
      },
      user: data.user
    });
  } catch (err) {
    console.error('[server.js] Erro no proxy de autenticacao:', err);
    return res.status(502).json({
      error: {
        message: 'Não foi possível conectar ao servidor de autenticação do Supabase. Verifique sua conexão com a internet.'
      }
    });
  }
});

// Cria o login (usuario + senha no Supabase Auth) e o perfil vinculado
// para um contato de empresa. So funciona com SUPABASE_SERVICE_ROLE_KEY
// configurada — sem ela, retorna 501 explicando o que falta.
//
// Fluxo:
//   1. Confere que quem chamou tem um token valido e e admin ativo
//      (usando a ANON key, respeitando RLS — nao precisamos da
//      service_role so para ler o proprio papel de quem pediu).
//   2. Com a service_role, cria o usuario no Supabase Auth com a senha
//      informada (email_confirm:true — sem precisar de link por e-mail).
//   3. Vincula o perfil via RPC criar_perfil_cliente (migration 005).
app.post('/api/admin/criar-usuario', limiteCriarUsuario, async (req, res) => {
  const { supabaseUrl, supabaseAnonKey } = obterConfigPublica();
  const serviceRoleKey = limparValor(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!serviceRoleKey) {
    return res.status(501).json({
      error: { message: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Cadastre essa variável na Railway (Supabase → Settings → API → service_role) para habilitar a criação de login de clientes.' }
    });
  }

  const tokenCabecalho = req.headers.authorization || '';
  const token = tokenCabecalho.startsWith('Bearer ') ? tokenCabecalho.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: { message: 'Sessão ausente.' } });
  }

  const { nome, email, password, telefone, whatsapp, cargo, empresaId, role } = req.body || {};
  if (!nome || !email || !password || !empresaId) {
    return res.status(400).json({ error: { message: 'Informe nome, e-mail, senha e empresa.' } });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: { message: 'A senha precisa ter pelo menos 8 caracteres.' } });
  }

  try {
    // 1. Quem esta chamando precisa ser admin ativo — verificado com a
    // ANON key + o token da propria sessao, respeitando RLS de verdade
    // (nao confiamos em nada que o cliente diga sobre si mesmo).
    const respUsuario = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` }
    });
    if (!respUsuario.ok) {
      return res.status(401).json({ error: { message: 'Sessão inválida ou expirada.' } });
    }
    const usuarioChamador = await respUsuario.json();

    const respPerfil = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${usuarioChamador.id}&select=role,ativo,empresa_id`,
      { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` } }
    );
    const perfis = respPerfil.ok ? await respPerfil.json() : [];
    const perfilChamador = perfis[0];
    const ehAdminFonsetech = perfilChamador?.role === 'admin' && perfilChamador?.ativo;
    const ehAdminDaEmpresa = perfilChamador?.role === 'cliente_admin' && perfilChamador?.ativo;
    if (!ehAdminFonsetech && !ehAdminDaEmpresa) {
      return res.status(403).json({ error: { message: 'Apenas administradores podem cadastrar login de clientes.' } });
    }

    // Um admin da Fonsetech pode cadastrar para qualquer empresa e decidir
    // se o novo usuario tambem sera "admin da empresa". Um admin de empresa
    // (cliente_admin) so cadastra dentro da propria empresa, e nunca cria
    // outro admin da Fonsetech — o valor enviado pelo cliente para
    // empresaId/role e ignorado nesse caso, sempre o da propria sessao.
    const empresaFinal = ehAdminFonsetech ? empresaId : perfilChamador.empresa_id;
    const roleFinal = role === 'cliente_admin' ? 'cliente_admin' : 'cliente';
    if (!empresaFinal) {
      return res.status(400).json({ error: { message: 'Empresa não identificada.' } });
    }

    // 2. Cria o usuario de fato no Supabase Auth, com a service_role.
    const respCriar = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: String(email).trim(),
        password: String(password),
        email_confirm: true,
        user_metadata: { nome }
      })
    });
    const dadosCriados = await respCriar.json();
    if (!respCriar.ok) {
      return res.status(respCriar.status).json({
        error: { message: dadosCriados.msg || dadosCriados.message || 'Não foi possível criar o usuário no Supabase Auth.' }
      });
    }

    // 3. Vincula o perfil (nome/telefone/empresa/role) ao usuario recem-criado.
    const respPerfilNovo = await fetch(`${supabaseUrl}/rest/v1/rpc/criar_perfil_cliente`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_id: dadosCriados.id,
        p_nome: nome,
        p_email: email,
        p_telefone: telefone || null,
        p_whatsapp: whatsapp || null,
        p_cargo: cargo || null,
        p_empresa_id: empresaFinal,
        p_role: roleFinal
      })
    });
    if (!respPerfilNovo.ok) {
      const erroPerfil = await respPerfilNovo.json().catch(() => ({}));
      // O login ja foi criado no Auth; avisa claramente em vez de deixar orfao e silencioso.
      console.error('[server.js] Usuario criado no Auth mas falhou ao vincular perfil:', erroPerfil);
      return res.status(502).json({
        error: { message: 'Login criado, mas houve um erro ao salvar o perfil. Contate o suporte técnico com o e-mail: ' + email }
      });
    }

    return res.status(201).json({ id: dadosCriados.id, email: dadosCriados.email });
  } catch (err) {
    console.error('[server.js] Erro ao criar usuario de cliente:', err);
    return res.status(502).json({ error: { message: 'Erro ao contatar o Supabase. Tente novamente.' } });
  }
});

// Bloqueio explicito: os protipos em design/ NAO tem autenticacao e nunca
// podem ser servidos em producao. Eles ficam fora de dist/ (nao estao em
// public/), mas a guarda abaixo garante 404 mesmo se alguem os copiar para la.
const BLOQUEADOS = [/^\/design(\/|$)/i, /\.dc\.html$/i, /^\/supabase(\/|$)/i, /^\/scripts(\/|$)/i, /^\/\.env/i];
app.use((req, res, next) => {
  if (BLOQUEADOS.some((re) => re.test(req.path))) {
    return res.status(404).type('text/plain').send('Not Found');
  }
  next();
});

// "/" e a landing page publica (index.html estatico da pasta dist/)
app.get('/', (req, res) => res.sendFile(path.join(dist, 'index.html')));

// assets com hash no nome podem ser cacheados por muito tempo
app.use('/assets', express.static(path.join(dist, 'assets'), {
  immutable: true, maxAge: '1y'
}));

// demais arquivos estaticos, sem cache agressivo
app.use(express.static(dist, { index: false, maxAge: '1h' }));

function getAppHtml() {
  const filePath = path.join(dist, 'app.html');
  if (!fs.existsSync(filePath)) return null;
  const original = fs.readFileSync(filePath, 'utf-8');
  const { supabaseUrl, supabaseAnonKey } = obterConfigPublica();
  const scriptInjecao = `
    <script id="__FONSETTECH_RUNTIME_CONFIG__">
      window.__FONSETTECH_CONFIG__ = {
        supabaseUrl: ${JSON.stringify(supabaseUrl)},
        supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)}
      };
    </script>
  `;
  // Injeta no head para estar disponivel antes de qualquer bundle carregar
  if (original.includes('</head>')) {
    return original.replace('</head>', `${scriptInjecao}</head>`);
  }
  return scriptInjecao + original;
}

// SPA fallback: /login, /dashboard, /admin/... respondem o shell da SPA (app.html).
// Injeta dinamicamente as variaveis de runtime do Railway para que o frontend
// nunca fique desatualizado ou com variaveis vazias.
app.get('*', (req, res) => {
  try {
    const html = getAppHtml();
    if (html) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
  } catch (e) {
    console.error('[server.js] Falha ao injetar configuracoes no app.html:', e);
  }
  res.sendFile(path.join(dist, 'app.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log('[fonsetech] servindo dist/ na porta ' + port);
});
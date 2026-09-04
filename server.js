import express from 'express';
import compression from 'compression';
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
app.use(compression());
app.use(express.json());

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

// Proxy de autenticacao resiliente:
// Usado quando o navegador do cliente sofre bloqueio de rede direto para *.supabase.co
// (ex: adblockers, firewalls corporativos ou restricoes de DNS no browser).
// Utiliza estritamente a Anon Key publica, preservando total seguranca.
app.post('/api/auth/login', async (req, res) => {
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
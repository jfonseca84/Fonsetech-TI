import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Duas entradas:
 *   index.html -> landing page publica (HTML estatico, sem React)
 *   app.html   -> shell da SPA (login, /dashboard, /admin)
 *
 * Em producao o server.js decide qual arquivo responde cada rota.
 * Em desenvolvimento o middleware abaixo faz o mesmo papel.
 */
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

const fallbackDaSpa = {
  name: 'fonsetech-spa-fallback',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const rota = (req.url || '/').split('?')[0];

      // Endpoints de API suportados tambem em dev
      if (rota === '/api/config' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(obterConfigPublica()));
      }

      if (rota === '/api/supabase-status' && req.method === 'GET') {
        const { supabaseUrl, supabaseAnonKey } = obterConfigPublica();
        try {
          const resp = await fetch(`${supabaseUrl}/auth/v1/health`, {
            headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
          });
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            ok: true,
            supabaseReachable: resp.ok || resp.status < 500,
            status: resp.status,
            configured: Boolean(supabaseUrl && supabaseAnonKey)
          }));
        } catch (err) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            ok: false,
            supabaseReachable: false,
            error: err.message,
            configured: Boolean(supabaseUrl && supabaseAnonKey)
          }));
        }
      }

      if (rota === '/api/auth/login' && req.method === 'POST') {
        let corpo = '';
        req.on('data', chunk => { corpo += chunk; });
        req.on('end', async () => {
          try {
            const { email, password } = JSON.parse(corpo || '{}');
            if (!email || !password) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: { message: 'Informe e-mail e senha.' } }));
            }
            const { supabaseUrl, supabaseAnonKey } = obterConfigPublica();
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
            res.statusCode = authResp.status;
            res.setHeader('Content-Type', 'application/json');
            if (!authResp.ok) {
              return res.end(JSON.stringify({
                error: {
                  message: data.msg || data.error_description || data.message || 'Credenciais inválidas.',
                  code: data.code || authResp.status
                }
              }));
            }
            return res.end(JSON.stringify({
              session: {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in,
                expires_at: data.expires_at,
                token_type: data.token_type,
                user: data.user
              },
              user: data.user
            }));
          } catch (err) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              error: { message: 'Erro ao contatar Supabase: ' + err.message }
            }));
          }
        });
        return;
      }

      const aceitaHtml = (req.headers.accept || '').includes('text/html');
      const ehArquivo = rota.includes('.') || rota.startsWith('/@') || rota.startsWith('/src/') || rota.startsWith('/node_modules/');
      if (req.method === 'GET' && aceitaHtml && !ehArquivo && rota !== '/') {
        req.url = '/app.html';
      }
      next();
    });
  }
};

export default defineConfig({
  envPrefix: ['VITE_', 'SUPABASE_'],
  plugins: [react(), fallbackDaSpa],
  server: { host: '0.0.0.0', port: 3000 },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        index: 'index.html',
        app: 'app.html'
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});

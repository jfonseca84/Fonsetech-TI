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

      if (rota === '/api/client-log' && req.method === 'POST') {
        let corpo = '';
        req.on('data', chunk => { corpo += chunk; });
        req.on('end', () => {
          try {
            const dados = JSON.parse(corpo || '{}');
            const tipo = dados.tipo === 'promise_rejeitada' ? 'promise_rejeitada' : 'erro';
            console.error('[client-log]', JSON.stringify({
              tipo,
              mensagem: String(dados.mensagem || 'Erro desconhecido').slice(0, 500),
              rota: String(dados.rota || '').slice(0, 200),
              pilha: dados.pilha ? String(dados.pilha).slice(0, 2000) : null,
              em: new Date().toISOString()
            }));
          } catch {
            // corpo invalido: ignora silenciosamente, nao e critico
          }
          res.statusCode = 204;
          res.end();
        });
        return;
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

      if (rota === '/api/admin/criar-usuario' && req.method === 'POST') {
        let corpo = '';
        req.on('data', chunk => { corpo += chunk; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          const serviceRoleKey = limparValor(process.env.SUPABASE_SERVICE_ROLE_KEY);
          if (!serviceRoleKey) {
            res.statusCode = 501;
            return res.end(JSON.stringify({
              error: { message: 'SUPABASE_SERVICE_ROLE_KEY não configurada no .env local.' }
            }));
          }
          const token = (req.headers.authorization || '').replace(/^Bearer /, '');
          if (!token) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: { message: 'Sessão ausente.' } }));
          }
          try {
            const { nome, email, password, telefone, whatsapp, cargo, empresaId, role } = JSON.parse(corpo || '{}');
            if (!nome || !email || !password || !empresaId) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: { message: 'Informe nome, e-mail, senha e empresa.' } }));
            }
            if (String(password).length < 8) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: { message: 'A senha precisa ter pelo menos 8 caracteres.' } }));
            }
            const { supabaseUrl, supabaseAnonKey } = obterConfigPublica();

            const respUsuario = await fetch(`${supabaseUrl}/auth/v1/user`, {
              headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` }
            });
            if (!respUsuario.ok) {
              res.statusCode = 401;
              return res.end(JSON.stringify({ error: { message: 'Sessão inválida ou expirada.' } }));
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
              res.statusCode = 403;
              return res.end(JSON.stringify({ error: { message: 'Apenas administradores podem cadastrar login de clientes.' } }));
            }
            const empresaFinal = ehAdminFonsetech ? empresaId : perfilChamador.empresa_id;
            const roleFinal = role === 'cliente_admin' ? 'cliente_admin' : 'cliente';
            if (!empresaFinal) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: { message: 'Empresa não identificada.' } }));
            }

            const respCriar = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
              method: 'POST',
              headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: String(email).trim(), password: String(password), email_confirm: true, user_metadata: { nome } })
            });
            const dadosCriados = await respCriar.json();
            if (!respCriar.ok) {
              res.statusCode = respCriar.status;
              return res.end(JSON.stringify({ error: { message: dadosCriados.msg || dadosCriados.message || 'Não foi possível criar o usuário no Supabase Auth.' } }));
            }

            const respPerfilNovo = await fetch(`${supabaseUrl}/rest/v1/rpc/criar_perfil_cliente`, {
              method: 'POST',
              headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                p_id: dadosCriados.id, p_nome: nome, p_email: email, p_telefone: telefone || null,
                p_whatsapp: whatsapp || null, p_cargo: cargo || null, p_empresa_id: empresaFinal,
                p_role: roleFinal
              })
            });
            if (!respPerfilNovo.ok) {
              res.statusCode = 502;
              return res.end(JSON.stringify({ error: { message: 'Login criado, mas houve um erro ao salvar o perfil. Contate o suporte técnico com o e-mail: ' + email } }));
            }

            res.statusCode = 201;
            return res.end(JSON.stringify({ id: dadosCriados.id, email: dadosCriados.email }));
          } catch (err) {
            res.statusCode = 502;
            return res.end(JSON.stringify({ error: { message: 'Erro ao contatar o Supabase: ' + err.message } }));
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

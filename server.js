import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');
const port = process.env.PORT || 8080;

if (!fs.existsSync(dist)) {
  console.error('[fonsetech] pasta dist/ nao encontrada. Rode "npm run build" antes de "npm start".');
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.use(compression());

// cabecalhos de seguranca basicos
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// healthcheck da Railway
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));

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

// assets com hash no nome podem ser cacheados por muito tempo
app.use('/assets', express.static(path.join(dist, 'assets'), {
  immutable: true, maxAge: '1y'
}));

// demais arquivos estaticos, sem cache agressivo
app.use(express.static(dist, { index: false, maxAge: '1h' }));

// SPA fallback: /login, /dashboard, /admin, /clientes... respondem o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(port, () => {
  console.log('[fonsetech] servindo dist/ na porta ' + port);
});
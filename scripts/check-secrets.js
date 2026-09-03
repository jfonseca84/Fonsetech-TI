#!/usr/bin/env node
/**
 * Varredura de segredos, multiplataforma (Windows / Linux / macOS / Railway).
 * Substitui o antigo check-secrets.sh: nao depende de bash, grep nem git.
 *
 * Uso: npm run check:secrets
 * Codigo de saida 1 quando encontra segredo real (falha o pipeline).
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, extname, basename } from 'node:path';
import { execSync } from 'node:child_process';

const RAIZ = process.cwd();

const PASTAS_IGNORADAS = new Set([
  'node_modules', '.git', 'dist', 'build', '.vite', '.output',
  'coverage', '.cache', '.next', '.turbo'
]);

// Binarios: nao faz sentido varrer nem decodificar.
const EXT_BINARIAS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.bmp',
  '.pdf', '.zip', '.gz', '.tar', '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.webm', '.mp3', '.wav', '.docx', '.xlsx', '.pptx'
]);

// O proprio verificador e o template de variaveis contem os padroes de
// proposito; varre-los geraria falso positivo permanente.
const ARQUIVOS_ISENTOS = new Set(['check-secrets.js', 'check-secrets.sh', '.env.example']);

const ehDoc = (p) => ['.md', '.txt'].includes(extname(p).toLowerCase());

/**
 * escopo 'todos'  -> vale para qualquer arquivo, inclusive documentacao
 *                    (VALORES de credencial nao podem existir em lugar nenhum)
 * escopo 'codigo' -> ignora .md/.txt
 *                    (a documentacao pode citar NOMES de variaveis livremente)
 */
const REGRAS = [
  { rotulo: 'JWT (eyJ...)',                    escopo: 'todos',
    re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/ },
  { rotulo: 'connection string com senha',     escopo: 'todos',
    re: /postgres(ql)?:\/\/[^:@/\s]+:[^@\s]+@/ },
  { rotulo: 'chave privada PEM',               escopo: 'todos',
    re: /BEGIN [A-Z ]*PRIVATE KEY/ },
  { rotulo: 'Bearer com token literal',        escopo: 'todos',
    re: /[Bb]earer\s+[A-Za-z0-9._-]{20,}/ },
  { rotulo: 'variavel privada com prefixo VITE_', escopo: 'todos',
    re: /VITE_[A-Z_]*(SERVICE_ROLE|DATABASE_URL|SECRET|PRIVATE)/ },
  { rotulo: 'credencial atribuida a literal',  escopo: 'codigo',
    re: /(SERVICE_ROLE_KEY|ANON_KEY|API_?KEY|APIKEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE_KEY|AUTHORIZATION)\s*[:=]\s*['"`][^'"`]{8,}/ },
  { rotulo: 'senha em texto no codigo',        escopo: 'codigo',
    re: /(senhaRemota|senha_remota|senha|password|passwd)\s*[:=]\s*['"`][^'"`]{4,}/ },
  { rotulo: 'service_role usado no frontend',  escopo: 'codigo',
    re: /import\.meta\.env\.[A-Z_]*SERVICE_ROLE/ },
  { rotulo: 'localhost em codigo',             escopo: 'codigo',
    re: /localhost:[0-9]+/ }
];

// Arquivos sensiveis que nunca devem estar versionados.
const PADROES_SENSIVEIS = [
  /^\.env$/i, /^\.env\.(?!example$).+/i,
  /\.pem$/i, /\.key$/i, /\.p12$/i, /\.pfx$/i,
  /^secrets\.json$/i, /^credentials\.json$/i, /^service-account.*\.json$/i
];

function listar(dir, saida = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    let st;
    try { st = statSync(caminho); } catch { continue; }
    if (st.isDirectory()) {
      if (!PASTAS_IGNORADAS.has(nome)) listar(caminho, saida);
    } else if (st.isFile()) {
      saida.push(caminho);
    }
  }
  return saida;
}

const arquivos = listar(RAIZ);
let falhou = false;

function reportar(rotulo, achados) {
  if (achados.length) {
    falhou = true;
    console.log('');
    console.log('[FALHA] ' + rotulo);
    for (const a of achados) console.log('  ' + a);
  } else {
    console.log('[ok] ' + rotulo);
  }
}

console.log('== Varredura de segredos ==');

// ---------- 1. conteudo dos arquivos ----------
const achadosPorRegra = new Map(REGRAS.map((r) => [r.rotulo, []]));

for (const caminho of arquivos) {
  const rel = relative(RAIZ, caminho).split(sep).join('/');
  if (ARQUIVOS_ISENTOS.has(basename(caminho))) continue;
  if (EXT_BINARIAS.has(extname(caminho).toLowerCase())) continue;

  let texto;
  try { texto = readFileSync(caminho, 'utf8'); } catch { continue; }
  if (texto.includes('\u0000')) continue; // binario disfarcado

  const linhas = texto.split(/\r?\n/);
  const doc = ehDoc(rel);

  for (const regra of REGRAS) {
    if (regra.escopo === 'codigo' && doc) continue;
    linhas.forEach((linha, i) => {
      if (regra.re.test(linha)) {
        achadosPorRegra.get(regra.rotulo).push(rel + ':' + (i + 1) + '  ' + linha.trim().slice(0, 120));
      }
    });
  }
}

for (const regra of REGRAS) reportar(regra.rotulo, achadosPorRegra.get(regra.rotulo));

// ---------- 2. arquivos sensiveis presentes ----------
const sensiveis = arquivos
  .map((c) => relative(RAIZ, c).split(sep).join('/'))
  .filter((rel) => PADROES_SENSIVEIS.some((re) => re.test(basename(rel))));

console.log('');
if (sensiveis.length) {
  console.log('[aviso] arquivos sensiveis no diretorio (confirme que estao no .gitignore):');
  for (const s of sensiveis) console.log('  ' + s);
} else {
  console.log('[ok] nenhum arquivo sensivel no diretorio');
}

// ---------- 3. rastreamento no Git ----------
function gitDisponivel() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

if (gitDisponivel()) {
  let rastreados = [];
  try {
    rastreados = execSync('git ls-files', { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  } catch { /* repo vazio */ }

  const proibidos = rastreados.filter((rel) =>
    PADROES_SENSIVEIS.some((re) => re.test(basename(rel))));

  if (proibidos.length) {
    falhou = true;
    console.log('');
    console.log('[FALHA] arquivo sensivel rastreado pelo Git:');
    for (const p of proibidos) console.log('  ' + p + '   -> git rm --cached "' + p + '"');
  } else {
    console.log('[ok] nenhum arquivo sensivel rastreado pelo Git');
  }
} else {
  console.log('[--] repositorio Git ainda nao iniciado');
}

// ---------- 4. bundle gerado ----------
const dist = join(RAIZ, 'dist');
if (existsSync(dist)) {
  const RE_DIST = [
    /service_role/,
    /postgres(ql)?:\/\/[^:@/\s]+:[^@\s]+@/,
    /BEGIN [A-Z ]*PRIVATE KEY/
  ];
  const achados = [];
  for (const caminho of listar(dist)) {
    if (EXT_BINARIAS.has(extname(caminho).toLowerCase())) continue;
    let texto;
    try { texto = readFileSync(caminho, 'utf8'); } catch { continue; }
    for (const re of RE_DIST) {
      if (re.test(texto)) {
        achados.push(relative(RAIZ, caminho).split(sep).join('/') + '  (' + re.source + ')');
        break;
      }
    }
  }
  reportar('dist/ sem credenciais', achados);
} else {
  console.log('[--] dist/ ausente (rode npm run build para checar o bundle)');
}

// ---------- resultado ----------
console.log('');
if (falhou) {
  console.log('Corrija os itens acima ANTES de commitar.');
  process.exit(1);
}
console.log('Nenhum segredo encontrado. Seguro para commit.');

# FonseDesk — sistema de chamados

Produto da Fonsetech TI: helpdesk com portal do cliente e painel administrativo.
O nome do produto vive em `src/ui/marca.js`; a landing page publica (`index.html`)
continua sendo o site institucional da **Fonsetech TI**.
Arquitetura de produção: **GitHub → Railway (frontend) → Supabase (PostgreSQL + Auth + RLS)**.

```
        GitHub                Railway                 Supabase
   código-fonte  ──push──▶  build + deploy  ──API──▶  PostgreSQL
                            Node + Express            Auth / RLS / Storage
```

---

## ⚠️ Leia primeiro: o que existe hoje neste pacote

Este pacote contém **duas coisas diferentes**:

| Pasta | O que é | Status |
|---|---|---|
| `design/*.dc.html` | **Protótipos de design em HTML.** Mostram o layout, as cores, os textos e o comportamento pretendidos de cada tela. Rodam no navegador com estado em memória — não têm banco, login real nem build. | ✅ Prontos, aprovados |
| `supabase/`, `server.js`, `package.json`, `railway.json`, `vite.config.js`, `src/lib/supabase.js` | **Infraestrutura de produção.** Schema real do banco com RLS, scaffolding de build e deploy. | ✅ Prontos para aplicar |
| `src/` (componentes, rotas, telas) | **A implementação em React.** | ⬜ A fazer |

Os arquivos `.dc.html` **não são o código de produção** e não devem ser publicados como estão:
não possuem autenticação, e todos os dados são constantes no próprio arquivo (inclusive senhas
de exemplo de acesso remoto, que num sistema real jamais podem estar no frontend).

O trabalho restante é **recriar essas telas como componentes React**, lendo e gravando via
Supabase, dentro da estrutura já preparada aqui. O schema, as políticas de segurança e o
pipeline de deploy já estão definidos — falta a camada de interface em React.

---

## Requisitos

- **Node.js 20+** e npm
- Conta **GitHub** (repositório e deploy contínuo)
- Conta **Supabase** (banco, autenticação e storage)
- Conta **Railway** (hospedagem do frontend)
- Opcional: [Supabase CLI](https://supabase.com/docs/guides/cli) para aplicar migrations pelo terminal

---

## Instalação

```bash
git clone https://github.com/<sua-conta>/fonsetech-central-chamados.git
cd fonsetech-central-chamados
npm install
```

## Configuração

```bash
cp .env.example .env
```

Preencha o `.env` com os dados do seu projeto Supabase
(**Project Settings → API** e **Database → Connection string**).

O `.env.example` traz apenas os **nomes** das variáveis, sem valores.
O `.env` está no `.gitignore` e **nunca** vai para o repositório.

Antes de qualquer commit:

```bash
npm run check:secrets
```

O script (Node puro, roda em Windows, Linux e Railway sem bash) varre o
projeto por JWT do Supabase, connection strings com senha, chaves PEM,
tokens Bearer, credenciais atribuídas a literal, senhas em texto,
`service_role` no frontend, variáveis privadas com prefixo `VITE_`,
arquivos sensíveis rastreados pelo Git e credenciais no `dist/`.
Falha com código de saída 1 se encontrar algo — serve como pre-commit hook.

---

## Supabase — passo a passo

### 1. Criar o projeto
No painel do Supabase, crie um projeto e escolha a região mais próxima
(São Paulo, se disponível). Guarde a senha do banco.

### 2. Aplicar as migrations

**Opção A — painel web (mais simples):**
abra **SQL Editor** e execute, nesta ordem, o conteúdo de:

1. `supabase/migrations/001_setup_completo.sql` — tabelas, tipos, índices, triggers,
   Row Level Security e o bucket privado das apostilas, em um único script idempotente
2. `supabase/migrations/002_site_imagens.sql` — imagens da landing page trocáveis pelo painel
3. `supabase/migrations/003_fonsedesk_evolucao_multitenant.sql` — planos, CRM, financeiro,
   auditoria e campos extras de `empresas`/`chamados`/`agendamentos`
4. `supabase/migrations/004_hardening_seguranca.sql` — cifra a senha de acesso remoto
   (Vault + `pgcrypto`, RPCs `salvar_acesso_remoto`/`obter_senha_acesso_remoto`) e fecha
   duas brechas de RLS encontradas na 003 (campos internos de `empresas` e `auditoria_logs`)
5. `supabase/migrations/005_login_clientes.sql` — corrige colunas que faltavam em `profiles`
   (`email`/`cargo`/`whatsapp`), adiciona o papel `cliente_admin` e cria a RPC
   `criar_perfil_cliente`, usada por `/api/admin/criar-usuario` para o cadastro de login

**Opção B — CLI:**
```bash
supabase link --project-ref <seu-project-ref>
supabase db push
```

### 3. Dados de teste (apenas desenvolvimento)
```bash
# NÃO rode em produção
psql "<connection-string>" -f supabase/seed.sql
```

### 4. Autenticação

Em **Authentication → Providers**, mantenha **Email** habilitado e:

- **desative "Enable email signup"** — não existe cadastro público neste sistema;
  o acesso é criado pelo administrador (regra definida na tela de login)
- em **URL Configuration**, cadastre a URL da Railway em *Site URL* e *Redirect URLs*

Para criar um usuário: **Authentication → Users → Add user**, e depois insira o
perfil correspondente:

```sql
-- admin da Fonsetech
insert into public.profiles (id, nome, role, ativo)
values ('<uuid-do-auth-user>', 'Rafael Mendes', 'admin', true)
on conflict (id) do update set role = 'admin', ativo = true;

-- cliente vinculado a uma empresa
insert into public.profiles (id, empresa_id, nome, role, ativo)
values ('<uuid-do-auth-user>', '11111111-1111-1111-1111-111111111111',
        'Marina Ribeiro', 'cliente', true);
```

O botão **"Desativar"** na tela de Clientes corresponde a `profiles.ativo = false`:
o usuário deixa de passar pelo RLS sem que o login seja excluído.

### 5. Como a segurança está montada

| Tabela | Cliente | Admin |
|---|---|---|
| `empresas` | lê e edita **a própria** | tudo |
| `profiles` | lê o próprio e colegas da empresa; edita só nome/telefone | tudo |
| `maquinas` | **lê** as da própria empresa | cria, edita, remove |
| `maquinas_acesso_remoto` | **sem acesso** | tudo |
| `chamados` | lê os da empresa; abre novos | tudo, muda status/prioridade/responsável |
| `chamado_historico` | lê o público; comenta | tudo, inclusive notas internas |
| `agendamentos` | lê os da empresa; solicita | tudo, confirma |
| `materiais` | lê os publicados e liberados | tudo |

Três decisões que valem destaque:

1. **Credenciais de acesso remoto ficam em tabela separada** (`maquinas_acesso_remoto`).
   O RLS do Postgres filtra *linhas*, não *colunas* — se a senha estivesse em `maquinas`,
   qualquer cliente autorizado a ver a máquina veria também a senha. Isolar em outra
   tabela, sem nenhuma policy para cliente, é o que garante o bloqueio.
2. **O cliente não pode se promover a admin**: a policy de update em `profiles` exige que
   `role`, `ativo` e `empresa_id` permaneçam iguais aos valores atuais.
3. **O cliente não escolhe o responsável nem o status** ao abrir chamado: a policy de insert
   restringe `status` a *Aberto/Urgente* e exige `responsavel_id is null`.

---

## Desenvolvimento

```bash
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # gera dist/
npm run start    # serve dist/ pelo Express (igual à produção)
```

---

## VARIÁVEIS DE AMBIENTE — RAILWAY

Cadastre em **Railway → Project → Variables**. Nada disso vai para o GitHub.

### Obrigatórias

| Variável | Finalidade | Onde obter |
|---|---|---|
| `SUPABASE_URL` | Endereço da API do projeto | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Chave anônima (uso autenticado pelo RLS) | Supabase → Settings → API |
| `VITE_SUPABASE_URL` | Mesmo valor de `SUPABASE_URL` | idem |
| `VITE_SUPABASE_ANON_KEY` | Mesmo valor de `SUPABASE_ANON_KEY` | idem |
| `NODE_ENV` | `production` | fixo |

**Por que a duplicação com `VITE_`:** é uma restrição do build, não escolha de
projeto. O Vite substitui em tempo de compilação apenas variáveis prefixadas com
`VITE_`; sem o prefixo, o código do navegador recebe `undefined` e o app não
conecta. As duas versões recebem valores idênticos.

Essas duas **são públicas por natureza** — qualquer pessoa pode lê-las no bundle.
A segurança não vem de esconder a chave anônima, e sim do **RLS ativo** no
Supabase: a chave identifica o projeto, a policy decide o que cada usuário vê.

### Somente servidor — nunca com prefixo `VITE_`

| Variável | Finalidade | Quando cadastrar |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Ignora todo o RLS. Necessária para `/api/admin/criar-usuario` (cadastro de login de cliente, aba Clientes → perfil da empresa → "Novo usuário"). Sem ela, o botão funciona mas devolve erro explicando o que falta. | **Obrigatória** para usar esse cadastro; pegue em Supabase → Settings → API → service_role |
| `DATABASE_URL` | Conexão Postgres direta (migrations, scripts). Contém senha. | Apenas se rodar migrations pela Railway |
| `PORT` | Porta do Express. **A Railway injeta sozinha** — não cadastre. | — |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` dão acesso total ao banco,
> ignorando RLS. Se qualquer uma delas ganhar o prefixo `VITE_`, o valor entra no
> JavaScript público e o banco fica exposto. Confira após o build:
>
> ```bash
> grep -rE "service_role|postgres://" dist/    # deve retornar vazio
> ```

### Apenas local (não cadastre na Railway)

| Variável | Motivo |
|---|---|
| `PORT=8080` | Só para `npm start` local; em produção a Railway define |
| `DATABASE_URL` | Se você aplicar migrations da sua máquina |
| `NODE_ENV=development` | Automático no `npm run dev` |

---

## Railway — deploy

1. **New Project → Deploy from GitHub repo** e selecione o repositório
2. Cadastre as variáveis da seção acima
3. A Railway lê o `railway.json`:
   - build: `npm ci && npm run build`
   - start: `npm run start`
   - healthcheck: `/healthz`
4. **Settings → Networking → Generate Domain**
5. Volte ao Supabase e adicione esse domínio em **Authentication → URL Configuration**

Cada `push` na branch principal dispara um novo deploy.

### SPA e refresh de página

A rota `/` responde `dist/index.html` (landing page pública, HTML estático).
Qualquer outra rota responde `dist/app.html`, o shell da SPA — então `/login`,
`/dashboard/chamados` e `/admin/maquinas` continuam funcionando ao recarregar a
página, sem 404. Em `npm run dev` o middleware `fonsetech-spa-fallback` do
`vite.config.js` faz o mesmo. Os arquivos de `/assets` (com hash no nome) são
servidos com cache longo; os HTML, sem cache agressivo.

---

## Primeiro deploy — comandos

```bash
# 1. Validar localmente
npm install
npm run check:secrets          # nenhum segredo no código
npm run build                  # gera dist/ sem erros
npm run start                  # confere em http://localhost:8080

# 2. Publicar no GitHub
git init
git add .
git status                     # CONFIRME: .env não deve aparecer
git commit -m "Central de Chamados - infraestrutura de producao"
git branch -M main
git remote add origin https://github.com/<sua-conta>/fonsetech-central-chamados.git
git push -u origin main
```

Depois, no painel da **Railway** (sem terminal):

1. **New Project → Deploy from GitHub repo** → selecione o repositório
2. **Variables** → cadastre as variáveis da seção acima
3. O deploy inicia sozinho lendo o `railway.json`
4. **Settings → Networking → Generate Domain**
5. No **Supabase → Authentication → URL Configuration**, cadastre esse domínio
   em *Site URL* e *Redirect URLs*

Verificação final:

```bash
curl https://<seu-dominio>.up.railway.app/healthz     # {"ok":true}
```

Se preferir a CLI da Railway:

```bash
npm i -g @railway/cli
railway login
railway link
railway variables --set NODE_ENV=production
railway up
```

---

## Estrutura

```
/
├── .github/workflows/ci.yml         lint + testes + check:secrets + build no push/PR
├── index.html                       landing page pública (rota /)
├── app.html                         shell da SPA (login, /dashboard, /admin)
├── design/                          protótipos HTML (referência visual, NÃO servido)
│   ├── Chamados Login.dc.html
│   ├── Chamados Dashboard Cliente.dc.html
│   ├── Chamados Dashboard Admin.dc.html
│   ├── Fontesetech TI Landing.dc.html
│   └── support.js
├── src/
│   ├── main.jsx                     bootstrap do React + Router
│   ├── App.jsx                      rotas aninhadas (/login, /dashboard/*, /admin/*)
│   ├── auth/
│   │   ├── SessaoProvider.jsx       sessão + perfil (role/empresa)
│   │   └── RotaProtegida.jsx        guarda de rota por papel
│   ├── layout/
│   │   ├── Shell.jsx                sidebar + main (variantes cliente/admin)
│   │   ├── LayoutCliente.jsx        7 itens de navegação
│   │   ├── LayoutAdmin.jsx          5 itens de navegação
│   │   ├── Cabecalho.jsx            título + ação + avatar
│   │   ├── ItemNav.jsx              item da sidebar com estado ativo
│   │   └── BotaoSair.jsx
│   ├── ui/                          primitivos (tokens dos protótipos)
│   │   ├── tokens.js  Icone.jsx  Campo.jsx  Botao.jsx
│   │   ├── Chip.jsx  Modal.jsx  Estado.jsx  Kpi.jsx
│   │   └── tokens.test.js           testes dos formatadores (Vitest)
│   ├── dados/
│   │   ├── consultas.js             todas as queries do Supabase
│   │   ├── usarDados.js             hook loading/erro + tradução de erros
│   │   └── usarDados.test.js        testes da tradução de erros (Vitest)
│   ├── telas/
│   │   ├── Login.jsx
│   │   ├── cliente/                 VisaoGeral, MeusChamados, AbrirChamado,
│   │   │                            Agendamentos, Cursos, Downloads, MinhaEmpresa
│   │   └── admin/                   VisaoGeralAdmin, ChamadosAdmin, Clientes,
│   │                                AgendaAdmin, Maquinas
│   └── lib/
│       ├── supabase.js              cliente Supabase + carregarPerfil()
│       └── monitoramento.js         captura erros globais -> /api/client-log
├── supabase/
│   ├── migrations/
│   │   ├── 001_setup_completo.sql              schema + RLS + storage (idempotente)
│   │   ├── 002_site_imagens.sql                imagens da landing trocaveis pelo painel
│   │   ├── 003_fonsedesk_evolucao_multitenant.sql  planos, CRM, financeiro, auditoria
│   │   ├── 004_hardening_seguranca.sql         Vault + pgcrypto, correcoes de RLS
│   │   └── 005_login_clientes.sql              login de cliente (usuario + senha reais)
│   └── seed.sql
├── scripts/
│   └── check-secrets.js             varredura de segredos (Node, multiplataforma)
├── .env.example                     apenas nomes, sem valores
├── .gitignore
├── package.json
├── railway.json
├── server.js
├── vite.config.js
├── vitest.config.js
└── README.md
```

---

## Telas implementadas

Todas as telas foram convertidas dos protótipos em `design/` para React,
consumindo o Supabase pela camada `src/dados/consultas.js`.

### `/login`
Duas colunas. Painel esquerdo com gradiente azul-marinho, logo, headline,
quatro destaques em uma linha e card de depoimento; formulário à direita com
mostrar/ocultar senha, "Lembrar de mim" e recuperação por e-mail.
Autenticação via `signInWithPassword`; erro genérico para não revelar
se o e-mail existe. Sem cadastro público e sem login social.

### `/dashboard` — cliente (7 abas)
Visão geral (4 KPIs, chamados recentes, próximos agendamentos) · Meus chamados
(filtro por status, modal com histórico e resposta) · Abrir chamado (seleção da
máquina cadastrada, ficha técnica da escolhida e campo livre para equipamento
não cadastrado) · Agendamentos (visita e reunião + lista com status) · Cursos
(PDF/PPT, visualizador em tela inteira com URL assinada) · Downloads (programas
com versão, tamanho e link) · Minha empresa (cadastro + responsáveis).

### `/admin` — administrativo (5 abas)
Visão geral (5 KPIs, fila ordenada por prioridade e antiguidade, distribuição
por prioridade, últimas ações) · Chamados (busca textual + filtros; status,
prioridade e responsável editáveis; resposta ao cliente e nota interna) ·
Clientes (ativar/desativar acesso) · Agenda (confirmar e concluir) ·
Máquinas (inventário, rede, acesso remoto e cadastro).

## Tokens de design

```
Azul primário       #1d5ff5    hover #2f7bff
Azul escuro (link)  #1558d6    hover #0f47b0
Roxo (admin)        #7c3aed    claro #a78bfa
Texto principal     #0d1730
Texto secundário    #55637f / #6b7896
Texto terciário     #93a0b8 / #a3aec4
Fundo claro         #ffffff    alternativo #f4f7fc / #f7f9fd
Borda               rgba(20, 45, 100, 0.10 – 0.16)
Gradiente sidebar   linear-gradient(170deg, #0d2a6b, #0b1f52)
Gradiente admin     linear-gradient(170deg, #1b1442, #140f31)

Status: Aberto #1558d6 · Em atendimento #0369a1 · Aguardando #a16207
        Urgente #b91c1c · Resolvido #14804a

Tipografia   Plus Jakarta Sans (400–800); JetBrains Mono (números e IDs)
Raio         botões/inputs 10px · cards 14px · pílulas 999px
```

---

## Separação frontend / backend

Regra única: **o que o Vite compila só pode ler variáveis `VITE_`.**

### O que o navegador recebe

```
src/lib/supabase.js  →  import.meta.env.VITE_SUPABASE_URL
                        import.meta.env.VITE_SUPABASE_ANON_KEY
```

Esses dois são os **únicos** `import.meta.env` do projeto. Nenhum outro arquivo
sob `src/` lê variável de ambiente, portanto não existe caminho pelo qual
`SUPABASE_SERVICE_ROLE_KEY` ou `DATABASE_URL` cheguem ao bundle.

Verificação após o build:

```bash
grep -rE "service_role|postgres://" dist/     # deve retornar vazio
```

### O que fica no servidor

`server.js` lê apenas `process.env.PORT`. Ele **não** importa o cliente
Supabase e **não** toca em credencial alguma — é só um servidor de arquivos
estáticos com fallback de SPA. Nenhuma dependência de
`SUPABASE_SERVICE_ROLE_KEY` ou `DATABASE_URL` foi criada: essas variáveis
só passam a ser necessárias quando você escrever a rota de convite de usuário.

### Por que a `anon key` no navegador é aceitável

Ela identifica o projeto, não autoriza acesso. Quem autoriza é o RLS: toda
consulta chega ao Postgres como `authenticated` com o `auth.uid()` do usuário,
e as policies decidem cada linha visível. Sem sessão válida, a chave anônima
não lê nada — todas as tabelas têm RLS ativo e nenhuma policy para `anon`.

### Proteção dos protótipos

`design/` fica versionado como referência, mas **nunca é servido**:

1. está fora de `public/`, então o Vite não o copia para `dist/`
2. o `server.js` responde **404** para `/design/*`, `*.dc.html`,
   `/supabase/*`, `/scripts/*` e `/.env*` — defesa em profundidade
3. o `.gitignore` bloqueia `public/design/` e `dist/design/`

---

## Checklist de segurança antes de publicar

- [ ] `.env` **não** está versionado (confirme com `git status`)
- [ ] `npm run check:secrets` passa sem falhas
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ausente do bundle: após o build, rode
      `grep -r "service_role" dist/` — deve retornar vazio
- [ ] RLS habilitado em **todas** as tabelas (o Supabase alerta em Database → Tables)
- [ ] Cadastro público de e-mail desabilitado no Auth
- [ ] Senhas de acesso remoto apenas em `maquinas_acesso_remoto`, nunca em `maquinas`,
      e sempre gravadas via a RPC `salvar_acesso_remoto` (nunca por `insert`/`update` direto)
- [ ] `design/` não acessível em produção: `curl -I https://<dominio>/design/` → 404
- [ ] Nenhum `import.meta.env` fora de `src/lib/supabase.js`
- [ ] Teste de isolamento: logue como cliente da empresa A e confirme que
      `select * from maquinas` retorna somente as máquinas dela
- [ ] Teste de escalonamento: logue como cliente e tente `update profiles set role='admin'`
      e `update empresas set situacao_financeira='Em dia'` pela API — RLS/trigger devem barrar
- [ ] URLs de redirect do Auth apontando para o domínio da Railway
- [ ] `npm run audit:prod` sem vulnerabilidades altas/críticas
- [ ] Sem `localhost` no código de produção
- [ ] Estados de loading e erro tratados em todas as chamadas ao Supabase

---

## Segurança — resumo do que já está garantido e por quem

| Preocupação | Quem resolve | Como verificar |
|---|---|---|
| Senha de usuário em texto puro | **Supabase Auth** (GoTrue) faz hash com bcrypt; o app nunca vê nem grava senha de login | não há tabela própria de senha de usuário no schema |
| Rotas de API sem autenticação | Não existe rota privilegiada no `server.js` — ele só reencaminha para o Supabase Auth (`/api/auth/login`) e serve `dist/`. Toda leitura/escrita de dado passa pelo Supabase com RLS | ver `server.js`; nenhuma rota usa `SUPABASE_SERVICE_ROLE_KEY` |
| Força bruta no login | `express-rate-limit` em `/api/auth/login` (10 tentativas / 15 min por IP) somado ao rate limit nativo do Supabase Auth | `server.js`, `limiteLogin` |
| Cliente virar admin | `profiles_atualiza_proprio` (RLS) exige que `role`/`ativo`/`empresa_id` permaneçam iguais; não existe policy de `insert` para não-admin | tentar `update profiles set role='admin'` logado como cliente — deve falhar |
| Ver senha/dado sensível pelo F12 | RLS filtra no Postgres, não no navegador: a chave anônima é pública por design, quem decide o que cada usuário vê é a policy. `maquinas_acesso_remoto.senha_cifrada` fica cifrada (Vault + `pgcrypto`, migration 004) mesmo para o admin, e só é revelada por RPC sob demanda | inspecionar a resposta de rede com F12 — nunca deve aparecer senha em texto puro |
| Cliente sobrescrever dado interno da própria empresa (financeiro, plano, notas do admin) | Trigger `protege_campos_empresa` (migration 004) força de volta ao valor anterior qualquer coluna fora do formulário "Minha empresa" | tentar `update empresas set valor_mensal=0` logado como cliente — deve continuar com o valor antigo |
| Log de auditoria forjado em nome de outro usuário | Trigger `preenche_auditoria` (migration 004) ignora `usuario_id`/`usuario_nome` enviados pelo cliente e usa sempre a sessão autenticada | inspecionar `auditoria_logs.usuario_id` após um insert manual com outro id |

**Aplique a migration 004** (`supabase/migrations/004_hardening_seguranca.sql`) no SQL Editor —
ela não roda sozinha, é preciso colar e executar como as demais.

**Dependências com vulnerabilidade conhecida** (`npm audit`):
`react-router`/`react-router-dom` têm dois avisos moderados (redirect aberto e injeção de
construtor via SSR — este último não se aplica aqui, o app não usa SSR) cuja correção exige
subir para a v7, uma major com mudanças de API. Não apliquei essa migração porque é uma
mudança de estrutura maior do que o pedido, mas fica registrado para decisão consciente.

---

## Pendências

1. ~~Implementar a interface em React~~ — concluído, telas convertidas dos `.dc.html`
2. ~~Definir a cifragem das senhas de acesso remoto~~ — concluído no código: veja
   `supabase/migrations/004_hardening_seguranca.sql` (Vault + `pgcrypto`) e
   `salvarAcessoRemoto`/`obterSenhaAcessoRemoto` em `src/dados/consultas.js`.
3. ~~Fluxo de convite de cliente~~ — concluído: `/api/admin/criar-usuario` (server.js)
   usa `auth.admin.createUser` com a `service_role` para criar login (e-mail + senha
   definida pelo admin) e vincula o perfil via RPC `criar_perfil_cliente`
   (`supabase/migrations/005_login_clientes.sql`). Cadastre `SUPABASE_SERVICE_ROLE_KEY`
   na Railway para habilitar.
4. **Upload das apostilas** no bucket `materiais` e preenchimento de `arquivo_path`
5. **Links reais do Google Drive** em `materiais.link_externo` (hoje vazios — o botão
   fica como "Em breve")
6. **Notificações por e-mail** ao abrir/responder chamado, se desejado

**Rode as migrations pendentes** (SQL Editor do Supabase, uma vez cada, na ordem):
`004_hardening_seguranca.sql` e `005_login_clientes.sql` (a 005 precisa da 001+003 já aplicadas).

## Qualidade e observabilidade

- **CI** (`.github/workflows/ci.yml`): a cada push/PR na `main`, roda lint, testes,
  `check:secrets`, build e confere que nenhuma credencial vazou para `dist/`
- **Testes unitários** (`npm run test`, Vitest): cobrem a tradução de erros do
  Supabase para mensagens de usuário (`src/dados/usarDados.js`) e os formatadores
  de `src/ui/tokens.js`. Ficam em arquivos `*.test.js` ao lado do código testado
- **Log de erros do navegador** (`src/lib/monitoramento.js`): captura exceções e
  promises rejeitadas não tratadas e envia um resumo (mensagem, stack, rota — sem
  dado de formulário) para `/api/client-log`, logado de forma estruturada no
  servidor. Sem dependência de provedor externo

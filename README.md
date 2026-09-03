# Fonsetech — Central de Chamados

Sistema de helpdesk com portal do cliente e painel administrativo.
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

1. `supabase/migrations/001_initial_schema.sql` — tabelas, tipos, índices, triggers
2. `supabase/migrations/002_rls_policies.sql` — Row Level Security
3. `supabase/migrations/003_storage.sql` — bucket privado das apostilas

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
values ('<uuid-do-auth-user>', 'Rafael Mendes', 'admin', true);

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
| `SUPABASE_SERVICE_ROLE_KEY` | Ignora todo o RLS. Necessária só para convidar usuário / resetar senha via rota de servidor ou Edge Function. | Apenas quando esse fluxo existir |
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

O `server.js` responde `index.html` para qualquer rota não encontrada, então
`/login`, `/dashboard`, `/admin`, `/clientes` e `/configuracoes` continuam
funcionando ao recarregar a página — sem 404. Os arquivos de `/assets` (com hash no
nome) são servidos com cache longo; o `index.html`, sem cache agressivo.

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
├── index.html                       entrypoint do Vite
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
│   │   └── Chip.jsx  Modal.jsx  Estado.jsx  Kpi.jsx
│   ├── dados/
│   │   ├── consultas.js             todas as queries do Supabase
│   │   └── usarDados.js             hook loading/erro + tradução de erros
│   ├── telas/
│   │   ├── Login.jsx
│   │   ├── cliente/                 VisaoGeral, MeusChamados, AbrirChamado,
│   │   │                            Agendamentos, Cursos, Downloads, MinhaEmpresa
│   │   └── admin/                   VisaoGeralAdmin, ChamadosAdmin, Clientes,
│   │                                AgendaAdmin, Maquinas
│   └── lib/supabase.js              cliente Supabase + carregarPerfil()
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_storage.sql
│   └── seed.sql
├── scripts/
│   └── check-secrets.js             varredura de segredos (Node, multiplataforma)
├── .env.example                     apenas nomes, sem valores
├── .gitignore
├── package.json
├── railway.json
├── server.js
├── vite.config.js
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
- [ ] Senhas de acesso remoto apenas em `maquinas_acesso_remoto`, nunca em `maquinas`
- [ ] `design/` não acessível em produção: `curl -I https://<dominio>/design/` → 404
- [ ] Nenhum `import.meta.env` fora de `src/lib/supabase.js`
- [ ] Teste de isolamento: logue como cliente da empresa A e confirme que
      `select * from maquinas` retorna somente as máquinas dela
- [ ] URLs de redirect do Auth apontando para o domínio da Railway
- [ ] `npm run audit:prod` sem vulnerabilidades altas/críticas
- [ ] Sem `localhost` no código de produção
- [ ] Estados de loading e erro tratados em todas as chamadas ao Supabase

---

## Pendências

1. **Implementar a interface em React** — os `.dc.html` são a referência visual
2. **Definir a cifragem das senhas de acesso remoto** — a coluna `senha_cifrada` é
   `bytea`; use `pgsodium`/Vault do Supabase ou cifre na Edge Function. Não grave em texto puro
3. **Fluxo de convite de cliente** — precisa de rota de servidor com `service_role`
   (`auth.admin.inviteUserByEmail`), pois a chave anônima não cria usuários
4. **Upload das apostilas** no bucket `materiais` e preenchimento de `arquivo_path`
5. **Links reais do Google Drive** em `materiais.link_externo` (hoje vazios — o botão
   fica como "Em breve")
6. **Notificações por e-mail** ao abrir/responder chamado, se desejado

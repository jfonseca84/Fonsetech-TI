# Deploy — GitHub → Railway → Supabase

Site institucional **Fonsetech TI** em `/` · sistema de chamados **FonseDesk** em `/login`.

Ordem obrigatória: **Supabase primeiro** (o app não sobe sem banco), depois GitHub, depois Railway.

Rotas do sistema:

| Rota | Quem responde | Acesso |
|---|---|---|
| `/` | `dist/index.html` — landing page estática | público |
| `/login` | shell da SPA (`dist/app.html`) | público |
| `/dashboard/...` | shell da SPA | perfil `cliente` |
| `/admin/...` | shell da SPA | perfil `admin` |

---

## 1. Supabase (10 min)

1. Crie o projeto em supabase.com — região São Paulo se disponível. Guarde a senha do banco.
2. **SQL Editor → New query** → cole e execute o script único:
   `supabase/migrations/001_setup_completo.sql`

   Ele cria tabelas, enums, triggers, funções, todas as políticas de RLS e o
   bucket de Storage. É idempotente (`create ... if not exists`,
   `drop policy if exists`) e não contém nenhum comando destrutivo — pode ser
   executado de novo sem perder dados.
2b. **SQL Editor → New query** → cole e execute também:
   `supabase/migrations/002_site_imagens.sql`

   Cria a tabela `site_imagens` e o bucket público `site`, usados pela tela
   **Configurações do site** do painel admin para trocar as imagens da landing
   sem republicar o projeto. Também idempotente.
3. **Authentication → Providers → Email**: mantenha habilitado e **desative "Enable email signup"**
   (não existe cadastro público neste sistema).
4. **Authentication → Users → Add user**: crie o seu acesso de administrador
   (a senha fica no painel do Supabase, nunca no código ou no SQL).
5. **SQL Editor** — vincule o perfil, trocando o UUID pelo do usuário criado:

   ```sql
   insert into public.profiles (id, nome, role, ativo)
   values ('<uuid-do-usuario>', 'Seu Nome', 'admin', true)
   on conflict (id) do update set role = 'admin', ativo = true;
   ```

   Para um usuário cliente: `role = 'cliente'` **e** `empresa_id` preenchido —
   cliente sem empresa é bloqueado pelo RLS por definição.
6. **Settings → API**: copie `Project URL` e a chave `anon public`. São os dois
   valores que a Railway precisa.

> Não copie a `service_role`. Nenhum arquivo deste projeto a usa.

---

## 2. Validação local (antes de subir)

```bash
npm install
npm run check:secrets     # precisa terminar sem [FALHA]
npm run build             # precisa gerar dist/index.html e dist/app.html
npm run start             # http://localhost:8080
```

Crie o `.env` a partir do `.env.example` (`VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY`) para o teste local funcionar.

Confira, em `npm run dev` ou `npm run start`:

- `/` → landing page, sem pedir login
- `/login` → formulário; após entrar, admin cai em `/admin` e cliente em `/dashboard`
- `/dashboard/chamados` recarregado direto → abre a tela (fallback de SPA), não dá 404
- cliente que digita `/admin` na URL → é devolvido ao próprio painel

---

## 3. GitHub

```bash
git init
git add .
git status                # CONFIRME: .env não aparece na lista
git commit -m "Central de Chamados - aplicacao React + Supabase"
git branch -M main
git remote add origin https://github.com/<sua-conta>/fonsetech-central-chamados.git
git push -u origin main
```

O `package-lock.json` **deve** ser commitado — a Railway usa ele para o build reproduzível.

---

## 4. Railway

1. **New Project → Deploy from GitHub repo** → selecione o repositório.
2. **Variables** → adicione as variáveis de ambiente:

   | Variável | Valor | Observação |
   |---|---|---|
   | `VITE_SUPABASE_URL` ou `SUPABASE_URL` | Project URL do Supabase (ex: `https://vceeaqswgasjsonixvqs.supabase.co`) | Sem aspas, sem barra no final |
   | `VITE_SUPABASE_ANON_KEY` ou `SUPABASE_ANON_KEY` | Chave `anon public` | Sem aspas, sem espaços |

   > **Atenção:** Se as variáveis forem cadastradas com aspas ou barras extras no final, o sistema agora as sanitiza automaticamente. Além disso, o servidor `server.js` injeta as variáveis em runtime no `app.html` e possui um endpoint de proxy resiliente (`/api/auth/login`) para evitar o erro `Failed to fetch` quando o navegador sofre restrição de rede ou adblocker.
   >
   > Opcional: `NODE_ENV=production`.
   > Não cadastre `PORT` (a Railway injeta automaticamente).
   > **NÃO** cadastre `SUPABASE_SERVICE_ROLE_KEY` nem `DATABASE_URL` no frontend — nunca exponha chaves sensíveis.

3. O deploy roda sozinho lendo o `railway.json`:
   build `npm ci && npm run build` · start `npm run start` · healthcheck `/healthz`.
4. **Settings → Networking → Generate Domain**.
5. Volte ao **Supabase → Authentication → URL Configuration** e cadastre o domínio
   gerado em *Site URL* e em *Redirect URLs*. Sem isso, a recuperação de senha não
   volta para o app.

---

## 5. Verificação em produção e Diagnóstico

```bash
curl https://<seu-dominio>.up.railway.app/healthz                 # {"ok":true}
curl https://<seu-dominio>.up.railway.app/api/supabase-status     # {"ok":true, "supabaseReachable":true}
curl -I https://<seu-dominio>.up.railway.app/design/              # 404 (protótipos bloqueados)
```

Se ao fazer login aparecer erro:
- **E-mail ou senha incorretos**: Usuário ou senha digitados não coincidem com o Supabase Auth.
- **Perfil não encontrado na tabela profiles**: O usuário foi criado em Authentication > Users, mas falta o registro correspondente na tabela `profiles`. Execute no SQL Editor do Supabase:
  ```sql
  insert into public.profiles (id, nome, role, ativo)
  values ('<UUID_DO_USUARIO>', 'Nome Admin', 'admin', true)
  on conflict (id) do update set role = 'admin', ativo = true;
  ```
- **E-mail não confirmado**: No painel do Supabase, vá em **Authentication > Users**, localize o usuário e clique nos três pontinhos (...) > **Confirm email**.

No navegador:

- `/` abre a landing page pública
- `/login` carrega e autentica
- `/admin` abre a visão geral; recarregar não dá 404
- crie um usuário cliente vinculado a uma empresa e confirme que ele **não** enxerga
  dados de outra empresa — esse é o teste que valida o RLS

---

## SEO — trocar o domínio

Os arquivos de SEO assumem `https://www.fontesetechti.com.br`. **Se o domínio final
for outro**, troque em três lugares antes do deploy:

- `index.html` → `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image` e o
  bloco `application/ld+json`
- `public/robots.txt` → linha `Sitemap:`
- `public/sitemap.xml` → `<loc>`

Depois do primeiro deploy: cadastre o site no **Google Search Console**, envie
`https://<domínio>/sitemap.xml` e crie o perfil no **Google Meu Negócio** com o
endereço de Lajeado — é o que mais move buscas locais do tipo "suporte de TI em Lajeado".

As áreas autenticadas (`/login`, `/dashboard`, `/admin`) têm `noindex` no HTML e
`Disallow` no robots.txt.

---

## Trocar as imagens do site

Depois do deploy, as imagens são trocadas **pelo painel admin**: `/admin` →
**Configurações do site** → *Enviar imagem*. O upload vai para o bucket público
`site` do Supabase e aparece no site na hora, sem republicar. *Usar padrão* volta
para a imagem versionada no repositório.

Isso exige o passo 1.2b (migration `002_site_imagens.sql`).

As imagens padrão continuam em `public/imagens/` — elas são o que o visitante vê
enquanto um espaço nunca recebeu upload. Detalhes e tamanhos: `public/imagens/LEIA-ME.md`.

---

## Se algo falhar

**Build quebra na Railway** — veja o log. Se acusar módulo não encontrado, o
`package-lock.json` não foi commitado.

**Tela branca com erro de variável** — `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
não foram cadastradas, ou faltou o prefixo `VITE_`. Depois de alterar Variables é
preciso **redeploy** (o valor entra no bundle em build time).

**Login aceita e aparece "Acesso não liberado"** — o usuário existe no Auth mas não
tem linha em `public.profiles`, ou está com `ativo = false`. A tela oferece
*Tentar novamente*, *Sair da conta* e *Voltar ao site* — ninguém fica preso na sessão.

**"Banco de dados ainda não configurado"** — o script SQL do passo 1.2 não foi
executado nesse projeto do Supabase.

**Cliente não vê nada** — o perfil dele precisa de `empresa_id` preenchido.

**A landing aparece no lugar do painel (ou o contrário)** — o roteamento vive em dois
lugares: `vite.config.js` (dev) e `server.js` (produção). `/` responde
`dist/index.html`; qualquer outra rota responde `dist/app.html`.

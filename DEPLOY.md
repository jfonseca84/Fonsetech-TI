# Deploy — GitHub → Railway → Supabase

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
2. **Variables** → adicione apenas estas duas:

   | Variável | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL do Supabase |
   | `VITE_SUPABASE_ANON_KEY` | chave `anon public` |

   Opcional: `NODE_ENV=production`.
   Não cadastre `PORT` (a Railway injeta), nem `SUPABASE_SERVICE_ROLE_KEY`,
   nem `DATABASE_URL` — nada neste projeto as usa.

3. O deploy roda sozinho lendo o `railway.json`:
   build `npm ci && npm run build` · start `npm run start` · healthcheck `/healthz`.
4. **Settings → Networking → Generate Domain**.
5. Volte ao **Supabase → Authentication → URL Configuration** e cadastre o domínio
   gerado em *Site URL* e em *Redirect URLs*. Sem isso, a recuperação de senha não
   volta para o app.

---

## 5. Verificação em produção

```bash
curl https://<seu-dominio>.up.railway.app/healthz     # {"ok":true}
curl -I https://<seu-dominio>.up.railway.app/design/  # 404 (protótipos bloqueados)
```

No navegador:

- `/` abre a landing page pública
- `/login` carrega e autentica
- `/admin` abre a visão geral; recarregar não dá 404
- crie um usuário cliente vinculado a uma empresa e confirme que ele **não** enxerga
  dados de outra empresa — esse é o teste que valida o RLS

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

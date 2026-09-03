# Deploy — GitHub → Railway → Supabase

Ordem obrigatória: **Supabase primeiro** (o app não sobe sem banco), depois GitHub, depois Railway.

---

## 1. Supabase (10 min)

1. Crie o projeto em supabase.com — região São Paulo se disponível. Guarde a senha do banco.
2. **SQL Editor** → execute nesta ordem, um por vez:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_storage.sql`
3. **Authentication → Providers → Email**: mantenha habilitado e **desative "Enable email signup"**
   (não existe cadastro público neste sistema).
4. **Authentication → Users → Add user**: crie o seu acesso de administrador.
5. **SQL Editor** — vincule o perfil (troque o UUID pelo do usuário criado):

   ```sql
   insert into public.profiles (id, nome, role, ativo)
   values ('<uuid-do-usuario>', 'Seu Nome', 'admin', true);
   ```

6. **Settings → API**: copie `Project URL` e `anon public`. São os dois valores que a Railway precisa.

> Não copie a `service_role`. Ela não é usada por este frontend.

---

## 2. Validação local (antes de subir)

```bash
npm install
npm run check:secrets     # precisa terminar sem [FALHA]
npm run build             # precisa gerar dist/ sem erro
npm run start             # http://localhost:8080
```

Crie o `.env` a partir do `.env.example` para o teste local funcionar
(`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).

Abra `/login`, entre com o usuário criado e confirme que cai em `/admin`.

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
2. **Variables** → adicione as cinco:

   | Variável | Valor |
   |---|---|
   | `SUPABASE_URL` | Project URL do Supabase |
   | `SUPABASE_ANON_KEY` | chave anon public |
   | `VITE_SUPABASE_URL` | **mesmo** valor de SUPABASE_URL |
   | `VITE_SUPABASE_ANON_KEY` | **mesmo** valor de SUPABASE_ANON_KEY |
   | `NODE_ENV` | `production` |

   Não cadastre `PORT` (a Railway injeta) nem `SUPABASE_SERVICE_ROLE_KEY`
   (nenhum código deste projeto a usa).

3. O deploy roda sozinho lendo o `railway.json`:
   build `npm ci && npm run build` · start `npm run start` · healthcheck `/healthz`.
4. **Settings → Networking → Generate Domain**.
5. Volte ao **Supabase → Authentication → URL Configuration** e cadastre o domínio
   gerado em *Site URL* e em *Redirect URLs*. Sem isso, a recuperação de senha não volta para o app.

---

## 5. Verificação em produção

```bash
curl https://<seu-dominio>.up.railway.app/healthz     # {"ok":true}
curl -I https://<seu-dominio>.up.railway.app/design/  # 404 (protótipos bloqueados)
```

No navegador:

- `/login` carrega e autentica
- `/admin` abre a visão geral; recarregar a página não dá 404 (fallback de SPA)
- crie um usuário cliente vinculado a uma empresa e confirme que ele **não** enxerga
  dados de outra empresa — esse é o teste que valida o RLS

---

## Se algo falhar

**Build quebra na Railway** — veja o log. Se acusar módulo não encontrado, o
`package-lock.json` não foi commitado.

**Tela branca com erro de variável** — as quatro variáveis `SUPABASE_*`/`VITE_*`
não foram cadastradas, ou faltou o prefixo `VITE_` nas duas do frontend.
Depois de alterar Variables é preciso **redeploy** (o valor entra no bundle em build time).

**Login aceita mas cai de volta no /login** — o usuário existe no Auth mas não
tem linha em `public.profiles`, ou está com `ativo = false`.

**Cliente não vê nada** — o perfil dele precisa de `empresa_id` preenchido.
Cliente sem empresa é bloqueado pelo RLS por definição.

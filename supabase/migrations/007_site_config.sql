-- =====================================================================
-- 007_site_config.sql
-- Configuracoes simples de texto do site publico (chave/valor), editaveis
-- pelo painel admin — hoje usada para a URL do video de apresentacao do
-- FonseDesk (botao "Conhecer a plataforma"), mas serve para qualquer
-- outro texto/URL configuravel no futuro sem precisar de nova migration.
--
-- Mesmo padrao de site_imagens (002): leitura publica (a landing e
-- estatica e le pela API com a anon key), escrita so admin.
--
-- Idempotente, sem DROP nem DELETE.
-- =====================================================================

create table if not exists public.site_config (
  chave         text primary key,
  valor         text,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references public.profiles(id) on delete set null
);

alter table public.site_config enable row level security;

drop policy if exists site_config_leitura_publica on public.site_config;
create policy site_config_leitura_publica on public.site_config
  for select to anon, authenticated
  using (true);

drop policy if exists site_config_admin on public.site_config;
create policy site_config_admin on public.site_config
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

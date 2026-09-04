-- =====================================================================
-- FONSETECH - 002_site_imagens.sql
-- Imagens da landing page trocadas pelo painel admin ("Configuracoes do site").
--
-- Idempotente e nao destrutivo. Execute depois do 001_setup_completo.sql.
-- =====================================================================

-- Registro de qual arquivo esta em cada espaco da landing.
-- A landing e publica: a leitura desta tabela tambem e (anon), a escrita e so admin.
create table if not exists public.site_imagens (
  slug          text primary key,
  arquivo_path  text not null,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references public.profiles(id) on delete set null
);

alter table public.site_imagens enable row level security;

-- visitante nao logado precisa ler para a landing montar as imagens
drop policy if exists site_imagens_leitura_publica on public.site_imagens;
create policy site_imagens_leitura_publica on public.site_imagens
  for select to anon, authenticated
  using (true);

drop policy if exists site_imagens_admin on public.site_imagens;
create policy site_imagens_admin on public.site_imagens
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- ---------------------------------------------------------------------
-- Bucket PUBLICO (ao contrario de "materiais"): sao imagens de um site
-- aberto, servidas direto pelo CDN do Supabase, sem URL assinada.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site', 'site', true)
on conflict (id) do update set public = true;

drop policy if exists site_storage_leitura_publica on storage.objects;
create policy site_storage_leitura_publica on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site');

drop policy if exists site_storage_admin on storage.objects;
create policy site_storage_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'site' and public.eh_admin())
  with check (bucket_id = 'site' and public.eh_admin());

-- Nenhum dado inicial: enquanto um slug nao tiver linha aqui, a landing usa
-- a imagem versionada em public/imagens/ como padrao.

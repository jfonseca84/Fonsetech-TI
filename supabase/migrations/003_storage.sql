-- =====================================================================
-- 003_storage.sql
-- Bucket privado para as apostilas (PDF/PPT) da aba Cursos.
-- Downloads de programas usam link do Google Drive (link_externo),
-- portanto não passam pelo Storage.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('materiais', 'materiais', false)
on conflict (id) do nothing;

-- Admin gerencia os arquivos
create policy materiais_storage_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'materiais' and public.eh_admin())
  with check (bucket_id = 'materiais' and public.eh_admin());

-- Cliente lê apenas arquivos de materiais publicados e liberados para sua empresa.
-- No frontend, gere URL assinada:
--   supabase.storage.from('materiais').createSignedUrl(path, 3600)
create policy materiais_storage_cliente_le on storage.objects
  for select to authenticated
  using (
    bucket_id = 'materiais'
    and exists (
      select 1 from public.materiais m
      where m.arquivo_path = storage.objects.name
        and m.publicado
        and (
          not exists (select 1 from public.material_empresas me where me.material_id = m.id)
          or exists (
            select 1 from public.material_empresas me
            where me.material_id = m.id and me.empresa_id = public.minha_empresa()
          )
        )
    )
  );

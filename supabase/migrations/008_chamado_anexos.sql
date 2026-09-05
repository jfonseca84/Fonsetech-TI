-- =====================================================================
-- 008_chamado_anexos.sql
-- Anexos de arquivo nos chamados: o cliente pode anexar arquivos (print de
-- erro, foto do equipamento, log) ao abrir um chamado. Bucket privado —
-- assim como "materiais", o acesso e sempre por URL assinada, nunca publico.
--
-- Idempotente, sem DROP nem DELETE.
-- =====================================================================

create table if not exists public.chamado_anexos (
  id            uuid primary key default gen_random_uuid(),
  chamado_id    uuid not null references public.chamados(id) on delete cascade,
  arquivo_path  text not null,
  nome_original text not null,
  tamanho       bigint,
  tipo          text,
  enviado_por   uuid references public.profiles(id) on delete set null,
  criado_em     timestamptz not null default now()
);

create index if not exists chamado_anexos_chamado_idx on public.chamado_anexos(chamado_id);

alter table public.chamado_anexos enable row level security;

drop policy if exists chamado_anexos_admin on public.chamado_anexos;
create policy chamado_anexos_admin on public.chamado_anexos
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists chamado_anexos_cliente_le on public.chamado_anexos;
create policy chamado_anexos_cliente_le on public.chamado_anexos
  for select to authenticated
  using (exists (
    select 1 from public.chamados c
    where c.id = chamado_id and c.empresa_id = public.minha_empresa()
  ));

-- Cliente so anexa em chamado da propria empresa, e assina como quem enviou.
drop policy if exists chamado_anexos_cliente_envia on public.chamado_anexos;
create policy chamado_anexos_cliente_envia on public.chamado_anexos
  for insert to authenticated
  with check (
    enviado_por = auth.uid()
    and exists (
      select 1 from public.chamados c
      where c.id = chamado_id and c.empresa_id = public.minha_empresa()
    )
  );

-- ---------------------------------------------------------------------
-- STORAGE: bucket privado, um path por chamado (chamado_id/arquivo).
-- storage.foldername(name)[1] e o primeiro segmento do caminho, usado
-- para achar a que chamado (e portanto a que empresa) o arquivo pertence
-- — mesmo padrao ja usado no bucket "materiais" (migration 001).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chamados-anexos', 'chamados-anexos', false)
on conflict (id) do nothing;

drop policy if exists chamados_anexos_storage_admin on storage.objects;
create policy chamados_anexos_storage_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'chamados-anexos' and public.eh_admin())
  with check (bucket_id = 'chamados-anexos' and public.eh_admin());

drop policy if exists chamados_anexos_storage_cliente_le on storage.objects;
create policy chamados_anexos_storage_cliente_le on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chamados-anexos'
    and exists (
      select 1 from public.chamados c
      where c.id::text = (storage.foldername(name))[1]
        and c.empresa_id = public.minha_empresa()
    )
  );

drop policy if exists chamados_anexos_storage_cliente_envia on storage.objects;
create policy chamados_anexos_storage_cliente_envia on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chamados-anexos'
    and exists (
      select 1 from public.chamados c
      where c.id::text = (storage.foldername(name))[1]
        and c.empresa_id = public.minha_empresa()
    )
  );

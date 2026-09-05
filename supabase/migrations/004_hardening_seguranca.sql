-- =====================================================================
-- 004_hardening_seguranca.sql
-- Auditoria de seguranca pos-migration 003 (multitenant/CRM/financeiro):
--   1. Cifragem da senha de acesso remoto (pendencia ja conhecida)
--   2. Empresas: cliente conseguia sobrescrever campos internos/financeiros
--      via UPDATE direto (RLS so validava o "id", nao as colunas)
--   3. Auditoria: qualquer autenticado podia inserir log em nome de outro
--      usuario (usuario_id/usuario_nome vinham do proprio corpo da requisicao)
--
-- Idempotente, sem DROP TABLE/TYPE nem DELETE. Execute apos 001, 002 e 003.
-- =====================================================================

-- =====================================================================
-- Cifragem da senha de acesso remoto (Pendencia #2 do README)
-- =====================================================================
-- maquinas_acesso_remoto.senha_cifrada e bytea desde a migration 001, mas
-- nenhuma rota gravava ou lia esse campo: a senha so podia ser inserida
-- manualmente, ja cifrada, direto no SQL Editor. Este script adiciona o
-- par cifrar/decifrar via pgcrypto (ja habilitado na 001) com a chave
-- guardada no Vault do Supabase — nunca em codigo, nunca no bundle do
-- navegador — e duas RPCs que o admin usa para gravar e para revelar a
-- senha sob demanda, sem que ela apareça em nenhum select* da tabela.
--
-- Idempotente: pode ser executado de novo sem duplicar a chave nem
-- recriar objetos com erro.
-- =====================================================================

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'acesso_remoto_chave') then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'acesso_remoto_chave',
      'Chave simetrica para cifrar/decifrar maquinas_acesso_remoto.senha_cifrada'
    );
  end if;
end $$;

create or replace function public.cifrar_acesso_remoto(p_senha text)
returns bytea
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_chave text;
begin
  if p_senha is null or p_senha = '' then
    return null;
  end if;
  select decrypted_secret into v_chave from vault.decrypted_secrets where name = 'acesso_remoto_chave';
  return pgp_sym_encrypt(p_senha, v_chave);
end;
$$;

create or replace function public.decifrar_acesso_remoto(p_cifrado bytea)
returns text
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_chave text;
begin
  if p_cifrado is null then
    return null;
  end if;
  select decrypted_secret into v_chave from vault.decrypted_secrets where name = 'acesso_remoto_chave';
  return pgp_sym_decrypt(p_cifrado, v_chave);
end;
$$;

-- RPC usada pelo admin para criar/atualizar o acesso remoto ja cifrado
-- no mesmo passo — a senha em texto puro nunca fica gravada na tabela.
create or replace function public.salvar_acesso_remoto(
  p_maquina_id  uuid,
  p_ferramenta  text,
  p_host        text,
  p_login       text,
  p_senha       text,
  p_observacoes text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem gravar acesso remoto.';
  end if;

  insert into public.maquinas_acesso_remoto (maquina_id, ferramenta, host, login, senha_cifrada, observacoes, atualizado_em)
  values (
    p_maquina_id, coalesce(p_ferramenta, 'AnyDesk'), p_host, p_login,
    public.cifrar_acesso_remoto(p_senha), p_observacoes, now()
  )
  on conflict (maquina_id) do update set
    ferramenta    = excluded.ferramenta,
    host          = excluded.host,
    login         = excluded.login,
    -- Sem nova senha no update, mantem a que ja estava cifrada.
    senha_cifrada = coalesce(excluded.senha_cifrada, public.maquinas_acesso_remoto.senha_cifrada),
    observacoes   = excluded.observacoes,
    atualizado_em = now();
end;
$$;

-- RPC para o admin revelar a senha sob demanda (nunca em select* da tabela).
create or replace function public.obter_senha_acesso_remoto(p_maquina_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cifrado bytea;
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem ver a senha de acesso remoto.';
  end if;
  select senha_cifrada into v_cifrado from public.maquinas_acesso_remoto where maquina_id = p_maquina_id;
  return public.decifrar_acesso_remoto(v_cifrado);
end;
$$;

revoke all on function public.cifrar_acesso_remoto(text)                              from public, anon;
revoke all on function public.decifrar_acesso_remoto(bytea)                           from public, anon;
revoke all on function public.salvar_acesso_remoto(uuid, text, text, text, text, text) from public, anon;
revoke all on function public.obter_senha_acesso_remoto(uuid)                         from public, anon;

-- cifrar/decifrar sao usadas apenas internamente pelas duas RPCs acima
-- (security definer), por isso nem authenticated precisa de execute nelas.
grant execute on function public.salvar_acesso_remoto(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.obter_senha_acesso_remoto(uuid)                         to authenticated;

-- =====================================================================
-- EMPRESAS: cliente nao pode alterar campos internos/financeiros
-- =====================================================================
-- A policy "empresas_cliente_edita" (001) so verifica `id = minha_empresa()`.
-- RLS filtra LINHAS, nao colunas — nada impedia um UPDATE manual (fora da
-- tela "Minha empresa", ex.: requisicao montada no F12/devtools com a
-- mesma sessao) de alterar plano, valor_mensal, situacao_financeira,
-- condicoes_comerciais ou ate obs_internas (anotacoes do admin sobre o
-- proprio cliente). Este trigger devolve ao valor anterior qualquer campo
-- fora da lista que a tela realmente edita, sempre que quem esta gravando
-- nao e admin — funciona mesmo que a policy de RLS nunca seja revisada de
-- novo quando uma coluna nova for adicionada.
create or replace function public.protege_campos_empresa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.eh_admin() then
    return new;
  end if;

  -- Campos que a tela "Minha empresa" (src/telas/cliente/MinhaEmpresa.jsx)
  -- efetivamente edita ficam como o cliente enviou; todo o resto volta ao
  -- valor anterior, mesmo que tenha chegado um valor diferente no payload.
  new.nome_fantasia        := old.nome_fantasia;
  new.inscricao_estadual   := old.inscricao_estadual;
  new.whatsapp             := old.whatsapp;
  new.site                 := old.site;
  new.cep                  := old.cep;
  new.cidade               := old.cidade;
  new.estado               := old.estado;
  new.responsavel_nome     := old.responsavel_nome;
  new.responsavel_cargo    := old.responsavel_cargo;
  new.responsavel_email    := old.responsavel_email;
  new.responsavel_whatsapp := old.responsavel_whatsapp;
  new.observacoes          := old.observacoes;
  new.status_cliente       := old.status_cliente;
  new.inicio_contrato      := old.inicio_contrato;
  new.renovacao_contrato   := old.renovacao_contrato;
  new.valor_mensal         := old.valor_mensal;
  new.condicoes_comerciais := old.condicoes_comerciais;
  new.obs_internas         := old.obs_internas;
  new.situacao_financeira  := old.situacao_financeira;
  new.plano                := old.plano;
  new.ativo                := old.ativo;
  new.criado_em            := old.criado_em;

  return new;
end;
$$;

drop trigger if exists t_empresas_protege on public.empresas;
create trigger t_empresas_protege before update on public.empresas
  for each row execute function public.protege_campos_empresa();

-- =====================================================================
-- AUDITORIA: impede que um cliente registre um evento em nome de outro
-- usuario ou de outra empresa
-- =====================================================================
-- A policy "auditoria_inserir_autenticado" (003) aceita `with check (true)`:
-- usuario_id/usuario_nome/empresa_id vinham inteiramente do corpo da
-- requisicao (registrarAuditoria() em src/dados/consultas.js nem envia
-- usuario_id hoje). Este trigger preenche esses tres campos a partir da
-- sessao autenticada, sobrescrevendo qualquer valor que tenha chegado no
-- INSERT — o cliente continua podendo registrar seus proprios eventos,
-- mas nunca assinando como outra pessoa.
create or replace function public.preenche_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.usuario_id   := auth.uid();
  new.usuario_nome := coalesce((select nome from public.profiles where id = auth.uid()), 'Sistema');
  if not public.eh_admin() then
    new.empresa_id := public.minha_empresa();
  end if;
  return new;
end;
$$;

drop trigger if exists t_auditoria_preenche on public.auditoria_logs;
create trigger t_auditoria_preenche before insert on public.auditoria_logs
  for each row execute function public.preenche_auditoria();

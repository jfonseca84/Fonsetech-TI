-- =====================================================================
-- 006_login_clientes.sql
-- Conserta e completa o cadastro de login para usuarios de uma empresa
-- (aba Clientes > perfil da empresa > "Novo usuario", e o convite de
-- colaborador em "Minha empresa" do lado do cliente). Depende da
-- migration 005 (papel 'cliente_admin') ja commitada. Dois problemas
-- represados desde a evolucao multitenant (migration 003):
--
-- 1. profiles.email / .cargo / .whatsapp nunca existiram na tabela —
--    listarUsuariosEmpresa() e criarUsuarioEmpresa() (src/dados/consultas.js)
--    ja liam/gravavam essas colunas, entao qualquer uso falhava com
--    "column profiles.email does not exist". A constraint
--    cliente_tem_empresa tambem precisa aceitar 'cliente_admin'.
-- 2. Criar so a linha em "profiles" nunca criou um LOGIN de verdade: sem
--    um usuario em auth.users com senha, ninguem consegue entrar. Isso so
--    pode ser feito com a service_role key, nunca pelo navegador — dai a
--    RPC abaixo, chamada pela rota /api/admin/criar-usuario (server.js)
--    que ja roda com essa chave.
--
-- Idempotente, sem DROP nem DELETE.
-- =====================================================================

alter table public.profiles
  add column if not exists email citext,
  add column if not exists cargo text,
  add column if not exists whatsapp text;

-- A constraint original so admitia 'cliente' (com empresa) ou 'admin'
-- (sem empresa) — 'cliente_admin' e uma variante de cliente, tambem
-- precisa de empresa_id.
alter table public.profiles drop constraint if exists cliente_tem_empresa;
alter table public.profiles add constraint cliente_tem_empresa
  check ((role in ('cliente', 'cliente_admin') and empresa_id is not null) or (role = 'admin'));

-- O admin ja podia editar nome/telefone via profiles_admin_total (for all).
-- Os clientes continuam sem conseguir ver/alterar email/cargo/whatsapp de
-- outros perfis fora as policies ja existentes (profiles_proprio,
-- profiles_mesma_empresa) — nenhuma policy nova necessaria aqui.

-- ---------------------------------------------------------------------
-- RPC usada pela rota de servidor para vincular o perfil ao usuario recem
-- criado no Supabase Auth (a criacao do login em si acontece via
-- auth.admin.createUser, que so a service_role pode chamar).
-- security definer: quem grava e o servidor (com a service_role,
-- que ja ignora RLS), entao esta funcao nao reabre nada para o cliente —
-- so simplifica o insert de um unico lugar auditavel.
-- ---------------------------------------------------------------------
create or replace function public.criar_perfil_cliente(
  p_id         uuid,
  p_nome       text,
  p_email      text,
  p_telefone   text,
  p_whatsapp   text,
  p_cargo      text,
  p_empresa_id uuid,
  p_role       papel_usuario
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, telefone, whatsapp, cargo, empresa_id, role, ativo)
  values (p_id, p_nome, p_email, p_telefone, p_whatsapp, p_cargo, p_empresa_id, coalesce(p_role, 'cliente'), true)
  on conflict (id) do update set
    nome        = excluded.nome,
    email       = excluded.email,
    telefone    = excluded.telefone,
    whatsapp    = excluded.whatsapp,
    cargo       = excluded.cargo,
    empresa_id  = excluded.empresa_id,
    role        = excluded.role,
    atualizado_em = now();
end;
$$;

-- So o servidor chama isto (com a service_role, que ignora grants de
-- authenticated/anon de qualquer forma) — revoga de todo mundo por clareza.
revoke all on function public.criar_perfil_cliente(uuid, text, text, text, text, text, uuid, papel_usuario) from public, anon, authenticated;

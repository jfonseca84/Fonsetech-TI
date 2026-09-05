-- =====================================================================
-- 005_papel_cliente_admin.sql
-- Adiciona o papel 'cliente_admin' ("Admin da Empresa") ao enum
-- papel_usuario. E usado em Clientes.jsx, PerfilEmpresa360.jsx e
-- MinhaEmpresa.jsx, mas o enum (migration 001) so tinha 'cliente' e
-- 'admin' — gravar 'cliente_admin' sempre estourava "invalid input
-- value for enum papel_usuario".
--
-- Isolado em migration propria de proposito: o Postgres nao deixa usar
-- um valor de enum novo na MESMA transacao em que ele foi criado
-- (SQLSTATE 55P04, "unsafe use of new value of enum type"). Como
-- qualquer runner de migration (Supabase CLI, a integracao do GitHub, o
-- "Run" do SQL Editor colando o arquivo inteiro) roda cada arquivo como
-- uma unica transacao, o valor novo so pode ser referenciado (constraint,
-- coluna, RPC) em um arquivo seguinte — daqui a 006_login_clientes.sql.
--
-- Idempotente, sem DROP nem DELETE.
-- =====================================================================

alter type papel_usuario add value if not exists 'cliente_admin';

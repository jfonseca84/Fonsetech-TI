-- =====================================================================
-- seed.sql - dados de desenvolvimento (NAO rodar em producao)
-- Espelha os dados do protótipo para validar as telas.
--
-- Os usuários devem ser criados antes no Supabase Auth (painel ou CLI),
-- pois profiles.id referencia auth.users(id). Depois substitua os UUIDs.
-- =====================================================================

insert into public.empresas (id, razao_social, cnpj, endereco, email, telefone, tem_ti_interno, gerente_geral, diretor, plano)
values
  ('11111111-1111-1111-1111-111111111111', 'Ribeiro Comércio Ltda', '12.345.678/0001-90',
   'Av. Paulista, 1420 - Sala 12', 'marina@empresa.com.br', '(11) 98888-1234', false,
   'Marina Ribeiro', 'Ricardo Ribeiro', 'Profissional'),
  ('22222222-2222-2222-2222-222222222222', 'Alves Logística ME', '23.456.789/0001-01',
   'Rod. Anhanguera, km 32', 'diego@alveslog.com.br', '(11) 97777-2345', true,
   'Diego Alves', 'Sônia Alves', 'Avançado'),
  ('33333333-3333-3333-3333-333333333333', 'Mendes Soluções', '34.567.890/0001-12',
   'Rua das Palmeiras, 88', 'carlos@mendessol.com.br', '(11) 96666-3456', false,
   'Carlos Mendes', 'Carlos Mendes', 'Profissional')
on conflict (id) do nothing;

update public.empresas
   set tem_ti_interno = true, responsavel_ti = 'Bruno Alves'
 where id = '22222222-2222-2222-2222-222222222222';

-- MÁQUINAS
insert into public.maquinas (empresa_id, nome, usuario, setor, modelo, cpu, memoria, disco, sistema, rede, ip, mascara, gateway, dns)
values
  ('11111111-1111-1111-1111-111111111111', 'Máquina 06', 'João Ferreira', 'Comercial',
   'Dell OptiPlex 3090', 'Intel i5-11400', '16 GB', 'SSD 512 GB', 'Windows 11 Pro',
   'Estático', '192.168.0.106', '255.255.255.0', '192.168.0.1', '8.8.8.8 / 1.1.1.1'),
  ('11111111-1111-1111-1111-111111111111', 'Máquina 07', 'Camila Prado', 'Financeiro',
   'Lenovo ThinkCentre M70q', 'Intel i3-12100', '8 GB', 'SSD 256 GB', 'Windows 11 Pro',
   'DHCP', null, null, '192.168.0.1', 'Automático'),
  ('11111111-1111-1111-1111-111111111111', 'Notebook 02', 'Ricardo Ribeiro', 'Diretoria',
   'Dell Latitude 5440', 'Intel i7-1355U', '32 GB', 'SSD 1 TB', 'Windows 11 Pro',
   'DHCP', null, null, '192.168.0.1', 'Automático'),
  ('11111111-1111-1111-1111-111111111111', 'Servidor ARQ-01', 'Compartilhado', 'Infraestrutura',
   'Dell PowerEdge T150', 'Xeon E-2314', '32 GB', '2 x SSD 960 GB RAID 1', 'Windows Server 2022',
   'Estático', '192.168.0.10', '255.255.255.0', '192.168.0.1', '192.168.0.10 / 8.8.8.8'),
  ('22222222-2222-2222-2222-222222222222', 'Máquina 01', 'Diego Alves', 'Operações',
   'HP ProDesk 400 G9', 'Intel i5-12500', '16 GB', 'SSD 512 GB', 'Windows 11 Pro',
   'Estático', '10.0.1.21', '255.255.255.0', '10.0.1.1', '10.0.1.2 / 8.8.8.8'),
  ('33333333-3333-3333-3333-333333333333', 'Servidor ERP', 'Compartilhado', 'Infraestrutura',
   'Lenovo ThinkSystem ST50', 'Xeon E-2224', '64 GB', '2 x SSD 1 TB RAID 1', 'Ubuntu Server 24.04',
   'Estático', '172.16.4.5', '255.255.0.0', '172.16.0.1', '172.16.0.2')
on conflict (empresa_id, nome) do nothing;

-- MATERIAIS - Cursos (arquivo_path preenchido após upload no Storage)
insert into public.materiais (tipo, titulo, descricao, categoria, nivel, paginas, publicado)
values
  ('pdf', 'Boas práticas de senhas e acessos', 'Como criar senhas fortes, usar gerenciador e ativar verificação em duas etapas.', 'Segurança', 'Básico', 18, false),
  ('pdf', 'Reconhecendo golpes e e-mails falsos', 'Sinais de phishing, links suspeitos e o que fazer ao receber uma mensagem duvidosa.', 'Segurança', 'Básico', 24, false),
  ('ppt', 'Treinamento de segurança para equipes', 'Apresentação usada nos treinamentos presenciais, pronta para exibir em reunião.', 'Segurança', 'Básico', 34, false),
  ('pdf', 'Guia do backup na rotina da empresa', 'O que precisa ser copiado, com que frequência e como validar se o backup funcionou.', 'Infraestrutura', 'Intermediário', 32, false),
  ('ppt', 'Panorama da infraestrutura de TI', 'Slides que explicam servidores, rede e nuvem em linguagem de negócio.', 'Infraestrutura', 'Intermediário', 28, false),
  ('pdf', 'Primeiros socorros de rede e Wi-Fi', 'Testes simples antes de abrir um chamado: cabos, reinício de equipamentos e velocidade.', 'Redes', 'Básico', 21, false),
  ('pdf', 'Trabalho remoto com VPN', 'Como conectar, boas práticas em redes públicas e solução dos erros mais comuns.', 'Redes', 'Intermediário', 27, false),
  ('pdf', 'Organizando arquivos em pastas compartilhadas', 'Padrão de nomes, permissões por setor e o que nunca deve ficar na área de trabalho.', 'Produtividade', 'Básico', 16, false),
  ('ppt', 'Produtividade no pacote Office', 'Atalhos e recursos pouco usados que economizam tempo no dia a dia.', 'Produtividade', 'Básico', 22, false);

-- MATERIAIS - Downloads (link_externo = pasta/arquivo no Google Drive)
insert into public.materiais (tipo, titulo, descricao, categoria, versao, tamanho, sistema, destaque, publicado)
values
  ('programa', 'AnyDesk', 'Acesso remoto usado pela nossa equipe durante o atendimento.', 'Suporte remoto', '8.1', '4,2 MB', 'Windows', true, false),
  ('programa', 'Agente de Monitoramento Fonsetech', 'Coleta indicadores da máquina e abre alertas automáticos de falha.', 'Monitoramento', '2.4', '11,8 MB', 'Windows', true, false),
  ('programa', 'Cliente VPN configurado', 'Instalador já com o perfil da sua empresa aplicado.', 'Redes', '5.0', '18,5 MB', 'Windows', false, false),
  ('programa', 'Ferramenta de Backup Local', 'Rotina de cópia para HD externo, com agendamento diário.', 'Backup', '3.2', '9,1 MB', 'Windows', false, false),
  ('programa', 'Kit de Diagnóstico', 'Conjunto de utilitários para testar disco, memória e temperatura.', 'Diagnóstico', '1.7', '26,4 MB', 'Windows', false, false),
  ('programa', 'Leitor de PDF corporativo', 'Leitor licenciado para assinatura digital de documentos.', 'Produtividade', '24.2', '142 MB', 'Windows / macOS', false, false);

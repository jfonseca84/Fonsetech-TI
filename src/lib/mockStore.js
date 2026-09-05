// Mock data store espelhando o seed.sql e os schemas para o FonseDesk funcionar
// sem conexão ativa com o Supabase quando as variáveis de ambiente não forem informadas.

const PLANOS_INICIAIS = [
  {
    id: 'plano-1',
    nome: 'Básico',
    descricao: 'Suporte essencial para escritórios e microempresas com computadores locais.',
    valor_mensal: 299.00,
    valor_anual: 2990.00,
    franquia_atendimentos: 'Até 5 chamados remotos / mês',
    servicos_incluidos: ['Suporte remoto N1 e N2', 'Horário comercial', 'Verificação de backup em nuvem'],
    servicos_adicionais: 'Visita presencial R$ 150/h',
    beneficios: 'Acesso completo ao FonseDesk e central de chamados',
    status: 'Ativo'
  },
  {
    id: 'plano-2',
    nome: 'Profissional',
    descricao: 'Gestão completa de TI, antivírus gerenciado e suporte com visita mensal inclusa.',
    valor_mensal: 599.00,
    valor_anual: 5990.00,
    franquia_atendimentos: 'Até 15 chamados / mês + 1 visita preventiva inclusa',
    servicos_incluidos: ['Suporte remoto ilimitado', '1 visita técnica presencial/mês', 'Gestão de antivírus e firewall', 'Inventário e monitoramento de rede'],
    servicos_adicionais: 'Visita excedente com 30% de desconto',
    beneficios: 'Acesso ao catálogo de cursos e treinamentos Fonsetech',
    status: 'Ativo'
  },
  {
    id: 'plano-3',
    nome: 'Premium',
    descricao: 'Gestão de infraestrutura crítica, suporte com SLA prioritário e visitas emergenciais.',
    valor_mensal: 999.00,
    valor_anual: 9990.00,
    franquia_atendimentos: 'Chamados ilimitados + 3 visitas mensais',
    servicos_incluidos: ['Plantão 24/7 para emergências', 'Visitas presenciais ilimitadas para incidentes', 'Consultoria mensal de segurança', 'Gerenciamento de servidores e links'],
    servicos_adicionais: 'Consultoria de novos projetos inclusa',
    beneficios: 'Acesso VIP a todos os cursos, downloads e SLA de 1 hora',
    status: 'Ativo'
  }
];

const EMPRESAS_INICIAIS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    razao_social: 'Ribeiro Comércio de Alimentos Ltda',
    nome_fantasia: 'Supermercados Ribeiro',
    cnpj: '12.345.678/0001-90',
    inscricao_estadual: '078/1234567',
    endereco: 'Rua Júlio de Castilhos, 1420 - Centro',
    cep: '95900-000',
    cidade: 'Lajeado',
    estado: 'RS',
    email: 'marina@empresa.com.br',
    telefone: '(51) 3714-1234',
    whatsapp: '(51) 98888-1234',
    site: 'https://ribeiroalimentos.com.br',
    responsavel_nome: 'Marina Ribeiro',
    responsavel_cargo: 'Gerente Administrativa',
    responsavel_email: 'marina@empresa.com.br',
    responsavel_whatsapp: '(51) 98888-1234',
    tem_ti_interno: false,
    responsavel_ti: null,
    gerente_geral: 'Marina Ribeiro',
    diretor: 'Ricardo Ribeiro',
    plano: 'Profissional',
    status_cliente: 'Ativo',
    inicio_contrato: '2025-01-10',
    renovacao_contrato: '2027-01-10',
    valor_mensal: 599.00,
    condicoes_comerciais: 'Vencimento todo dia 10 via boleto bancário.',
    obs_internas: 'Cliente estratégico no centro de Lajeado. Preferem visitas técnicas no período da manhã.',
    situacao_financeira: 'Em dia',
    ativo: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    razao_social: 'Alves Logística e Transportes ME',
    nome_fantasia: 'Alves Express Log',
    cnpj: '23.456.789/0001-01',
    inscricao_estadual: '078/9876543',
    endereco: 'Rodovia RS-130, km 72 - Bairro Florestal',
    cep: '95901-450',
    cidade: 'Lajeado',
    estado: 'RS',
    email: 'diego@alveslog.com.br',
    telefone: '(51) 3748-2345',
    whatsapp: '(51) 97777-2345',
    site: 'https://alveslogistica.com.br',
    responsavel_nome: 'Diego Alves',
    responsavel_cargo: 'Diretor de Operações',
    responsavel_email: 'diego@alveslog.com.br',
    responsavel_whatsapp: '(51) 97777-2345',
    tem_ti_interno: true,
    responsavel_ti: 'Bruno Alves',
    gerente_geral: 'Diego Alves',
    diretor: 'Sônia Alves',
    plano: 'Premium',
    status_cliente: 'Ativo',
    inicio_contrato: '2024-06-15',
    renovacao_contrato: '2026-06-15',
    valor_mensal: 999.00,
    condicoes_comerciais: 'Vencimento dia 05 via Pix/Boleto.',
    obs_internas: 'Frota de caminhões com rastreadores e servidores locais. Requer monitoramento 24 horas.',
    situacao_financeira: 'Em atraso',
    ativo: true
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    razao_social: 'Mendes Soluções em Engenharia',
    nome_fantasia: 'Mendes Engenharia',
    cnpj: '34.567.890/0001-12',
    inscricao_estadual: 'Isento',
    endereco: 'Av. Benjamin Constant, 880 - Sala 402',
    cep: '95900-200',
    cidade: 'Lajeado',
    estado: 'RS',
    email: 'carlos@mendessol.com.br',
    telefone: '(51) 3710-3456',
    whatsapp: '(51) 96666-3456',
    site: 'https://mendeseng.com.br',
    responsavel_nome: 'Carlos Mendes',
    responsavel_cargo: 'Engenheiro Sócio',
    responsavel_email: 'carlos@mendessol.com.br',
    responsavel_whatsapp: '(51) 96666-3456',
    tem_ti_interno: false,
    responsavel_ti: null,
    gerente_geral: 'Carlos Mendes',
    diretor: 'Carlos Mendes',
    plano: 'Básico',
    status_cliente: 'Ativo',
    inicio_contrato: '2025-08-01',
    renovacao_contrato: '2026-08-01',
    valor_mensal: 299.00,
    condicoes_comerciais: 'Vencimento dia 20.',
    obs_internas: 'Uso focado em AutoCAD e estações de trabalho de alta performance.',
    situacao_financeira: 'Em dia',
    ativo: true
  }
];

const PERFIS_INICIAIS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nome: 'João Fonseca',
    email: 'admin@fonsetech.com.br',
    telefone: '(51) 99999-8888',
    whatsapp: '(51) 99999-8888',
    role: 'admin',
    cargo: 'Diretor de TI / Suporte',
    ativo: true,
    empresa_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nome: 'Marina Ribeiro',
    email: 'marina@empresa.com.br',
    telefone: '(51) 3714-1234',
    whatsapp: '(51) 98888-1234',
    role: 'cliente_admin',
    cargo: 'Gerente Administrativa',
    ativo: true,
    empresa_id: '11111111-1111-1111-1111-111111111111'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    nome: 'Camila Prado',
    email: 'camila@empresa.com.br',
    telefone: '(51) 98888-5678',
    whatsapp: '(51) 98888-5678',
    role: 'cliente',
    cargo: 'Financeiro',
    ativo: true,
    empresa_id: '11111111-1111-1111-1111-111111111111'
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    nome: 'Diego Alves',
    email: 'diego@alveslog.com.br',
    telefone: '(51) 97777-2345',
    whatsapp: '(51) 97777-2345',
    role: 'cliente_admin',
    cargo: 'Diretor',
    ativo: true,
    empresa_id: '22222222-2222-2222-2222-222222222222'
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    nome: 'Carlos Mendes',
    email: 'carlos@mendessol.com.br',
    telefone: '(51) 96666-3456',
    whatsapp: '(51) 96666-3456',
    role: 'cliente_admin',
    cargo: 'Engenheiro Sócio',
    ativo: true,
    empresa_id: '33333333-3333-3333-3333-333333333333'
  }
];

const MAQUINAS_INICIAIS = [
  {
    id: 'm1111111-0001-0000-0000-000000000001',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    nome: 'Máquina 06',
    usuario: 'João Ferreira',
    setor: 'Comercial',
    modelo: 'Dell OptiPlex 3090',
    cpu: 'Intel i5-11400',
    memoria: '16 GB',
    disco: 'SSD 512 GB',
    sistema: 'Windows 11 Pro',
    rede: 'Estático',
    ip: '192.168.0.106',
    mascara: '255.255.255.0',
    gateway: '192.168.0.1',
    dns: '8.8.8.8 / 1.1.1.1',
    ativo: true
  },
  {
    id: 'm1111111-0002-0000-0000-000000000002',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    nome: 'Máquina 07',
    usuario: 'Camila Prado',
    setor: 'Financeiro',
    modelo: 'Lenovo ThinkCentre M70q',
    cpu: 'Intel i3-12100',
    memoria: '8 GB',
    disco: 'SSD 256 GB',
    sistema: 'Windows 11 Pro',
    rede: 'DHCP',
    ip: null,
    mascara: null,
    gateway: '192.168.0.1',
    dns: 'Automático',
    ativo: true
  },
  {
    id: 'm1111111-0003-0000-0000-000000000003',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    nome: 'Notebook 02',
    usuario: 'Ricardo Ribeiro',
    setor: 'Diretoria',
    modelo: 'Dell Latitude 5440',
    cpu: 'Intel i7-1355U',
    memoria: '32 GB',
    disco: 'SSD 1 TB',
    sistema: 'Windows 11 Pro',
    rede: 'DHCP',
    ip: null,
    mascara: null,
    gateway: '192.168.0.1',
    dns: 'Automático',
    ativo: true
  },
  {
    id: 'm2222222-0001-0000-0000-000000000001',
    empresa_id: '22222222-2222-2222-2222-222222222222',
    nome: 'Máquina 01',
    usuario: 'Diego Alves',
    setor: 'Operações',
    modelo: 'HP ProDesk 400 G9',
    cpu: 'Intel i5-12500',
    memoria: '16 GB',
    disco: 'SSD 512 GB',
    sistema: 'Windows 11 Pro',
    rede: 'DHCP',
    ip: null,
    ativo: true
  }
];

const CHAMADOS_INICIAIS = [
  {
    id: 'c1111111-0001-0000-0000-000000000001',
    numero: 4821,
    titulo: 'Impressora fiscal não responde na Máquina 06',
    categoria: 'Periféricos',
    descricao: 'A impressora Bematech MP-4200 TH parou de imprimir os cupons de venda após a reinicialização do Windows.',
    prioridade: 'Alta',
    status: 'Em andamento',
    aberto_em: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolvido_em: null,
    usuario_equipamento: 'João Ferreira',
    equipamento_livre: true,
    empresa_id: '11111111-1111-1111-1111-111111111111',
    maquina_id: 'm1111111-0001-0000-0000-000000000001',
    responsavel_id: '00000000-0000-0000-0000-000000000001',
    aberto_por: '00000000-0000-0000-0000-000000000002',
    cobranca_tipo: 'incluido_no_plano',
    cobranca_valor: 0.00,
    cobranca_status: 'faz_parte_do_plano'
  },
  {
    id: 'c1111111-0002-0000-0000-000000000002',
    numero: 4819,
    titulo: 'Instalação de novo ponto de rede no almoxarifado',
    categoria: 'Rede',
    descricao: 'Passagem de cabo Cat6 e conectorização de tomada RJ45 para novo terminal.',
    prioridade: 'Média',
    status: 'Concluído',
    aberto_em: new Date(Date.now() - 86400000 * 3).toISOString(),
    resolvido_em: new Date(Date.now() - 86400000 * 2).toISOString(),
    usuario_equipamento: 'Carlos Almoxarifado',
    equipamento_livre: true,
    empresa_id: '11111111-1111-1111-1111-111111111111',
    maquina_id: null,
    responsavel_id: '00000000-0000-0000-0000-000000000001',
    aberto_por: '00000000-0000-0000-0000-000000000002',
    cobranca_tipo: 'servico_adicional',
    cobranca_valor: 180.00,
    cobranca_status: 'em_aberto'
  },
  {
    id: 'c2222222-0001-0000-0000-000000000001',
    numero: 4815,
    titulo: 'Falha no backup em nuvem do servidor de arquivos',
    categoria: 'Segurança',
    descricao: 'Rotina noturna reportou erro de sincronização com o storage secundário.',
    prioridade: 'Urgente',
    status: 'Aberto',
    aberto_em: new Date(Date.now() - 3600000 * 5).toISOString(),
    resolvido_em: null,
    usuario_equipamento: 'Servidor Matriz',
    equipamento_livre: true,
    empresa_id: '22222222-2222-2222-2222-222222222222',
    maquina_id: null,
    responsavel_id: '00000000-0000-0000-0000-000000000001',
    aberto_por: '00000000-0000-0000-0000-000000000004',
    cobranca_tipo: 'incluido_no_plano',
    cobranca_valor: 0.00,
    cobranca_status: 'faz_parte_do_plano'
  }
];

const HISTORICO_INICIAL = [
  {
    id: 'h-1',
    chamado_id: 'c1111111-0001-0000-0000-000000000001',
    autor_id: '00000000-0000-0000-0000-000000000001',
    autor_nome: 'João Fonseca',
    texto: 'Chamado recebido. Técnico conectando remotamente para verificar a fila de spooler e porta USB.',
    interno: false,
    criado_em: new Date(Date.now() - 3600000).toISOString()
  }
];

const AGENDAMENTOS_INICIAIS = [
  {
    id: 'ag-1',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    contato_nome: 'Marina Ribeiro',
    contato_whatsapp: '(51) 98888-1234',
    tipo: 'visita',
    data: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    hora: '09:30',
    duracao_minutos: 90,
    assunto: 'Manutenção preventiva e limpeza física dos servidores',
    endereco: 'Rua Júlio de Castilhos, 1420 - Centro, Lajeado/RS',
    formato: 'Presencial',
    modalidade: 'visita_empresa',
    status: 'confirmado',
    observacoes: 'Acesso liberado na recepção com crachá de prestador.',
    cobranca_tipo: 'incluido_no_plano',
    cobranca_valor: 0.00
  },
  {
    id: 'ag-2',
    empresa_id: '22222222-2222-2222-2222-222222222222',
    contato_nome: 'Diego Alves',
    contato_whatsapp: '(51) 97777-2345',
    tipo: 'visita',
    data: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    hora: '14:00',
    duracao_minutos: 120,
    assunto: 'Revisão de antenas Wi-Fi e link redundante no galpão logístico',
    endereco: 'Rodovia RS-130, km 72 - Bairro Florestal, Lajeado/RS',
    formato: 'Presencial',
    modalidade: 'visita_empresa',
    status: 'agendado',
    observacoes: 'Acompanhar com Bruno da TI interna.',
    cobranca_tipo: 'incluido_no_plano',
    cobranca_valor: 0.00
  },
  {
    id: 'ag-3',
    empresa_id: '33333333-3333-3333-3333-333333333333',
    contato_nome: 'Carlos Mendes',
    contato_whatsapp: '(51) 96666-3456',
    tipo: 'reuniao',
    data: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
    hora: '10:00',
    duracao_minutos: 45,
    assunto: 'Apresentação de projeto para migração de e-mails para Microsoft 365',
    endereco: 'Videoconferência Google Meet',
    formato: 'Remoto',
    modalidade: 'remoto',
    status: 'confirmado',
    observacoes: 'Enviar link da sala com 15 minutos de antecedência.',
    cobranca_tipo: 'incluido_no_plano',
    cobranca_valor: 0.00
  }
];

const MATERIAIS_INICIAIS = [
  {
    id: 'mat-1',
    tipo: 'apostila',
    titulo: 'Segurança da Informação para Empresas: Guia Prático Fonsetech',
    descricao: 'Manual de boas práticas para prevenção de phishing, senhas corporativas fortes e proteção contra ransomware.',
    categoria: 'Segurança',
    nivel: 'Fundamental',
    paginas: 28,
    arquivo_path: 'seguranca-corporativa-fonsetech.pdf',
    link_externo: null,
    versao: '2.4',
    tamanho: '4.8 MB',
    sistema: 'PDF',
    destaque: true,
    publicado: true,
    disponibilidade: 'todas',
    ordem: 1
  },
  {
    id: 'mat-2',
    tipo: 'apresentacao',
    titulo: 'LGPD e Conformidade de Dados em Ambientes de Trabalho',
    descricao: 'Treinamento em slides para colaboradores sobre manipulação de dados de clientes e fornecedores.',
    categoria: 'Treinamento',
    nivel: 'Intermediário',
    paginas: 36,
    arquivo_path: 'treinamento-lgpd-equipes.pptx',
    link_externo: null,
    versao: '1.2',
    tamanho: '12.4 MB',
    sistema: 'PowerPoint',
    destaque: false,
    publicado: true,
    disponibilidade: 'por_plano',
    ordem: 2
  },
  {
    id: 'mat-3',
    tipo: 'software',
    titulo: 'Agente de Suporte Remoto Fonsetech QuickSupport',
    descricao: 'Utilitário leve para permitir que nosso time de especialistas acesse sua máquina com apenas 1 clique quando solicitado.',
    categoria: 'Ferramentas',
    nivel: 'Todos',
    paginas: null,
    arquivo_path: 'Fonsetech-QuickSupport.exe',
    link_externo: 'https://download.anydesk.com',
    versao: '7.1',
    tamanho: '3.9 MB',
    sistema: 'Windows 10/11',
    destaque: true,
    publicado: true,
    disponibilidade: 'todas',
    ordem: 3
  }
];

const CRM_LEADS_INICIAIS = [
  {
    id: 'lead-1',
    nome: 'Dr. Roberto Silveira',
    empresa_nome: 'Clínica Saúde & Vida Lajeado',
    empresa_id: null,
    telefone: '(51) 3714-9988',
    whatsapp: '(51) 99876-5432',
    email: 'roberto@saudevida.med.br',
    origem: 'Indicação',
    servico_interesse: 'Plano Profissional de TI + Backup em Nuvem',
    responsavel_comercial: 'João Fonseca',
    valor_estimado: 750.00,
    probabilidade: 70,
    data_prevista: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    etapa: 'proposta_enviada',
    observacoes: 'Possuem 12 computadores e 2 impressoras em rede. Precisam de suporte ágil entre 07h e 19h.',
    historico: [
      { data: '2026-08-28', texto: 'Primeiro contato realizado via WhatsApp. Agendado diagnóstico.' },
      { data: '2026-09-01', texto: 'Diagnóstico de rede presencial concluído. Proposta formalizada.' }
    ]
  },
  {
    id: 'lead-2',
    nome: 'Eduardo Haas',
    empresa_nome: 'Haas Distribuidora de Auto Peças',
    empresa_id: null,
    telefone: '(51) 3712-4455',
    whatsapp: '(51) 99123-4567',
    email: 'eduardo@haasauto.com.br',
    origem: 'Site',
    servico_interesse: 'Gestão de Servidores e Firewalls',
    responsavel_comercial: 'João Fonseca',
    valor_estimado: 1200.00,
    probabilidade: 85,
    data_prevista: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    etapa: 'negociacao',
    observacoes: 'Estão sem suporte técnico fixo. Querem fechar contrato anual de TI com SLA prioritário.',
    historico: [
      { data: '2026-08-25', texto: 'Lead recebido através do botão do site institucional.' },
      { data: '2026-08-30', texto: 'Reunião de alinhamento com diretoria. Em fase final de minuta contratual.' }
    ]
  },
  {
    id: 'lead-3',
    nome: 'Patrícia Schneider',
    empresa_nome: 'Schneider & Advogados Associados',
    empresa_id: null,
    telefone: '(51) 3720-1122',
    whatsapp: '(51) 98765-4321',
    email: 'patricia@schneideradv.com.br',
    origem: 'Google',
    servico_interesse: 'Suporte a Notebooks e Migração Microsoft 365',
    responsavel_comercial: 'João Fonseca',
    valor_estimado: 599.00,
    probabilidade: 40,
    data_prevista: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
    etapa: 'qualificacao',
    observacoes: 'Escritório com 8 advogados. Muito dependentes de estabilidade de e-mail e certificados digitais.',
    historico: [
      { data: '2026-09-02', texto: 'Mensagem enviada com apresentação institucional dos planos Fonsetech.' }
    ]
  },
  {
    id: 'lead-4',
    nome: 'Marina Ribeiro',
    empresa_nome: 'Ribeiro Comércio de Alimentos Ltda',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    telefone: '(51) 3714-1234',
    whatsapp: '(51) 98888-1234',
    email: 'marina@empresa.com.br',
    origem: 'Indicação',
    servico_interesse: 'Plano Profissional',
    responsavel_comercial: 'João Fonseca',
    valor_estimado: 599.00,
    probabilidade: 100,
    data_prevista: '2025-01-10',
    etapa: 'ganho',
    observacoes: 'Lead convertido com sucesso em cliente ativo.',
    historico: [
      { data: '2025-01-05', texto: 'Contrato assinado. Cliente cadastrado na base oficial do FonseDesk.' }
    ]
  }
];

const CRM_PROPOSTAS_INICIAIS = [
  {
    id: 'prop-1',
    lead_id: 'lead-1',
    empresa_id: null,
    servico: 'Gestão de TI Especializada - Plano Profissional + Backup Nuvem',
    descricao: 'Suporte preventivo e corretivo para 12 computadores, configuração de rotina de backup externo e segurança antivírus.',
    quantidade: 1,
    valor: 850.00,
    desconto: 100.00,
    valor_final: 750.00,
    condicoes_pagamento: 'Mensalidade via boleto bancário, com vencimento todo dia 10.',
    validade: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
    status: 'enviada',
    observacoes: 'Inclui 1 visita presencial mensal e chamados remotos ilimitados.'
  },
  {
    id: 'prop-2',
    lead_id: 'lead-2',
    empresa_id: null,
    servico: 'Gestão Completa de Infraestrutura - Plano Premium',
    descricao: 'Monitoramento 24/7 de links e servidores, suporte a 25 terminais e manutenção da rede física/Wi-Fi.',
    quantidade: 1,
    valor: 1350.00,
    desconto: 150.00,
    valor_final: 1200.00,
    condicoes_pagamento: 'Contrato anual faturado mensalmente.',
    validade: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    status: 'em_negociacao',
    observacoes: 'Diretoria solicitou revisão da cláusula de tempo de resposta presencial.'
  }
];

const FINANCEIRO_LANCAMENTOS_INICIAIS = [
  {
    id: 'fin-1',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    descricao: 'Mensalidade Contrato de TI — Plano Profissional (Setembro/2026)',
    categoria: 'Mensalidade',
    origem: 'plano_mensal',
    chamado_id: null,
    agendamento_id: null,
    proposta_id: null,
    valor: 599.00,
    data_emissao: '2026-09-01',
    data_vencimento: '2026-09-10',
    data_pagamento: '2026-09-03',
    forma_pagamento: 'Boleto',
    status: 'pago',
    observacao: 'Liquidado via convênio bancário com comprovante arquivado.'
  },
  {
    id: 'fin-2',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    descricao: 'Passagem e conectorização de ponto de rede adicional (Chamado #4819)',
    categoria: 'Suporte Avulso',
    origem: 'chamado',
    chamado_id: 'c1111111-0002-0000-0000-000000000002',
    agendamento_id: null,
    proposta_id: null,
    valor: 180.00,
    data_emissao: '2026-09-02',
    data_vencimento: '2026-09-15',
    data_pagamento: null,
    forma_pagamento: 'Pix',
    status: 'em_aberto',
    observacao: 'Material e serviço de cabeamento aprovados pela Marina.'
  },
  {
    id: 'fin-3',
    empresa_id: '22222222-2222-2222-2222-222222222222',
    descricao: 'Mensalidade Contrato de TI — Plano Premium (Agosto/2026)',
    categoria: 'Mensalidade',
    origem: 'plano_mensal',
    chamado_id: null,
    agendamento_id: null,
    proposta_id: null,
    valor: 999.00,
    data_emissao: '2026-08-01',
    data_vencimento: '2026-08-05',
    data_pagamento: null,
    forma_pagamento: 'Boleto',
    status: 'vencido',
    observacao: 'Aguardando confirmação do setor financeiro de pagamento.'
  },
  {
    id: 'fin-4',
    empresa_id: '22222222-2222-2222-2222-222222222222',
    descricao: 'Mensalidade Contrato de TI — Plano Premium (Setembro/2026)',
    categoria: 'Mensalidade',
    origem: 'plano_mensal',
    chamado_id: null,
    agendamento_id: null,
    proposta_id: null,
    valor: 999.00,
    data_emissao: '2026-09-01',
    data_vencimento: '2026-09-05',
    data_pagamento: null,
    forma_pagamento: 'Boleto',
    status: 'vencido',
    observacao: 'Segundo boleto em aberto. Entrar em contato via WhatsApp.'
  },
  {
    id: 'fin-5',
    empresa_id: '33333333-3333-3333-3333-333333333333',
    descricao: 'Mensalidade Contrato de TI — Plano Básico (Setembro/2026)',
    categoria: 'Mensalidade',
    origem: 'plano_mensal',
    chamado_id: null,
    agendamento_id: null,
    proposta_id: null,
    valor: 299.00,
    data_emissao: '2026-09-01',
    data_vencimento: '2026-09-20',
    data_pagamento: null,
    forma_pagamento: 'Pix',
    status: 'em_aberto',
    observacao: 'Enviado por e-mail com chave Pix cadastrada.'
  }
];

const AUDITORIA_INICIAL = [
  {
    id: 'aud-1',
    usuario_nome: 'João Fonseca',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    acao: 'Atualizou plano e condições comerciais da empresa',
    recurso: 'Empresas',
    resultado: 'sucesso',
    criado_em: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'aud-2',
    usuario_nome: 'João Fonseca',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    acao: 'Criou agendamento de visita técnica preventiva',
    recurso: 'Agenda',
    resultado: 'sucesso',
    criado_em: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export class MockStorage {
  constructor() {
    this.carregar();
  }

  carregar() {
    try {
      const salvo = localStorage.getItem('fonsetech_demo_db_v2');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        this.planos = parsed.planos || PLANOS_INICIAIS;
        this.empresas = parsed.empresas || EMPRESAS_INICIAIS;
        this.profiles = parsed.profiles || PERFIS_INICIAIS;
        this.maquinas = parsed.maquinas || MAQUINAS_INICIAIS;
        this.materiais = parsed.materiais || MATERIAIS_INICIAIS;
        this.chamados = parsed.chamados || CHAMADOS_INICIAIS;
        this.historico = parsed.historico || HISTORICO_INICIAL;
        this.agendamentos = parsed.agendamentos || AGENDAMENTOS_INICIAIS;
        this.crm_leads = parsed.crm_leads || CRM_LEADS_INICIAIS;
        this.crm_propostas = parsed.crm_propostas || CRM_PROPOSTAS_INICIAIS;
        this.financeiro_lancamentos = parsed.financeiro_lancamentos || FINANCEIRO_LANCAMENTOS_INICIAIS;
        this.auditoria_logs = parsed.auditoria_logs || AUDITORIA_INICIAL;
        this.site_imagens = parsed.site_imagens || [];
        this.site_config = parsed.site_config || [];
        return;
      }
    } catch {
      // Ignora erro de parse
    }
    this.planos = [...PLANOS_INICIAIS];
    this.empresas = [...EMPRESAS_INICIAIS];
    this.profiles = [...PERFIS_INICIAIS];
    this.maquinas = [...MAQUINAS_INICIAIS];
    this.materiais = [...MATERIAIS_INICIAIS];
    this.chamados = [...CHAMADOS_INICIAIS];
    this.historico = [...HISTORICO_INICIAL];
    this.agendamentos = [...AGENDAMENTOS_INICIAIS];
    this.crm_leads = [...CRM_LEADS_INICIAIS];
    this.crm_propostas = [...CRM_PROPOSTAS_INICIAIS];
    this.financeiro_lancamentos = [...FINANCEIRO_LANCAMENTOS_INICIAIS];
    this.auditoria_logs = [...AUDITORIA_INICIAL];
    this.site_imagens = [];
    this.site_config = [];
  }

  salvar() {
    try {
      localStorage.setItem('fonsetech_demo_db_v2', JSON.stringify({
        planos: this.planos,
        empresas: this.empresas,
        profiles: this.profiles,
        maquinas: this.maquinas,
        materiais: this.materiais,
        chamados: this.chamados,
        historico: this.historico,
        agendamentos: this.agendamentos,
        crm_leads: this.crm_leads,
        crm_propostas: this.crm_propostas,
        financeiro_lancamentos: this.financeiro_lancamentos,
        auditoria_logs: this.auditoria_logs,
        site_imagens: this.site_imagens,
        site_config: this.site_config
      }));
    } catch {
      // Quota cheia ignorada
    }
  }

  obterColecao(nome) {
    if (nome === 'planos') return this.planos;
    if (nome === 'empresas') return this.empresas;
    if (nome === 'profiles') return this.profiles;
    if (nome === 'maquinas') return this.maquinas;
    if (nome === 'maquinas_acesso_remoto') return [];
    if (nome === 'materiais') return this.materiais;
    if (nome === 'chamados') return this.chamados;
    if (nome === 'chamado_historico') return this.historico;
    if (nome === 'agendamentos') return this.agendamentos;
    if (nome === 'crm_leads') return this.crm_leads;
    if (nome === 'crm_propostas') return this.crm_propostas;
    if (nome === 'financeiro_lancamentos') return this.financeiro_lancamentos;
    if (nome === 'auditoria_logs') return this.auditoria_logs;
    if (nome === 'site_imagens') return this.site_imagens;
    if (nome === 'site_config') return this.site_config;
    return [];
  }
}

export const mockStorage = new MockStorage();

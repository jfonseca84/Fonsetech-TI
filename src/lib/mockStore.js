// Mock data store espelhando o seed.sql e os protótipos para o FonseDesk funcionar
// sem conexão ativa com o Supabase quando as variáveis de ambiente não forem informadas.

const EMPRESAS_INICIAIS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    razao_social: 'Ribeiro Comércio Ltda',
    cnpj: '12.345.678/0001-90',
    endereco: 'Av. Paulista, 1420 - Sala 12',
    email: 'marina@empresa.com.br',
    telefone: '(11) 98888-1234',
    tem_ti_interno: false,
    responsavel_ti: null,
    gerente_geral: 'Marina Ribeiro',
    diretor: 'Ricardo Ribeiro',
    plano: 'Profissional',
    ativo: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    razao_social: 'Alves Logística ME',
    cnpj: '23.456.789/0001-01',
    endereco: 'Rod. Anhanguera, km 32',
    email: 'diego@alveslog.com.br',
    telefone: '(11) 97777-2345',
    tem_ti_interno: true,
    responsavel_ti: 'Bruno Alves',
    gerente_geral: 'Diego Alves',
    diretor: 'Sônia Alves',
    plano: 'Avançado',
    ativo: true
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    razao_social: 'Mendes Soluções',
    cnpj: '34.567.890/0001-12',
    endereco: 'Rua das Palmeiras, 88',
    email: 'carlos@mendessol.com.br',
    telefone: '(11) 96666-3456',
    tem_ti_interno: false,
    responsavel_ti: null,
    gerente_geral: 'Carlos Mendes',
    diretor: 'Carlos Mendes',
    plano: 'Profissional',
    ativo: true
  }
];

const PERFIS_INICIAIS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nome: 'João Fonseca',
    email: 'admin@fonsetech.com.br',
    telefone: '(51) 99999-8888',
    role: 'admin',
    ativo: true,
    empresa_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nome: 'Marina Ribeiro',
    email: 'marina@empresa.com.br',
    telefone: '(11) 98888-1234',
    role: 'cliente',
    ativo: true,
    empresa_id: '11111111-1111-1111-1111-111111111111'
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
    id: 'm1111111-0004-0000-0000-000000000004',
    empresa_id: '11111111-1111-1111-1111-111111111111',
    nome: 'Servidor ARQ-01',
    usuario: 'Compartilhado',
    setor: 'Infraestrutura',
    modelo: 'Dell PowerEdge T150',
    cpu: 'Xeon E-2314',
    memoria: '32 GB',
    disco: '2 x SSD 960 GB RAID 1',
    sistema: 'Windows Server 2022',
    rede: 'Estático',
    ip: '192.168.0.10',
    mascara: '255.255.255.0',
    gateway: '192.168.0.1',
    dns: '192.168.0.10 / 8.8.8.8',
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
    rede: 'Estático',
    ip: '10.0.1.21',
    mascara: '255.255.255.0',
    gateway: '10.0.1.1',
    dns: '10.0.1.2 / 8.8.8.8',
    ativo: true
  },
  {
    id: 'm3333333-0001-0000-0000-000000000001',
    empresa_id: '33333333-3333-3333-3333-333333333333',
    nome: 'Servidor ERP',
    usuario: 'Compartilhado',
    setor: 'Infraestrutura',
    modelo: 'Lenovo ThinkSystem ST50',
    cpu: 'Xeon E-2224',
    memoria: '64 GB',
    disco: '2 x SSD 1 TB RAID 1',
    sistema: 'Ubuntu Server 24.04',
    rede: 'Estático',
    ip: '172.16.4.5',
    mascara: '255.255.0.0',
    gateway: '172.16.0.1',
    dns: '172.16.0.2',
    ativo: true
  }
];

const MATERIAIS_INICIAIS = [
  {
    id: 'mat-001',
    tipo: 'pdf',
    titulo: 'Boas práticas de senhas e acessos',
    descricao: 'Como criar senhas fortes, usar gerenciador e ativar verificação em duas etapas.',
    categoria: 'Segurança',
    nivel: 'Básico',
    paginas: 18,
    publicado: true,
    arquivo_path: 'seguranca/senhas.pdf',
    link_externo: null,
    versao: null,
    tamanho: null,
    sistema: null,
    destaque: false
  },
  {
    id: 'mat-002',
    tipo: 'pdf',
    titulo: 'Reconhecendo golpes e e-mails falsos',
    descricao: 'Sinais de phishing, links suspeitos e o que fazer ao receber uma mensagem duvidosa.',
    categoria: 'Segurança',
    nivel: 'Básico',
    paginas: 24,
    publicado: true,
    arquivo_path: 'seguranca/phishing.pdf',
    link_externo: null,
    versao: null,
    tamanho: null,
    sistema: null,
    destaque: false
  },
  {
    id: 'mat-003',
    tipo: 'ppt',
    titulo: 'Treinamento de segurança para equipes',
    descricao: 'Apresentação usada nos treinamentos presenciais, pronta para exibir em reunião.',
    categoria: 'Segurança',
    nivel: 'Básico',
    paginas: 34,
    publicado: true,
    arquivo_path: 'seguranca/treinamento.ppt',
    link_externo: null,
    versao: null,
    tamanho: null,
    sistema: null,
    destaque: false
  },
  {
    id: 'mat-004',
    tipo: 'pdf',
    titulo: 'Guia do backup na rotina da empresa',
    descricao: 'O que precisa ser copiado, com que frequência e como validar se o backup funcionou.',
    categoria: 'Infraestrutura',
    nivel: 'Intermediário',
    paginas: 32,
    publicado: true,
    arquivo_path: 'infra/backup.pdf',
    link_externo: null,
    versao: null,
    tamanho: null,
    sistema: null,
    destaque: false
  },
  {
    id: 'mat-005',
    tipo: 'programa',
    titulo: 'AnyDesk Corporativo',
    descricao: 'Acesso remoto usado pela nossa equipe durante o atendimento.',
    categoria: 'Suporte remoto',
    versao: '8.1',
    tamanho: '4,2 MB',
    sistema: 'Windows',
    destaque: true,
    publicado: true,
    link_externo: 'https://anydesk.com',
    arquivo_path: null
  },
  {
    id: 'mat-006',
    tipo: 'programa',
    titulo: 'Agente de Monitoramento Fonsetech',
    descricao: 'Coleta indicadores da máquina e abre alertas automáticos de falha.',
    categoria: 'Monitoramento',
    versao: '2.4',
    tamanho: '11,8 MB',
    sistema: 'Windows',
    destaque: true,
    publicado: true,
    link_externo: '#',
    arquivo_path: null
  },
  {
    id: 'mat-007',
    tipo: 'programa',
    titulo: 'Cliente VPN Configurado',
    descricao: 'Instalador já com o perfil da sua empresa aplicado.',
    categoria: 'Redes',
    versao: '5.0',
    tamanho: '18,5 MB',
    sistema: 'Windows',
    destaque: false,
    publicado: true,
    link_externo: '#',
    arquivo_path: null
  }
];

const CHAMADOS_INICIAIS = [
  {
    id: 'ch-1042',
    numero: 1042,
    titulo: 'Lentidão ao abrir e consultar faturas no ERP',
    categoria: 'Sistemas',
    descricao: 'Após a última atualização do servidor de banco de dados, as consultas demoram mais de 2 minutos para responder.',
    prioridade: 'Alta',
    status: 'Em atendimento',
    aberto_em: new Date(Date.now() - 3600000 * 4).toISOString(),
    resolvido_em: null,
    usuario_equipamento: 'Camila Prado',
    equipamento_livre: true,
    empresa_id: '11111111-1111-1111-1111-111111111111',
    maquina_id: 'm1111111-0002-0000-0000-000000000002',
    responsavel_id: '00000000-0000-0000-0000-000000000001',
    aberto_por: '00000000-0000-0000-0000-000000000002'
  },
  {
    id: 'ch-1041',
    numero: 1041,
    titulo: 'Configuração da nova impressora fiscal em rede',
    categoria: 'Impressoras',
    descricao: 'Chegou o novo equipamento da recepção, precisamos configurar o driver e compartilhar com os 3 postos de atendimento.',
    prioridade: 'Média',
    status: 'Aberto',
    aberto_em: new Date(Date.now() - 3600000 * 22).toISOString(),
    resolvido_em: null,
    usuario_equipamento: 'João Ferreira',
    equipamento_livre: false,
    empresa_id: '11111111-1111-1111-1111-111111111111',
    maquina_id: 'm1111111-0001-0000-0000-000000000001',
    responsavel_id: null,
    aberto_por: '00000000-0000-0000-0000-000000000002'
  },
  {
    id: 'ch-1040',
    numero: 1040,
    titulo: 'Alerta de falha no backup noturno do Servidor ARQ-01',
    categoria: 'Backup',
    descricao: 'O script de sincronização com a nuvem reportou espaço insuficiente no disco secundário.',
    prioridade: 'Urgente',
    status: 'Urgente',
    aberto_em: new Date(Date.now() - 3600000 * 48).toISOString(),
    resolvido_em: null,
    usuario_equipamento: 'Servidor',
    equipamento_livre: true,
    empresa_id: '11111111-1111-1111-1111-111111111111',
    maquina_id: 'm1111111-0004-0000-0000-000000000004',
    responsavel_id: '00000000-0000-0000-0000-000000000001',
    aberto_por: '00000000-0000-0000-0000-000000000001'
  },
  {
    id: 'ch-1039',
    numero: 1039,
    titulo: 'Substituição de fonte de alimentação da Máquina 01',
    categoria: 'Hardware',
    descricao: 'Computador reiniciava sob carga pesada. Fonte substituída por modelo de 500W com PFC ativo.',
    prioridade: 'Média',
    status: 'Resolvido',
    aberto_em: new Date(Date.now() - 3600000 * 96).toISOString(),
    resolvido_em: new Date(Date.now() - 3600000 * 72).toISOString(),
    usuario_equipamento: 'Diego Alves',
    equipamento_livre: true,
    empresa_id: '22222222-2222-2222-2222-222222222222',
    maquina_id: 'm2222222-0001-0000-0000-000000000001',
    responsavel_id: '00000000-0000-0000-0000-000000000001',
    aberto_por: '00000000-0000-0000-0000-000000000001'
  }
];

const HISTORICO_INICIAL = [
  {
    id: 'h-1',
    chamado_id: 'ch-1042',
    autor_id: '00000000-0000-0000-0000-000000000001',
    autor_nome: 'João Fonseca',
    texto: 'Iniciamos análise no índice da tabela de lançamentos do ERP. Realizando reconstrução.',
    interno: false,
    criado_em: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'h-2',
    chamado_id: 'ch-1040',
    autor_id: '00000000-0000-0000-0000-000000000001',
    autor_nome: 'João Fonseca',
    texto: 'Rotina de purga de logs antigos executada. Liberados 140 GB. Reexecutando o backup.',
    interno: false,
    criado_em: new Date(Date.now() - 3600000 * 40).toISOString()
  }
];

const AGENDAMENTOS_INICIAIS = [
  {
    id: 'ag-1',
    tipo: 'visita',
    data: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    hora: '09:30',
    assunto: 'Manutenção preventiva e limpeza física dos servidores',
    endereco: 'Av. Paulista, 1420 - Sala 12',
    formato: 'Presencial',
    status: 'Confirmado',
    empresa_id: '11111111-1111-1111-1111-111111111111'
  },
  {
    id: 'ag-2',
    tipo: 'reuniao',
    data: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    hora: '14:00',
    assunto: 'Apresentação do projeto de migração de telefonia para VoIP',
    endereco: 'Google Meet',
    formato: 'Remoto',
    status: 'Solicitado',
    empresa_id: '11111111-1111-1111-1111-111111111111'
  }
];

export class MockStorage {
  constructor() {
    this.carregar();
  }

  carregar() {
    try {
      const salvo = localStorage.getItem('fonsetech_demo_db');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        this.empresas = parsed.empresas || EMPRESAS_INICIAIS;
        this.profiles = parsed.profiles || PERFIS_INICIAIS;
        this.maquinas = parsed.maquinas || MAQUINAS_INICIAIS;
        this.materiais = parsed.materiais || MATERIAIS_INICIAIS;
        this.chamados = parsed.chamados || CHAMADOS_INICIAIS;
        this.historico = parsed.historico || HISTORICO_INICIAL;
        this.agendamentos = parsed.agendamentos || AGENDAMENTOS_INICIAIS;
        this.site_imagens = parsed.site_imagens || [];
        return;
      }
    } catch {
      // Ignora erro de JSON e usa os padrões
    }
    this.empresas = [...EMPRESAS_INICIAIS];
    this.profiles = [...PERFIS_INICIAIS];
    this.maquinas = [...MAQUINAS_INICIAIS];
    this.materiais = [...MATERIAIS_INICIAIS];
    this.chamados = [...CHAMADOS_INICIAIS];
    this.historico = [...HISTORICO_INICIAL];
    this.agendamentos = [...AGENDAMENTOS_INICIAIS];
    this.site_imagens = [];
  }

  salvar() {
    try {
      localStorage.setItem('fonsetech_demo_db', JSON.stringify({
        empresas: this.empresas,
        profiles: this.profiles,
        maquinas: this.maquinas,
        materiais: this.materiais,
        chamados: this.chamados,
        historico: this.historico,
        agendamentos: this.agendamentos,
        site_imagens: this.site_imagens
      }));
    } catch {
      // Ignora quota cheia
    }
  }

  obterColecao(nome) {
    if (nome === 'empresas') return this.empresas;
    if (nome === 'profiles') return this.profiles;
    if (nome === 'maquinas') return this.maquinas;
    if (nome === 'maquinas_acesso_remoto') return [];
    if (nome === 'materiais') return this.materiais;
    if (nome === 'chamados') return this.chamados;
    if (nome === 'chamado_historico') return this.historico;
    if (nome === 'agendamentos') return this.agendamentos;
    if (nome === 'site_imagens') return this.site_imagens;
    return [];
  }
}

export const mockStorage = new MockStorage();

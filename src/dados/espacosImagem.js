/**
 * Espacos de imagem da landing page.
 * O slug e o contrato entre o painel admin e o index.html: se mudar aqui,
 * mude o atributo data-slug correspondente na landing.
 */
export const ESPACOS = [
  {
    slug: 'logo',
    titulo: 'Logo da Fonsetech',
    onde: 'Cabeçalho do site público',
    tamanho: '360 × 88 px (PNG com fundo transparente)',
    proporcao: '360 / 88'
  },
  {
    slug: 'dashboard-notebook',
    titulo: 'Mockup do notebook (topo)',
    onde: 'Seção inicial, imagem grande do dashboard',
    tamanho: '800 × 516 px',
    proporcao: '400 / 258'
  },
  {
    slug: 'dashboard-celular',
    titulo: 'Mockup do celular (topo)',
    onde: 'Seção inicial, sobreposto ao notebook',
    tamanho: '320 × 615 px',
    proporcao: '104 / 200'
  },
  {
    slug: 'plataforma-dashboard',
    titulo: 'Screenshot da plataforma',
    onde: 'Seção "Plataforma própria", moldura à direita',
    tamanho: '1200 × 760 px',
    proporcao: '1200 / 760'
  },
  {
    slug: 'sobre-fonsetech',
    titulo: 'Imagem do "Sobre nós"',
    onde: 'Coluna esquerda da seção Sobre nós',
    tamanho: '1040 × 1290 px (retrato)',
    proporcao: '4 / 5'
  },
  {
    slug: 'projeto-gestao',
    titulo: 'Portfólio — 1º projeto',
    onde: 'Sistema de gestão',
    tamanho: '420 × 384 px',
    proporcao: '140 / 128'
  },
  {
    slug: 'projeto-delivery',
    titulo: 'Portfólio — 2º projeto',
    onde: 'Aplicativo de delivery',
    tamanho: '420 × 384 px',
    proporcao: '140 / 128'
  },
  {
    slug: 'projeto-site',
    titulo: 'Portfólio — 3º projeto',
    onde: 'Site institucional',
    tamanho: '420 × 384 px',
    proporcao: '140 / 128'
  },
  {
    slug: 'depoimento-carlos',
    titulo: 'Foto do depoimento',
    onde: 'Avatar redondo ao lado do depoimento',
    tamanho: '200 × 200 px (quadrada)',
    proporcao: '1 / 1'
  }
];

export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO = 3 * 1024 * 1024; // 3 MB

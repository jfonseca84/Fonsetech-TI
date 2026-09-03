// Tokens extraidos dos prototipos em design/. Nao inventar valores novos.
export const c = {
  azul: '#1d5ff5', azulHover: '#2f7bff', azulEscuro: '#1558d6', azulLink: '#0f47b0',
  roxo: '#7c3aed', roxoClaro: '#a78bfa', roxoHover: '#8b5cf6',
  tinta: '#0d1730', texto2: '#55637f', texto3: '#6b7896', texto4: '#93a0b8', texto5: '#a3aec4',
  branco: '#ffffff', fundo: '#f4f7fc', fundoCampo: '#f7f9fd', cardAlt: '#f8fafd',
  borda: 'rgba(20, 45, 100, 0.1)', borda2: 'rgba(20, 45, 100, 0.14)', borda3: 'rgba(20, 45, 100, 0.16)',
  sidebarCliente: 'linear-gradient(170deg, #0d2a6b 0%, #0b1f52 100%)',
  sidebarAdmin: 'linear-gradient(170deg, #1b1442 0%, #140f31 100%)',
  loginPainel: 'linear-gradient(150deg, #0d2a6b 0%, #123a8f 46%, #0b1f52 100%)',
  navCliente: '#b9cdec', navAdmin: '#b6a9e4',
  ciano: '#3fd0e0', verde: '#22c07a', verdeTexto: '#14804a'
};

export const TONS = {
  'Aberto':             { fg: '#1558d6', bg: 'rgba(29, 95, 245, 0.1)',  dot: '#1d5ff5' },
  'Em atendimento':     { fg: '#0369a1', bg: 'rgba(56, 189, 248, 0.14)', dot: '#38bdf8' },
  'Aguardando cliente': { fg: '#a16207', bg: 'rgba(240, 160, 32, 0.14)', dot: '#f0a020' },
  'Urgente':            { fg: '#b91c1c', bg: 'rgba(220, 38, 38, 0.1)',   dot: '#dc2626' },
  'Resolvido':          { fg: '#14804a', bg: 'rgba(34, 192, 122, 0.12)', dot: '#22c07a' }
};

export const PRIO_FG = { 'Urgente': '#b91c1c', 'Alta': '#c2410c', 'Média': '#55637f', 'Baixa': '#6b7896' };

export const STATUS = ['Aberto', 'Em atendimento', 'Aguardando cliente', 'Urgente', 'Resolvido'];
export const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];
export const CATEGORIAS = ['Rede e internet', 'Computadores', 'Sistemas', 'Servidores', 'E-mail e acessos'];

export const card = {
  background: c.branco, border: '1px solid ' + c.borda, borderRadius: 14,
  boxShadow: '0 2px 8px rgba(20, 45, 100, 0.04)'
};

export const botao = {
  primario: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    background: c.azul, color: c.branco, fontSize: 13.5, fontWeight: 700,
    padding: '12px 18px', border: 0, borderRadius: 10, cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(29, 95, 245, 0.28)', transition: 'background .22s ease, transform .22s ease'
  },
  secundario: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    background: c.branco, color: '#2c3853', fontSize: 13.5, fontWeight: 600,
    padding: '12px 18px', border: '1px solid ' + c.borda3, borderRadius: 10, cursor: 'pointer',
    transition: 'border-color .22s ease, background .22s ease'
  },
  roxo: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    background: c.roxo, color: c.branco, fontSize: 14, fontWeight: 700,
    padding: '14px 18px', border: 0, borderRadius: 10, cursor: 'pointer',
    boxShadow: '0 10px 26px rgba(124, 58, 237, 0.26)', transition: 'background .22s ease'
  }
};

export const rotulo = { fontSize: 12.5, fontWeight: 700, color: '#2c3853' };
export const mono = "'JetBrains Mono', monospace";

export const pill = (fg, bg) => ({
  fontSize: 11.5, fontWeight: 700, padding: '6px 11px', borderRadius: 999,
  color: fg, background: bg, textAlign: 'center', whiteSpace: 'nowrap'
});

export function dataBR(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

export function horaBR(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
         d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function iniciais(nome) {
  if (!nome) return '--';
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

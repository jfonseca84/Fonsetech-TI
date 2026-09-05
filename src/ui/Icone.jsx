import { c } from './tokens.js';

const P = {
  grade: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/></>,
  ticket: <path d="M8 3.5h8a2 2 0 0 1 2 2v13l-6-3-6 3v-13a2 2 0 0 1 2-2z"/>,
  mais: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  agenda: <><rect x="3.5" y="5" width="17" height="15" rx="2.4"/><path d="M3.5 9.5h17"/><path d="M8 3.5v3"/><path d="M16 3.5v3"/></>,
  predio: <><path d="M4 20V7l8-3.5V20"/><path d="M12 10.5h6a2 2 0 0 1 2 2V20"/><path d="M3 20h18"/></>,
  curso: <><path d="M3 6.5l9-3 9 3-9 3-9-3z"/><path d="M6 9v5.5c0 1.7 2.7 3 6 3s6-1.3 6-3V9"/><path d="M21 7v6"/></>,
  download: <><path d="M12 3.5v11"/><path d="M8 11l4 4 4-4"/><path d="M4 19.5h16"/></>,
  pessoas: <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="9" r="2.4"/><path d="M16 14.6a4.6 4.6 0 0 1 5 4.4"/></>,
  monitor: <><rect x="3.5" y="4" width="17" height="12.5" rx="2.2"/><path d="M8 20h8"/><path d="M12 16.5V20"/></>,
  sair: <><path d="M10 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h4"/><path d="M15.5 8L20 12l-4.5 4"/><path d="M20 12H10"/></>,
  seta: <><path d="M5 12h13"/><path d="M12 5l7 7-7 7"/></>,
  voltar: <><path d="M19 12H6"/><path d="M12 5l-7 7 7 7"/></>,
  check: <path d="M4 12.5l5 5L20 6.5"/>,
  busca: <><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></>,
  olho: <><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></>,
  fechar: <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
  menu: <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>,
  relogio: <><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></>,
  telaCheia: <><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></>,
  pdf: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/><path d="M9 13.5h6"/><path d="M9 17h4"/></>,
  ppt: <><rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M12 16.5V20"/><path d="M8.5 20h7"/><path d="M7.5 12.5l3-3 2.5 2.5 3.5-4"/></>,
  pino: <><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2.2"/><path d="M16 10.5l5-3v9l-5-3z"/></>,
  alerta: <><circle cx="12" cy="12" r="9"/><path d="M12 7.5v6"/><path d="M12 16.5h.01"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/></>,
  grafico: <><path d="M4 17l5-5 3.5 3.5L20 8"/><path d="M15.5 8H20v4.5"/></>,
  escudo: <><path d="M12 3l8 3v5.5c0 4.6-3.2 8.3-8 9.5-4.8-1.2-8-4.9-8-9.5V6l8-3z"/><path d="M8.8 11.6l2.6 2.6 3.8-4"/></>,
  usuario: <><circle cx="12" cy="8.5" r="3.6"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
  cadeado: <><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></>,
  losango: <><path d="M12 2.6L21.4 12 12 21.4 2.6 12 12 2.6z"/></>,
  engrenagem: <><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.5 7.8l2.25 1.3M17.25 14.9l2.25 1.3M4.5 16.2l2.25-1.3M17.25 9.1l2.25-1.3"/></>,
  imagem: <><rect x="3.2" y="4.5" width="17.6" height="15" rx="2.4"/><circle cx="8.6" cy="10" r="1.7"/><path d="M3.8 17l4.6-4.3 3.4 3 3-2.6 5.4 4.6"/></>,
  whatsapp: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M17 14.2c-.3-.2-1.7-.8-2-.9s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.9 8.9 0 0 1-2.6-1.6 9.8 9.8 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.7s.3-.4.5-.6a2.2 2.2 0 0 0 .3-.5.7.7 0 0 0 0-.7c-.1-.2-.7-1.7-1-2.3s-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.4 3.4 14.5 14.5 0 0 0 5.6 4.9c2.4 1 2.9.8 3.4.7a2.9 2.9 0 0 0 1.9-1.3 2.4 2.4 0 0 0 .2-1.3c-.2-.1-.5-.2-.8-.4z"/></>,
  cifrao: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  funil: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
  documento: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
  editar: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  lixeira: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
  telefone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
  email: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>
};

export default function Icone({ nome, tamanho = 18, cor = 'currentColor', largura = 1.8, style }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none"
      stroke={cor} strokeWidth={largura} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style}>
      {P[nome] || null}
    </svg>
  );
}

export function Marca({ tamanho = 21, cor = '#8fc0ff' }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.6L21.4 12 12 21.4 2.6 12 12 2.6z" stroke={cor} strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.4" fill={cor} />
    </svg>
  );
}

export function Aspas({ cor = c.azulHover }) {
  return (
    <svg width="20" height="18" viewBox="0 0 34 30" fill={cor} aria-hidden="true">
      <path d="M0 18.5C0 9.6 5.2 3.1 13.2 0l1.6 3.4C9.9 5.7 7 9.2 6.6 13.2h5.2V29H0V18.5zm18.6 0C18.6 9.6 23.8 3.1 31.8 0l1.6 3.4c-4.9 2.3-7.8 5.8-8.2 9.8h5.2V29H18.6V18.5z" />
    </svg>
  );
}

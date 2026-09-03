import { useLocation } from 'react-router-dom';
import Shell from './Shell.jsx';
import Cabecalho from './Cabecalho.jsx';
import { useSessao } from '../auth/SessaoProvider.jsx';

const ITENS = [
  { para: '/dashboard',              fim: true, icone: 'grade',    rotulo: 'Visão geral' },
  { para: '/dashboard/chamados',                icone: 'ticket',   rotulo: 'Meus chamados' },
  { para: '/dashboard/novo',                    icone: 'mais',     rotulo: 'Abrir chamado' },
  { para: '/dashboard/agendamentos',            icone: 'agenda',   rotulo: 'Agendamentos' },
  { para: '/dashboard/cursos',                  icone: 'curso',    rotulo: 'Cursos' },
  { para: '/dashboard/downloads',               icone: 'download', rotulo: 'Downloads' },
  { para: '/dashboard/empresa',                 icone: 'predio',   rotulo: 'Minha empresa' }
];

const CABECALHOS = {
  '/dashboard':              ['Visão geral', 'Acompanhe o atendimento da sua empresa em um só lugar.'],
  '/dashboard/chamados':     ['Meus chamados', 'Todos os chamados abertos pela sua empresa.'],
  '/dashboard/novo':         ['Abrir chamado', 'Descreva o problema e nossa equipe assume a partir daí.'],
  '/dashboard/agendamentos': ['Agendamentos', 'Solicite visitas técnicas e reuniões com a nossa equipe.'],
  '/dashboard/cursos':       ['Cursos', 'Apostilas e apresentações de treinamento para a sua equipe.'],
  '/dashboard/downloads':    ['Downloads', 'Programas e utilitários liberados para a sua empresa.'],
  '/dashboard/empresa':      ['Minha empresa', 'Mantenha os dados cadastrais e os responsáveis atualizados.']
};

const SLA = { 'Essencial': 'SLA de resposta em 8h', 'Profissional': 'SLA de resposta em 4h', 'Avançado': 'SLA de resposta em 1h' };

export default function LayoutCliente() {
  const { perfil } = useSessao();
  const { pathname } = useLocation();
  const plano = perfil?.empresas?.plano || '—';
  const chave = pathname.replace(/\/+$/, '') || '/dashboard';
  const [titulo, subtitulo] = CABECALHOS[chave] || CABECALHOS['/dashboard'];

  return (
    <Shell
      variante="cliente"
      itens={ITENS}
      rodape={{ rotulo: 'SEU PLANO', valor: plano, dica: SLA[plano] || 'Atendimento em horário comercial' }}
      cabecalho={
        <Cabecalho
          titulo={titulo}
          subtitulo={subtitulo}
          nome={perfil?.nome}
          detalhe={perfil?.empresas?.razao_social}
          tomAvatar="cliente"
        />
      }
    />
  );
}

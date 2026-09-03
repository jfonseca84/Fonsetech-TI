import { useLocation } from 'react-router-dom';
import Shell from './Shell.jsx';
import Cabecalho from './Cabecalho.jsx';
import { useSessao } from '../auth/SessaoProvider.jsx';

const ITENS = [
  { para: '/admin',              fim: true, icone: 'grade',   rotulo: 'Visão geral' },
  { para: '/admin/chamados',                icone: 'ticket',  rotulo: 'Chamados' },
  { para: '/admin/clientes',                icone: 'pessoas', rotulo: 'Clientes' },
  { para: '/admin/agenda',                  icone: 'agenda',  rotulo: 'Agenda' },
  { para: '/admin/maquinas',                icone: 'monitor', rotulo: 'Máquinas' }
];

const CABECALHOS = {
  '/admin':          ['Visão geral', 'Situação da operação de suporte em tempo real.'],
  '/admin/chamados': ['Chamados', 'Fila completa com filtros por cliente, prioridade e status.'],
  '/admin/clientes': ['Clientes', 'Usuários com acesso à central, por empresa.'],
  '/admin/agenda':   ['Agenda', 'Visitas técnicas e reuniões de todos os clientes.'],
  '/admin/maquinas': ['Máquinas', 'Inventário por empresa, com rede e acesso remoto.']
};

export default function LayoutAdmin() {
  const { perfil } = useSessao();
  const { pathname } = useLocation();
  const chave = pathname.replace(/\/+$/, '') || '/admin';
  const [titulo, subtitulo] = CABECALHOS[chave] || CABECALHOS['/admin'];

  return (
    <Shell
      variante="admin"
      itens={ITENS}
      rodape={{ rotulo: 'EQUIPE', valor: 'Fonsetech TI', dica: 'Suporte N1 · N2 · N3' }}
      cabecalho={
        <Cabecalho
          titulo={titulo}
          subtitulo={subtitulo}
          nome={perfil?.nome}
          detalhe="Administrador"
          tomAvatar="admin"
        />
      }
    />
  );
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Shell from './Shell.jsx';
import { titulo as tituloAba } from '../ui/marca.js';
import Cabecalho from './Cabecalho.jsx';
import { useSessao } from '../auth/SessaoProvider.jsx';

const ITENS = [
  { para: '/admin',              fim: true, icone: 'grade',   rotulo: 'Visão geral' },
  { para: '/admin/chamados',                icone: 'ticket',  rotulo: 'Chamados' },
  { para: '/admin/clientes',                icone: 'pessoas', rotulo: 'Clientes' },
  { para: '/admin/agenda',                  icone: 'agenda',  rotulo: 'Agenda' },
  { para: '/admin/maquinas',                icone: 'monitor', rotulo: 'Máquinas' },
  { para: '/admin/configuracoes',           icone: 'engrenagem', rotulo: 'Configurações do site' }
];

const CABECALHOS = {
  '/admin':          ['Visão geral', 'Situação da operação de suporte em tempo real.'],
  '/admin/chamados': ['Chamados', 'Fila completa com filtros por cliente, prioridade e status.'],
  '/admin/clientes': ['Clientes', 'Usuários com acesso ao FonseDesk, por empresa.'],
  '/admin/agenda':   ['Agenda', 'Visitas técnicas e reuniões de todos os clientes.'],
  '/admin/maquinas': ['Máquinas', 'Inventário por empresa, com rede e acesso remoto.'],
  '/admin/configuracoes': ['Configurações do site', 'Imagens da landing page, trocadas sem nova publicação.']
};

export default function LayoutAdmin() {
  const { perfil } = useSessao();
  const { pathname } = useLocation();
  const chave = pathname.replace(/\/+$/, '') || '/admin';
  const [titulo, subtitulo] = CABECALHOS[chave] || CABECALHOS['/admin'];

  useEffect(() => { document.title = tituloAba(titulo); }, [titulo]);

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

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Shell from './Shell.jsx';
import { titulo as tituloAba } from '../ui/marca.js';
import Cabecalho from './Cabecalho.jsx';
import { useSessao } from '../auth/SessaoProvider.jsx';

const ITENS = [
  { para: '/admin',              fim: true, icone: 'grade',   rotulo: 'Visão geral' },
  { para: '/admin/chamados',                icone: 'ticket',  rotulo: 'Chamados' },
  { para: '/admin/clientes',                icone: 'predio',  rotulo: 'Clientes' },
  { para: '/admin/crm',                     icone: 'funil',   rotulo: 'CRM Comercial' },
  { para: '/admin/agenda',                  icone: 'agenda',  rotulo: 'Agenda' },
  { para: '/admin/financeiro',              icone: 'cifrao',  rotulo: 'Financeiro' },
  { para: '/admin/conteudo',                icone: 'curso',   rotulo: 'Cursos & Downloads' },
  { para: '/admin/maquinas',                icone: 'monitor', rotulo: 'Máquinas' },
  { para: '/admin/configuracoes',           icone: 'engrenagem', rotulo: 'Configurações do site' }
];

const CABECALHOS = {
  '/admin':              ['Visão geral', 'Situação da operação de suporte em tempo real.'],
  '/admin/chamados':     ['Chamados', 'Fila completa com filtros por cliente, prioridade e status.'],
  '/admin/clientes':     ['Gestão de Clientes & Empresas', 'Cadastros completos, usuários de cada empresa e visão 360º.'],
  '/admin/crm':          ['CRM & Funil Comercial', 'Pipeline de leads, propostas comerciais e conversão em 1 clique.'],
  '/admin/agenda':       ['Agenda Técnica', 'Visitas presenciais e reuniões com controle total pelo administrador.'],
  '/admin/financeiro':   ['Financeiro & Faturamento', 'Contas a receber, cobrança de atendimentos e planos contratados.'],
  '/admin/conteudo':     ['Cursos & Downloads', 'Gestão de apostilas, apresentações e softwares com regras por empresa e plano.'],
  '/admin/maquinas':     ['Máquinas', 'Inventário por empresa, com rede e acesso remoto.'],
  '/admin/configuracoes':['Configurações do site', 'Imagens da landing page, trocadas sem nova publicação.']
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

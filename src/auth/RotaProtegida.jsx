import { Navigate } from 'react-router-dom';
import { useSessao } from './SessaoProvider.jsx';
import SemAcesso from './SemAcesso.jsx';
import { Carregando } from '../ui/Estado.jsx';

/**
 * Guarda de rota por papel.
 * IMPORTANTE: isto e conveniencia de navegacao, nao seguranca.
 * O bloqueio real dos dados e o RLS no Supabase - um cliente que
 * forcasse /admin veria as telas vazias, porque as consultas
 * retornam apenas o que a policy autoriza.
 */
// 'cliente_admin' e uma variante de 'cliente' (gerencia a equipe da propria
// empresa), nao uma area separada — a guarda de /dashboard (papel="cliente")
// precisa aceitar os dois. Comparar com !== deixava cliente_admin preso num
// loop: barrado em /dashboard, redirecionado para... /dashboard.
const PAPEIS_PERMITIDOS = {
  cliente: ['cliente', 'cliente_admin'],
  admin: ['admin']
};

export default function RotaProtegida({ papel, children }) {
  const { carregando, autenticado, perfil, erro } = useSessao();

  if (carregando) return <Carregando altura="100vh" texto="Verificando acesso..." />;

  // autenticado sem perfil valido: tela com saida (sair da conta / voltar ao site)
  if (autenticado && !perfil) return <SemAcesso mensagem={erro} />;

  if (!perfil) return <Navigate to="/login" replace />;

  if (papel && !PAPEIS_PERMITIDOS[papel]?.includes(perfil.role)) {
    return <Navigate to={perfil.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

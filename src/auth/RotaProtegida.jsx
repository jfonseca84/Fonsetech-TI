import { Navigate } from 'react-router-dom';
import { useSessao } from './SessaoProvider.jsx';
import { Carregando, Erro } from '../ui/Estado.jsx';

/**
 * Guarda de rota por papel.
 * IMPORTANTE: isto e conveniencia de navegacao, nao seguranca.
 * O bloqueio real dos dados e o RLS no Supabase - um cliente que
 * forcasse /admin veria as telas vazias, porque as consultas
 * retornam apenas o que a policy autoriza.
 */
export default function RotaProtegida({ papel, children }) {
  const { carregando, perfil, erro } = useSessao();

  if (carregando) return <Carregando altura="100vh" texto="Verificando acesso..." />;

  if (erro && !perfil) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 30 }}>
        <div style={{ maxWidth: 420 }}><Erro mensagem={erro} /></div>
      </div>
    );
  }

  if (!perfil) return <Navigate to="/login" replace />;

  if (papel && perfil.role !== papel) {
    return <Navigate to={perfil.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

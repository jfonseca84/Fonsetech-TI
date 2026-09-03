import { Routes, Route, Navigate } from 'react-router-dom';
import { SessaoProvider, useSessao } from './auth/SessaoProvider.jsx';
import RotaProtegida from './auth/RotaProtegida.jsx';
import LayoutCliente from './layout/LayoutCliente.jsx';
import LayoutAdmin from './layout/LayoutAdmin.jsx';
import Login from './telas/Login.jsx';

import VisaoGeral from './telas/cliente/VisaoGeral.jsx';
import MeusChamados from './telas/cliente/MeusChamados.jsx';
import AbrirChamado from './telas/cliente/AbrirChamado.jsx';
import Agendamentos from './telas/cliente/Agendamentos.jsx';
import Cursos from './telas/cliente/Cursos.jsx';
import Downloads from './telas/cliente/Downloads.jsx';
import MinhaEmpresa from './telas/cliente/MinhaEmpresa.jsx';

import VisaoGeralAdmin from './telas/admin/VisaoGeralAdmin.jsx';
import ChamadosAdmin from './telas/admin/ChamadosAdmin.jsx';
import Clientes from './telas/admin/Clientes.jsx';
import AgendaAdmin from './telas/admin/AgendaAdmin.jsx';
import Maquinas from './telas/admin/Maquinas.jsx';

import { Carregando } from './ui/Estado.jsx';

/** Decide o destino conforme o papel carregado do perfil. */
function Raiz() {
  const { carregando, perfil } = useSessao();
  if (carregando) return <Carregando altura="100vh" texto="Verificando acesso..." />;
  if (!perfil) return <Navigate to="/login" replace />;
  return <Navigate to={perfil.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

/** Quem já está autenticado não volta ao login. */
function LoginOuPainel() {
  const { carregando, perfil } = useSessao();
  if (carregando) return <Carregando altura="100vh" texto="Verificando acesso..." />;
  if (perfil) return <Navigate to={perfil.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <Login />;
}

export default function App() {
  return (
    <SessaoProvider>
      <Routes>
        <Route path="/" element={<Raiz />} />
        <Route path="/login" element={<LoginOuPainel />} />

        {/* Área do cliente. O RLS é a barreira real dos dados;
            a guarda apenas evita renderizar tela indevida. */}
        <Route
          path="/dashboard"
          element={<RotaProtegida papel="cliente"><LayoutCliente /></RotaProtegida>}
        >
          <Route index element={<VisaoGeral />} />
          <Route path="chamados" element={<MeusChamados />} />
          <Route path="novo" element={<AbrirChamado />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="cursos" element={<Cursos />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="empresa" element={<MinhaEmpresa />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Área administrativa. Cliente autenticado que tentar /admin
            é devolvido ao próprio painel pelo RotaProtegida. */}
        <Route
          path="/admin"
          element={<RotaProtegida papel="admin"><LayoutAdmin /></RotaProtegida>}
        >
          <Route index element={<VisaoGeralAdmin />} />
          <Route path="chamados" element={<ChamadosAdmin />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="agenda" element={<AgendaAdmin />} />
          <Route path="maquinas" element={<Maquinas />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessaoProvider>
  );
}

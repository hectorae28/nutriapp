import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider, PacienteProvider } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import NutriApp from './NutriApp';
import Login from './pages/Login';
import DashboardView from './views/DashboardView';
import PlannerView from './views/PlannerView';
import TablesView from './views/TablesView';
import CatalogoAdminView from './views/CatalogoAdminView';
import ReportsView from './views/ReportsView';
import ProfileView from './views/ProfileView';
import PacientesView from './views/PacientesView';
import PacienteDetalleView from './views/PacienteDetalleView';
import PlanEditorView from './views/PlanEditorView';
import RecuperarPasswordView from './views/RecuperarPasswordView';
import ResetPasswordView from './views/ResetPasswordView';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedGroups }) {
  const { user, groups, loading, isAdmin, isNutricionista, isSecretario } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedGroups && !isAdmin && !allowedGroups.some((g) => groups.includes(g))) {
    // Redirigir a la home de su rol
    if (isNutricionista) return <Navigate to="/dashboard" replace />;
    if (isSecretario) return <Navigate to="/pacientes" replace />;
    return <Navigate to="/planner" replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading, isNutricionista, isAdmin, isSecretario } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (isNutricionista || isAdmin) return <Navigate to="/dashboard" replace />;
  if (isSecretario) return <Navigate to="/pacientes" replace />;
  return <Navigate to="/planner" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PacienteProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-password" element={<RecuperarPasswordView />} />
            <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordView />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <NutriApp />
                </ProtectedRoute>
              }
            >
              <Route index element={<RootRedirect />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin']}>
                    <DashboardView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="planner"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Paciente', 'Admin']}>
                    <PlannerView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tablas"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin']}>
                    <TablesView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tablas/admin"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin']}>
                    <CatalogoAdminView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reportes"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Paciente', 'Admin']}>
                    <ReportsView />
                  </ProtectedRoute>
                }
              />
              <Route path="perfil" element={<ProfileView />} />
              <Route
                path="pacientes"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin', 'Secretario']}>
                    <PacientesView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pacientes/:id"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin', 'Secretario']}>
                    <PacienteDetalleView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pacientes/:id/plan-editor"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin']}>
                    <PlanEditorView />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PacienteProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider, PacienteProvider } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import NutriApp from './NutriApp';
import Login from './pages/Login';
import DashboardView from './views/DashboardView';
import PlannerView from './views/PlannerView';
import TablesView from './views/TablesView';
import ReportsView from './views/ReportsView';
import ProfileView from './views/ProfileView';
import PacientesView from './views/PacientesView';
import PacienteDetalleView from './views/PacienteDetalleView';
import PlanEditorView from './views/PlanEditorView';
import PlantillasView from './views/PlantillasView';
import PlantillaEditorView from './views/PlantillaEditorView';

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
  const { user, groups, loading, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedGroups && !isAdmin && !allowedGroups.some((g) => groups.includes(g))) {
    return <Navigate to="/planner" replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading, isNutricionista, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isNutricionista || isAdmin ? '/dashboard' : '/planner'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PacienteProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

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
              <Route path="planner" element={<PlannerView />} />
              <Route path="tablas" element={<TablesView />} />
              <Route path="reportes" element={<ReportsView />} />
              <Route path="perfil" element={<ProfileView />} />
              <Route
                path="pacientes"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin']}>
                    <PacientesView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pacientes/:id"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin']}>
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
              <Route
                path="plantillas"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin']}>
                    <PlantillasView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="plantillas/editor"
                element={
                  <ProtectedRoute allowedGroups={['Nutricionista', 'Admin']}>
                    <PlantillaEditorView />
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

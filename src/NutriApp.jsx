import { ThemeProvider, NavProvider, useNav } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import PlannerView from './views/PlannerView';
import TablesView from './views/TablesView';
import ReportsView from './views/ReportsView';
import ProfileView from './views/ProfileView';

function NutriAppInner() {
  const { view } = useNav();

  const views = {
    planner: PlannerView,
    tables: TablesView,
    reports: ReportsView,
    profile: ProfileView,
  };

  const View = views[view] || PlannerView;

  return (
    <div className="na-app-layout">
      <Sidebar />
      <main className="na-main">
        <View />
      </main>
      <BottomNav />
    </div>
  );
}

export default function NutriApp() {
  return (
    <ThemeProvider>
      <NavProvider>
        <NutriAppInner />
      </NavProvider>
    </ThemeProvider>
  );
}

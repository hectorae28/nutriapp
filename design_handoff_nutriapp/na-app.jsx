/* ── NutriApp: Main App ─────────────────────────────────── */

function NutriApp() {
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
      <Sidebar/>
      <main className="na-main">
        <View/>
      </main>
      <BottomNav/>
    </div>
  );
}

function AppRoot() {
  return (
    <ThemeProvider>
      <NavProvider>
        <NutriApp/>
      </NavProvider>
    </ThemeProvider>
  );
}

const naRoot = ReactDOM.createRoot(document.getElementById('root'));
naRoot.render(<AppRoot/>);

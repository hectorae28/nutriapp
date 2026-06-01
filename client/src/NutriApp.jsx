import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

export default function NutriApp() {
  return (
    <div className="na-app-layout">
      <Sidebar />
      <main className="na-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

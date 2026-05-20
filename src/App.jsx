import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import PlanAlimentacion from "./pages/PlanAlimentacion";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 flex flex-col">
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/planalimentacion" replace />} />
        <Route path="/planalimentacion" element={<PlanAlimentacion />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/planalimentacion" replace />} />
      </Routes>
    </div>
  );
}

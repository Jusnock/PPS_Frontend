import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RutaProtegida from './components/RutaProtegida'; // <-- Importamos el guardia

// Tus importaciones de páginas...
import Login from './pages/Login';
import LayoutCorporativo from './pages/LayoutCorporativo';
import Dashboard from './pages/Dashboard';
import Gestion from './pages/Gestion';
import Campanas from './pages/Campanas';
import Quiz from './pages/Quiz';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/login" element={<Login />} />
        
        
        <Route element={<LayoutCorporativo />}>
          
          
          <Route element={<RutaProtegida rolesPermitidos={['SUPERADMIN', 'ADMIN_EMPRESA']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/gestion" element={<Gestion />} />
            <Route path="/campanas" element={<Campanas />} />
          </Route>

          
          <Route element={<RutaProtegida rolesPermitidos={['SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO']} />}>
            <Route path="/quiz" element={<Quiz />} />
          </Route>

        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
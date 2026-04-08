import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Quiz from './pages/Quiz';
import Dashboard from './pages/Dashboard';
import Gestion from './pages/Gestion';
import Campanas from './pages/Campanas';

// 1. IMPORTAMOS EL NUEVO DISEÑO
import LayoutCorporativo from './pages/LayoutCorporativo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* 2. ENVOLVEMOS TUS RUTAS CON EL NUEVO DISEÑO CORPORATIVO */}
        <Route element={<LayoutCorporativo />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gestion" element={<Gestion />} /> 
          <Route path="/campanas" element={<Campanas />} />
          <Route path="/quiz" element={<Quiz />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
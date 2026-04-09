import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../api/axios';

export default function RutaProtegida({ rolesPermitidos }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Verificamos quién es el usuario antes de renderizar la página
    api.get('/users/me')
      .then(res => {
        setUsuario(res.data);
        setCargando(false);
      })
      .catch(() => {
        // Si hay error (token vencido), dejamos de cargar
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 1. Si no hay usuario logueado, patada al Login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si el rol del usuario NO está en la lista de permitidos para esta ruta
  if (!rolesPermitidos.includes(usuario.rol)) {
    // Si es un empleado intentando entrar a zona admin, lo mandamos a sus entrenamientos
    if (usuario.rol === 'EMPLEADO') {
      return <Navigate to="/quiz" replace />;
    }
    // Si es un admin intentando entrar a otro lado raro, al dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Si tiene permiso, renderizamos la ruta hija que solicitó
  return <Outlet />;
}
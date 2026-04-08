import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function LayoutCorporativo() {
  const location = useLocation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Averiguamos quién es el usuario para ocultar/mostrar menús
    api.get('/users/me')
      .then(res => {
        setUsuario(res.data);
        setCargando(false);
      })
      .catch(() => {
        handleLogout();
      });
  }, []);

  const isActive = (path) => location.pathname.includes(path);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  if (cargando) {
    return <div className="h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  // Verificamos si es un administrador (SuperAdmin o Admin Empresa)
  const esAdmin = usuario.rol === 'SUPERADMIN' || usuario.rol === 'ADMIN_EMPRESA';

  return (
    // h-screen y overflow-hidden evitan que la pantalla crezca y exija scroll
    <div className="h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR (Menú Lateral) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-full transition-all shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-3 shadow-sm">
            <span className="font-bold text-white leading-none">S</span>
          </div>
          <span className="font-semibold tracking-tight text-lg">Security<span className="font-light">Console</span></span>
        </div>

        {/* El menú principal con scroll interno si hay muchos botones */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Panel Principal</div>
          
          {/* DASHBOARD Y GESTIÓN: SOLO VISIBLE PARA ADMINS */}
          {esAdmin && (
            <>
              <Link to="/dashboard" className={`flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive('/dashboard') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Dashboard
              </Link>
              
              <Link to="/gestion" className={`flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive('/gestion') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Gestión
              </Link>
            </>
          )}

          {/* SIMULACIONES: EL ADMIN CREA, EL EMPLEADO JUEGA */}
          {esAdmin ? (
            <Link to="/campanas" className={`flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive('/campanas') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Creador de Campañas
            </Link>
          ) : (
            <Link to="/quiz" className={`flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive('/quiz') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Mis Entrenamientos
            </Link>
          )}
        </nav>

        {/* BOTÓN CERRAR SESIÓN ANCLADO AL FONDO */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button onClick={handleLogout} className="flex items-center w-full px-2 py-2 text-sm font-medium text-slate-400 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            {location.pathname.replace('/', '') || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-slate-700">{usuario.nombre}</span>
              <span className="text-xs text-slate-500 font-mono">{usuario.rol}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-700">{usuario.nombre.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Contenedor del contenido con scroll propio */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto pb-12">
            <Outlet />
          </div>
        </div>
      </main>
      
    </div>
  );
}
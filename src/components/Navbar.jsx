import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Pedimos el usuario exactamente igual que en el Dashboard (sin forzar cabeceras)
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me');
        setUsuario(res.data);
      } catch (error) {
        console.error("Error al cargar usuario en Navbar:", error);
      }
    };

    fetchUser();
  }, [location.pathname]); // Escucha si cambiamos de página para actualizarse

 const handleLogout = () => {
    localStorage.removeItem('access_token'); 
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path 
      ? "bg-blue-50 text-blue-700" 
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900";
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Lado Izquierdo: Logo y Enlaces */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 mr-8">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg leading-none">C</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg tracking-tight hidden md:block">
                Portal de Seguridad
              </span>
            </div>

            {/* Enlaces: Solo se dibujan cuando tenemos los datos del usuario */}
            {usuario && (
              <div className="hidden sm:flex sm:space-x-2">
                <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard')}`}>
                  Panel Principal
                </Link>

                {usuario.rol === 'SUPERADMIN' && (
                  <>
                    <Link to="/gestion" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/gestion')}`}>
                      Instituciones
                    </Link>
                    <Link to="/campanas" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/campanas')}`}>
                      Banco de Correos
                    </Link>
                  </>
                )}

                {usuario.rol === 'ADMIN_EMPRESA' && (
                  <>
                    <Link to="/gestion" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/gestion')}`}>
                      Colaboradores
                    </Link>
                    <Link to="/campanas" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/campanas')}`}>
                      Campañas
                    </Link>
                  </>
                )}

                {usuario.rol === 'EMPLEADO' && (
                  <Link to="/quiz" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/quiz')}`}>
                    Simulador
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Lado Derecho: Info del Usuario y Logout */}
          <div className="flex items-center gap-4">
            {usuario ? (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">{usuario.nombre}</span>
                  <span className="text-xs text-gray-500 capitalize">{usuario.rol.replace('_', ' ').toLowerCase()}</span>
                </div>
                
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200">
                  {usuario.nombre.charAt(0).toUpperCase()}
                </div>

                <div className="border-l border-gray-200 h-6 mx-2 hidden sm:block"></div>
              </>
            ) : (
              <div className="text-sm text-blue-600 animate-pulse font-medium bg-blue-50 px-3 py-1 rounded-md">
                Verificando...
              </div>
            )}

            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-red-600 p-2 transition-colors flex items-center gap-1 rounded-md hover:bg-red-50"
              title="Cerrar Sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
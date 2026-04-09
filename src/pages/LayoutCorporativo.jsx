import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function LayoutCorporativo() {
  const location = useLocation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Estados para el cambio de contraseña
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
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

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword('');

    if (nuevaPassword.length < 6) {
      return setErrorPassword('La contraseña debe tener al menos 6 caracteres.');
    }
    if (nuevaPassword !== confirmarPassword) {
      return setErrorPassword('Las contraseñas no coinciden.');
    }

    try {
      setGuardandoPassword(true);
      await api.put('/users/me/password', { new_password: nuevaPassword });
      
      setUsuario({ ...usuario, debe_cambiar_password: false });
      setGuardandoPassword(false);
    } catch (err) {
      setErrorPassword('Ocurrió un error al guardar. Revisa tu conexión.');
      setGuardandoPassword(false);
    }
  };

  if (cargando) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cpce-blue"></div>
      </div>
    );
  }

  if (!usuario) return null;

  // =========================================================================
  // EL MURO DE SEGURIDAD (Con colores CPCE)
  // =========================================================================
  if (usuario.debe_cambiar_password) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in relative overflow-hidden">
          {/* Decoración superior */}
          <div className="absolute top-0 left-0 w-full h-2 bg-cpce-blue"></div>
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-cpce-blue rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Actualiza tu contraseña</h2>
          <p className="text-sm text-slate-500 text-center mb-8">Por políticas de seguridad, es obligatorio que cambies tu contraseña temporal antes de acceder a la plataforma.</p>
          
          {errorPassword && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r">
              {errorPassword}
            </div>
          )}

          <form onSubmit={handleCambiarPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
              <input 
                type="password" 
                required
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-cpce-blue outline-none" 
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
              <input 
                type="password" 
                required
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-cpce-blue outline-none" 
                placeholder="Repite tu contraseña"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={guardandoPassword}
              className={`w-full py-3 rounded-md text-white font-medium flex justify-center items-center transition-colors ${guardandoPassword ? 'bg-blue-400 cursor-not-allowed' : 'bg-cpce-blue hover:bg-cpce-dark cursor-pointer'}`}
            >
              {guardandoPassword ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Guardar y Continuar'}
            </button>
          </form>

          <button onClick={handleLogout} className="mt-6 w-full text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
            Cerrar sesión y hacerlo más tarde
          </button>
        </div>
      </div>
    );
  }
  // =========================================================================

  const esAdmin = usuario.rol === 'SUPERADMIN' || usuario.rol === 'ADMIN_EMPRESA';

  return (
    <div className="h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR ESTILO CPCE */}
      <aside className="w-64 bg-cpce-blue text-white flex flex-col h-full transition-all shrink-0 shadow-xl z-20 relative">
        {/* Cabecera blanca con logo */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-cpce-dark shrink-0 bg-white">
          {/* Si la imagen no carga, muestra texto de respaldo */}
          <img 
            src="/logo-cpce.png" 
            alt="CPCE Mendoza" 
            className="h-12 object-contain object-left" 
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.nextSibling.style.display = 'block'; 
            }} 
          />
          <span className="text-cpce-blue font-bold tracking-tight text-xl hidden">CPCE Mendoza</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4 px-2">Capacitación</div>
          
          {esAdmin && (
            <>
              <Link to="/dashboard" className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all ${isActive('/dashboard') ? 'bg-white text-cpce-blue shadow-sm' : 'text-blue-100 hover:bg-cpce-dark hover:text-white'}`}>
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Dashboard
              </Link>
              
              <Link to="/gestion" className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all ${isActive('/gestion') ? 'bg-white text-cpce-blue shadow-sm' : 'text-blue-100 hover:bg-cpce-dark hover:text-white'}`}>
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Gestión
              </Link>
            </>
          )}

          {esAdmin ? (
            <Link to="/campanas" className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all ${isActive('/campanas') ? 'bg-white text-cpce-blue shadow-sm' : 'text-blue-100 hover:bg-cpce-dark hover:text-white'}`}>
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Creador de Campañas
            </Link>
          ) : (
            <Link to="/quiz" className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all ${isActive('/quiz') ? 'bg-white text-cpce-blue shadow-sm' : 'text-blue-100 hover:bg-cpce-dark hover:text-white'}`}>
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Mis Entrenamientos
            </Link>
          )}
        </nav>

        {/* CERRAR SESIÓN ESTILO CPCE */}
        <div className="p-4 border-t border-cpce-dark shrink-0 bg-cpce-dark/50">
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-blue-100 rounded-md hover:bg-cpce-red hover:text-white transition-colors cursor-pointer">
            <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <h1 className="text-xl font-bold text-slate-800 capitalize tracking-tight">
            {location.pathname.replace('/', '') || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-700">{usuario.nombre}</span>
              <span className="text-xs text-slate-500 font-mono tracking-wider">{usuario.rol}</span>
            </div>
            <div className="h-9 w-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-cpce-blue">{usuario.nombre.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto pb-12">
            <Outlet />
          </div>
        </div>
      </main>
      
    </div>
  );
}
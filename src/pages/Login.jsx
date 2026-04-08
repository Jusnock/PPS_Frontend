// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [paso, setPaso] = useState(1); 
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [usuarioData, setUsuarioData] = useState(null); 
  
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState(''); // <-- Nuevo estado para el mensaje verde
  const [cargando, setCargando] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParams = params.get("token");
    
    if (tokenParams) {
      localStorage.setItem("access_token", tokenParams); 
      verificarPerfil(tokenParams);
    }
  }, [location, navigate]);

  const verificarPerfil = async (tokenGuardado) => {
    try {
      const resUser = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${tokenGuardado}` }
      });
      
      if (resUser.data.debe_cambiar_password) {
        setUsuarioData(resUser.data);
        setPaso(2);
        setCargando(false);
      } else {
        redireccionarSegunRol(resUser.data.rol);
      }
    } catch (err) {
      setError('Error al verificar perfil.');
      setCargando(false);
    }
  };

  const redireccionarSegunRol = (rol) => {
    if (rol === 'EMPLEADO') navigate('/quiz', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');
    setCargando(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const tokenRecibido = response.data.access_token || response.data.token; 
      
      localStorage.setItem('access_token', tokenRecibido);
      await verificarPerfil(tokenRecibido);

    } catch (err) {
      setError('Credenciales inválidas o incorrectas.');
      setCargando(false);
    }
  };

const handleCambioPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);
    try {
      // 1. Recuperamos el token provisional que guardamos en el Paso 1
      const tokenGuardado = localStorage.getItem('access_token');

      // 2. Le enviamos la nueva contraseña AL BACKEND, pero esta vez con su credencial (Headers)
      await api.put('/users/change-password', 
        { nueva_password: nuevaPassword },
        { headers: { Authorization: `Bearer ${tokenGuardado}` } } // <-- ¡Faltaba esto!
      );
      
      // 3. ¡Éxito! Limpiamos todo y lo devolvemos al Login con mensaje verde
      localStorage.removeItem('access_token'); 
      setPaso(1); 
      setPassword(''); 
      setNuevaPassword(''); 
      setConfirmarPassword('');
      setMensajeExito('¡Contraseña actualizada! Por favor, inicia sesión con tu nueva clave.');
      setCargando(false);

      } catch (err) {
      // Hacemos que el error sea 100% transparente para ver de qué se queja FastAPI
      console.error("Error completo del backend:", err.response);
      const detalleError = err.response?.data?.detail;

      if (Array.isArray(detalleError)) {
        // Si FastAPI nos devuelve una lista de errores (Error 422 de Pydantic), la extraemos:
        const mensajeFastAPI = detalleError.map(e => `${e.loc[e.loc.length-1]}: ${e.msg}`).join(', ');
        setError(`Error del Backend -> ${mensajeFastAPI}`);
      } else if (typeof detalleError === 'string') {
        setError(detalleError);
      } else {
        setError('Ocurrió un error en el servidor al actualizar la contraseña.');
      }
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 p-6 md:p-12">
      <header className="flex justify-between items-center mb-12 border-b border-gray-200 pb-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center"><span className="text-white font-bold text-lg leading-none">C</span></div>
          <span className="font-semibold text-gray-900 tracking-tight text-lg">Consejo Profesional</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>Portal de Seguridad</div>
      </header>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center flex-1">
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-6"><span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Plataforma de Entrenamiento</span></div>
          <h1 className="text-5xl lg:text-6xl font-normal leading-tight tracking-tight text-gray-900 mb-6">Seguridad de la <br /><span className="font-semibold text-blue-600">Información.</span></h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-md">Accede a tu panel de control para gestionar campañas, revisar métricas de riesgo o completar tus simulaciones.</p>
        </div>

        <div className="bg-white p-8 sm:p-10 border border-gray-200 shadow-xl shadow-gray-200/50 rounded-2xl w-full max-w-md mx-auto transition-all duration-500">
          
          {paso === 1 ? (
            <div className="animate-fade-in">
              <h3 className="text-2xl font-medium mb-2 tracking-tight text-gray-900">Iniciar Sesión</h3>
              <p className="text-sm text-gray-500 mb-8">Ingresa tus credenciales corporativas.</p>
              
              {/* Mensajes de Error y Éxito */}
              {error && <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">{error}</div>}
              {mensajeExito && <div className="mb-6 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-r-md font-medium">{mensajeExito}</div>}
              
              <form onSubmit={handleManualLogin} className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" placeholder="usuario@consejo.org.ar" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={cargando} className="mt-4 bg-blue-600 text-white font-medium py-3 px-4 w-full rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-70">
                  {cargando ? 'Verificando...' : 'Acceder al Portal'}
                </button>
              </form>
              <div className="relative flex items-center justify-center mb-6"><span className="absolute bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wider">O ingreso directo</span><div className="w-full h-px bg-gray-200"></div></div>
              <button type="button" onClick={() => window.location.href = "http://localhost:8000/login"} className="bg-white text-gray-700 font-medium py-3 px-4 w-full rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition-colors flex justify-center items-center gap-3 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continuar con Google Workspace
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-4"><div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div></div>
              <h3 className="text-xl font-medium mb-2 tracking-tight text-center text-gray-900">Actualiza tu Seguridad</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">Has ingresado con una clave provisional. Por políticas de seguridad, debes crear una nueva contraseña.</p>
              
              {error && <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">{error}</div>}
              
              <form onSubmit={handleCambioPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                  <input type="password" required value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                  <input type="password" required value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={cargando} className="mt-6 bg-green-600 text-white font-medium py-3 px-4 w-full rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-70">
                  {cargando ? 'Actualizando...' : 'Guardar contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
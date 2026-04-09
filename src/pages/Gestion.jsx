import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Gestion() {
  const [usuario, setUsuario] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empleados, setEmpleados] = useState([]); 
  const [cargando, setCargando] = useState(true);

  // --- Sistema de Notificaciones Elegantes ---
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'exito' });
  const [confirmar, setConfirmar] = useState({ visible: false, mensaje: '', accion: null });

  const mostrarToast = (mensaje, tipo = 'exito') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast({ visible: false, mensaje: '', tipo: 'exito' }), 3000);
  };

  const pedirConfirmacion = (mensaje, accion) => {
    setConfirmar({ visible: true, mensaje, accion });
  };

  // --- Estados Super-Admin ---
  const [modalCrearEmpresa, setModalCrearEmpresa] = useState(false);
  const [formEmpresaNueva, setFormEmpresaNueva] = useState({ nombre: '', dominio_google: '' });
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [formEmpresaEditar, setFormEmpresaEditar] = useState({ nombre: '', dominio_google: '' });
  
  const [modoAdmin, setModoAdmin] = useState('CREAR'); 
  const [adminActual, setAdminActual] = useState(null);
  const [formAdmin, setFormAdmin] = useState({ nombre: '', email: '', password: '' });

  // --- Estados Admin Local (Empresa) ---
  const [modalEmpleado, setModalEmpleado] = useState(false);
  const [modoEmpleado, setModoEmpleado] = useState('CREAR');
  const [empleadoActual, setEmpleadoActual] = useState(null);
  const [formEmpleado, setFormEmpleado] = useState({ nombre: '', email: '', password: '' });

  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resUser = await api.get('/users/me');
      setUsuario(resUser.data);

      if (resUser.data.rol === 'SUPERADMIN') {
        const [resEmpresas, resUsers] = await Promise.all([
          api.get('/companies/'),
          api.get('/users/')
        ]);
        setEmpresas(resEmpresas.data);
        setEmpleados(resUsers.data); 
      } else if (resUser.data.rol === 'ADMIN_EMPRESA') {
        const resUsers = await api.get('/users/');
        const filtrados = resUsers.data.filter(u => u.company_id === resUser.data.company_id && u.rol !== 'SUPERADMIN');
        setEmpleados(filtrados);
      } else {
        navigate('/dashboard'); 
      }
      setCargando(false);
    } catch (err) {
      mostrarToast('Error crítico al cargar los datos.', 'error');
      setCargando(false);
    }
  };

  // ==========================================
  // LOGICA SUPER-ADMIN
  // ==========================================
  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    try {
      await api.post('/companies/', formEmpresaNueva);
      setFormEmpresaNueva({ nombre: '', dominio_google: '' });
      setModalCrearEmpresa(false);
      cargarDatos();
      mostrarToast('Institución creada correctamente');
    } catch (err) { mostrarToast(err.response?.data?.detail || 'Error al crear institución.', 'error'); }
  };

  const handleBorrarEmpresa = (id) => {
    pedirConfirmacion("¿Seguro que deseas eliminar esta institución y TODO su contenido permanentemente?", async () => {
      try {
        await api.delete(`/companies/${id}`);
        cargarDatos();
        mostrarToast('Institución eliminada');
      } catch (err) { mostrarToast('Error al eliminar.', 'error'); }
    });
  };

  const abrirModalGestion = (emp) => {
    setEmpresaActual(emp);
    setFormEmpresaEditar({ nombre: emp.nombre, dominio_google: emp.dominio_google });
    cancelarEdicionAdmin(); 
    setModalAbierto(true);
  };

  const cerrarModalGestion = () => {
    setModalAbierto(false);
    setEmpresaActual(null);
  };

  const handleEditarEmpresaModal = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/companies/${empresaActual.id}`, formEmpresaEditar);
      cargarDatos();
      mostrarToast('Datos de la institución actualizados');
    } catch (err) { mostrarToast('Error al actualizar la institución.', 'error'); }
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    try {
      if (modoAdmin === 'CREAR') {
        await api.post('/users/', { ...formAdmin, rol: 'ADMIN_EMPRESA', company_id: empresaActual.id });
        mostrarToast('Administrador registrado con éxito');
      } else {
        await api.put(`/users/${adminActual.id}`, { ...formAdmin, rol: 'ADMIN_EMPRESA' });
        mostrarToast('Acceso actualizado');
      }
      cancelarEdicionAdmin();
      cargarDatos(); 
    } catch (err) { mostrarToast(err.response?.data?.detail || 'Error al guardar el administrador.', 'error'); }
  };

  const handleBorrarAdmin = (id) => {
    pedirConfirmacion("¿Quitar a este administrador del sistema?", async () => {
      try {
        await api.delete(`/users/${id}`);
        cancelarEdicionAdmin();
        cargarDatos();
        mostrarToast('Administrador eliminado');
      } catch (err) { mostrarToast('Error al eliminar administrador.', 'error'); }
    });
  };

  const iniciarEdicionAdmin = (admin) => {
    setModoAdmin('EDITAR');
    setAdminActual(admin);
    setFormAdmin({ nombre: admin.nombre, email: admin.email, password: '' });
  };

  const cancelarEdicionAdmin = () => {
    setModoAdmin('CREAR');
    setAdminActual(null);
    setFormAdmin({ nombre: '', email: '', password: '' });
  };

  // ==========================================
  // LOGICA ADMIN EMPRESA 
  // ==========================================
  const abrirModalNuevoEmpleado = () => {
    setModoEmpleado('CREAR');
    setEmpleadoActual(null);
    setFormEmpleado({ nombre: '', email: '', password: '' });
    setModalEmpleado(true);
  };

  const iniciarEdicionEmpleado = (emp) => {
    setModoEmpleado('EDITAR');
    setEmpleadoActual(emp);
    setFormEmpleado({ nombre: emp.nombre, email: emp.email, password: '' }); 
    setModalEmpleado(true);
  };

  const cerrarModalEmpleado = () => {
    setModalEmpleado(false);
    setEmpleadoActual(null);
    setFormEmpleado({ nombre: '', email: '', password: '' });
  };

  const handleSubmitEmpleado = async (e) => {
    e.preventDefault();
    try {
      if (modoEmpleado === 'CREAR') {
        await api.post('/users/', { ...formEmpleado, rol: 'EMPLEADO' });
        mostrarToast('Empleado registrado exitosamente');
      } else {
        await api.put(`/users/${empleadoActual.id}`, { ...formEmpleado, rol: empleadoActual.rol });
        mostrarToast('Datos del empleado actualizados');
      }
      cerrarModalEmpleado();
      cargarDatos();
    } catch (err) { mostrarToast(err.response?.data?.detail || 'Error al guardar empleado.', 'error'); }
  };

  const handleBorrarEmpleado = (id) => {
    pedirConfirmacion("¿Dar de baja a este empleado permanentemente?", async () => {
      try {
        await api.delete(`/users/${id}`);
        cargarDatos();
        mostrarToast('Empleado dado de baja');
      } catch (err) { mostrarToast('Error al eliminar empleado.', 'error'); }
    });
  };

  // RENDER DE CARGA
  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cpce-blue"></div>
      </div>
    );
  }

  // ==========================================
  // RENDER COMPARTIDO: COMPONENTES FLOTANTES
  // ==========================================
  const NotificacionesUI = (
    <>
      {/* TOAST DE MENSAJES */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-5 py-3.5 rounded-md shadow-xl text-sm font-medium animate-fade-in transition-colors ${toast.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.tipo === 'exito' ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {toast.mensaje}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {confirmar.visible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden border-t-4 border-t-cpce-red">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 text-cpce-red flex items-center justify-center mx-auto mb-4 border border-red-100">
                 <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar Acción</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{confirmar.mensaje}</p>
            </div>
            <div className="flex border-t border-slate-100 bg-slate-50">
              <button onClick={() => setConfirmar({ visible: false, mensaje: '', accion: null })} className="flex-1 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors border-r border-slate-100 cursor-pointer">
                Cancelar
              </button>
              <button onClick={() => { confirmar.accion(); setConfirmar({ visible: false, mensaje: '', accion: null }); }} className="flex-1 px-4 py-3.5 text-sm font-semibold text-cpce-red hover:bg-red-50 transition-colors cursor-pointer">
                Sí, proceder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ==========================================
  // VISTA: SUPER-ADMIN
  // ==========================================
  if (usuario?.rol === 'SUPERADMIN') {
    const adminsDeEmpresaActual = empresaActual 
      ? empleados.filter(u => u.company_id === empresaActual.id && u.rol === 'ADMIN_EMPRESA')
      : [];

    return (
      <div className="animate-fade-in max-w-7xl mx-auto">
        {NotificacionesUI}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Directorio de Instituciones</h1>
            <p className="text-sm text-slate-500 mt-1">Gestión global de clientes y dominios autorizados.</p>
          </div>
          <button 
            onClick={() => setModalCrearEmpresa(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-cpce-blue rounded-md hover:bg-cpce-dark transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nueva Institución
          </button>
        </div>

        {/* Tabla Ancho Completo */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Institución</th>
                  <th className="px-6 py-4 font-bold">Dominio Principal</th>
                  <th className="px-6 py-4 font-bold">ID Ref.</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {empresas.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-cpce-blue font-bold text-xs">
                        {emp.nombre.charAt(0).toUpperCase()}
                      </div>
                      {emp.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 font-mono">
                        @{emp.dominio_google}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{String(emp.id).padStart(3, '0')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2"> 
                        <button onClick={() => abrirModalGestion(emp)} className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-blue bg-white border border-cpce-blue hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                          Gestionar
                        </button>
                        <button onClick={() => handleBorrarEmpresa(emp.id)} className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-red hover:bg-red-50 transition-colors cursor-pointer">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {empresas.length === 0 && (
                  <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 text-sm">No hay instituciones registradas en el sistema.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: NUEVA EMPRESA */}
        {modalCrearEmpresa && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-cpce-blue">
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Alta de Institución</h2>
                <button onClick={() => setModalCrearEmpresa(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleCrearEmpresa} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Comercial</label>
                  <input type="text" required value={formEmpresaNueva.nombre} onChange={e => setFormEmpresaNueva({...formEmpresaNueva, nombre: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all" placeholder="Ej: Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Dominio (Google Workspace)</label>
                  <input type="text" required value={formEmpresaNueva.dominio_google} onChange={e => setFormEmpresaNueva({...formEmpresaNueva, dominio_google: e.target.value.toLowerCase()})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all font-mono" placeholder="acme.com" />
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="submit" className="flex-1 bg-cpce-blue text-white font-semibold text-sm py-2.5 px-4 rounded-md hover:bg-cpce-dark transition-colors cursor-pointer shadow-sm">Dar de Alta</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: GESTION DE EMPRESA EXISTENTE */}
        {modalAbierto && empresaActual && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 md:p-8 animate-fade-in">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-t-4 border-t-cpce-blue">
              
              <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Gestión de Institución</h2>
                  <p className="text-sm text-cpce-blue font-semibold">{empresaActual.nombre}</p>
                </div>
                <button onClick={cerrarModalGestion} className="text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 bg-white">
                
                {/* Modificar Empresa */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Configuración General</h3>
                  <form onSubmit={handleEditarEmpresaModal} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Comercial</label>
                      <input type="text" required value={formEmpresaEditar.nombre} onChange={e => setFormEmpresaEditar({...formEmpresaEditar, nombre: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Dominio</label>
                      <input type="text" required value={formEmpresaEditar.dominio_google} onChange={e => setFormEmpresaEditar({...formEmpresaEditar, dominio_google: e.target.value.toLowerCase()})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all font-mono" />
                    </div>
                    <button type="submit" className="w-full mt-2 bg-cpce-blue text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-cpce-dark shadow-sm transition-colors cursor-pointer">
                      Guardar Cambios
                    </button>
                  </form>
                </div>

                {/* Admins de la Empresa */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Administradores Locales</h3>
                  
                  <div className="mb-6 max-h-40 overflow-y-auto border border-slate-200 rounded-md">
                    <ul className="divide-y divide-slate-100">
                      {adminsDeEmpresaActual.map(admin => (
                        <li key={admin.id} className={`p-3 flex justify-between items-center text-sm hover:bg-slate-50 ${adminActual?.id === admin.id ? 'bg-blue-50/50' : ''}`}>
                          <div>
                            <p className="font-semibold text-slate-900">{admin.nombre}</p>
                            <p className="text-xs text-slate-500 font-mono">{admin.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => iniciarEdicionAdmin(admin)} className="text-xs text-cpce-blue hover:underline font-semibold cursor-pointer">Editar</button>
                            <span className="text-slate-300">|</span>
                            <button type="button" onClick={() => handleBorrarAdmin(admin.id)} className="text-xs text-cpce-red hover:underline font-semibold cursor-pointer">Quitar</button>
                          </div>
                        </li>
                      ))}
                      {adminsDeEmpresaActual.length === 0 && (
                        <li className="p-4 text-center text-xs text-slate-500">Sin administradores asignados.</li>
                      )}
                    </ul>
                  </div>

                  <form onSubmit={handleSubmitAdmin} className={`space-y-3 p-4 rounded-md border transition-colors ${modoAdmin === 'EDITAR' ? 'border-cpce-blue bg-blue-50/30' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                      {modoAdmin === 'EDITAR' ? 'Modificar Acceso' : 'Otorgar Acceso'}
                    </h4>
                    <input type="text" required value={formAdmin.nombre} onChange={e => setFormAdmin({...formAdmin, nombre: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-cpce-blue focus:border-cpce-blue" placeholder="Nombre completo" />
                    <input type="email" required value={formAdmin.email} onChange={e => setFormAdmin({...formAdmin, email: e.target.value.toLowerCase()})} className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-cpce-blue focus:border-cpce-blue font-mono" placeholder="admin@institucion.com" />
                    <input type="password" required={modoAdmin === 'CREAR'} value={formAdmin.password} onChange={e => setFormAdmin({...formAdmin, password: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-cpce-blue focus:border-cpce-blue" placeholder={modoAdmin === 'EDITAR' ? "Nueva contraseña (opcional)" : "Contraseña temporal"} />
                    
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 text-white font-semibold text-xs py-2 px-3 rounded-md bg-cpce-blue hover:bg-cpce-dark transition-colors cursor-pointer shadow-sm">
                        {modoAdmin === 'EDITAR' ? 'Actualizar' : 'Registrar'}
                      </button>
                      {modoAdmin === 'EDITAR' && (
                        <button type="button" onClick={cancelarEdicionAdmin} className="bg-white border border-slate-300 text-slate-700 font-semibold text-xs py-2 px-3 rounded-md hover:bg-slate-50 cursor-pointer">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VISTA: ADMIN EMPRESA (EMPLEADOS)
  // ==========================================
  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {NotificacionesUI}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Empleados</h1>
          <p className="text-sm text-slate-500 mt-1">Nómina del personal autorizado para participar en las simulaciones.</p>
        </div>
        <button 
          onClick={abrirModalNuevoEmpleado}
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-cpce-blue rounded-md hover:bg-cpce-dark transition-colors shadow-sm cursor-pointer"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Empleado
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Empleados</p>
            <p className="text-2xl font-bold text-slate-900">{empleados.length}</p>
          </div>
          <div className="h-10 w-10 bg-blue-50 text-cpce-blue border border-blue-100 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Empleado</th>
                <th className="px-6 py-4 font-bold">Correo Corporativo</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {empleados.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-16 text-center text-slate-500 text-sm">Aún no hay empleados registrados en tu organización.</td></tr>
              ) : (
                empleados.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-cpce-blue font-bold text-xs">
                        {emp.nombre.charAt(0).toUpperCase()}
                      </div>
                      {emp.nombre}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{emp.email}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                        <button onClick={() => iniciarEdicionEmpleado(emp)} className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-blue bg-white border border-cpce-blue hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                          Editar
                        </button>
                        <button onClick={() => handleBorrarEmpleado(emp.id)} className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-red hover:bg-red-50 transition-colors cursor-pointer">
                          Baja
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ALTA / EDICIÓN DE EMPLEADO */}
      {modalEmpleado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-cpce-blue">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {modoEmpleado === 'EDITAR' ? 'Modificar Empleado' : 'Alta de Empleado'}
              </h2>
              <button onClick={cerrarModalEmpleado} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmitEmpleado} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" required value={formEmpleado.nombre} onChange={e => setFormEmpleado({...formEmpleado, nombre: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all" placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Correo Corporativo</label>
                <input type="email" required value={formEmpleado.email} onChange={e => setFormEmpleado({...formEmpleado, email: e.target.value.toLowerCase()})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all font-mono" placeholder="juan@institucion.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{modoEmpleado === 'EDITAR' ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}</label>
                <input type="password" required={modoEmpleado === 'CREAR'} value={formEmpleado.password} onChange={e => setFormEmpleado({...formEmpleado, password: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all" placeholder="••••••••" />
              </div>
              
              <div className="mt-8 flex gap-3 pt-2">
                <button type="button" onClick={cerrarModalEmpleado} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-sm py-2.5 px-4 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-cpce-blue text-white font-semibold text-sm py-2.5 px-4 rounded-md hover:bg-cpce-dark transition-colors shadow-sm cursor-pointer">
                  {modoEmpleado === 'EDITAR' ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
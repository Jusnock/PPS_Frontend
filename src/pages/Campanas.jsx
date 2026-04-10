import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Campanas() {
  const [usuario, setUsuario] = useState(null);
  const [tabActual, setTabActual] = useState('ESCENARIOS');
  
  const [escenarios, setEscenarios] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- Sistema de Notificaciones ---
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'exito' });
  const [confirmar, setConfirmar] = useState({ visible: false, mensaje: '', accion: null });

  const mostrarToast = (mensaje, tipo = 'exito') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast({ visible: false, mensaje: '', tipo: 'exito' }), 3000);
  };

  const pedirConfirmacion = (mensaje, accion) => {
    setConfirmar({ visible: true, mensaje, accion });
  };

  // --- Estados Escenarios (Bandeja de Entrada) ---
  const [panelEscenarioOpen, setPanelEscenarioOpen] = useState(false);
  const [modoEscenario, setModoEscenario] = useState('CREAR');
  const [escenarioActual, setEscenarioActual] = useState(null);
  const [formEscenario, setFormEscenario] = useState({
    titulo_interno: '', remitente_nombre: '', remitente_email: '', asunto_simulado: '', cuerpo_html: '', 
    es_phishing: true, dificultad: 'MEDIA', explicacion_titulo: '', explicacion_texto: '', clues: []
  });

  // --- Estados Quizzes (Campañas) ---
  const [panelQuizOpen, setPanelQuizOpen] = useState(false);
  const [modoQuiz, setModoQuiz] = useState('CREAR');
  const [quizActual, setQuizActual] = useState(null);
  // NOTA: Eliminamos 'scenario_ids' porque ahora el Backend elige los 10 al azar
  const [formQuiz, setFormQuiz] = useState({
    titulo: '', descripcion: '', activo: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resUser = await api.get('/users/me');
      setUsuario(resUser.data);

      const [resEscenarios, resQuizzes] = await Promise.all([
        api.get('/scenarios/'),
        api.get('/quizzes/')
      ]);
      
      setEscenarios(resEscenarios.data);
      setQuizzes(resQuizzes.data);
      setCargando(false);
    } catch (err) {
      mostrarToast('Error crítico al cargar el laboratorio.', 'error');
      setCargando(false);
    }
  };

  // ==========================================
  // HANDLERS ESCENARIOS
  // ==========================================
  const abrirPanelNuevoEscenario = () => {
    setModoEscenario('CREAR');
    setEscenarioActual(null);
    setFormEscenario({ titulo_interno: '', remitente_nombre: '', remitente_email: '', asunto_simulado: '', cuerpo_html: '', es_phishing: true, dificultad: 'MEDIA', explicacion_titulo: '', explicacion_texto: '', clues: [] });
    setPanelEscenarioOpen(true);
  };

  const iniciarEdicionEscenario = (esc) => {
    setModoEscenario('EDITAR');
    setEscenarioActual(esc);
    setFormEscenario({ ...esc, clues: esc.clues || [], explicacion_titulo: esc.explicacion_titulo || '', explicacion_texto: esc.explicacion_texto || '' });
    setPanelEscenarioOpen(true);
  };

  const cerrarPanelEscenario = () => {
    setPanelEscenarioOpen(false);
  };

  const handleSubmitEscenario = async (e) => {
    e.preventDefault();
    try {
      if (modoEscenario === 'CREAR') {
        await api.post('/scenarios/', formEscenario);
        mostrarToast('Correo simulado creado correctamente');
      } else {
        await api.put(`/scenarios/${escenarioActual.id}`, formEscenario);
        mostrarToast('Correo actualizado exitosamente');
      }
      cerrarPanelEscenario();
      cargarDatos();
    } catch (err) { mostrarToast('Error al guardar el escenario.', 'error'); }
  };

  const handleBorrarEscenario = (id) => {
    pedirConfirmacion("¿Borrar este correo? Desaparecerá de las campañas que lo usen.", async () => {
      try {
        await api.delete(`/scenarios/${id}`);
        cargarDatos();
        mostrarToast('Correo eliminado');
      } catch (err) { mostrarToast('Error al borrar.', 'error'); }
    });
  };

  const agregarPista = () => {
    setFormEscenario(prev => ({ ...prev, clues: [...prev.clues, { texto: '', posicion: 'top-10 left-10' }] }));
  };

  const actualizarPista = (index, campo, valor) => {
    const nuevasPistas = [...formEscenario.clues];
    nuevasPistas[index][campo] = valor;
    setFormEscenario(prev => ({ ...prev, clues: nuevasPistas }));
  };

  const borrarPista = (index) => {
    const nuevasPistas = formEscenario.clues.filter((_, i) => i !== index);
    setFormEscenario(prev => ({ ...prev, clues: nuevasPistas }));
  };

  // ==========================================
  // HANDLERS QUIZZES (Campañas Automáticas)
  // ==========================================
  const abrirPanelNuevoQuiz = () => {
    setModoQuiz('CREAR');
    setQuizActual(null);
    setFormQuiz({ titulo: '', descripcion: '', activo: true });
    setPanelQuizOpen(true);
  };

  const iniciarEdicionQuiz = (quiz) => {
    setModoQuiz('EDITAR');
    setQuizActual(quiz);
    setFormQuiz({ titulo: quiz.titulo, descripcion: quiz.descripcion || '', activo: quiz.activo });
    setPanelQuizOpen(true);
  };

  const cerrarPanelQuiz = () => {
    setPanelQuizOpen(false);
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    try {
      // Como el Backend ahora elige las 10 preguntas automáticamente, solo enviamos los datos básicos
      if (modoQuiz === 'CREAR') {
        await api.post('/quizzes/', { ...formQuiz, scenario_ids: [] }); 
        mostrarToast('Campaña generada aleatoriamente con éxito');
      } else {
        await api.put(`/quizzes/${quizActual.id}`, { ...formQuiz, scenario_ids: quizActual.scenarios.map(s => s.id) });
        mostrarToast('Estado de la campaña actualizado');
      }
      cerrarPanelQuiz();
      cargarDatos();
    } catch (err) { mostrarToast('Error al procesar la campaña.', 'error'); }
  };

  const handleBorrarQuiz = (id) => {
    pedirConfirmacion("¿Eliminar esta campaña de entrenamiento por completo?", async () => {
      try {
        await api.delete(`/quizzes/${id}`);
        cargarDatos();
        mostrarToast('Campaña eliminada');
      } catch (err) { mostrarToast('Error al borrar.', 'error'); }
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
  // RENDER COMPARTIDO: NOTIFICACIONES (Estilo CPCE)
  // ==========================================
  const NotificacionesUI = (
    <>
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-5 py-3.5 rounded-md shadow-xl text-sm font-semibold animate-fade-in transition-colors ${toast.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.tipo === 'exito' ? (
             <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {toast.mensaje}
        </div>
      )}

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
              <button onClick={() => setConfirmar({ visible: false, mensaje: '', accion: null })} className="flex-1 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors border-r border-slate-100 cursor-pointer">Cancelar</button>
              <button onClick={() => { confirmar.accion(); setConfirmar({ visible: false, mensaje: '', accion: null }); }} className="flex-1 px-4 py-3.5 text-sm font-semibold text-cpce-red hover:bg-red-50 transition-colors cursor-pointer">Sí, proceder</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {NotificacionesUI}
      
      {/* Cabecera Principal y Tabs */}
      <div className="mb-8 border-b border-slate-200 pb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Laboratorio de Simulaciones
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Diseña correos amenazantes y el sistema ensamblará dinámicamente evaluaciones de 10 escenarios aleatorios para tus empleados.
        </p>

        <div className="flex space-x-6">
          <button onClick={() => setTabActual('ESCENARIOS')} className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${tabActual === 'ESCENARIOS' ? 'text-cpce-blue' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Banco de Correos</span>
            {tabActual === 'ESCENARIOS' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cpce-blue"></span>}
          </button>
          <button onClick={() => setTabActual('QUIZZES')} className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${tabActual === 'QUIZZES' ? 'text-cpce-blue' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> Campañas Activas</span>
            {tabActual === 'QUIZZES' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cpce-blue"></span>}
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* PESTAÑA 1: ESCENARIOS (Correos) */}
      {/* ========================================== */}
      {tabActual === 'ESCENARIOS' && (
        <div className="animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div><h2 className="text-lg font-bold text-slate-800">Catálogo de Escenarios</h2></div>
            <button onClick={abrirPanelNuevoEscenario} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-cpce-blue rounded-md hover:bg-cpce-dark transition-colors shadow-sm cursor-pointer">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Diseñar Nuevo Correo
            </button>
          </div>

          <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Identificador Interno</th>
                    <th className="px-6 py-4 font-bold">Bandeja Simulada</th>
                    <th className="px-6 py-4 font-bold text-center">Clasificación</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {escenarios.map(esc => (
                    <tr key={esc.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-900">{esc.titulo_interno}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{esc.remitente_nombre || 'Sin Remitente'}</span>
                          <span className="text-xs text-slate-500 font-mono mt-0.5">{esc.remitente_email || 'correo@ejemplo.com'}</span>
                          <span className="text-xs text-slate-400 mt-1 italic">Asunto: "{esc.asunto_simulado}"</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${esc.es_phishing ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {esc.es_phishing ? 'Ataque Phishing' : 'Correo Legítimo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => iniciarEdicionEscenario(esc)} className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-blue bg-white border border-cpce-blue hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">Editar</button>
                          <button onClick={() => handleBorrarEscenario(esc.id)} className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-red hover:bg-red-50 transition-colors cursor-pointer">Borrar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {escenarios.length === 0 && <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 text-sm">El banco de correos está vacío. Crea tu primer escenario.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PESTAÑA 2: QUIZZES (Campañas Automáticas) */}
      {/* ========================================== */}
      {tabActual === 'QUIZZES' && (
        <div className="animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div><h2 className="text-lg font-bold text-slate-800">Evaluaciones Activas</h2></div>
            <button onClick={abrirPanelNuevoQuiz} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-cpce-blue rounded-md hover:bg-cpce-dark transition-colors shadow-sm cursor-pointer">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Generar Campaña
            </button>
          </div>

          <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Nombre de la Campaña</th>
                    <th className="px-6 py-4 font-bold text-center">Escenarios</th>
                    <th className="px-6 py-4 font-bold text-center">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {quizzes.map(quiz => (
                    <tr key={quiz.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{quiz.titulo}</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm truncate">{quiz.descripcion || 'Generada dinámicamente'}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-cpce-blue font-bold font-mono text-xs border border-blue-100 shadow-sm">
                          {quiz.scenarios?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${quiz.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {quiz.activo ? 'En Curso' : 'Finalizada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => iniciarEdicionQuiz(quiz)} className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-blue bg-white border border-cpce-blue hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">Editar</button>
                          <button onClick={() => handleBorrarQuiz(quiz.id)} className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-red hover:bg-red-50 transition-colors cursor-pointer">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {quizzes.length === 0 && <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 text-sm">No hay campañas configuradas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PANEL LATERAL (OFF-CANVAS): CREADOR DE ESCENARIOS */}
      {/* ==================================================================== */}
      {panelEscenarioOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarPanelEscenario}></div>
          
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col border-l border-cpce-blue transform transition-transform duration-300 translate-x-0">
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{modoEscenario === 'EDITAR' ? 'Modificar Escenario' : 'Constructor de Escenario'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Define la estructura visual y la lógica de retroalimentación.</p>
              </div>
              <button onClick={cerrarPanelEscenario} className="text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="form-escenario" onSubmit={handleSubmitEscenario} className="space-y-8">
                
                {/* Bloque 1: General */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><svg className="w-4 h-4 text-cpce-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Configuración Interna</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Identificador de uso interno</label>
                    <input type="text" required value={formEscenario.titulo_interno} onChange={e => setFormEscenario({...formEscenario, titulo_interno: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none" placeholder="Ej: Falso email de RRHH" />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md border border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">¿Este correo es un Ataque Phishing?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formEscenario.es_phishing} onChange={e => setFormEscenario({...formEscenario, es_phishing: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Bloque 2: Anatomía del Correo Falso */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><svg className="w-4 h-4 text-cpce-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Interfaz Simulada</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Remitente</label>
                      <input type="text" required value={formEscenario.remitente_nombre} onChange={e => setFormEscenario({...formEscenario, remitente_nombre: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none" placeholder="Ej: Lucas Jiménez" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Remitente Falso</label>
                      <input type="email" required value={formEscenario.remitente_email} onChange={e => setFormEscenario({...formEscenario, remitente_email: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cpce-blue outline-none" placeholder="admin@soporte.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Asunto del Correo</label>
                    <input type="text" required value={formEscenario.asunto_simulado} onChange={e => setFormEscenario({...formEscenario, asunto_simulado: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none" placeholder="Lucas te invitó a editar un documento" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                      Cuerpo del Correo (HTML)
                    </label>
                    <textarea required value={formEscenario.cuerpo_html} onChange={e => setFormEscenario({...formEscenario, cuerpo_html: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none font-mono h-32 resize-y bg-slate-800 text-green-400" placeholder="<p>Hola. Aquí tienes el documento...</p>"></textarea>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Bloque 3: Retroalimentación */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><svg className="w-4 h-4 text-cpce-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> Motor de Retroalimentación</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Título de la Explicación (Aparece tras responder)</label>
                    <input type="text" value={formEscenario.explicacion_titulo} onChange={e => setFormEscenario({...formEscenario, explicacion_titulo: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none" placeholder="Ej: En realidad, este es un correo de phishing" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Texto de la Explicación</label>
                    <textarea value={formEscenario.explicacion_texto} onChange={e => setFormEscenario({...formEscenario, explicacion_texto: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none h-20 resize-none" placeholder="Ej: El remitente usa un dominio genérico..."></textarea>
                  </div>

                  {/* Gestor de Pistas */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs font-semibold text-slate-600">Pistas Flotantes (Tooltips UI)</label>
                      <button type="button" onClick={agregarPista} className="text-xs bg-blue-50 text-cpce-blue font-semibold px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">+ Agregar Pista</button>
                    </div>
                    
                    <div className="space-y-3">
                      {formEscenario.clues.map((pista, index) => (
                        <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-md border border-slate-200">
                          <div className="flex-1 space-y-2">
                            <select 
                              value={pista.posicion} 
                              onChange={(e) => actualizarPista(index, 'posicion', e.target.value)} 
                              className="w-full border border-slate-300 rounded text-xs px-2 py-1 text-slate-700 outline-none focus:ring-1 focus:ring-cpce-blue focus:border-cpce-blue bg-white cursor-pointer">
                              <option value="">Selecciona el elemento sospechoso...</option>
                              <option value="top-8 left-10">Asunto del correo</option>
                              <option value="top-20 left-10">Dirección del remitente (Email)</option>
                              <option value="top-20 right-10">Fecha u hora de envío</option>
                              <option value="top-1/3 left-10">Saludo o texto introductorio</option>
                              <option value="top-1/2 left-1/2 -translate-x-1/2">Botón de acción o Enlace principal</option>
                              <option value="bottom-1/4 left-10">Archivo adjunto</option>
                              <option value="bottom-10 left-10">Firma o pie de página</option>
                            </select>
                            <textarea value={pista.texto} onChange={(e) => actualizarPista(index, 'texto', e.target.value)} className="w-full border border-slate-300 rounded text-xs px-2 py-1 outline-none focus:border-cpce-blue h-12 resize-none" placeholder="Texto explicativo del tooltip..."></textarea>
                          </div>
                          <button type="button" onClick={() => borrarPista(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                      {formEscenario.clues.length === 0 && <p className="text-xs text-slate-400 italic text-center border border-dashed border-slate-300 rounded py-4">No has agregado tooltips flotantes.</p>}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button type="button" onClick={cerrarPanelEscenario} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-sm py-2.5 px-4 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" form="form-escenario" className="flex-1 bg-cpce-blue text-white font-semibold text-sm py-2.5 px-4 rounded-md hover:bg-cpce-dark transition-colors shadow-sm cursor-pointer">
                {modoEscenario === 'EDITAR' ? 'Guardar Cambios' : 'Crear Escenario'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PANEL LATERAL (OFF-CANVAS): CREADOR DE CAMPAÑAS (QUIZZES) */}
      {/* ==================================================================== */}
      {panelQuizOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarPanelQuiz}></div>
          
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-cpce-blue transform transition-transform duration-300 translate-x-0">
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">{modoQuiz === 'EDITAR' ? 'Modificar Campaña' : 'Generar Campaña'}</h2>
              <button onClick={cerrarPanelQuiz} className="text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
              <form id="form-quiz" onSubmit={handleSubmitQuiz} className="space-y-6">
                
                {/* BANNER INFORMATIVO */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex gap-3">
                  <div className="text-cpce-blue mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Generación Dinámica</h4>
                    <p className="text-xs text-slate-600 mt-1">El sistema elegirá aleatoriamente 10 escenarios de tu banco de correos para construir esta evaluación.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre de la Evaluación</label>
                  <input type="text" required value={formQuiz.titulo} onChange={e => setFormQuiz({...formQuiz, titulo: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all" placeholder="Ej: Entrenamiento Q3 2026" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción / Objetivo (Opcional)</label>
                  <textarea value={formQuiz.descripcion} onChange={e => setFormQuiz({...formQuiz, descripcion: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cpce-blue outline-none transition-all h-20 resize-none" placeholder="Objetivo de esta campaña..."></textarea>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md border border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Campaña Activa</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formQuiz.activo} onChange={e => setFormQuiz({...formQuiz, activo: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button type="button" onClick={cerrarPanelQuiz} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-sm py-2.5 px-4 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" form="form-quiz" className="flex-1 bg-cpce-blue text-white font-semibold text-sm py-2.5 px-4 rounded-md hover:bg-cpce-dark transition-colors shadow-sm cursor-pointer">
                {modoQuiz === 'EDITAR' ? 'Actualizar Campaña' : 'Lanzar Campaña'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
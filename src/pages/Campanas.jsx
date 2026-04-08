import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Campanas() {
  const [usuario, setUsuario] = useState(null);
  const [tabActual, setTabActual] = useState('ESCENARIOS');
  
  const [escenarios, setEscenarios] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
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

  // --- Estados Escenarios (Bandeja de Entrada Simulada) ---
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
  const [formQuiz, setFormQuiz] = useState({
    titulo: '', descripcion: '', activo: true, scenario_ids: []
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
  // HANDLERS ESCENARIOS (Correos)
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

  // Gestor de Pistas (Clues)
  const agregarPista = () => {
    setFormEscenario(prev => ({
      ...prev,
      clues: [...prev.clues, { texto: '', posicion: 'top-10 left-10' }]
    }));
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
  // HANDLERS QUIZZES (Campañas)
  // ==========================================
  const abrirPanelNuevoQuiz = () => {
    setModoQuiz('CREAR');
    setQuizActual(null);
    setFormQuiz({ titulo: '', descripcion: '', activo: true, scenario_ids: [] });
    setPanelQuizOpen(true);
  };

  const iniciarEdicionQuiz = (quiz) => {
    setModoQuiz('EDITAR');
    setQuizActual(quiz);
    setFormQuiz({ titulo: quiz.titulo, descripcion: quiz.descripcion || '', activo: quiz.activo, scenario_ids: quiz.scenarios ? quiz.scenarios.map(s => s.id) : [] });
    setPanelQuizOpen(true);
  };

  const cerrarPanelQuiz = () => {
    setPanelQuizOpen(false);
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    try {
      if (modoQuiz === 'CREAR') {
        await api.post('/quizzes/', formQuiz);
        mostrarToast('Campaña de entrenamiento lanzada');
      } else {
        await api.put(`/quizzes/${quizActual.id}`, formQuiz);
        mostrarToast('Campaña actualizada');
      }
      cerrarPanelQuiz();
      cargarDatos();
    } catch (err) { mostrarToast('Error al guardar la campaña.', 'error'); }
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

  const toggleScenarioSelection = (scenarioId) => {
    setFormQuiz(prev => {
      const ids = prev.scenario_ids.includes(scenarioId)
        ? prev.scenario_ids.filter(id => id !== scenarioId)
        : [...prev.scenario_ids, scenarioId];
      return { ...prev, scenario_ids: ids };
    });
  };

  // RENDER DE CARGA
  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  // ==========================================
  // RENDER COMPARTIDO: NOTIFICACIONES
  // ==========================================
  const NotificacionesUI = (
    <>
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium animate-fade-in transition-colors ${toast.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                 <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirmar Acción</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{confirmar.mensaje}</p>
            </div>
            <div className="flex border-t border-slate-100 bg-slate-50">
              <button onClick={() => setConfirmar({ visible: false, mensaje: '', accion: null })} className="flex-1 px-4 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors border-r border-slate-100 cursor-pointer">Cancelar</button>
              <button onClick={() => { confirmar.accion(); setConfirmar({ visible: false, mensaje: '', accion: null }); }} className="flex-1 px-4 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer">Sí, proceder</button>
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
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">
          Laboratorio de Campañas
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Diseña simulaciones realistas (estilo Jigsaw) y empaquétalas en evaluaciones para tus empleados.
        </p>

        <div className="flex space-x-6">
          <button onClick={() => setTabActual('ESCENARIOS')} className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer ${tabActual === 'ESCENARIOS' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Banco de Correos</span>
            {tabActual === 'ESCENARIOS' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-md"></span>}
          </button>
          <button onClick={() => setTabActual('QUIZZES')} className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer ${tabActual === 'QUIZZES' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> Ensamblar Campaña</span>
            {tabActual === 'QUIZZES' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-md"></span>}
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* PESTAÑA 1: ESCENARIOS (Correos) */}
      {/* ========================================== */}
      {tabActual === 'ESCENARIOS' && (
        <div className="animate-fade-in">
          
          {/* Header de la Tabla */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div><h2 className="text-lg font-medium text-slate-800">Catálogo de Escenarios</h2></div>
            <button onClick={abrirPanelNuevoEscenario} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm ring-1 ring-slate-900/10 cursor-pointer">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Diseñar Nuevo Correo
            </button>
          </div>

          {/* Tabla de Escenarios Full-Width */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Identificador Interno</th>
                    <th className="px-6 py-4 font-semibold">Bandeja Simulada</th>
                    <th className="px-6 py-4 font-semibold text-center">Clasificación</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {escenarios.map(esc => (
                    <tr key={esc.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900">{esc.titulo_interno}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{esc.remitente_nombre || 'Sin Remitente'}</span>
                          <span className="text-xs text-slate-500 font-mono mt-0.5">{esc.remitente_email || 'correo@ejemplo.com'}</span>
                          <span className="text-xs text-slate-400 mt-1 italic">Asunto: "{esc.asunto_simulado}"</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${esc.es_phishing ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {esc.es_phishing ? 'Ataque Phishing' : 'Correo Legítimo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => iniciarEdicionEscenario(esc)} className="text-xs font-medium px-3 py-1.5 rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">Editar</button>
                          <button onClick={() => handleBorrarEscenario(esc.id)} className="text-xs font-medium px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors cursor-pointer">Borrar</button>
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
      {/* PESTAÑA 2: QUIZZES (Campañas) */}
      {/* ========================================== */}
      {tabActual === 'QUIZZES' && (
        <div className="animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div><h2 className="text-lg font-medium text-slate-800">Evaluaciones Activas</h2></div>
            <button onClick={abrirPanelNuevoQuiz} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm ring-1 ring-slate-900/10 cursor-pointer">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Ensamblar Campaña
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Campaña de Entrenamiento</th>
                    <th className="px-6 py-4 font-semibold text-center">Escenarios Incluidos</th>
                    <th className="px-6 py-4 font-semibold text-center">Estado</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {quizzes.map(quiz => (
                    <tr key={quiz.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{quiz.titulo}</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm truncate">{quiz.descripcion || 'Sin descripción'}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-medium font-mono text-xs border border-slate-200">
                          {quiz.scenarios?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${quiz.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {quiz.activo ? 'En Curso' : 'Finalizada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => iniciarEdicionQuiz(quiz)} className="text-xs font-medium px-3 py-1.5 rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">Editar</button>
                          <button onClick={() => handleBorrarQuiz(quiz.id)} className="text-xs font-medium px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors cursor-pointer">Eliminar</button>
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
      {/* PANEL LATERAL (OFF-CANVAS): CREADOR DE ESCENARIOS ESTILO JIGSAW */}
      {/* ==================================================================== */}
      {panelEscenarioOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={cerrarPanelEscenario}></div>
          
          {/* Panel Lateral que desliza */}
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 translate-x-0">
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{modoEscenario === 'EDITAR' ? 'Modificar Escenario' : 'Constructor de Escenario'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Define la estructura visual y la lógica de retroalimentación.</p>
              </div>
              <button onClick={cerrarPanelEscenario} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="form-escenario" onSubmit={handleSubmitEscenario} className="space-y-8">
                
                {/* Bloque 1: General */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2"><svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Configuración Interna</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Identificador de uso interno</label>
                    <input type="text" required value={formEscenario.titulo_interno} onChange={e => setFormEscenario({...formEscenario, titulo_interno: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Falso email de RRHH" />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">¿Este correo es un Ataque Phishing?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formEscenario.es_phishing} onChange={e => setFormEscenario({...formEscenario, es_phishing: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Bloque 2: Anatomía del Correo Falso */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2"><svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Interfaz Simulada (Estilo Gmail)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Remitente</label>
                      <input type="text" required value={formEscenario.remitente_nombre} onChange={e => setFormEscenario({...formEscenario, remitente_nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Lucas Jiménez" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Correo Remitente Falso</label>
                      <input type="email" required value={formEscenario.remitente_email} onChange={e => setFormEscenario({...formEscenario, remitente_email: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="luke.json8000@gmail.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Asunto del Correo</label>
                    <input type="text" required value={formEscenario.asunto_simulado} onChange={e => setFormEscenario({...formEscenario, asunto_simulado: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Lucas te invitó a editar un documento" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 flex justify-between">
                      Cuerpo del Correo (HTML)
                      <span className="text-slate-400 font-mono text-[10px]">Acepta etiquetas Tailwind/React</span>
                    </label>
                    <textarea required value={formEscenario.cuerpo_html} onChange={e => setFormEscenario({...formEscenario, cuerpo_html: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono h-32 resize-y bg-slate-800 text-green-400" placeholder="<p>Hola. Aquí tienes el documento...</p>"></textarea>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Bloque 3: Retroalimentación y Pistas (Jigsaw Engine) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2"><svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> Motor de Retroalimentación</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Título de la Explicación (Aparece tras responder)</label>
                    <input type="text" value={formEscenario.explicacion_titulo} onChange={e => setFormEscenario({...formEscenario, explicacion_titulo: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: En realidad, este es un correo de phishing" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Texto de la Explicación</label>
                    <textarea value={formEscenario.explicacion_texto} onChange={e => setFormEscenario({...formEscenario, explicacion_texto: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none" placeholder="Ej: El remitente usa un dominio genérico (@gmail.com) en lugar de uno corporativo..."></textarea>
                  </div>

                  {/* Gestor de Pistas Dinámicas */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs font-medium text-slate-600">Pistas Flotantes (Tooltips UI)</label>
                      <button type="button" onClick={agregarPista} className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">+ Agregar Pista</button>
                    </div>
                    
                    <div className="space-y-3">
                      {formEscenario.clues.map((pista, index) => (
                        <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex-1 space-y-2">
                            <input type="text" value={pista.posicion} onChange={(e) => actualizarPista(index, 'posicion', e.target.value)} className="w-full border border-slate-300 rounded text-xs px-2 py-1 font-mono text-slate-500 outline-none focus:border-blue-500" placeholder="Clases Tailwind (Ej: top-14 left-10)" />
                            <textarea value={pista.texto} onChange={(e) => actualizarPista(index, 'texto', e.target.value)} className="w-full border border-slate-300 rounded text-xs px-2 py-1 outline-none focus:border-blue-500 h-12 resize-none" placeholder="Texto explicativo del tooltip..."></textarea>
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

            {/* Footer del Panel */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button type="button" onClick={cerrarPanelEscenario} className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" form="form-escenario" className="flex-1 bg-slate-900 text-white font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
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
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={cerrarPanelQuiz}></div>
          
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 translate-x-0">
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">{modoQuiz === 'EDITAR' ? 'Modificar Campaña' : 'Ensamblar Campaña'}</h2>
              <button onClick={cerrarPanelQuiz} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="form-quiz" onSubmit={handleSubmitQuiz} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Evaluación</label>
                  <input type="text" required value={formQuiz.titulo} onChange={e => setFormQuiz({...formQuiz, titulo: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ej: Entrenamiento Q3 2026" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / Objetivo</label>
                  <textarea value={formQuiz.descripcion} onChange={e => setFormQuiz({...formQuiz, descripcion: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20 resize-none" placeholder="Objetivo de esta campaña..."></textarea>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">Estado de la Campaña</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formQuiz.activo} onChange={e => setFormQuiz({...formQuiz, activo: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-end mb-3 mt-4">
                    <label className="block text-sm font-semibold text-slate-800">Seleccionar Correos</label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-white">
                      {formQuiz.scenario_ids.length} elegidos
                    </span>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 space-y-1 p-2">
                    {escenarios.map(esc => (
                      <label key={esc.id} className={`flex items-start gap-3 p-3 cursor-pointer rounded-md border transition-colors ${formQuiz.scenario_ids.includes(esc.id) ? 'bg-white border-blue-400 shadow-sm ring-1 ring-blue-400/20' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}>
                        <input type="checkbox" checked={formQuiz.scenario_ids.includes(esc.id)} onChange={() => toggleScenarioSelection(esc.id)} className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 leading-tight">{esc.titulo_interno}</p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">{esc.es_phishing ? <span className="text-red-600">Phishing</span> : <span className="text-emerald-600">Legítimo</span>}</p>
                        </div>
                      </label>
                    ))}
                    {escenarios.length === 0 && <p className="text-xs text-slate-500 text-center py-6">El banco está vacío.</p>}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer del Panel */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button type="button" onClick={cerrarPanelQuiz} className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" form="form-quiz" className="flex-1 bg-slate-900 text-white font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
                {modoQuiz === 'EDITAR' ? 'Actualizar' : 'Lanzar Campaña'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
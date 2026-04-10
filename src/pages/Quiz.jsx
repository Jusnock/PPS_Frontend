import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Quiz() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  const [campanasDisponibles, setCampanasDisponibles] = useState([]);
  const [campanaActiva, setCampanaActiva] = useState(null);
  const [escenarios, setEscenarios] = useState([]);
  const [sesionId, setSesionId] = useState(null);

  const [fase, setFase] = useState('CARGANDO'); 
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [acerto, setAcerto] = useState(null);
  const [pistaActiva, setPistaActiva] = useState(0);
  const [tiempoInicio, setTiempoInicio] = useState(null);
  
  // === NUEVO: Contador de aciertos para el reporte final ===
  const [aciertosTotales, setAciertosTotales] = useState(0);

  const emailContainerRef = useRef(null);
  const [estiloPista, setEstiloPista] = useState({});
  const [tooltipArriba, setTooltipArriba] = useState(false);

  useEffect(() => {
    cargarCampana();
  }, []);

  useEffect(() => {
    if (fase === 'PISTAS') {
      setTimeout(calcularPosicionPista, 50);
    }
  }, [fase, pistaActiva]);

  const cargarCampana = async () => {
    try {
      const resQuizzes = await api.get('/quizzes/');
      const activas = resQuizzes.data.filter(q => q.activo && q.scenarios.length > 0);

      if (activas.length === 0) {
        setFase('SIN_CAMPANAS');
      } else {
        setCampanasDisponibles(activas);
        setFase('LISTA'); 
      }
      setCargando(false);
    } catch (err) {
      setError('Error al cargar tu entrenamiento.');
      setCargando(false);
    }
  };

  const iniciarCampanaDirecta = async (campana) => {
    try {
      setCargando(true);
      setCampanaActiva(campana);
      const escenariosMezclados = [...campana.scenarios].sort(() => Math.random() - 0.5);
      setEscenarios(escenariosMezclados);
      
      // Reiniciamos contadores al empezar
      setPreguntaActual(0);
      setAciertosTotales(0);

      const resUser = await api.get('/users/me');
      const resSession = await api.post('/sessions/', {
        user_id: resUser.data.id,
        quiz_id: campana.id 
      });
      
      setSesionId(resSession.data.id);
      setTiempoInicio(Date.now());
      setFase('PREGUNTA');
      setCargando(false);
    } catch (err) {
      setError('Error al iniciar la sesión. Contacte al administrador.');
      setCargando(false);
    }
  };

  const handleRespuesta = async (respuestaUsuarioEsPhishing) => {
    const escenario = escenarios[preguntaActual];
    const esCorrecto = respuestaUsuarioEsPhishing === escenario.es_phishing;
    const tiempoTardadoSegundos = Math.round((Date.now() - tiempoInicio) / 1000);

    setAcerto(esCorrecto);
    
    // Sumamos un punto si acertó
    if (esCorrecto) {
      setAciertosTotales(prev => prev + 1);
    }

    setFase('RESULTADO');

    try {
      await api.post(`/sessions/${sesionId}/answers`, {
        scenario_id: escenario.id,
        identificado_como_phishing: respuestaUsuarioEsPhishing,
        tiempo_en_segundos: tiempoTardadoSegundos
      });
    } catch (err) {}
  };

  const handleMostrarPistas = () => {
    setFase('PISTAS');
    setPistaActiva(0);
  };

  const handleSiguientePista = async () => {
    const escenario = escenarios[preguntaActual];
    if (escenario.clues && pistaActiva < escenario.clues.length - 1) {
      setPistaActiva(pistaActiva + 1);
    } else {
      if (preguntaActual < escenarios.length - 1) {
        setPreguntaActual(preguntaActual + 1);
        setFase('PREGUNTA');
        setTiempoInicio(Date.now());
      } else {
        setFase('FIN');
        try {
          await api.put(`/sessions/${sesionId}/finish`);
        } catch (err) {}
      }
    }
  };

  const calcularPosicionPista = () => {
    const pista = escenarios[preguntaActual]?.clues[pistaActiva];
    const container = emailContainerRef.current;
    
    if (!container || !pista) return;

    let targetElement = null;
    const pos = pista.posicion;

    if (pos.includes('top-8')) targetElement = container.querySelector('[data-id="asunto"]');
    else if (pos.includes('top-20 left')) targetElement = container.querySelector('[data-id="remitente"]');
    else if (pos.includes('top-20 right')) targetElement = container.querySelector('[data-id="fecha"]');
    else if (pos.includes('top-1/3')) targetElement = container.querySelector('.cuerpo-html p:first-of-type');
    else if (pos.includes('top-1/2')) targetElement = container.querySelector('.cuerpo-html a, .cuerpo-html button');
    else if (pos.includes('bottom-1/4')) targetElement = container.querySelector('.cuerpo-html img');
    else if (pos.includes('bottom-10')) targetElement = container.querySelector('.cuerpo-html p:last-of-type');

    if (targetElement) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      let calculatedTop = targetRect.bottom - containerRect.top + 15; 
      let calculatedLeft = targetRect.left - containerRect.left;
      let isAbove = false;

      if (calculatedTop + 140 > containerRect.height) {
        calculatedTop = targetRect.top - containerRect.top - 150; 
        isAbove = true;
      }

      if (calculatedLeft + 320 > containerRect.width) {
        calculatedLeft = containerRect.width - 340;
      }
      
      setEstiloPista({
        top: `${calculatedTop}px`,
        left: `${Math.max(10, calculatedLeft)}px`
      });
      setTooltipArriba(isAbove);

    } else {
      setEstiloPista({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      setTooltipArriba(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cpce-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <p className="font-semibold text-lg">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Reintentar</button>
      </div>
    );
  }

  if (fase === 'SIN_CAMPANAS') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <h2 className="text-2xl font-medium text-gray-900 mb-2">Todo al día</h2>
        <p className="text-gray-500">No tienes entrenamientos pendientes en este momento.</p>
      </div>
    );
  }

  if (fase === 'LISTA') {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 animate-fade-in">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tus Entrenamientos</h2>
        <p className="text-gray-500 mb-8">Selecciona un módulo para comenzar tu capacitación.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campanasDisponibles.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                  {c.scenarios?.length} Escenarios
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{c.titulo}</h3>
              <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-2">
                {c.descripcion || "Módulo de entrenamiento en detección de amenazas y phishing."}
              </p>
              <button 
                onClick={() => iniciarCampanaDirecta(c)} 
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Comenzar Módulo
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // === NUEVA PANTALLA DE RESULTADOS DEL EMPLEADO ===
  if (fase === 'FIN') {
    const porcentaje = Math.round((aciertosTotales / escenarios.length) * 100) || 0;
    
    // Evaluamos el rendimiento para cambiar los colores y el mensaje
    let esExcelente = porcentaje >= 80;
    let colorTexto = esExcelente ? "text-emerald-600" : "text-amber-500";
    let bgIcono = esExcelente ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100";
    let mensaje = esExcelente 
      ? "¡Excelente nivel de alerta! Tienes un perfil altamente seguro." 
      : "Buen intento, pero debes prestar más atención a los detalles de los remitentes y enlaces.";

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fade-in">
        
        <div className="bg-white p-10 rounded-xl shadow-xl border-t-4 border-t-cpce-blue max-w-md w-full text-center relative overflow-hidden">
          
          <h2 className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-6">Resultados del Módulo</h2>
          
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-sm border ${bgIcono}`}>
            {esExcelente ? (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
          </div>

          <div className={`text-6xl font-black mb-2 tracking-tighter ${colorTexto}`}>
            {porcentaje}%
          </div>
          
          <p className="text-slate-900 font-bold text-lg mb-2">
            {aciertosTotales} de {escenarios.length} aciertos
          </p>
          
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            {mensaje}
          </p>
          
          <button 
            onClick={() => {
              setFase('CARGANDO'); 
              window.location.reload(); 
            }} 
            className="w-full bg-cpce-blue text-white py-3 rounded-md font-semibold hover:bg-cpce-dark transition-colors shadow-sm cursor-pointer"
          >
            Finalizar y Volver
          </button>
        </div>
      </div>
    );
  }

  const escenario = escenarios[preguntaActual];
  const pistas = escenario?.clues || [];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 font-sans animate-fade-in">
      
      <div className="text-center mb-8">
        {fase === 'PREGUNTA' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-normal text-gray-900 mb-3">
              Analiza este correo electrónico...
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Revisa los enlaces pasando el mouse por encima y verifica los remitentes. 
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button onClick={() => handleRespuesta(true)} className="bg-blue-600 text-white font-medium px-8 py-2.5 rounded-full shadow-sm hover:bg-blue-700 transition-colors cursor-pointer">
                Es Phishing
              </button>
              <button onClick={() => handleRespuesta(false)} className="bg-white border-2 border-blue-600 text-blue-600 font-medium px-8 py-2.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                Es Legítimo
              </button>
            </div>
          </div>
        )}

        {(fase === 'RESULTADO' || fase === 'PISTAS') && (
          <div className="animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-normal mb-4">
              <span className={`font-semibold ${acerto ? 'text-green-600' : 'text-red-600'}`}>
                {acerto ? '¡Correcto! ' : '¡Incorrecto! '}
              </span>
              <span className="text-gray-900">{escenario.explicacion_titulo || (escenario.es_phishing ? 'Este era un ataque.' : 'El correo era seguro.')}</span>
            </h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto mb-6">
              {escenario.explicacion_texto || "Siempre mantén la guardia en alto."}
            </p>
            {fase === 'RESULTADO' && (
              <button onClick={handleMostrarPistas} className="bg-blue-600 text-white font-medium px-8 py-2.5 rounded-full shadow-sm hover:bg-blue-700 transition-colors cursor-pointer">
                {pistas.length > 0 ? 'Mostrar Pistas' : 'Siguiente Escenario'}
              </button>
            )}
          </div>
        )}
      </div>

      <div 
        ref={emailContainerRef} 
        className={`relative bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden transition-all duration-500 ${fase !== 'PREGUNTA' ? 'ring-2 ring-gray-200 opacity-95' : ''}`}
      >
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-white">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-medium text-lg shrink-0">
              {escenario?.remitente_nombre ? escenario.remitente_nombre.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-1">
                <span data-id="remitente" className="font-semibold text-gray-900">{escenario?.remitente_nombre}</span>
                <span className="text-xs text-gray-500 font-mono">&lt;{escenario?.remitente_email}&gt;</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">para mí ▾</p>
            </div>
          </div>
          <span data-id="fecha" className="text-xs text-gray-400 whitespace-nowrap pt-1">Hoy</span>
        </div>

        <div className="px-6 md:px-12 py-8 bg-white min-h-[350px]">
          <h3 data-id="asunto" className="text-xl font-normal text-gray-900 mb-6">{escenario?.asunto_simulado}</h3>
          
          <div 
            className="cuerpo-html text-sm text-gray-800" 
            onClick={(e) => {
              if (e.target.tagName === 'A' || e.target.closest('a')) {
                e.preventDefault();
              }
            }}
            dangerouslySetInnerHTML={{ __html: escenario?.cuerpo_html || '' }} 
          />
        </div>

        {fase === 'PISTAS' && pistas.length > 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            
            <div 
              style={{ ...estiloPista, position: 'absolute' }} 
              className="bg-white border border-gray-200 shadow-2xl rounded-lg p-5 max-w-xs pointer-events-auto animate-fade-in z-20"
            >
              {tooltipArriba ? (
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
              ) : (
                <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
              )}
              
              <div className="relative">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {pistas[pistaActiva].texto}
                </p>
                
                <div className="flex justify-end">
                  <button 
                    onClick={handleSiguientePista} 
                    className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {pistaActiva < pistas.length - 1 ? 'Siguiente pista' : 'Finalizar revisión'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-right mt-4">
        <span className="text-xs text-gray-400 font-medium tracking-wider">Pregunta {preguntaActual + 1}/{escenarios.length}</span>
      </div>

    </div>
  );
}
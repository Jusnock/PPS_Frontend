import { useState, useEffect } from 'react';
import api from '../api/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [empresas, setEmpresas] = useState([]); 
  const [campanas, setCampanas] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estados para los Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroCampana, setFiltroCampana] = useState('');

  useEffect(() => {
    inicializar();
  }, []);

  // Cada vez que cambie un filtro, le pedimos al backend los nuevos cálculos
  useEffect(() => {
    if (usuario) cargarEstadisticas();
  }, [filtroEmpresa, filtroCampana, usuario]);

  const inicializar = async () => {
    try {
      const resUser = await api.get('/users/me');
      setUsuario(resUser.data);

      // Si es empleado, no cargamos nada más, el render lo va a expulsar
      if (resUser.data.rol === 'EMPLEADO') {
        setCargando(false);
        return;
      }

      // Si es SuperAdmin, traemos la lista de empresas para su filtro
      if (resUser.data.rol === 'SUPERADMIN') {
        const resEmp = await api.get('/companies/');
        setEmpresas(resEmp.data);
      }

      // Traemos las campañas para el filtro
      const resQuiz = await api.get('/quizzes/');
      setCampanas(resQuiz.data);
      
      setCargando(false);
    } catch (err) { 
      setError('Error de conexión con el servidor.');
      setCargando(false); 
    }
  };
const cargarEstadisticas = async () => {
    try {
      // Creamos los parámetros de forma limpia
      const params = new URLSearchParams();
      if (filtroEmpresa) params.append('company_id', filtroEmpresa);
      if (filtroCampana) params.append('quiz_id', filtroCampana);

      // La URL quedará limpia: /stats/dashboard o /stats/dashboard?company_id=1
      const res = await api.get(`/stats/dashboard?${params.toString()}`);
      setStats(res.data);
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
      // Opcional: podrías setear un estado de error aquí
    }
  };

  // 1. PANTALLA DE CARGA
  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  // 2. SEGURIDAD: SI ES EMPLEADO, LO PATEMOS A SU SIMULADOR
  if (usuario && usuario.rol === 'EMPLEADO') {
    return <Navigate to="/quiz" replace />;
  }

  // 3. PANTALLA DE ERROR
  if (error) {
    return (
      <div className="p-8 m-6 bg-red-50 border border-red-200 text-red-700 rounded-xl max-w-2xl mx-auto mt-12">
        <p className="font-bold text-lg">Atención</p>
        <p>{error}</p>
      </div>
    );
  }

  // Tooltip elegante para el gráfico de torta
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-sm border border-slate-700">
          <p className="font-semibold">{payload[0].name}: {payload[0].value} respuestas</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto">
      
      {/* Cabecera */}
      <div className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full tracking-wider uppercase">
            {stats?.tipo_vista === 'SUPERADMIN' ? 'Vista Global' : 'Panel de Empresa'}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Informes de Simulación
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoriza el rendimiento, aciertos y nivel de riesgo general.
        </p>
      </div>

      {/* SECCIÓN DE FILTROS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        {/* Solo el SuperAdmin ve el filtro de empresas */}
        {usuario?.rol === 'SUPERADMIN' && (
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">Filtrar por Institución</label>
            <select 
              value={filtroEmpresa} 
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Todas las empresas</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        )}

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">Filtrar por Campaña</label>
          <select 
            value={filtroCampana} 
            onChange={(e) => setFiltroCampana(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Todas las campañas históricas</option>
            {campanas.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </div>
        
        <button 
          onClick={() => { setFiltroEmpresa(''); setFiltroCampana(''); }} 
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
        >
          Limpiar filtros
        </button>
      </div>

      {stats ? (
        <>
          {/* KPI CARDS (Big Numbers) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tasa de Acierto</p>
              <p className="text-4xl font-bold text-slate-900 mt-2">{stats.resumen.tasa_acierto.toFixed(1)}%</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${stats.resumen.tasa_acierto > 70 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${stats.resumen.tasa_acierto}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tiempo de Reacción</p>
              <p className="text-4xl font-bold text-slate-900 mt-2">{stats.resumen.tiempo_promedio.toFixed(1)}s</p>
              <p className="text-xs text-slate-400 mt-2">Promedio antes de tomar una decisión.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Muestra Analizada</p>
              <p className="text-4xl font-bold text-slate-900 mt-2">{stats.resumen.total_respuestas}</p>
              <p className="text-xs text-slate-400 mt-2">Respuestas registradas en este filtro.</p>
            </div>
          </div>

          {/* GRÁFICOS PRINCIPALES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Distribución de Resultados */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm h-[350px] flex flex-col">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Distribución de Seguridad</h3>
              {stats.resumen.total_respuestas > 0 ? (
                <>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={stats.grafico_rendimiento} 
                          innerRadius={70} 
                          outerRadius={100} 
                          paddingAngle={5} 
                          dataKey="value"
                        >
                          {stats.grafico_rendimiento.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                     <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span> Aciertos</div>
                     <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span> Cayeron en trampa</div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-400 italic">No hay suficientes datos para graficar.</div>
              )}
            </div>

            {/* Panel de Análisis Textual */}
            <div className="bg-slate-900 p-8 rounded-xl shadow-lg text-white flex flex-col justify-center relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-3">Diagnóstico del Filtro</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Según los datos actuales, el nivel de acierto frente a ataques dirigidos es del <strong className={stats.resumen.tasa_acierto > 70 ? 'text-emerald-400' : 'text-red-400'}>{stats.resumen.tasa_acierto.toFixed(1)}%</strong>.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-white/10 p-4 rounded-lg border border-white/5">
                    <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">💡</div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {stats.resumen.total_respuestas === 0 
                        ? "Aún no hay interacciones registradas. Invita a los empleados a completar sus simulaciones."
                        : stats.resumen.tasa_acierto > 70 
                          ? "Excelente nivel de concientización. La mayoría de los usuarios identifica correctamente las amenazas."
                          : "Nivel de riesgo crítico. Se recomienda enviar píldoras educativas y reforzar el entrenamiento sobre revisión de URLs y remitentes."}
                    </p>
                  </div>
                </div>
              </div>
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-12 text-slate-500">Esperando datos...</div>
      )}
    </div>
  );
}
import axios from 'axios';

// Creamos una instancia preconfigurada apuntando a tu FastAPI
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// "Interceptor": Antes de que salga cualquier petición, ejecuta esto
api.interceptors.request.use((config) => {
  // Buscamos el JWT en el almacenamiento local del navegador
  const token = localStorage.getItem('access_token');
  
  // Si existe, lo pegamos como un candado en la cabecera de la petición
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
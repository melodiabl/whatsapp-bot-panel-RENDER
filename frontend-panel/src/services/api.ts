import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// ===================== AUTH =====================
export const authService = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  verificarToken: () => api.get('/auth/verificar-token'),
};

// ===================== DASHBOARD =====================
export const dashboardService = {
  getEstadisticas: () => api.get('/dashboard/estadisticas'),
  getDashboardStats: () => api.get('/dashboard/stats'),
  getBotStatus: () => api.get('/dashboard/status'),
};

// ===================== USUARIOS =====================
export const userService = {
  getUsuarios: () => api.get('/usuarios'),
  registrarUsuario: (data: any) => api.post('/usuarios', data),
  eliminarUsuario: (id: number) => api.delete(`/usuarios/${id}`),
};

// ===================== APORTES =====================
export const aportesService = {
  getAportes: () => api.get('/aportes'),
  subirAporte: (data: any) => api.post('/aportes', data),
  eliminarAporte: (id: number) => api.delete(`/aportes/${id}`),
};

// ===================== PROVEEDORES =====================
export const proveedoresService = {
  getProveedores: () => api.get('/proveedores'),
  infoProveedor: (id: string) => api.get(`/proveedores/${id}`),
};

// ===================== PEDIDOS =====================
export const pedidosService = {
  getPedidos: () => api.get('/pedidos'),
  eliminarPedido: (id: number) => api.delete(`/pedidos/${id}`),
};

// ===================== VOTACIONES =====================
export const votacionesService = {
  getVotaciones: () => api.get('/votaciones'),
  registrarVotacion: (data: any) => api.post('/votaciones', data),
  eliminarVotacion: (id: number) => api.delete(`/votaciones/${id}`),
};

// ===================== LOGS =====================
export const logsService = {
  getLogs: () => api.get('/logs'),
};

// ===================== MANHWAS =====================
export const manhwasService = {
  getManhwas: () => api.get('/manhwas'),
};

// ===================== WHATSAPP =====================
export const whatsappService = {
  getQR: () => api.get('/whatsapp/qr'),
  getStatus: () => api.get('/whatsapp/status'),
  restart: () => api.get('/whatsapp/restart'),
  enviarMensaje: (data: any) => api.post('/whatsapp/send', data),
  reenviarMensaje: (data: any) => api.post('/whatsapp/resend', data),
  desconectar: () => api.get('/whatsapp/disconnect'),
  logout: () => api.get('/whatsapp/logout'),
  getAvailableGroups: () => api.get('/whatsapp/grupos'),
};


import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// ===================== AUTH =====================
interface LoginData {
  username: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  rol: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login: (data: LoginData) => api.post<LoginResponse>('/auth/login', data),
  verificarToken: () => api.get('/auth/verificar-token'),
  getCurrent:User  () => api.get<User>('/auth/current-user'), // Asegúrate de que esta función esté definida
};

// ===================== DASHBOARD =====================
export const dashboardService = {
  getEstadisticas: () => api.get('/dashboard/estadisticas'),
  getDashboardStats: () => api.get('/dashboard/stats'),
  getBotStatus: () => api.get('/dashboard/status'),
};

// ===================== USUARIOS =====================
interface Usuario {
  id: number;
  username: string;
  // Agrega otros campos según sea necesario
}

export const userService = {
  getUsuarios: () => api.get<Usuario[]>('/usuarios'),
  registrarUsuario: (data: Usuario) => api.post('/usuarios', data),
  eliminarUsuario: (id: number) => api.delete(`/usuarios/${id}`),
};

// ===================== APORTES =====================
interface Aporte {
  id: number;
  contenido: string;
  tipo: string;
  usuario: string;
  grupo: string;
  fecha: string;
  pdf_generado: string;
}

export const aportesService = {
  getAportes: () => api.get<Aporte[]>('/aportes'),
  subirAporte: (data: Aporte) => api.post('/aportes', data),
  eliminarAporte: (id: number) => api.delete(`/aportes/${id}`),
};

// ===================== PROVEEDORES =====================
interface Proveedor {
  id: string;
  nombre: string;
}

export const proveedoresService = {
  getProveedores: () => api.get<Proveedor[]>('/proveedores'),
  infoProveedor: (id: string) => api.get<Proveedor>(`/proveedores/${id}`),
};

// ===================== PEDIDOS =====================
interface Pedido {
  id: number;
  // Agrega otros campos según sea necesario
}

export const pedidosService = {
  getPedidos: () => api.get<Pedido[]>('/pedidos'),
  eliminarPedido: (id: number) => api.delete(`/pedidos/${id}`),
};

// ===================== VOTACIONES =====================
interface Votacion {
  id: number;
  // Agrega otros campos según sea necesario
}

export const votacionesService = {
  getVotaciones: () => api.get<Votacion[]>('/votaciones'),
  registrarVotacion: (data: Votacion) => api.post('/votaciones', data),
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


import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

// Servicios usando el cliente `api`

export const authService = {
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout')
}

export const whatsappService = {
  getQR: () => api.get('/qr'),
  getStatus: () => api.get('/status'),
  restart: () => api.post('/restart'),
  enviarMensaje: (data) => api.post('/enviar-mensaje', data),
  reenviarMensaje: (data) => api.post('/reenviar-mensaje', data),
  desconectar: () => api.post('/desconectar')
}

export const dashboardService = {
  getEstadisticas: () => api.get('/dashboard')
}

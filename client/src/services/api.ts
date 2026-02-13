import axios from 'axios'
import toast from 'react-hot-toast'

// Configuração da URL base da API
const getApiBaseUrl = () => {
  try {
    return import.meta.env?.VITE_API_URL || '/api'
  } catch (error) {
    console.warn('Erro ao acessar import.meta.env, usando fallback')
    return '/api'
  }
}

const API_BASE_URL = getApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 segundos de timeout (para relatórios grandes)
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Debug apenas em desenvolvimento
  if (import.meta.env?.DEV) {
    console.log('API Request:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      baseURL: config.baseURL
    })
  }
  
  return config
}, (error) => {
  console.error('Request Error:', error)
  return Promise.reject(error)
})

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => {
    // Debug apenas em desenvolvimento
    if (import.meta.env?.DEV) {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      })
    }
    return response
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    })

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Evitar loop de redirecionamento
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
    
    const message = error.response?.data?.message || 'Erro de conexão com o servidor'
    
    // Não mostrar toast para erros de login (será tratado no contexto)
    const isLoginError = error.config?.url?.includes('/auth/login')
    
    // Não mostrar toast para erros de rede em desenvolvimento ou erros de login
    if ((!error.message.includes('Network Error') || !import.meta.env?.DEV) && !isLoginError) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api
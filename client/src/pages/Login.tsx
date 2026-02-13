import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { LogIn, Eye, EyeOff, AlertCircle, Package, Shield, TrendingUp } from 'lucide-react'

interface LoginForm {
  username: string
  password: string
  rememberMe: boolean
}

export const Login: React.FC = () => {
  const { user, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string>('')
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue 
  } = useForm<LoginForm>({
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false
    }
  })

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  // Função para preencher dados de teste (apenas em desenvolvimento)
  const fillTestCredentials = (role: 'admin' | 'viewer') => {
    if (role === 'admin') {
      setValue('username', 'admin')
      setValue('password', 'admin123')
    } else {
      setValue('username', 'gerencia')
      setValue('password', 'viewer123')
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setLoginError('')
    
    try {
      const success = await login(data.username, data.password)
      
      if (!success) {
        setLoginError('Usuário ou senha inválidos. Verifique suas credenciais e tente novamente.')
      }
      
      // Implementar lógica de "Lembrar-me" se necessário
      if (data.rememberMe && success) {
        localStorage.setItem('rememberMe', 'true')
      }
    } catch (error: any) {
      console.error('Erro no login:', error)
      setLoginError(
        error.response?.data?.message || 
        'Erro ao conectar com o servidor. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  const isDevelopment = import.meta.env.DEV

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Coluna Esquerda - Ilustração/Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Inventário TI</h1>
              <p className="text-blue-100 text-sm">Gestão Profissional de Ativos</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Controle Total dos Seus Ativos
            </h2>
            <p className="text-blue-100 text-lg">
              Sistema completo para gerenciamento de inventário, movimentações e relatórios inteligentes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <Shield className="w-6 h-6 text-blue-200 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Segurança Avançada</h3>
                <p className="text-blue-100 text-sm">Autenticação JWT e controle de permissões por função</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-200 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Relatórios em Tempo Real</h3>
                <p className="text-blue-100 text-sm">Dashboard analítico com métricas e alertas inteligentes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-blue-100 text-sm">
          © 2026 Sistema de Inventário TI. Todos os direitos reservados.
        </div>
      </div>

      {/* Coluna Direita - Formulário de Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Inventário TI</h1>
          </div>

          {/* Card de Login */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo de volta
              </h2>
              <p className="text-gray-600">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>

            {/* Alerta de Erro Global */}
            {loginError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">Erro ao fazer login</h4>
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Campo Usuário */}
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Usuário ou Email
                </label>
                <input
                  {...register('username', { 
                    required: 'Usuário é obrigatório',
                    minLength: {
                      value: 3,
                      message: 'Usuário deve ter no mínimo 3 caracteres'
                    }
                  })}
                  type="text"
                  id="username"
                  autoComplete="username"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.username || loginError 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                    }
                  `}
                  placeholder="Digite seu usuário"
                  disabled={loading}
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Campo Senha */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-gray-700"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    onClick={() => alert('Funcionalidade de recuperação de senha em desenvolvimento')}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <input
                    {...register('password', { 
                      required: 'Senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'Senha deve ter no mínimo 6 caracteres'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    className={`
                      w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${errors.password || loginError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                      }
                    `}
                    placeholder="Digite sua senha"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Checkbox Lembrar-me */}
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label 
                  htmlFor="rememberMe" 
                  className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
                >
                  Permanecer conectado
                </label>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full py-3 px-4 rounded-lg font-medium text-white
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-700 hover:to-indigo-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                  shadow-lg hover:shadow-xl
                "
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    <span>Entrar no Sistema</span>
                  </div>
                )}
              </button>
            </form>

            {/* Botões de Teste (apenas em desenvolvimento) */}
            {isDevelopment && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Ambiente de Desenvolvimento - Acesso Rápido
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillTestCredentials('admin')}
                    className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCredentials('viewer')}
                    className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  >
                    Viewer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Mobile */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2026 Sistema de Inventário TI</p>
          </div>
        </div>
      </div>
    </div>
  )
}
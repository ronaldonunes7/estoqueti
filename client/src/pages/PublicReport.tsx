import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Building, 
  Calendar, 
  TrendingUp, 
  Package, 
  Download, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Globe
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import axios from 'axios'
import jsPDF from 'jspdf'

// API instance sem interceptors para página pública
const publicApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

interface ReportConfig {
  name: string
  scope: 'general' | 'store'
  store_name?: string
  store_city?: string
  period: string
  start_date: string
  end_date: string
}

interface ReportKPIs {
  totalReceived: number
  inTransit: number
  totalMovements: number
}

interface ReportMovement {
  id: number
  date: string
  asset_name: string
  patrimony_tag: string
  type: string
  employee_name: string
  store_name?: string
  store_city?: string
  quantity: number
}

interface ReportData {
  config: ReportConfig
  kpis: ReportKPIs
  movements: ReportMovement[]
}

export const PublicReport: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    if (token) {
      validateAndLoadReport()
    }
  }, [token])

  const validateAndLoadReport = async (passwordAttempt?: string) => {
    if (!token) return

    setValidating(true)
    try {
      // Primeiro validar o token
      const validateResponse = await publicApi.get(`/external-reports/validate/${token}`, {
        params: passwordAttempt ? { password: passwordAttempt } : {}
      })

      if (validateResponse.data.valid) {
        // Token válido, buscar dados
        const dataResponse = await publicApi.get(`/external-reports/data/${token}`, {
          params: passwordAttempt ? { password: passwordAttempt } : {}
        })
        
        setReportData(dataResponse.data)
        setRequiresPassword(false)
        setError(null)
      }
    } catch (error: any) {
      console.error('Erro ao validar/carregar relatório:', error)
      
      if (error.response?.status === 401 && error.response?.data?.requires_password) {
        setRequiresPassword(true)
        setError(null)
      } else if (error.response?.status === 401) {
        setError('Senha incorreta')
      } else if (error.response?.status === 404) {
        setError('Relatório não encontrado ou inativo')
      } else if (error.response?.status === 410) {
        setError('Este link expirou')
      } else {
        setError('Erro ao carregar relatório')
      }
    } finally {
      setLoading(false)
      setValidating(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      validateAndLoadReport(password)
    }
  }

  const getPeriodLabel = (period: string) => {
    const labels = {
      '7days': 'Últimos 7 dias',
      '30days': 'Últimos 30 dias',
      'current_month': 'Mês atual'
    }
    return labels[period as keyof typeof labels] || period
  }

  const getMovementBadge = (type: string) => {
    const badges = {
      'Entrada': 'bg-green-100 text-green-800',
      'Saída': 'bg-red-100 text-red-800',
      'Transferência': 'bg-blue-100 text-blue-800',
      'Manutenção': 'bg-yellow-100 text-yellow-800',
      'Descarte': 'bg-gray-100 text-gray-800'
    }
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const downloadPDF = () => {
    if (!reportData) return

    const pdf = new jsPDF()
    const { config, kpis, movements } = reportData

    // Cabeçalho
    pdf.setFontSize(20)
    pdf.text('Relatório de Movimentações', 20, 30)
    
    pdf.setFontSize(12)
    pdf.text(`${config.name}`, 20, 45)
    
    if (config.scope === 'store' && config.store_name) {
      pdf.text(`Unidade: ${config.store_name} - ${config.store_city}`, 20, 55)
    } else {
      pdf.text('Escopo: Todas as unidades', 20, 55)
    }
    
    pdf.text(`Período: ${getPeriodLabel(config.period)}`, 20, 65)
    pdf.text(`${format(new Date(config.start_date), 'dd/MM/yyyy', { locale: ptBR })} até ${format(new Date(config.end_date), 'dd/MM/yyyy', { locale: ptBR })}`, 20, 75)

    // KPIs
    pdf.setFontSize(14)
    pdf.text('Resumo:', 20, 95)
    
    pdf.setFontSize(10)
    pdf.text(`Total de Itens Recebidos: ${kpis.totalReceived}`, 20, 105)
    pdf.text(`Itens em Trânsito: ${kpis.inTransit}`, 20, 115)
    pdf.text(`Total de Movimentações: ${kpis.totalMovements}`, 20, 125)

    // Movimentações
    pdf.setFontSize(14)
    pdf.text('Movimentações:', 20, 145)
    
    pdf.setFontSize(8)
    let yPosition = 155
    
    movements.slice(0, 30).forEach((movement) => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
      
      const dateStr = format(new Date(movement.date), 'dd/MM/yyyy', { locale: ptBR })
      const text = `${dateStr} - ${movement.asset_name} (${movement.patrimony_tag}) - ${movement.type} - ${movement.employee_name}`
      
      pdf.text(text, 20, yPosition)
      yPosition += 10
    })

    // Rodapé
    pdf.setFontSize(8)
    pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, pdf.internal.pageSize.height - 20)
    pdf.text('Sistema de Inventário TI', 20, pdf.internal.pageSize.height - 10)

    pdf.save(`relatorio-${config.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Protegido</h1>
            <p className="text-gray-600">Este relatório requer uma senha para acesso</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                  placeholder="Digite a senha..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={validating}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {validating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Acessar Relatório
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro de Acesso</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum dado encontrado</p>
        </div>
      </div>
    )
  }

  const { config, kpis, movements } = reportData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary-100">
                <Package className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Inventário TI</h1>
                <p className="text-gray-600">{config.name}</p>
              </div>
            </div>
            <button
              onClick={downloadPDF}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Salvar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações do Relatório */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              {config.scope === 'store' ? (
                <Building className="h-5 w-5 text-gray-400" />
              ) : (
                <Globe className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Escopo</p>
                <p className="text-gray-900">
                  {config.scope === 'store' 
                    ? `${config.store_name} - ${config.store_city}`
                    : 'Todas as unidades'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Período</p>
                <p className="text-gray-900">{getPeriodLabel(config.period)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Intervalo</p>
                <p className="text-gray-900">
                  {format(new Date(config.start_date), 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                  {format(new Date(config.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Itens Recebidos</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalReceived}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Itens em Trânsito</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.inTransit}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Movimentações</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalMovements}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Movimentações Recentes</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ativo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{movement.asset_name}</div>
                        <div className="text-sm text-gray-500 font-mono">{movement.patrimony_tag}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMovementBadge(movement.type)}`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.employee_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {movements.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma movimentação encontrada no período</p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Relatório gerado em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          <p>Sistema de Inventário TI - Acesso Externo</p>
        </div>
      </div>
    </div>
  )
}
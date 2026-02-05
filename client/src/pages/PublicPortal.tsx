import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Building2, 
  TrendingUp, 
  Package, 
  AlertCircle, 
  Download,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  DollarSign,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Store {
  id: number
  name: string
  city: string
}

interface LinkConfig {
  name: string
  scope: string
  period: string
  show_financial: boolean
  allowed_stores: Store[]
  created_by: string
}

interface DashboardMetrics {
  total_assets: number
  available_assets: number
  in_use_assets: number
  maintenance_assets: number
  total_value: number | null
}

interface Asset {
  id: number
  name: string
  brand_model: string
  status: string
  created_at: string
  purchase_value: number | null
}

interface DashboardData {
  store: Store
  metrics: DashboardMetrics
  assets: Asset[]
  show_financial: boolean
}

// Skeleton Components
const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
)

const SkeletonTable = () => (
  <div className="bg-white rounded-lg shadow animate-pulse">
    <div className="p-6 border-b">
      <div className="h-6 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-3">
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  </div>
)

export const PublicPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(true)
  const [config, setConfig] = useState<LinkConfig | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  
  // Password handling
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Validate token on mount
  useEffect(() => {
    if (!token || token.length !== 32) {
      toast.error('Token inválido')
      navigate('/')
      return
    }
    
    validateToken()
  }, [token])

  // Load dashboard when store is selected
  useEffect(() => {
    if (selectedStoreId && config) {
      loadDashboard()
    }
  }, [selectedStoreId, config])

  const validateToken = async () => {
    try {
      setValidating(true)
      const url = `/api/external-reports/public/validate/${token}${password ? `?password=${encodeURIComponent(password)}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.status === 401 && data.requiresPassword) {
        setRequiresPassword(true)
        setValidating(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao validar token')
      }

      setConfig(data.config)
      setRequiresPassword(false)
      setPasswordError('')
      
    } catch (error: any) {
      console.error('Erro na validação:', error)
      if (error.message.includes('Senha incorreta')) {
        setPasswordError('Senha incorreta')
        setRequiresPassword(true)
      } else {
        toast.error(error.message || 'Erro ao validar acesso')
        navigate('/')
      }
    } finally {
      setValidating(false)
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    if (!selectedStoreId || !token) return

    try {
      setLoadingDashboard(true)
      const url = `/api/external-reports/public/dashboard/${token}/${selectedStoreId}${password ? `?password=${encodeURIComponent(password)}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao carregar dados')
      }

      setDashboardData(data)
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error(error.message || 'Erro ao carregar dados')
    } finally {
      setLoadingDashboard(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setPasswordError('Senha é obrigatória')
      return
    }
    setPasswordError('')
    validateToken()
  }

  const exportToPDF = () => {
    if (!dashboardData || !config) return

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.width
    
    // Header
    pdf.setFontSize(20)
    pdf.text(config.name, 20, 30)
    
    pdf.setFontSize(12)
    pdf.text(`Loja: ${dashboardData.store.name} - ${dashboardData.store.city}`, 20, 45)
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 55)
    pdf.text(`Período: ${getPeriodLabel(config.period)}`, 20, 65)

    // Metrics
    pdf.setFontSize(16)
    pdf.text('Resumo Executivo', 20, 85)
    
    pdf.setFontSize(12)
    let yPos = 100
    pdf.text(`Total de Ativos: ${dashboardData.metrics.total_assets}`, 20, yPos)
    yPos += 10
    pdf.text(`Disponíveis: ${dashboardData.metrics.available_assets}`, 20, yPos)
    yPos += 10
    pdf.text(`Em Uso: ${dashboardData.metrics.in_use_assets}`, 20, yPos)
    yPos += 10
    pdf.text(`Em Manutenção: ${dashboardData.metrics.maintenance_assets}`, 20, yPos)
    
    if (dashboardData.show_financial && dashboardData.metrics.total_value !== null) {
      yPos += 10
      pdf.text(`Valor Patrimonial: R$ ${dashboardData.metrics.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPos)
    }

    // Assets table
    if (dashboardData.assets.length > 0) {
      yPos += 20
      pdf.setFontSize(16)
      pdf.text('Lista de Ativos', 20, yPos)
      
      const tableData = dashboardData.assets.map(asset => [
        asset.name,
        asset.brand_model,
        asset.status,
        new Date(asset.created_at).toLocaleDateString('pt-BR'),
        dashboardData.show_financial && asset.purchase_value 
          ? `R$ ${asset.purchase_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
          : '-'
      ])

      const columns = ['Nome', 'Modelo', 'Status', 'Data Chegada']
      if (dashboardData.show_financial) {
        columns.push('Valor')
      }

      ;(pdf as any).autoTable({
        head: [columns],
        body: tableData,
        startY: yPos + 10,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })
    }

    // Footer
    const pageCount = pdf.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pdf.internal.pageSize.height - 10)
      pdf.text(`Criado por: ${config.created_by}`, 20, pdf.internal.pageSize.height - 10)
    }

    pdf.save(`relatorio-${dashboardData.store.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Relatório exportado com sucesso!')
  }

  const getPeriodLabel = (period: string) => {
    const labels = {
      '7days': 'Últimos 7 dias',
      '30days': 'Últimos 30 dias',
      'current_month': 'Mês atual'
    }
    return labels[period as keyof typeof labels] || period
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'Disponível': 'bg-green-100 text-green-800 border-green-200',
      'Em Uso': 'bg-blue-100 text-blue-800 border-blue-200',
      'Manutenção': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Em Trânsito': 'bg-purple-100 text-purple-800 border-purple-200',
      'Descartado': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Password form
  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Acesso Protegido</h2>
            <p className="text-gray-600 mt-2">Este relatório requer senha para acesso</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={validating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                'Acessar Relatório'
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading || validating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          
          <SkeletonTable />
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro de Acesso</h2>
          <p className="text-gray-600">Não foi possível carregar as configurações do relatório</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{config.name}</h1>
              <p className="text-gray-600 mt-2">
                Período: {getPeriodLabel(config.period)} • Criado por: {config.created_by}
              </p>
            </div>
            
            {dashboardData && (
              <button
                onClick={exportToPDF}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </button>
            )}
          </div>
        </div>

        {/* Store Selector */}
        {config?.allowed_stores && config.allowed_stores.length >= 1 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Unidade ({config.allowed_stores.length} disponíveis)
            </label>
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(Number(e.target.value))}
              className="max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione uma unidade...</option>
              {config.allowed_stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} - {store.city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dashboard Content */}
        {selectedStoreId && (
          <>
            {loadingDashboard ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
                <SkeletonTable />
              </>
            ) : dashboardData ? (
              <>
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Ativos</p>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.metrics.total_assets}</p>
                      </div>
                      <Package className="h-12 w-12 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Disponíveis</p>
                        <p className="text-3xl font-bold text-green-600">{dashboardData.metrics.available_assets}</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Em Uso</p>
                        <p className="text-3xl font-bold text-blue-600">{dashboardData.metrics.in_use_assets}</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {dashboardData.show_financial && dashboardData.metrics.total_value !== null && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Valor Patrimonial</p>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {dashboardData.metrics.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <DollarSign className="h-12 w-12 text-green-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Assets Table */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Ativos - {dashboardData.store.name}
                      </h3>
                      <button
                        onClick={loadDashboard}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Atualizar
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ativo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Chegada
                          </th>
                          {dashboardData.show_financial && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Valor
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.assets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                                <div className="text-sm text-gray-500">{asset.brand_model}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(asset.status)}`}>
                                {asset.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {new Date(asset.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            {dashboardData.show_financial && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {asset.purchase_value 
                                  ? `R$ ${asset.purchase_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                                  : '-'
                                }
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {dashboardData.assets.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ativo encontrado</h3>
                      <p className="text-gray-500">Não há ativos cadastrados para esta unidade no período selecionado.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
                <p className="text-gray-500 mb-4">Não foi possível carregar os dados da unidade selecionada.</p>
                <button
                  onClick={loadDashboard}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </button>
              </div>
            )}
          </>
        )}

        {/* No store selected */}
        {!selectedStoreId && config.allowed_stores && config.allowed_stores.length > 1 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma Unidade</h3>
            <p className="text-gray-500">Escolha uma unidade no filtro acima para visualizar os dados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
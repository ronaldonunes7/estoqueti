import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  Download, 
  FileText, 
  Calendar,
  Filter,
  Package,
  ArrowRightLeft
} from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<'assets' | 'movements'>('assets')
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    type: '',
    start_date: '',
    end_date: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: dashboardData } = useQuery(
    'dashboard-reports',
    async () => {
      const response = await api.get('/dashboard/metrics')
      return response.data
    }
  )

  const downloadReport = async (fileFormat: 'csv' | 'pdf') => {
    setIsGenerating(true)
    const loadingToast = toast.loading(`Gerando relatório ${fileFormat.toUpperCase()}...`)
    
    try {
      const endpoint = reportType === 'assets' ? '/reports/assets' : '/reports/movements'
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      console.log('📊 Solicitando relatório:', { endpoint, format: fileFormat, params: params.toString() })

      const response = await api.get(`${endpoint}/${fileFormat}?${params}`, {
        responseType: 'blob',
        timeout: 60000 // 60 segundos para relatórios grandes
      })

      console.log('✅ Relatório recebido:', response.data.size, 'bytes')

      // Verificar se a resposta é realmente um blob
      if (!(response.data instanceof Blob)) {
        throw new Error('Resposta inválida do servidor')
      }

      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
      const filename = `relatorio-${reportType}-${timestamp}.${fileFormat}`
      link.setAttribute('download', filename)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.dismiss(loadingToast)
      toast.success(`Relatório ${fileFormat.toUpperCase()} baixado com sucesso!`)
    } catch (error: any) {
      console.error('❌ Erro ao gerar relatório:', error)
      toast.dismiss(loadingToast)
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro ao gerar relatório. Tente novamente.'
      
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setIsGenerating(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      type: '',
      start_date: '',
      end_date: ''
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600">Exportar dados para prestação de contas</p>
      </div>

      {/* Resumo executivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.metrics?.totalAssets || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="h-4 w-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.metrics?.availableAssets || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Uso</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.metrics?.inUseAssets || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ArrowRightLeft className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saídas (30d)</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.metrics?.recentCheckouts || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuração de relatórios */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gerar Relatório</h3>
        
        <div className="space-y-4">
          {/* Tipo de relatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="assets"
                  checked={reportType === 'assets'}
                  onChange={(e) => setReportType(e.target.value as 'assets')}
                  className="mr-2"
                />
                <Package className="h-4 w-4 mr-1" />
                Relatório de Ativos
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="movements"
                  checked={reportType === 'movements'}
                  onChange={(e) => setReportType(e.target.value as 'movements')}
                  className="mr-2"
                />
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Relatório de Movimentações
              </label>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportType === 'assets' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input"
                  >
                    <option value="">Todos</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Em Uso">Em Uso</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="input"
                  >
                    <option value="">Todas</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Periférico">Periférico</option>
                    <option value="Licença">Licença</option>
                    <option value="Insumos">Insumos</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Movimentação
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="input"
                  >
                    <option value="">Todos</option>
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Descarte">Descarte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    className="input"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="btn btn-secondary w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Botões de download */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={() => downloadReport('csv')}
              disabled={isGenerating}
              className="btn btn-primary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Gerando...' : 'Baixar CSV'}
            </button>

            <button
              onClick={() => downloadReport('pdf')}
              disabled={isGenerating}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isGenerating ? 'Gerando...' : 'Baixar PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Informações sobre os relatórios */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Sobre os Relatórios
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Relatório de Ativos:</strong> Lista completa de todos os ativos com suas informações detalhadas, status atual e dados de compra.</li>
                <li><strong>Relatório de Movimentações:</strong> Histórico completo de todas as movimentações (entradas, saídas, manutenções) com timestamps e responsáveis.</li>
                <li><strong>Formato CSV:</strong> Ideal para análise em planilhas e integração com outros sistemas.</li>
                <li><strong>Formato PDF:</strong> Perfeito para apresentações e documentação oficial.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {dashboardData?.breakdowns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Distribuição por Categoria
            </h3>
            <div className="space-y-3">
              {dashboardData.breakdowns.category.map((item: any) => (
                <div key={item.category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.category}</span>
                  <span className="font-medium text-gray-900">{item.count} itens</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Distribuição por Status
            </h3>
            <div className="space-y-3">
              {dashboardData.breakdowns.status.map((item: any) => (
                <div key={item.status} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      item.status === 'Disponível' ? 'bg-green-500' :
                      item.status === 'Em Uso' ? 'bg-blue-500' :
                      item.status === 'Manutenção' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">{item.status}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.count} itens</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
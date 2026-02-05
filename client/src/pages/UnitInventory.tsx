import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Filter, 
  Download,
  Eye,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Activity,
  Send,
  Plus
} from 'lucide-react'
import api from '../services/api'
import { Asset, Store } from '../types'
import { usePermissions } from '../hooks/usePermissions'
import { AdminOnly, AccessDenied } from '../components/RoleGuard'
import { AssetDetailDrawer } from '../components/AssetDetailDrawer'
import toast from 'react-hot-toast'

export const UnitInventory: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const permissions = usePermissions()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)

  // Buscar dados da unidade
  const { data: storeData, isLoading: storeLoading } = useQuery(
    ['store', id],
    async () => {
      const response = await api.get(`/stores/${id}`)
      return response.data
    },
    { enabled: !!id }
  )

  // Buscar inventário da unidade
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery(
    ['unit-inventory', id, statusFilter],
    async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await api.get(`/stores/${id}/inventory?${params}`)
      return response.data
    },
    { enabled: !!id }
  )

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset)
    setShowDrawer(true)
  }

  const handleTransfer = (asset: Asset) => {
    // Navegar para a página de transferência com o ativo pré-selecionado
    navigate('/transfer', { state: { asset, fromStore: storeData } })
  }

  const handleAddStock = (asset: Asset) => {
    // Navegar para a página de ativos com modal de adicionar estoque
    navigate('/assets', { state: { addStockAsset: asset } })
  }

  const handleDiscard = (asset: Asset) => {
    // Navegar para a página de ativos com modal de dar baixa
    navigate('/assets', { state: { discardAsset: asset } })
  }

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/stores/${id}/inventory/export`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `inventario-${storeData?.name?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Inventário exportado com sucesso!')
    } catch (error) {
      toast.error('Erro ao exportar inventário')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'Disponível': 'bg-green-100 text-green-800 border-green-200',
      'Em Uso': 'bg-blue-100 text-blue-800 border-blue-200',
      'Manutenção': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Em Trânsito': 'bg-purple-100 text-purple-800 border-purple-200',
      'Descartado': 'bg-red-100 text-red-800 border-red-200'
    }
    
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const filteredAssets = inventoryData?.assets?.filter((asset: Asset) => {
    if (statusFilter === 'all') return true
    return asset.status === statusFilter
  }) || []

  if (storeLoading || inventoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Unidade não encontrada</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 btn btn-primary"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{storeData.name}</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {storeData.address}, {storeData.city}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleExportPDF}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar Inventário
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Valor Total */}
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Valor Total em Ativos</p>
              <p className="text-2xl font-bold">
                R$ {inventoryData?.summary?.totalValue?.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) || '0,00'}
              </p>
              <p className="text-sm text-green-100 mt-1">
                {inventoryData?.summary?.uniqueAssets || 0} ativos únicos e{' '}
                {inventoryData?.summary?.consumables || 0} insumos monitorados
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        {/* Total de Itens */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total de Itens</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventoryData?.summary?.totalItems || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Todos os status
              </p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        {/* Disponíveis */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Disponíveis</p>
              <p className="text-2xl font-bold text-green-600">
                {inventoryData?.summary?.available || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Prontos para uso
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-green-500" />
            </div>
          </div>
        </div>

        {/* Em Uso */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Em Uso</p>
              <p className="text-2xl font-bold text-blue-600">
                {inventoryData?.summary?.inUse || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Com colaboradores
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtrar por status:</span>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Todos', count: inventoryData?.summary?.totalItems || 0 },
                { key: 'Disponível', label: 'Disponíveis', count: inventoryData?.summary?.available || 0 },
                { key: 'Em Uso', label: 'Em Uso', count: inventoryData?.summary?.inUse || 0 },
                { key: 'Manutenção', label: 'Manutenção', count: inventoryData?.summary?.maintenance || 0 }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Ativos */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ativo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Identificação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável Atual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chegada na Unidade
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset: Asset & { 
                current_user?: string, 
                arrival_date?: string, 
                purchase_value?: number 
              }) => (
                <tr key={asset.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {asset.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.brand_model}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{asset.patrimony_tag}</div>
                    <div className="text-sm text-gray-500">{asset.serial_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.current_user || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.purchase_value 
                      ? `R$ ${asset.purchase_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.arrival_date 
                      ? new Date(asset.arrival_date).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleAssetClick(asset)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum ativo encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all' 
                  ? 'Esta unidade não possui ativos cadastrados.'
                  : `Não há ativos com status "${statusFilter}" nesta unidade.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer de Detalhes do Ativo */}
      <AssetDetailDrawer
        asset={selectedAsset}
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false)
          setSelectedAsset(null)
        }}
        storeId={parseInt(id || '0')}
        onTransfer={handleTransfer}
        onAddStock={handleAddStock}
        onDiscard={handleDiscard}
      />
    </div>
  )
}
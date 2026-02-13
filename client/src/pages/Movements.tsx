import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  ArrowRightLeft, 
  LogIn, 
  LogOut, 
  Wrench,
  Filter,
  X,
  Download,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  User,
  Eye,
  ExternalLink,
  Share2,
  Scan,
  Plus,
  Minus,
  FileText
} from 'lucide-react'
import api from '../services/api'
import { Movement, MovementFilters, Store, Asset } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ShareReportModal } from '../components/ShareReportModal'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { ResponsibilityTermModal } from '../components/ResponsibilityTermModal'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const Movements: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<MovementFilters>({
    page: 1,
    limit: 20
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTermModal, setShowTermModal] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null)
  const [bipMode, setBipMode] = useState(false)
  const [scannedItems, setScannedItems] = useState<Array<{
    asset: Asset
    quantity: number
    timestamp: Date
  }>>([])
  const [movementType, setMovementType] = useState<'Entrada' | 'Saída'>('Saída')

  // Queries
  const { data: movementsData, isLoading } = useQuery(
    ['movements', filters],
    async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString())
      })
      
      const response = await api.get(`/movements?${params}`)
      return response.data
    }
  )

  const { data: kpisData } = useQuery(
    ['movements-kpis', filters.start_date, filters.end_date],
    async () => {
      const params = new URLSearchParams()
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      const response = await api.get(`/movements/kpis?${params}`)
      return response.data
    }
  )

  const { data: storesData } = useQuery(
    'stores-for-filter',
    async () => {
      const response = await api.get('/stores')
      return response.data.stores
    }
  )

  // Handlers
  const handleFilterChange = (key: keyof MovementFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filtering
    }))
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20
    })
  }

  // Funções do Modo Bip
  const handleAssetScanned = (asset: Asset) => {
    const existingItem = scannedItems.find(item => item.asset.id === asset.id)
    
    if (existingItem) {
      // Se já existe, incrementar quantidade
      setScannedItems(prev => prev.map(item => 
        item.asset.id === asset.id 
          ? { ...item, quantity: item.quantity + 1, timestamp: new Date() }
          : item
      ))
      toast.success(`${asset.name} - Quantidade: ${existingItem.quantity + 1}`)
    } else {
      // Adicionar novo item
      setScannedItems(prev => [...prev, {
        asset,
        quantity: 1,
        timestamp: new Date()
      }])
      toast.success(`${asset.name} adicionado à lista`)
    }
  }

  const handleConsumableScanned = (asset: Asset, quantity: number) => {
    const existingItem = scannedItems.find(item => item.asset.id === asset.id)
    
    if (existingItem) {
      // Se já existe, somar quantidade
      setScannedItems(prev => prev.map(item => 
        item.asset.id === asset.id 
          ? { ...item, quantity: item.quantity + quantity, timestamp: new Date() }
          : item
      ))
      toast.success(`${asset.name} - Total: ${existingItem.quantity + quantity}`)
    } else {
      // Adicionar novo item
      setScannedItems(prev => [...prev, {
        asset,
        quantity,
        timestamp: new Date()
      }])
      toast.success(`${asset.name} (${quantity}x) adicionado à lista`)
    }
  }

  const removeScannedItem = (assetId: number) => {
    setScannedItems(prev => prev.filter(item => item.asset.id !== assetId))
  }

  const updateItemQuantity = (assetId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeScannedItem(assetId)
      return
    }
    
    setScannedItems(prev => prev.map(item => 
      item.asset.id === assetId 
        ? { ...item, quantity: newQuantity, timestamp: new Date() }
        : item
    ))
  }

  const clearScannedItems = () => {
    setScannedItems([])
  }

  // Mutation para processar movimentações em lote
  const processBatchMovementMutation = useMutation(
    async (items: typeof scannedItems) => {
      const movements = items.map(item => ({
        asset_id: item.asset.id,
        type: movementType,
        employee_name: 'Modo Bip',
        destination: movementType === 'Saída' ? 'Saída via Scanner' : 'Entrada via Scanner',
        responsible_technician: user?.username || 'Sistema',
        observations: `Movimentação via código de barras - ${format(item.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
        quantity: item.quantity
      }))

      // Processar cada movimentação
      for (const movement of movements) {
        await api.post('/movements', movement)
      }

      return movements
    },
    {
      onSuccess: (movements) => {
        queryClient.invalidateQueries('movements')
        queryClient.invalidateQueries('assets')
        toast.success(`${movements.length} movimentações processadas com sucesso!`)
        clearScannedItems()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao processar movimentações')
      }
    }
  )

  const downloadComprovante = async (movementId: number) => {
    try {
      const response = await api.get(`/movements/${movementId}/comprovante`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `comprovante-${movementId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error)
    }
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

  const getMovementIcon = (type: string) => {
    const icons = {
      'Entrada': <LogIn className="h-4 w-4" />,
      'Saída': <LogOut className="h-4 w-4" />,
      'Transferência': <ArrowRightLeft className="h-4 w-4" />,
      'Manutenção': <Wrench className="h-4 w-4" />,
      'Descarte': <X className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <ArrowRightLeft className="h-4 w-4" />
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getOriginDestination = (movement: Movement) => {
    switch (movement.type) {
      case 'Entrada':
        return {
          origin: movement.destination || 'Fornecedor',
          destination: 'Estoque Central'
        }
      case 'Saída':
        return {
          origin: 'Estoque Central',
          destination: movement.destination || 'Colaborador'
        }
      case 'Transferência':
        return {
          origin: 'Estoque Central',
          destination: movement.store_name || movement.destination || 'Destino'
        }
      case 'Manutenção':
        return {
          origin: 'Estoque Central',
          destination: 'Manutenção Externa'
        }
      default:
        return {
          origin: 'N/A',
          destination: 'N/A'
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimentações</h1>
          <p className="text-gray-600">Auditoria e análise de movimentações de ativos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setBipMode(!bipMode)}
            className={`btn flex items-center gap-2 ${
              bipMode ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Scan className="h-4 w-4" />
            {bipMode ? 'Sair do Modo Bip' : 'Modo Bip'}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowShareModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar Relatório
            </button>
          )}
        </div>
      </div>

      {/* Modo Bip - Scanner de Código de Barras */}
      {bipMode && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Scan className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Modo Bip - Scanner Ativo</h2>
              <p className="text-sm text-gray-600">Escaneie códigos de barras para movimentação rápida</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scanner */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimentação
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMovementType('Saída')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      movementType === 'Saída'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <LogOut className="h-4 w-4 inline mr-1" />
                    Saída
                  </button>
                  <button
                    onClick={() => setMovementType('Entrada')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      movementType === 'Entrada'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <LogIn className="h-4 w-4 inline mr-1" />
                    Entrada
                  </button>
                </div>
              </div>

              <BarcodeScanner
                onAssetFound={handleAssetScanned}
                onQuantitySelect={handleConsumableScanned}
                movementType={movementType}
                placeholder="🔍 Escaneie ou digite o código de barras..."
              />
            </div>

            {/* Lista de Itens Escaneados */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  Itens Escaneados ({scannedItems.length})
                </h3>
                {scannedItems.length > 0 && (
                  <button
                    onClick={clearScannedItems}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scannedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Scan className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum item escaneado</p>
                  </div>
                ) : (
                  scannedItems.map((item) => (
                    <div key={item.asset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.asset.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.asset.brand_model}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateItemQuantity(item.asset.id, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium px-2">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(item.asset.id, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-green-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeScannedItem(item.asset.id)}
                          className="p-1 text-gray-400 hover:text-red-600 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {scannedItems.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => processBatchMovementMutation.mutate(scannedItems)}
                    disabled={processBatchMovementMutation.isLoading}
                    className="w-full btn btn-primary text-sm disabled:opacity-50"
                  >
                    {processBatchMovementMutation.isLoading ? (
                      'Processando...'
                    ) : (
                      `Processar ${scannedItems.length} ${movementType}${scannedItems.length > 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPIs Cards */}
      {kpisData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Saídas (Mês)</p>
                <p className="text-2xl font-bold text-gray-900">{kpisData.totalSaidas.count}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(kpisData.totalSaidas.value)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Itens em Manutenção</p>
                <p className="text-2xl font-bold text-gray-900">{kpisData.itensManutencao.count}</p>
                <p className="text-sm text-gray-500">Externa</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor em Movimentação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(kpisData.valorTotalMovimentacao.value)}
                </p>
                <p className="text-sm text-gray-500">Estimado</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Avançados */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros Avançados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Movimentação
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="Entrada">Entrada</option>
                <option value="Saída">Saída</option>
                <option value="Transferência">Transferência</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Descarte">Descarte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loja/Destino
              </label>
              <select
                value={filters.store_id || ''}
                onChange={(e) => handleFilterChange('store_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="input"
              >
                <option value="">Todas</option>
                {storesData?.map((store: Store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Técnico
              </label>
              <input
                type="text"
                placeholder="Nome do técnico..."
                value={filters.technician || ''}
                onChange={(e) => handleFilterChange('technician', e.target.value || undefined)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                  className="input flex-1"
                />
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
                  className="input flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="btn btn-secondary flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Auditoria */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Auditoria de Movimentações</h3>
          <div className="text-sm text-gray-500">
            {movementsData?.pagination && (
              <>
                {movementsData.pagination.total} registros encontrados
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ativo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origem → Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movementsData?.movements?.map((movement: Movement) => {
                  const { origin, destination } = getOriginDestination(movement)
                  
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${getMovementBadge(movement.type).replace('text-', 'text-white ').replace('bg-', 'bg-').split(' ')[0]}`}>
                            {getMovementIcon(movement.type)}
                          </div>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getMovementBadge(movement.type)}`}>
                            {movement.type}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            to={`/inventory/asset/${movement.asset_id}/history`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-900 hover:underline flex items-center gap-1"
                          >
                            {movement.asset_name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <div className="text-sm text-gray-500 mt-1">
                            {movement.patrimony_tag && (
                              <Link
                                to={`/inventory/asset/${movement.asset_id}/history`}
                                className="font-mono bg-gray-100 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors"
                              >
                                {movement.patrimony_tag}
                              </Link>
                            )}
                            {movement.serial_number && (
                              <span className="ml-1 text-xs">
                                {movement.serial_number}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            Qtd: {movement.quantity}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600">{origin}</span>
                          <ArrowRightLeft className="h-3 w-3 mx-2 text-gray-400" />
                          <span className="text-gray-900 font-medium">{destination}</span>
                        </div>
                        {movement.store_city && (
                          <div className="text-xs text-gray-500 mt-1">
                            {movement.store_city}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{movement.employee_name}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.responsible_technician}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(movement.movement_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(movement.movement_date), 'HH:mm', { locale: ptBR })}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Novo
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/inventory/asset/${movement.asset_id}/history`}
                            className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                            title="Ver Histórico do Ativo"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Histórico</span>
                          </Link>
                          
                          {/* Botão Termo de Responsabilidade - apenas para Saída e Transferência */}
                          {(movement.type === 'Saída' || movement.type === 'Transferência') && (
                            <button
                              onClick={() => {
                                setSelectedMovement(movement)
                                setShowTermModal(true)
                              }}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              title="Gerar Termo de Responsabilidade"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="hidden sm:inline">Termo</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => downloadComprovante(movement.id)}
                            className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                            title="Gerar Comprovante"
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Comprovante</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {movementsData?.pagination && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
                disabled={(filters.page || 1) === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => handleFilterChange('page', Math.min(movementsData.pagination.pages, (filters.page || 1) + 1))}
                disabled={(filters.page || 1) >= movementsData.pagination.pages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {((filters.page || 1) - 1) * (filters.limit || 20) + 1}
                  </span>{' '}
                  até{' '}
                  <span className="font-medium">
                    {Math.min((filters.page || 1) * (filters.limit || 20), movementsData.pagination.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{movementsData.pagination.total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
                    disabled={(filters.page || 1) === 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', Math.min(movementsData.pagination.pages, (filters.page || 1) + 1))}
                    disabled={(filters.page || 1) >= movementsData.pagination.pages}
                    className="btn btn-secondary disabled:opacity-50 ml-2"
                  >
                    Próximo
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Compartilhamento */}
      {showShareModal && (
        <ShareReportModal
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Modal de Termo de Responsabilidade */}
      {showTermModal && (
        <ResponsibilityTermModal
          isOpen={showTermModal}
          onClose={() => {
            setShowTermModal(false)
            setSelectedMovement(null)
          }}
          movement={selectedMovement}
        />
      )}
    </div>
  )
}
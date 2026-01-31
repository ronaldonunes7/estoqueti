import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  X,
  Archive,
  CheckSquare,
  Square,
  AlertTriangle,
  PackagePlus,
  AlertCircle
} from 'lucide-react'
import api from '../services/api'
import { Asset, AssetFormData } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { InteractiveStatusBadge } from '../components/InteractiveStatusBadge'
import { BulkActionsBar } from '../components/BulkActionsBar'
import { AddStockModal } from '../components/AddStockModal'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { StockIndicator } from '../components/molecules/StockIndicator'
import { AssetTooltip } from '../components/molecules/AssetTooltip'
import toast from 'react-hot-toast'

export const Assets: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [page, setPage] = useState(1)
  const [selectedAssets, setSelectedAssets] = useState<number[]>([])
  const [showStockOnly, setShowStockOnly] = useState(false)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [showCriticalItems, setShowCriticalItems] = useState(false)
  const [showAddStockModal, setShowAddStockModal] = useState(false)
  const [bipMode, setBipMode] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AssetFormData>()

  const { data: assetsData, isLoading, refetch } = useQuery(
    ['assets', search, categoryFilter, statusFilter, page, showStockOnly, showLowStockOnly, showCriticalItems],
    async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryFilter) params.append('category', categoryFilter)
      if (statusFilter) params.append('status', statusFilter)
      if (showStockOnly) {
        // Filtrar apenas ativos em estoque (Disponível e Manutenção)
        if (!statusFilter) {
          params.append('status_in', 'Disponível,Manutenção')
        }
      }
      if (showLowStockOnly) {
        params.append('low_stock_only', 'true')
      }
      if (showCriticalItems) {
        // Filtro para itens críticos: estoque baixo OU em manutenção
        params.append('critical_items', 'true')
      }
      params.append('page', page.toString())
      
      const response = await api.get(`/assets?${params}`)
      return response.data
    }
  )

  const createAssetMutation = useMutation(
    (data: AssetFormData) => api.post('/assets', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assets')
        setShowModal(false)
        reset()
        toast.success('Ativo criado com sucesso!')
      }
    }
  )

  const updateAssetMutation = useMutation(
    ({ id, data }: { id: number; data: AssetFormData }) => api.put(`/assets/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assets')
        setShowModal(false)
        setEditingAsset(null)
        reset()
        toast.success('Ativo atualizado com sucesso!')
      }
    }
  )

  const deleteAssetMutation = useMutation(
    (id: number) => api.delete(`/assets/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assets')
        toast.success('Ativo deletado com sucesso!')
      }
    }
  )

  const onSubmit = (data: AssetFormData) => {
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data })
    } else {
      createAssetMutation.mutate(data)
    }
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    reset(asset)
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja deletar este ativo?')) {
      deleteAssetMutation.mutate(id)
    }
  }

  const handleSelectAsset = (assetId: number, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, assetId])
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== assetId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allAssetIds = assetsData?.assets?.map((asset: Asset) => asset.id) || []
      setSelectedAssets(allAssetIds)
    } else {
      setSelectedAssets([])
    }
  }

  const clearSelection = () => {
    setSelectedAssets([])
  }

  const getSelectedAssetsData = () => {
    return assetsData?.assets?.filter((asset: Asset) => 
      selectedAssets.includes(asset.id)
    ).map((asset: Asset) => ({
      id: asset.id,
      name: asset.name,
      status: asset.status
    })) || []
  }

  const openModal = () => {
    setEditingAsset(null)
    reset({
      status: 'Disponível',
      category: 'Hardware'
    })
    setShowModal(true)
  }

  const isLowStock = (asset: Asset) => {
    return asset.asset_type === 'consumable' && 
           asset.stock_quantity !== undefined && 
           asset.min_stock !== undefined &&
           asset.stock_quantity <= asset.min_stock &&
           asset.min_stock > 0
  }

  const getRowClassName = (asset: Asset) => {
    const baseClass = "hover:bg-gray-50"
    if (isLowStock(asset)) {
      return `${baseClass} bg-red-50 border-l-4 border-red-500`
    }
    return baseClass
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ativos</h1>
          <p className="text-gray-600">Gerenciar inventário de ativos de TI</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddStockModal(true)}
              className="btn btn-success flex items-center gap-2"
            >
              <PackagePlus className="h-4 w-4" />
              Adicionar Saldo
            </button>
            <button
              onClick={openModal}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Ativo
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por tag, serial ou nome..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            <option value="Hardware">Hardware</option>
            <option value="Periférico">Periférico</option>
            <option value="Licença">Licença</option>
            <option value="Insumos">Insumos</option>
          </select>

          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="Disponível">Disponível</option>
            <option value="Em Uso">Em Uso</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Descartado">Descartado</option>
          </select>

          <button
            onClick={() => setShowStockOnly(!showStockOnly)}
            className={`btn flex items-center gap-2 ${
              showStockOnly ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'btn-secondary'
            }`}
          >
            <Archive className="h-4 w-4" />
            Apenas em Estoque
          </button>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`btn flex items-center gap-2 ${
              showLowStockOnly ? 'btn-primary bg-red-600 hover:bg-red-700' : 'btn-secondary'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Itens em Falta
          </button>

          <button
            onClick={() => setShowCriticalItems(!showCriticalItems)}
            className={`btn flex items-center gap-2 ${
              showCriticalItems ? 'bg-amber-600 text-white hover:bg-amber-700' : 'btn-secondary'
            }`}
            title="Itens abaixo do estoque mínimo ou em manutenção"
          >
            <AlertCircle className="h-4 w-4" />
            ⚠️ Itens Críticos
          </button>

          <button
            onClick={() => setBipMode(!bipMode)}
            className={`btn flex items-center gap-2 ${
              bipMode ? 'btn-primary bg-green-600 hover:bg-green-700' : 'btn-secondary'
            }`}
            title="Modo Bip para adição rápida de estoque"
          >
            <PackagePlus className="h-4 w-4" />
            {bipMode ? 'Bip ON' : 'Modo Bip'}
          </button>

          <button
            onClick={() => {
              setSearch('')
              setCategoryFilter('')
              setStatusFilter('')
              setShowStockOnly(false)
              setShowLowStockOnly(false)
              setShowCriticalItems(false)
              setPage(1)
            }}
            className="btn btn-secondary flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        </div>
      </div>

      {/* Lista de ativos */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {user?.role === 'admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={(e) => handleSelectAll((e.target as HTMLInputElement).checked)}
                          className="flex items-center"
                        >
                          {selectedAssets.length === assetsData?.assets?.length && assetsData?.assets?.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-primary-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ativo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identificação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código de Barras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    {user?.role === 'admin' && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assetsData?.assets?.map((asset: Asset) => (
                    <tr key={asset.id} className={getRowClassName(asset)}>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSelectAsset(asset.id, !selectedAssets.includes(asset.id))}
                            className="flex items-center"
                          >
                            {selectedAssets.includes(asset.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AssetTooltip asset={asset}>
                          <div className="flex items-center">
                            <Package className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2 hover:text-blue-600 transition-colors cursor-help">
                                {asset.name}
                                {isLowStock(asset) && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {asset.brand_model}
                              </div>
                            </div>
                          </div>
                        </AssetTooltip>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{asset.patrimony_tag}</div>
                        <div className="text-sm text-gray-500">{asset.serial_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.barcode ? (
                          <div className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded border">
                            {asset.barcode}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Não cadastrado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {asset.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StockIndicator
                          currentStock={asset.stock_quantity || 0}
                          minStock={asset.min_stock || 0}
                          assetType={asset.asset_type}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.location || '-'}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {asset.asset_type === 'consumable' && (
                              <button
                                onClick={() => {
                                  setShowAddStockModal(true)
                                  // Pre-select this asset for stock addition
                                  setTimeout(() => {
                                    // This will be handled by the modal component
                                  }, 100)
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Adicionar estoque"
                              >
                                <PackagePlus className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(asset)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {assetsData?.pagination && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= assetsData.pagination.pages}
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
                        {(page - 1) * assetsData.pagination.limit + 1}
                      </span>{' '}
                      até{' '}
                      <span className="font-medium">
                        {Math.min(page * assetsData.pagination.limit, assetsData.pagination.total)}
                      </span>{' '}
                      de{' '}
                      <span className="font-medium">{assetsData.pagination.total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="btn btn-secondary disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= assetsData.pagination.pages}
                        className="btn btn-secondary disabled:opacity-50 ml-2"
                      >
                        Próximo
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingAsset ? 'Editar Ativo' : 'Novo Ativo'}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome *</label>
                        <input
                          {...register('name', { required: 'Nome é obrigatório' })}
                          className="input mt-1"
                        />
                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Marca/Modelo *</label>
                        <input
                          {...register('brand_model', { required: 'Marca/Modelo é obrigatório' })}
                          className="input mt-1"
                        />
                        {errors.brand_model && <p className="text-red-600 text-sm mt-1">{errors.brand_model.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Número de Série *</label>
                        <input
                          {...register('serial_number', { required: 'Número de série é obrigatório' })}
                          className="input mt-1"
                        />
                        {errors.serial_number && <p className="text-red-600 text-sm mt-1">{errors.serial_number.message}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tag Patrimônio *</label>
                        <input
                          {...register('patrimony_tag', { required: 'Tag de patrimônio é obrigatória' })}
                          className="input mt-1"
                        />
                        {errors.patrimony_tag && <p className="text-red-600 text-sm mt-1">{errors.patrimony_tag.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Código de Barras (EAN/Serial)</label>
                        <input
                          {...register('barcode')}
                          className="input mt-1"
                          placeholder="Código de barras único"
                        />
                        {errors.barcode && <p className="text-red-600 text-sm mt-1">{errors.barcode.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Categoria *</label>
                        <select
                          {...register('category', { required: 'Categoria é obrigatória' })}
                          className="input mt-1"
                        >
                          <option value="Hardware">Hardware</option>
                          <option value="Periférico">Periférico</option>
                          <option value="Licença">Licença</option>
                          <option value="Insumos">Insumos</option>
                        </select>
                        {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          {...register('status')}
                          className="input mt-1"
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Em Uso">Em Uso</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Descartado">Descartado</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Compra</label>
                        <input
                          type="date"
                          {...register('purchase_date')}
                          className="input mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valor de Compra</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('purchase_value')}
                          className="input mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vencimento Garantia</label>
                        <input
                          type="date"
                          {...register('warranty_expiry')}
                          className="input mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Localização</label>
                        <input
                          {...register('location')}
                          className="input mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Observações</label>
                      <textarea
                        {...register('notes')}
                        rows={3}
                        className="input mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createAssetMutation.isLoading || updateAssetMutation.isLoading}
                    className="btn btn-primary sm:ml-3 sm:w-auto"
                  >
                    {createAssetMutation.isLoading || updateAssetMutation.isLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary mt-3 sm:mt-0 sm:w-auto"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Ações em Lote */}
      <BulkActionsBar
        selectedAssets={getSelectedAssetsData()}
        onClearSelection={clearSelection}
      />

      {/* Modal de Adicionar Estoque */}
      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        onSuccess={() => {
          refetch()
          queryClient.invalidateQueries('dashboard')
        }}
        bipMode={bipMode}
      />
    </div>
  )
}
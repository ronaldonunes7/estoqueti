import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { 
  ArrowRight, 
  Search, 
  Package,
  Store,
  AlertCircle,
  CheckCircle,
  X,
  QrCode
} from 'lucide-react'
import api from '../services/api'
import { Asset, Store as StoreType, TransferFormData } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { ShippingLabelGenerator } from '../components/ShippingLabelGenerator'
import toast from 'react-hot-toast'

export const Transfer: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null)
  const [assetSearch, setAssetSearch] = useState('')
  const [storeSearch, setStoreSearch] = useState('')
  
  // Estados para etiqueta de envio
  const [showShippingLabel, setShowShippingLabel] = useState(false)
  const [lastTransferData, setLastTransferData] = useState<{
    movementId: number
    assetName: string
    patrimonyTag?: string
    serialNumber?: string
    destinationStore: string
    destinationCity: string
    quantity: number
    responsibleTechnician: string
  } | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TransferFormData>({
    defaultValues: {
      quantity: 1,
      responsible_technician: user?.username || ''
    }
  })

  const quantity = watch('quantity')

  // Pré-selecionar ativo baseado no parâmetro da URL (vindo do QR Scanner)
  useEffect(() => {
    const assetId = searchParams.get('asset_id')
    if (assetId && !selectedAsset) {
      // Buscar o ativo específico
      api.get(`/assets/${assetId}`)
        .then(response => {
          const asset = response.data
          
          // VALIDAÇÃO: Verificar se o ativo pode ser transferido
          const validation = canAssetBeTransferred(asset)
          
          if (!validation.canTransfer) {
            toast.error(`ERRO: O item "${asset.name}" ${validation.reason}`, {
              duration: 6000,
              icon: '🚫'
            })
            return
          }
          
          setSelectedAsset(asset)
          setAssetSearch(asset.name) // Preencher o campo de busca
          toast.success(`Ativo "${asset.name}" selecionado via QR Code!`)
        })
        .catch(error => {
          console.error('Erro ao buscar ativo:', error)
          toast.error('Ativo não encontrado')
        })
    }
  }, [searchParams, selectedAsset])

  const { data: assetsData } = useQuery(
    ['assets-for-transfer', assetSearch],
    async () => {
      const params = new URLSearchParams()
      if (assetSearch) params.append('search', assetSearch)
      params.append('limit', '20')
      
      const response = await api.get(`/assets?${params}`)
      return response.data
    }
  )

  const { data: storesData } = useQuery(
    ['stores-for-transfer', storeSearch],
    async () => {
      const params = new URLSearchParams()
      if (storeSearch) params.append('search', storeSearch)
      params.append('limit', '20')
      
      const response = await api.get(`/stores?${params}`)
      return response.data
    }
  )

  const transferMutation = useMutation(
    (data: TransferFormData) => api.post('/movements/transfer', data),
    {
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries('assets')
        queryClient.invalidateQueries('movements')
        queryClient.invalidateQueries('dashboard')
        
        // Capturar dados para etiqueta de envio
        if (selectedAsset && selectedStore) {
          setLastTransferData({
            movementId: response.data.movement_id || Date.now(), // Fallback se não retornar ID
            assetName: selectedAsset.name,
            patrimonyTag: selectedAsset.patrimony_tag,
            serialNumber: selectedAsset.serial_number,
            destinationStore: selectedStore.name,
            destinationCity: selectedStore.city,
            quantity: variables.quantity,
            responsibleTechnician: variables.responsible_technician
          })
        }
        
        // Reset form
        setSelectedAsset(null)
        setSelectedStore(null)
        setAssetSearch('')
        setStoreSearch('')
        reset({
          quantity: 1,
          responsible_technician: user?.username || ''
        })
        
        toast.success('Transferência realizada com sucesso!')
      }
    }
  )

  const onSubmit = (data: TransferFormData) => {
    if (!selectedAsset || !selectedStore) {
      toast.error('Selecione um produto e uma loja de destino')
      return
    }

    const formData = {
      ...data,
      asset_id: selectedAsset.id,
      store_id: selectedStore.id
    }

    console.log('Enviando dados de transferência:', formData)
    transferMutation.mutate(formData)
  }

  const selectAsset = (asset: Asset) => {
    // VALIDAÇÃO: Verificar se o ativo pode ser transferido
    const validation = canAssetBeTransferred(asset)
    
    if (!validation.canTransfer) {
      toast.error(`ERRO: ${validation.reason}`, {
        duration: 5000,
        icon: '🚫'
      })
      return
    }

    setSelectedAsset(asset)
    setValue('asset_id', asset.id)
    
    // Para ativos únicos, forçar quantidade 1
    if (asset.asset_type === 'unique') {
      setValue('quantity', 1)
    }
  }

  const selectStore = (store: StoreType) => {
    setSelectedStore(store)
    setValue('store_id', store.id)
  }

  const getAvailableAssets = () => {
    if (!assetsData?.assets) return []
    
    return assetsData.assets.filter((asset: Asset) => {
      if (asset.asset_type === 'unique') {
        // REGRA: Ativos únicos devem estar 'Disponível' APENAS
        // Removendo 'Em Uso' pois não faz sentido transferir algo já em uso
        return asset.status === 'Disponível'
      } else {
        // REGRA: Insumos devem ter quantidade > 0 no estoque
        return asset.stock_quantity > 0
      }
    })
  }

  // Função para validar se um ativo pode ser transferido
  const canAssetBeTransferred = (asset: Asset): { canTransfer: boolean; reason?: string } => {
    if (asset.asset_type === 'unique') {
      if (asset.status !== 'Disponível') {
        return {
          canTransfer: false,
          reason: `O item está com status '${asset.status}' e não pode ser transferido. Apenas itens 'Disponível' podem ser transferidos.`
        }
      }
    } else {
      if (asset.stock_quantity <= 0) {
        return {
          canTransfer: false,
          reason: `O item não possui estoque disponível (${asset.stock_quantity} unidades).`
        }
      }
    }
    
    return { canTransfer: true }
  }

  const canTransfer = selectedAsset && selectedStore && quantity > 0 && 
    (selectedAsset.asset_type === 'unique' || quantity <= selectedAsset.stock_quantity)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova Transferência</h1>
        <p className="text-gray-600">Transferir produtos para lojas/unidades</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seleção de Produto */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            1. Selecionar Produto
          </h3>
          
          {!selectedAsset ? (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar produto por nome, serial ou tag..."
                  className="input pl-10"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
              </div>
              
              {/* Helper text */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    <strong>Exibindo apenas itens prontos para saída:</strong> Ativos únicos com status 'Disponível' e insumos com estoque disponível.
                  </span>
                </p>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {getAvailableAssets().map((asset: Asset) => (
                  <div
                    key={asset.id}
                    onClick={() => selectAsset(asset)}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{asset.name}</div>
                        <div className="text-sm text-gray-500">
                          {asset.brand_model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.asset_type === 'unique' 
                            ? `${asset.patrimony_tag || asset.serial_number}` 
                            : `Estoque: ${asset.stock_quantity}`
                          }
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          asset.asset_type === 'unique' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {asset.asset_type === 'unique' ? 'Único' : 'Insumo'}
                        </span>
                        {asset.asset_type === 'unique' && (
                          <span className={`mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                            asset.status === 'Disponível' ? 'bg-green-100 text-green-800' :
                            asset.status === 'Em Uso' ? 'bg-blue-100 text-blue-800' :
                            asset.status === 'Manutenção' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {asset.status}
                          </span>
                        )}
                        {asset.asset_type === 'consumable' && asset.stock_quantity <= asset.min_stock && (
                          <span className="text-xs text-red-600 mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Estoque baixo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {getAvailableAssets().length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum produto disponível para transferência
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-900">{selectedAsset.name}</div>
                <div className="text-sm text-gray-600">
                  {selectedAsset.asset_type === 'unique' 
                    ? `${selectedAsset.patrimony_tag || selectedAsset.serial_number}` 
                    : `Estoque disponível: ${selectedAsset.stock_quantity}`
                  }
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quantidade */}
        {selectedAsset && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              2. Definir Quantidade
            </h3>
            
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                max={selectedAsset.asset_type === 'unique' ? 1 : selectedAsset.stock_quantity}
                disabled={selectedAsset.asset_type === 'unique'}
                {...register('quantity', { 
                  required: 'Quantidade é obrigatória',
                  min: { value: 1, message: 'Quantidade deve ser maior que 0' },
                  max: { 
                    value: selectedAsset.asset_type === 'unique' ? 1 : selectedAsset.stock_quantity, 
                    message: `Quantidade máxima: ${selectedAsset.asset_type === 'unique' ? 1 : selectedAsset.stock_quantity}` 
                  }
                })}
                className="input"
              />
              {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
              
              {selectedAsset.asset_type === 'consumable' && (
                <p className="text-sm text-gray-500 mt-1">
                  Máximo disponível: {selectedAsset.stock_quantity}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Seleção de Loja */}
        {selectedAsset && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Store className="h-5 w-5 mr-2" />
              3. Selecionar Loja de Destino
            </h3>
            
            {!selectedStore ? (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar loja por nome ou cidade..."
                    className="input pl-10"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {storesData?.stores?.map((store: StoreType) => (
                    <div
                      key={store.id}
                      onClick={() => selectStore(store)}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-500">
                        {store.city} - {store.responsible}
                      </div>
                      <div className="text-sm text-gray-500">
                        {store.address}
                      </div>
                    </div>
                  ))}
                  {(!storesData?.stores || storesData.stores.length === 0) && (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma loja encontrada
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{selectedStore.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedStore.city} - {selectedStore.responsible}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStore(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Informações Adicionais */}
        {selectedAsset && selectedStore && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              4. Informações da Transferência
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Colaborador (Quem receberá o ativo) *
                </label>
                <input
                  {...register('employee_name', { required: 'Nome do colaborador é obrigatório' })}
                  className="input mt-1"
                  placeholder="Nome do colaborador que receberá o ativo"
                />
                {errors.employee_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.employee_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Técnico Responsável *
                </label>
                <input
                  {...register('responsible_technician', { required: 'Técnico responsável é obrigatório' })}
                  className="input mt-1"
                />
                {errors.responsible_technician && (
                  <p className="text-red-600 text-sm mt-1">{errors.responsible_technician.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  {...register('observations')}
                  rows={3}
                  className="input mt-1"
                  placeholder="Observações sobre a transferência..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Resumo da Transferência */}
        {canTransfer && (
          <div className="card bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Resumo da Transferência
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium">{selectedAsset.name}</div>
                  <div className="text-xs text-gray-500">Qtd: {quantity}</div>
                </div>
                
                <ArrowRight className="h-6 w-6 text-gray-400" />
                
                <div className="text-center">
                  <Store className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium">{selectedStore.name}</div>
                  <div className="text-xs text-gray-500">{selectedStore.city}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setSelectedAsset(null)
              setSelectedStore(null)
              setAssetSearch('')
              setStoreSearch('')
              reset()
            }}
            className="btn btn-secondary"
          >
            Limpar
          </button>
          
          <button
            type="submit"
            disabled={!canTransfer || transferMutation.isLoading}
            className="btn btn-primary"
          >
            {transferMutation.isLoading ? 'Processando...' : 'Confirmar Transferência'}
          </button>
        </div>
        
        {/* Botão de Etiqueta de Envio - Aparece após transferência bem-sucedida */}
        {lastTransferData && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">
                    Transferência realizada com sucesso!
                  </h4>
                  <p className="text-sm text-green-700">
                    {lastTransferData.assetName} → {lastTransferData.destinationStore}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShippingLabel(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <QrCode className="h-4 w-4 mr-2" />
                📄 Imprimir Etiqueta de Envio
              </button>
            </div>
          </div>
        )}
      </form>
      
      {/* Modal de Etiqueta de Envio */}
      {showShippingLabel && lastTransferData && (
        <ShippingLabelGenerator
          movementId={lastTransferData.movementId}
          assetName={lastTransferData.assetName}
          patrimonyTag={lastTransferData.patrimonyTag}
          serialNumber={lastTransferData.serialNumber}
          destinationStore={lastTransferData.destinationStore}
          destinationCity={lastTransferData.destinationCity}
          quantity={lastTransferData.quantity}
          responsibleTechnician={lastTransferData.responsibleTechnician}
          onClose={() => {
            setShowShippingLabel(false)
            setLastTransferData(null) // Limpar dados após fechar
          }}
        />
      )}
    </div>
  )
}
import React, { useState } from 'react'
import { Check, X, Loader2, Package, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from 'react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

interface BulkActionsBarProps {
  selectedAssets: Array<{
    id: number
    name: string
    status: string
  }>
  onClearSelection: () => void
}

const statusOptions = [
  { value: 'Disponível', label: 'Disponível', color: 'bg-green-100 text-green-800' },
  { value: 'Em Uso', label: 'Em Uso', color: 'bg-blue-100 text-blue-800' },
  { value: 'Manutenção', label: 'Manutenção', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Descartado', label: 'Descartado', color: 'bg-red-100 text-red-800' }
]

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedAssets,
  onClearSelection
}) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [observations, setObservations] = useState('')
  const queryClient = useQueryClient()

  const bulkUpdateMutation = useMutation(
    async ({ status, observations }: { status: string; observations: string }) => {
      // Atualizar status de todos os ativos selecionados usando a rota específica
      const promises = selectedAssets.map(asset => 
        api.patch(`/assets/${asset.id}/status`, { status })
      )
      
      await Promise.all(promises)
      
      // Registrar movimentações em lote
      const movementPromises = selectedAssets.map(asset =>
        api.post('/movements/status-change', {
          asset_id: asset.id,
          old_status: asset.status,
          new_status: status,
          observations,
          type: getMovementType(asset.status, status)
        })
      )
      
      await Promise.all(movementPromises)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assets')
        queryClient.invalidateQueries('movements')
        toast.success(`Status de ${selectedAssets.length} ativo(s) atualizado para "${selectedStatus}"`)
        setShowModal(false)
        setObservations('')
        setSelectedStatus('')
        onClearSelection()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao atualizar status em lote')
      }
    }
  )

  const getMovementType = (oldStatus: string, newStatus: string) => {
    if (newStatus === 'Manutenção') return 'Manutenção'
    if (newStatus === 'Descartado') return 'Descarte'
    if (oldStatus === 'Disponível' && newStatus === 'Em Uso') return 'Saída'
    if (oldStatus === 'Em Uso' && newStatus === 'Disponível') return 'Entrada'
    if (newStatus === 'Disponível') return 'Entrada' // Qualquer coisa voltando para disponível
    if (newStatus === 'Em Uso') return 'Saída' // Qualquer coisa indo para em uso
    return 'Entrada' // Fallback seguro
  }

  const handleBulkUpdate = () => {
    if (!selectedStatus) {
      toast.error('Selecione um status')
      return
    }
    
    if (!observations.trim()) {
      toast.error('Adicione uma observação para justificar a mudança')
      return
    }
    
    bulkUpdateMutation.mutate({
      status: selectedStatus,
      observations: observations.trim()
    })
  }

  const getStatusSummary = () => {
    const statusCount = selectedAssets.reduce((acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(statusCount).map(([status, count]) => (
      <span key={status} className="text-xs bg-gray-100 px-2 py-1 rounded">
        {count}x {status}
      </span>
    ))
  }

  if (selectedAssets.length === 0) return null

  return (
    <>
      {/* Barra de Ações */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-96">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-600" />
                <span className="font-medium text-gray-900">
                  {selectedAssets.length} ativo(s) selecionado(s)
                </span>
              </div>
              <div className="flex gap-1">
                {getStatusSummary()}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary text-sm"
              >
                Alterar Status em Lote
              </button>
              <button
                onClick={onClearSelection}
                className="btn btn-secondary text-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Alteração em Lote */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary-600" />
                    Alteração de Status em Lote
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Alterar status de <strong>{selectedAssets.length} ativo(s)</strong> selecionado(s)
                  </p>
                </div>

                {/* Lista de Ativos Selecionados */}
                <div className="mb-4 max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                  <div className="p-3 space-y-2">
                    {selectedAssets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">{asset.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          statusOptions.find(s => s.value === asset.status)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {asset.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Seleção de Novo Status */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Novo Status *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedStatus(option.value)}
                        className={`p-3 text-sm border rounded-md transition-all ${
                          selectedStatus === option.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${option.color.split(' ')[0]}`}></span>
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observação (obrigatória) *
                  </label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Descreva o motivo da alteração em lote..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Aviso */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs text-yellow-800">
                        <strong>Atenção:</strong> Esta ação irá alterar o status de {selectedAssets.length} ativo(s) 
                        e registrar movimentações individuais para cada um. Esta operação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleBulkUpdate}
                  disabled={!selectedStatus || !observations.trim() || bulkUpdateMutation.isLoading}
                  className="btn btn-primary sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {bulkUpdateMutation.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando {selectedAssets.length} ativo(s)...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar Alteração
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setObservations('')
                    setSelectedStatus('')
                  }}
                  disabled={bulkUpdateMutation.isLoading}
                  className="btn btn-secondary mt-3 sm:mt-0 sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
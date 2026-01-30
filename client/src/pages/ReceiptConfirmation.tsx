import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Scan,
  Clock,
  MapPin,
  User,
  Calendar,
  X,
  Check
} from 'lucide-react'
import api from '../services/api'
import { PendingTransfer } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { BarcodeScanner } from '../components/BarcodeScanner'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const ReceiptConfirmation: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showScanner, setShowScanner] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<PendingTransfer | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDivergenceModal, setShowDivergenceModal] = useState(false)
  const [receivedQuantity, setReceivedQuantity] = useState(1)
  const [observations, setObservations] = useState('')
  const [divergenceType, setDivergenceType] = useState<'damaged' | 'quantity_mismatch' | 'other'>('damaged')
  const [divergenceDescription, setDivergenceDescription] = useState('')

  // Buscar transferências pendentes
  const { data: pendingTransfers, isLoading } = useQuery(
    'pending-transfers',
    async () => {
      const response = await api.get('/movements/pending-receipts')
      return response.data.transfers
    }
  )

  // Buscar transferência por código de barras
  const scanTransferMutation = useMutation(
    async (barcode: string) => {
      const response = await api.get(`/movements/pending-receipt/${barcode}`)
      return response.data
    },
    {
      onSuccess: (transfer) => {
        setSelectedTransfer(transfer)
        setReceivedQuantity(transfer.quantity)
        setShowConfirmModal(true)
        toast.success(`Transferência encontrada: ${transfer.asset_name}`)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Transferência não encontrada')
      }
    }
  )

  // Confirmar recebimento
  const confirmReceiptMutation = useMutation(
    async (data: {
      asset_id: number
      transfer_id: number
      received_quantity: number
      observations?: string
      has_divergence?: boolean
      divergence_type?: string
      divergence_description?: string
    }) => {
      const response = await api.post('/movements/confirm-receipt', data)
      return response.data
    },
    {
      onSuccess: (result) => {
        queryClient.invalidateQueries('pending-transfers')
        queryClient.invalidateQueries('assets')
        queryClient.invalidateQueries('dashboard')
        
        setShowConfirmModal(false)
        setShowDivergenceModal(false)
        setSelectedTransfer(null)
        setObservations('')
        setDivergenceDescription('')
        
        if (result.has_divergence) {
          toast.success('Recebimento confirmado com divergência registrada')
        } else {
          toast.success('Recebimento confirmado com sucesso!')
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao confirmar recebimento')
      }
    }
  )

  const handleBarcodeScanned = (barcode: string) => {
    scanTransferMutation.mutate(barcode)
  }

  const handleConfirmReceipt = () => {
    if (!selectedTransfer) return

    confirmReceiptMutation.mutate({
      asset_id: selectedTransfer.asset_id,
      transfer_id: selectedTransfer.id,
      received_quantity: receivedQuantity,
      observations
    })
  }

  const handleReportDivergence = () => {
    if (!selectedTransfer) return

    confirmReceiptMutation.mutate({
      asset_id: selectedTransfer.asset_id,
      transfer_id: selectedTransfer.id,
      received_quantity: receivedQuantity,
      observations,
      has_divergence: true,
      divergence_type: divergenceType,
      divergence_description: divergenceDescription
    })
  }

  const selectTransferFromList = (transfer: PendingTransfer) => {
    setSelectedTransfer(transfer)
    setReceivedQuantity(transfer.quantity)
    setShowConfirmModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmar Recebimento</h1>
          <p className="text-gray-600">Confirme o recebimento de itens transferidos</p>
        </div>
        <button
          onClick={() => setShowScanner(!showScanner)}
          className={`btn ${showScanner ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`}
        >
          <Scan className="h-4 w-4" />
          {showScanner ? 'Fechar Scanner' : 'Modo Scanner'}
        </button>
      </div>

      {/* Scanner de Código de Barras */}
      {showScanner && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Scan className="h-5 w-5 mr-2" />
            Scanner de Recebimento
          </h3>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Escaneie o código de barras do item que você acabou de receber para confirmar automaticamente
            </p>
          </div>
          <BarcodeScanner
            onAssetFound={(asset) => {
              if (asset.barcode) {
                handleBarcodeScanned(asset.barcode)
              }
            }}
            placeholder="Escaneie o código de barras do item recebido..."
            customValidation={(asset) => {
              if (asset.status !== 'Em Trânsito' && asset.asset_type === 'unique') {
                return {
                  isValid: false,
                  errorMessage: `ERRO: O item "${asset.name}" não está em trânsito. Status atual: ${asset.status}`
                }
              }
              return { isValid: true }
            }}
          />
        </div>
      )}

      {/* Lista de Transferências Pendentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Transferências Pendentes ({pendingTransfers?.length || 0})
          </h3>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando transferências...</p>
          </div>
        ) : pendingTransfers?.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma transferência pendente</p>
            <p className="text-sm text-gray-400">Todos os itens foram recebidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTransfers?.map((transfer: PendingTransfer) => (
              <div
                key={transfer.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => selectTransferFromList(transfer)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{transfer.asset_name}</h4>
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Em Trânsito
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{transfer.asset_brand_model}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>Para: {transfer.destination_store}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Colaborador: {transfer.employee_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(transfer.transfer_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {transfer.observations && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <strong>Observações:</strong> {transfer.observations}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {transfer.quantity}x
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        selectTransferFromList(transfer)
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && selectedTransfer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      Confirmar Recebimento
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTransfer.asset_name} - {selectedTransfer.asset_brand_model}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade Recebida
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedTransfer.quantity}
                      value={receivedQuantity}
                      onChange={(e) => setReceivedQuantity(parseInt(e.target.value) || 1)}
                      className="input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quantidade enviada: {selectedTransfer.quantity}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      rows={3}
                      className="input"
                      placeholder="Observações sobre o recebimento..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setShowDivergenceModal(true)
                  }}
                  className="flex-1 btn btn-warning"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reportar Divergência
                </button>
                <button
                  onClick={handleConfirmReceipt}
                  disabled={confirmReceiptMutation.isLoading}
                  className="flex-1 btn btn-primary"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Recebimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Divergência */}
      {showDivergenceModal && selectedTransfer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      Reportar Divergência
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTransfer.asset_name} - {selectedTransfer.asset_brand_model}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Divergência
                    </label>
                    <select
                      value={divergenceType}
                      onChange={(e) => setDivergenceType(e.target.value as any)}
                      className="input"
                    >
                      <option value="damaged">Item danificado/quebrado</option>
                      <option value="quantity_mismatch">Quantidade incorreta</option>
                      <option value="other">Outro problema</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade Recebida
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedTransfer.quantity}
                      value={receivedQuantity}
                      onChange={(e) => setReceivedQuantity(parseInt(e.target.value) || 0)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição da Divergência *
                    </label>
                    <textarea
                      value={divergenceDescription}
                      onChange={(e) => setDivergenceDescription(e.target.value)}
                      rows={3}
                      className="input"
                      placeholder="Descreva detalhadamente o problema encontrado..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações Adicionais
                    </label>
                    <textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      rows={2}
                      className="input"
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowDivergenceModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={handleReportDivergence}
                  disabled={confirmReceiptMutation.isLoading || !divergenceDescription.trim()}
                  className="flex-1 btn btn-warning"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Confirmar com Divergência
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QrCode, Camera, CheckCircle, Package, Search } from 'lucide-react'
import { QRScanner } from '../components/QRScanner'
import { usePermissions } from '../hooks/usePermissions'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

interface PendingTransfer {
  id: number
  asset_id: number
  asset_name: string
  asset_brand_model: string
  asset_barcode?: string
  asset_type: 'unique' | 'consumable'
  quantity: number
  origin_store?: string
  destination_store: string
  employee_name: string
  responsible_technician: string
  movement_date: string
  observations?: string
}

export const ReceiptConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin } = usePermissions()
  const [showScanner, setShowScanner] = useState(false)
  const [showManualConfirm, setShowManualConfirm] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<PendingTransfer | null>(null)
  const [confirmationData, setConfirmationData] = useState({
    received_quantity: 0,
    observations: '',
    has_divergence: false,
    divergence_type: '',
    divergence_description: ''
  })
  
  const movementId = searchParams.get('id')

  // Buscar transferências pendentes (apenas para admin)
  const { data: pendingTransfers, isLoading } = useQuery(
    'pending-transfers',
    async () => {
      const response = await api.get('/movements/pending-receipts')
      return response.data.transfers as PendingTransfer[]
    },
    {
      enabled: isAdmin && showManualConfirm
    }
  )

  // Mutation para confirmar recebimento
  const confirmReceiptMutation = useMutation(
    async (data: {
      asset_id: number
      transfer_id: number
      received_quantity?: number
      observations?: string
      has_divergence?: boolean
      divergence_type?: string
      divergence_description?: string
    }) => {
      const response = await api.post('/movements/confirm-receipt', data)
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Recebimento confirmado com sucesso!')
        queryClient.invalidateQueries('pending-transfers')
        queryClient.invalidateQueries('movements')
        queryClient.invalidateQueries('dashboard')
        setSelectedTransfer(null)
        setShowManualConfirm(false)
        setConfirmationData({
          received_quantity: 0,
          observations: '',
          has_divergence: false,
          divergence_type: '',
          divergence_description: ''
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao confirmar recebimento')
      }
    }
  )

  const handleManualConfirm = () => {
    if (!selectedTransfer) {
      toast.error('Selecione uma transferência')
      return
    }

    const data: any = {
      asset_id: selectedTransfer.asset_id,
      transfer_id: selectedTransfer.id,
      observations: confirmationData.observations
    }

    if (selectedTransfer.asset_type === 'consumable') {
      if (!confirmationData.received_quantity || confirmationData.received_quantity <= 0) {
        toast.error('Informe a quantidade recebida')
        return
      }
      data.received_quantity = confirmationData.received_quantity
    }

    if (confirmationData.has_divergence) {
      data.has_divergence = true
      data.divergence_type = confirmationData.divergence_type
      data.divergence_description = confirmationData.divergence_description
    }

    confirmReceiptMutation.mutate(data)
  }

  const handleQRCodeScan = (data: string) => {
    console.log('QR Code escaneado:', data)
    setScannedData(data)
    setShowScanner(false)
    toast.success('QR Code lido com sucesso!')
  }

  const handleScanError = (error: any) => {
    console.error('Erro no scanner:', error)
    toast.error('Erro ao acessar a câmera')
  }

  if (!movementId && !showScanner && !scannedData && !showManualConfirm) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Confirmar Recebimento
            </h3>
            <p className="text-gray-500 mb-6">
              Escaneie o QR Code da etiqueta de envio
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowScanner(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="h-5 w-5 mr-2" />
                Escanear QR Code
              </button>

              {isAdmin && (
                <button
                  onClick={() => setShowManualConfirm(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Package className="h-5 w-5 mr-2" />
                  Confirmação Manual
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showScanner) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Scanner QR Code
          </h3>
          
          <QRScanner
            onScan={handleQRCodeScan}
            onError={handleScanError}
          />
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowScanner(false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (scannedData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              QR Code Escaneado!
            </h3>
            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="text-sm text-gray-700 break-all">{scannedData}</p>
            </div>
            <button
              onClick={() => {
                setScannedData(null)
                setShowScanner(true)
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Escanear Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Interface de confirmação manual (apenas admin)
  if (showManualConfirm && isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Confirmação Manual de Recebimento
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowManualConfirm(false)
                  setSelectedTransfer(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Lista de transferências pendentes */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando transferências...</p>
              </div>
            ) : !pendingTransfers || pendingTransfers.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">Nenhuma transferência pendente</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Selecione a transferência para confirmar:
                </h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pendingTransfers.map((transfer) => (
                    <div
                      key={transfer.id}
                      onClick={() => {
                        setSelectedTransfer(transfer)
                        setConfirmationData({
                          ...confirmationData,
                          received_quantity: transfer.quantity
                        })
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTransfer?.id === transfer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {transfer.asset_name}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              {transfer.asset_type === 'unique' ? 'Único' : 'Insumo'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {transfer.asset_brand_model}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Origem:</span>
                              <span className="ml-1 text-gray-900">
                                {transfer.origin_store || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Destino:</span>
                              <span className="ml-1 text-gray-900">
                                {transfer.destination_store}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Quantidade:</span>
                              <span className="ml-1 text-gray-900">
                                {transfer.quantity}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Data:</span>
                              <span className="ml-1 text-gray-900">
                                {new Date(transfer.movement_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          {transfer.observations && (
                            <p className="text-xs text-gray-500 mt-2">
                              Obs: {transfer.observations}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulário de confirmação */}
                {selectedTransfer && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Dados de Confirmação
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Quantidade recebida (apenas para insumos) */}
                      {selectedTransfer.asset_type === 'consumable' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantidade Recebida *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={selectedTransfer.quantity}
                            value={confirmationData.received_quantity}
                            onChange={(e) => setConfirmationData({
                              ...confirmationData,
                              received_quantity: parseInt(e.target.value) || 0
                            })}
                            className="input"
                            placeholder="Quantidade recebida"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Quantidade enviada: {selectedTransfer.quantity}
                          </p>
                        </div>
                      )}

                      {/* Observações */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Observações
                        </label>
                        <textarea
                          value={confirmationData.observations}
                          onChange={(e) => setConfirmationData({
                            ...confirmationData,
                            observations: e.target.value
                          })}
                          className="input"
                          rows={3}
                          placeholder="Observações sobre o recebimento..."
                        />
                      </div>

                      {/* Divergência */}
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={confirmationData.has_divergence}
                            onChange={(e) => setConfirmationData({
                              ...confirmationData,
                              has_divergence: e.target.checked
                            })}
                            className="rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Registrar divergência
                          </span>
                        </label>
                      </div>

                      {confirmationData.has_divergence && (
                        <div className="space-y-3 pl-6 border-l-2 border-yellow-400">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tipo de Divergência
                            </label>
                            <select
                              value={confirmationData.divergence_type}
                              onChange={(e) => setConfirmationData({
                                ...confirmationData,
                                divergence_type: e.target.value
                              })}
                              className="input"
                            >
                              <option value="">Selecione...</option>
                              <option value="damaged">Item danificado</option>
                              <option value="quantity_mismatch">Divergência de quantidade</option>
                              <option value="other">Outro</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descrição da Divergência
                            </label>
                            <textarea
                              value={confirmationData.divergence_description}
                              onChange={(e) => setConfirmationData({
                                ...confirmationData,
                                divergence_description: e.target.value
                              })}
                              className="input"
                              rows={2}
                              placeholder="Descreva a divergência encontrada..."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setSelectedTransfer(null)}
                        className="btn btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleManualConfirm}
                        disabled={confirmReceiptMutation.isLoading}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        {confirmReceiptMutation.isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Confirmando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Confirmar Recebimento
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Confirmar Recebimento
        </h3>
        <p className="text-gray-500">
          ID da movimentação: {movementId}
        </p>
      </div>
    </div>
  )
}
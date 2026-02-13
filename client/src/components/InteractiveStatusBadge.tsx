import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from 'react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

interface InteractiveStatusBadgeProps {
  assetId: number
  assetName: string
  currentStatus: string
  onStatusChange?: (newStatus: string) => void
  disabled?: boolean
}

const statusOptions = [
  { value: 'Disponível', label: 'Disponível', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'Em Uso', label: 'Em Uso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'Em Trânsito', label: 'Em Trânsito', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'Manutenção', label: 'Manutenção', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'Descartado', label: 'Descartado', color: 'bg-red-100 text-red-800 border-red-200' }
]

export const InteractiveStatusBadge: React.FC<InteractiveStatusBadgeProps> = ({
  assetId,
  assetName,
  currentStatus,
  onStatusChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [observations, setObservations] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const updateStatusMutation = useMutation(
    async ({ status, observations }: { status: string; observations: string }) => {
      setIsUpdating(true)
      try {
        console.log('Atualizando status:', { assetId, status, observations })
        
        // Primeiro, testar com a rota de teste
        console.log('Testando rota simples...')
        const testResponse = await api.patch(`/assets/test/${assetId}`, { status })
        console.log('Teste OK:', testResponse.data)
        
        // Se o teste funcionar, usar a rota real
        const statusData = { status }
        console.log('Dados para PATCH /assets/:id/status:', JSON.stringify(statusData))
        
        // Atualizar o status do ativo usando a rota específica
        const statusResponse = await api.patch(`/assets/${assetId}/status`, statusData)
        console.log('Status atualizado:', statusResponse.data)
        
        // Registrar a movimentação
        const movementData = {
          asset_id: assetId,
          old_status: currentStatus,
          new_status: status,
          observations,
          type: getMovementType(currentStatus, status)
        }
        console.log('Dados para POST /movements/status-change:', JSON.stringify(movementData))
        
        const movementResponse = await api.post('/movements/status-change', movementData)
        console.log('Movimentação registrada:', movementResponse.data)
        
      } catch (error) {
        console.error('Erro na mutação:', error)
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assets')
        queryClient.invalidateQueries('movements')
        toast.success(`Status de "${assetName}" atualizado para "${selectedStatus}"`)
        setShowConfirmModal(false)
        setObservations('')
        onStatusChange?.(selectedStatus)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao atualizar status')
      }
    }
  )

  const getMovementType = (oldStatus: string, newStatus: string) => {
    if (newStatus === 'Manutenção') return 'Manutenção'
    if (newStatus === 'Descartado') return 'Descarte'
    if (oldStatus === 'Disponível' && newStatus === 'Em Uso') return 'Saída'
    if (oldStatus === 'Em Uso' && newStatus === 'Disponível') return 'Entrada'
    return 'Alteração de Status'
  }

  const getCurrentStatusConfig = () => {
    return statusOptions.find(option => option.value === currentStatus) || statusOptions[0]
  }

  const handleStatusSelect = (status: string) => {
    if (status === currentStatus) {
      setIsOpen(false)
      return
    }
    
    setSelectedStatus(status)
    setIsOpen(false)
    setShowConfirmModal(true)
  }

  const handleConfirm = async () => {
    if (!observations.trim()) {
      toast.error('Por favor, adicione uma observação para justificar a mudança')
      return
    }
    
    console.log('Confirmando alteração:', { selectedStatus, observations: observations.trim() })
    
    // Teste direto com fetch para eliminar axios como possível causa
    try {
      setIsUpdating(true)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/assets/test/${assetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: selectedStatus })
      })
      
      const result = await response.json()
      console.log('Fetch result:', result)
      
      if (response.ok) {
        toast.success('Teste funcionou! Agora usando mutação normal...')
        updateStatusMutation.mutate({
          status: selectedStatus,
          observations: observations.trim()
        })
      } else {
        toast.error('Erro no teste: ' + result.message)
      }
    } catch (error) {
      console.error('Erro no fetch:', error)
      toast.error('Erro no teste fetch')
    } finally {
      setIsUpdating(false)
    }
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentConfig = getCurrentStatusConfig()

  if (isUpdating) {
    return (
      <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${currentConfig.color}`}>
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Atualizando...
      </div>
    )
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border transition-all duration-200 ${
            disabled 
              ? `${currentConfig.color} opacity-50 cursor-not-allowed`
              : `${currentConfig.color} hover:shadow-md cursor-pointer`
          }`}
        >
          {currentStatus}
          {!disabled && <ChevronDown className="h-3 w-3 ml-1" />}
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                  option.value === currentStatus ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${option.color.split(' ')[0]}`}></span>
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirmar Alteração de Status
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Alterar status de <strong>"{assetName}"</strong> de{' '}
                    <span className={`px-2 py-1 text-xs rounded-full ${getCurrentStatusConfig().color}`}>
                      {currentStatus}
                    </span>{' '}
                    para{' '}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      statusOptions.find(s => s.value === selectedStatus)?.color
                    }`}>
                      {selectedStatus}
                    </span>
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observação (obrigatória) *
                  </label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Descreva o motivo da alteração..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-yellow-800">
                        Esta ação será registrada automaticamente no histórico de movimentações do ativo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleConfirm}
                  disabled={!observations.trim() || isUpdating}
                  className="btn btn-primary sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setObservations('')
                  }}
                  disabled={isUpdating}
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
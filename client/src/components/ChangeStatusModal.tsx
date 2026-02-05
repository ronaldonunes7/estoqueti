import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { X, AlertCircle, User, CheckCircle } from 'lucide-react'
import api from '../services/api'
import { Asset } from '../types'
import toast from 'react-hot-toast'

interface ChangeStatusModalProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  storeId: number
}

type StatusOption = 'Disponível' | 'Em Uso' | 'Manutenção'

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  asset,
  isOpen,
  onClose,
  storeId
}) => {
  const queryClient = useQueryClient()
  const [newStatus, setNewStatus] = useState<StatusOption>(asset.status as StatusOption)
  const [employeeName, setEmployeeName] = useState('')
  const [observations, setObservations] = useState('')

  const changeStatusMutation = useMutation(
    async (data: {
      asset_id: number
      new_status: string
      employee_name?: string
      observations?: string
      store_id: number
    }) => {
      const response = await api.post('/movements/status-change', data)
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Status alterado com sucesso!')
        queryClient.invalidateQueries(['unit-inventory', storeId.toString()])
        queryClient.invalidateQueries(['asset-unit-history', asset.id, storeId])
        queryClient.invalidateQueries('dashboard')
        onClose()
        resetForm()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao alterar status')
      }
    }
  )

  const resetForm = () => {
    setNewStatus(asset.status as StatusOption)
    setEmployeeName('')
    setObservations('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validação: Se mudar para "Em Uso", colaborador é obrigatório
    if (newStatus === 'Em Uso' && !employeeName.trim()) {
      toast.error('Informe o nome do colaborador responsável')
      return
    }

    // Não permitir mudança para o mesmo status
    if (newStatus === asset.status) {
      toast.error('Selecione um status diferente do atual')
      return
    }

    const data: any = {
      asset_id: asset.id,
      new_status: newStatus,
      store_id: storeId,
      observations: observations.trim() || undefined
    }

    if (newStatus === 'Em Uso') {
      data.employee_name = employeeName.trim()
    }

    changeStatusMutation.mutate(data)
  }

  const getStatusBadgeClass = (status: string) => {
    const badges = {
      'Disponível': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Em Uso': 'bg-blue-100 text-blue-800 border-blue-200',
      'Manutenção': 'bg-amber-100 text-amber-800 border-amber-200'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusDescription = (status: string) => {
    const descriptions = {
      'Disponível': 'Item disponível no estoque da unidade',
      'Em Uso': 'Item em uso por um colaborador',
      'Manutenção': 'Item com defeito ou em manutenção'
    }
    return descriptions[status as keyof typeof descriptions] || ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Alterar Status do Ativo</h2>
            <p className="text-sm text-gray-500 mt-1">
              {asset.name} - {asset.brand_model}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Status Atual */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status Atual</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadgeClass(asset.status)}`}>
                {asset.status}
              </span>
            </div>

            {/* Novo Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Novo Status *
              </label>
              <div className="space-y-3">
                {(['Disponível', 'Em Uso', 'Manutenção'] as StatusOption[]).map((status) => (
                  <label
                    key={status}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      newStatus === status
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={newStatus === status}
                      onChange={(e) => setNewStatus(e.target.value as StatusOption)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(status)}`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getStatusDescription(status)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Campo de Colaborador (obrigatório para "Em Uso") */}
            {newStatus === 'Em Uso' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Colaborador Responsável *
                    </label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="Nome completo do colaborador"
                      className="input"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Informe o nome do colaborador que ficará responsável pelo ativo
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alerta para Manutenção */}
            {newStatus === 'Manutenção' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-900 mb-1">
                      Atenção: Item em Manutenção
                    </h4>
                    <p className="text-sm text-amber-700">
                      Este item será marcado como indisponível e um registro será criado no histórico.
                      Descreva o problema nas observações abaixo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alerta para Disponível */}
            {newStatus === 'Disponível' && asset.status === 'Em Uso' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-emerald-900 mb-1">
                      Liberação de Ativo
                    </h4>
                    <p className="text-sm text-emerald-700">
                      O vínculo com o colaborador será removido e o item voltará para o estoque da unidade.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações {newStatus === 'Manutenção' && '(Recomendado)'}
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
                className="input"
                placeholder={
                  newStatus === 'Manutenção'
                    ? 'Descreva o problema ou defeito apresentado...'
                    : 'Observações adicionais sobre a mudança de status...'
                }
              />
            </div>

            {/* Informação de Auditoria */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Trilha de Auditoria
                  </h4>
                  <p className="text-sm text-gray-600">
                    Esta alteração será registrada no histórico do ativo com data, hora e usuário responsável.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={changeStatusMutation.isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={changeStatusMutation.isLoading}
            className="btn btn-primary flex items-center gap-2"
          >
            {changeStatusMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Alterando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmar Alteração
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

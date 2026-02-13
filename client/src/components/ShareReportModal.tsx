import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { 
  Share2, 
  X, 
  Copy, 
  Eye, 
  EyeOff, 
  Calendar,
  Building,
  Globe,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import api from '../services/api'
import { Store } from '../types'
import toast from 'react-hot-toast'

interface ShareReportFormData {
  name: string
  scope: 'general' | 'store' | 'multi_store'
  store_id?: number
  store_ids?: number[]
  period: '7days' | '30days' | 'current_month'
  password?: string
  expires_at: string
  show_financial: boolean
}

interface ShareReportModalProps {
  onClose: () => void
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({ onClose }) => {
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ShareReportFormData>({
    defaultValues: {
      scope: 'general',
      period: '30days',
      show_financial: true,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 dias
    }
  })

  const scope = watch('scope')
  const selectedStoreIds = watch('store_ids') || []

  const { data: storesData } = useQuery(
    'stores-for-share',
    async () => {
      const response = await api.get('/stores')
      return response.data.stores
    }
  )

  const createLinkMutation = useMutation(
    async (data: ShareReportFormData) => {
      const response = await api.post('/external-reports', data)
      return response.data
    },
    {
      onSuccess: (data) => {
        setGeneratedLink(data.url)
        toast.success('Link de compartilhamento criado com sucesso!')
        queryClient.invalidateQueries('external-reports')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao criar link')
      }
    }
  )

  const onSubmit = (data: ShareReportFormData) => {
    // Validação adicional para multi-store
    if (data.scope === 'multi_store' && (!data.store_ids || data.store_ids.length === 0)) {
      toast.error('Selecione pelo menos uma unidade para o escopo multi-loja')
      return
    }
    
    createLinkMutation.mutate(data)
  }

  const copyToClipboard = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink)
        toast.success('Link copiado para a área de transferência!')
      } catch (error) {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea')
        textArea.value = generatedLink
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        toast.success('Link copiado!')
      }
    }
  }

  const getPeriodLabel = (period: string) => {
    const labels = {
      '7days': 'Últimos 7 dias',
      '30days': 'Últimos 30 dias',
      'current_month': 'Mês atual'
    }
    return labels[period as keyof typeof labels] || period
  }

  if (generatedLink) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Link Criado com Sucesso
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Link de Compartilhamento</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-white text-sm font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Informações Importantes</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Este link permite acesso aos dados sem login no sistema</li>
                <li>• Compartilhe apenas com pessoas autorizadas</li>
                <li>• O link expira automaticamente na data configurada</li>
                <li>• Você pode revogar o acesso a qualquer momento em "Gestão de Acessos Externos"</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => window.open(generatedLink, '_blank')}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </button>
              <button
                onClick={onClose}
                className="btn btn-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header fixo */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Compartilhar Relatório
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="share-report-form">
            {/* Nome do Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Relatório
              </label>
              <input
                type="text"
                {...register('name', { required: 'Nome é obrigatório' })}
                placeholder="Ex: Relatório Mensal - Loja Centro"
                className="input"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

              {/* Escopo do Relatório */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escopo do Relatório
              </label>
            <div className="grid grid-cols-1 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('scope')}
                  value="general"
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Geral</div>
                    <div className="text-sm text-gray-500">Todas as unidades</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('scope')}
                  value="store"
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Unidade Específica</div>
                    <div className="text-sm text-gray-500">Uma loja apenas</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('scope')}
                  value="multi_store"
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-medium">Múltiplas Unidades</div>
                    <div className="text-sm text-gray-500">Selecionar lojas específicas</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Seleção de Loja (se escopo for 'store') */}
          {scope === 'store' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Unidade
              </label>
              <select
                {...register('store_id', { 
                  required: scope === 'store' ? 'Selecione uma unidade' : false 
                })}
                className="input"
              >
                <option value="">Selecione uma unidade...</option>
                {storesData?.map((store: Store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.city}
                  </option>
                ))}
              </select>
              {errors.store_id && (
                <p className="text-red-500 text-sm mt-1">{errors.store_id.message}</p>
              )}
            </div>
          )}

          {/* Seleção de Múltiplas Lojas (se escopo for 'multi_store') */}
          {scope === 'multi_store' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Unidades ({selectedStoreIds.length} selecionadas)
              </label>
              <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                {storesData?.map((store: Store) => (
                  <label key={store.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStoreIds.includes(store.id)}
                      onChange={(e) => {
                        const currentIds = selectedStoreIds || []
                        if (e.target.checked) {
                          setValue('store_ids', [...currentIds, store.id])
                        } else {
                          setValue('store_ids', currentIds.filter(id => id !== store.id))
                        }
                      }}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-500">{store.city}</div>
                    </div>
                  </label>
                ))}
              </div>
              {scope === 'multi_store' && selectedStoreIds.length === 0 && (
                <p className="text-red-500 text-sm mt-1">Selecione pelo menos uma unidade</p>
              )}
            </div>
          )}

          {/* Controle de Informações Financeiras */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível de Detalhe
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('show_financial')}
                  value="true"
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Completo</div>
                    <div className="text-sm text-gray-500">Inclui valores patrimoniais e financeiros</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('show_financial')}
                  value="false"
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Operacional</div>
                    <div className="text-sm text-gray-500">Apenas dados operacionais (sem valores)</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Período de Dados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período de Dados
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '7days', label: 'Últimos 7 dias' },
                { value: '30days', label: 'Últimos 30 dias' },
                { value: 'current_month', label: 'Mês Atual' }
              ].map((option) => (
                <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    {...register('period')}
                    value={option.value}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Data de Expiração */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Expiração
            </label>
            <input
              type="date"
              {...register('expires_at', { required: 'Data de expiração é obrigatória' })}
              min={new Date().toISOString().split('T')[0]}
              className="input"
            />
            {errors.expires_at && (
              <p className="text-red-500 text-sm mt-1">{errors.expires_at.message}</p>
            )}
          </div>

          {/* Senha Opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha de Acesso (Opcional)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Deixe em branco para acesso livre"
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se definida, será necessário inserir a senha para acessar o relatório
            </p>
          </div>
          </form>
        </div>

        {/* Footer fixo com botões */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="share-report-form"
            disabled={createLinkMutation.isLoading}
            className="btn btn-primary flex items-center gap-2"
          >
            {createLinkMutation.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            Gerar Link
          </button>
        </div>
      </div>
    </div>
  )
}
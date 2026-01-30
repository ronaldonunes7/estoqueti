import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  ExternalLink, 
  Eye, 
  Trash2, 
  Copy, 
  Calendar,
  Building,
  Globe,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface ExternalLink {
  id: number
  token: string
  name: string
  scope: 'general' | 'store'
  store_id?: number
  store_name?: string
  store_city?: string
  period: string
  password_hash?: string
  expires_at: string
  click_count: number
  is_active: boolean
  created_by: number
  created_at: string
  last_accessed?: string
  created_by_username: string
  is_expired: boolean
  url: string
}

export const ExternalAccess: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: linksData, isLoading } = useQuery(
    'external-reports',
    async () => {
      const response = await api.get('/external-reports')
      return response.data
    }
  )

  const revokeLinkMutation = useMutation(
    async (linkId: number) => {
      await api.patch(`/external-reports/${linkId}/revoke`)
    },
    {
      onSuccess: () => {
        toast.success('Link revogado com sucesso!')
        queryClient.invalidateQueries('external-reports')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao revogar link')
      }
    }
  )

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado para a área de transferência!')
    } catch (error) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Link copiado!')
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

  const getStatusBadge = (link: ExternalLink) => {
    if (!link.is_active) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    if (link.is_expired) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getStatusText = (link: ExternalLink) => {
    if (!link.is_active) return 'Revogado'
    if (link.is_expired) return 'Expirado'
    return 'Ativo'
  }

  const handleRevokeLink = (link: ExternalLink) => {
    if (window.confirm(`Tem certeza que deseja revogar o link "${link.name}"? Esta ação não pode ser desfeita.`)) {
      revokeLinkMutation.mutate(link.id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Acessos Externos</h1>
            <p className="text-gray-600">Gerencie links de compartilhamento de relatórios</p>
          </div>
        </div>
        
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const links = linksData?.links || []
  const activeLinks = links.filter((link: ExternalLink) => link.is_active && !link.is_expired)
  const totalClicks = links.reduce((sum: number, link: ExternalLink) => sum + link.click_count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Acessos Externos</h1>
          <p className="text-gray-600">Gerencie links de compartilhamento de relatórios</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Links Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{activeLinks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <ExternalLink className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Links</p>
              <p className="text-2xl font-bold text-gray-900">{links.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Acessos</p>
              <p className="text-2xl font-bold text-gray-900">{totalClicks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Links */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Links de Compartilhamento</h3>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-12">
            <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhum link de compartilhamento criado</p>
            <p className="text-sm text-gray-400">
              Vá para "Movimentações" e clique em "Compartilhar Relatório" para criar o primeiro link
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do Relatório
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Escopo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acessos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expira em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {links.map((link: ExternalLink) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{link.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          {link.password_hash ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                          {link.password_hash ? 'Protegido por senha' : 'Acesso livre'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {link.scope === 'store' ? (
                          <Building className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Globe className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <div className="text-sm text-gray-900">
                            {link.scope === 'store' ? link.store_name : 'Todas as unidades'}
                          </div>
                          {link.scope === 'store' && link.store_city && (
                            <div className="text-xs text-gray-500">{link.store_city}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{getPeriodLabel(link.period)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(link)}`}>
                        {getStatusText(link)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{link.click_count}</div>
                      {link.last_accessed && (
                        <div className="text-xs text-gray-500">
                          Último: {format(new Date(link.last_accessed), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(link.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(link.expires_at), 'HH:mm', { locale: ptBR })}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {link.is_active && !link.is_expired && (
                          <>
                            <button
                              onClick={() => copyToClipboard(link.url)}
                              className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                              title="Copiar Link"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => window.open(link.url, '_blank')}
                              className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {link.is_active && (
                          <button
                            onClick={() => handleRevokeLink(link)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title="Revogar Link"
                            disabled={revokeLinkMutation.isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informações de Segurança */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Informações de Segurança</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Links externos permitem acesso aos dados sem login no sistema</li>
              <li>• Compartilhe apenas com pessoas autorizadas</li>
              <li>• Links expiram automaticamente na data configurada</li>
              <li>• Você pode revogar o acesso a qualquer momento</li>
              <li>• Links protegidos por senha oferecem segurança adicional</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
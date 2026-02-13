import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
  Download,
  LogIn,
  LogOut,
  ArrowRightLeft,
  Wrench,
  X,
  Clock,
  Building,
  QrCode,
  TrendingUp
} from 'lucide-react'
import api from '../services/api'
import { AssetHistory } from '../types'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { QRCodeGenerator } from '../components/QRCodeGenerator'
import { AssetLifePath } from '../components/AssetLifePath'
import { AssetPredictiveAnalysis } from '../components/AssetPredictiveAnalysis'
import { AssetTermsHistory } from '../components/AssetTermsHistory'

export const AssetHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'lifecycle' | 'analysis' | 'terms'>('timeline')

  const { data: historyData, isLoading, error } = useQuery<AssetHistory>(
    ['asset-history', id],
    async () => {
      const response = await api.get(`/movements/asset/${id}/history`)
      return response.data
    },
    {
      enabled: !!id
    }
  )

  const downloadLaudo = async () => {
    try {
      const response = await api.get(`/movements/asset/${id}/laudo`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `laudo-${historyData?.asset.patrimony_tag || id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar laudo:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'Disponível': 'bg-green-100 text-green-800 border-green-200',
      'Em Uso': 'bg-blue-100 text-blue-800 border-blue-200',
      'Manutenção': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Descartado': 'bg-red-100 text-red-800 border-red-200'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getMovementIcon = (type: string) => {
    const icons = {
      'Entrada': <LogIn className="h-4 w-4 text-green-600" />,
      'Saída': <LogOut className="h-4 w-4 text-red-600" />,
      'Transferência': <ArrowRightLeft className="h-4 w-4 text-blue-600" />,
      'Manutenção': <Wrench className="h-4 w-4 text-yellow-600" />,
      'Descarte': <X className="h-4 w-4 text-gray-600" />
    }
    return icons[type as keyof typeof icons] || <ArrowRightLeft className="h-4 w-4 text-gray-600" />
  }

  const getMovementColor = (type: string) => {
    const colors = {
      'Entrada': 'border-green-200 bg-green-50',
      'Saída': 'border-red-200 bg-red-50',
      'Transferência': 'border-blue-200 bg-blue-50',
      'Manutenção': 'border-yellow-200 bg-yellow-50',
      'Descarte': 'border-gray-200 bg-gray-50'
    }
    return colors[type as keyof typeof colors] || 'border-gray-200 bg-gray-50'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !historyData) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ativo não encontrado</h3>
        <p className="text-gray-600 mb-4">O ativo solicitado não foi encontrado ou você não tem permissão para visualizá-lo.</p>
        <button
          onClick={() => navigate('/movements')}
          className="btn btn-primary"
        >
          Voltar para Movimentações
        </button>
      </div>
    )
  }

  const { asset, movements } = historyData

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/movements')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Histórico do Ativo</h1>
            <p className="text-gray-600">Lifecycle completo e auditoria</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadLaudo}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Imprimir Laudo
          </button>
          <button
            onClick={() => setShowQRGenerator(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Gerar Etiqueta
          </button>
        </div>
      </div>

      {/* Ficha do Ativo */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-100">
              <Package className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {asset.name}
              </h2>
              {asset.patrimony_tag && (
                <p className="text-lg font-mono text-primary-600 bg-primary-50 px-3 py-1 rounded-md inline-block mt-1">
                  {asset.patrimony_tag}
                </p>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(asset.status)}`}>
            {asset.status}
          </span>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Marca/Modelo</h4>
            <p className="text-sm text-gray-900">{asset.brand_model}</p>
          </div>
          
          {asset.serial_number && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Número de Série</h4>
              <p className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                {asset.serial_number}
              </p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Categoria</h4>
            <p className="text-sm text-gray-900">{asset.category}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Tipo</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              asset.asset_type === 'unique' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {asset.asset_type === 'unique' ? 'Único' : 'Insumo'}
            </span>
          </div>
        </div>

        {/* Localização Atual */}
        {asset.current_store_name && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Localização Atual</h4>
            </div>
            <p className="text-blue-800">
              {asset.current_store_name} - {asset.current_store_city}
            </p>
          </div>
        )}

        {/* Informações Adicionais */}
        {(asset.purchase_value || asset.purchase_date || asset.warranty_expiry) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            {asset.purchase_value && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Valor de Compra</h4>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(parseFloat(asset.purchase_value.toString()))}
                </p>
              </div>
            )}
            
            {asset.purchase_date && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Data de Compra</h4>
                <p className="text-sm text-gray-900">
                  {format(new Date(asset.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
            
            {asset.warranty_expiry && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Garantia até</h4>
                <p className="text-sm text-gray-900">
                  {format(new Date(asset.warranty_expiry), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Abas de Navegação */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timeline'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </div>
            </button>
            <button
              onClick={() => setActiveTab('lifecycle')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lifecycle'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ciclo de Vida
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Análise Preditiva
              </div>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'terms'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Termos de Responsabilidade
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'timeline' ? (
        /* Timeline de Movimentações */
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Timeline de Movimentações</h3>
            <div className="text-sm text-gray-500">
              {movements.length} movimentações registradas
            </div>
          </div>

        {movements.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma movimentação</h4>
            <p className="text-gray-600">Este ativo ainda não possui movimentações registradas.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {movements.map((movement) => (
                <div key={movement.id} className="relative flex items-start gap-6">
                  {/* Ícone da timeline */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white shadow-lg ${getMovementColor(movement.type)}`}>
                    {getMovementIcon(movement.type)}
                  </div>
                  
                  {/* Conteúdo da movimentação */}
                  <div className="flex-1 min-w-0">
                    <div className={`p-4 rounded-lg border ${getMovementColor(movement.type)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {movement.type}
                            {movement.store_name && ` para ${movement.store_name}`}
                            {movement.destination && !movement.store_name && ` - ${movement.destination}`}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(movement.movement_date), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                            </div>
                            {movement.daysInLocation && movement.daysInLocation > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {movement.daysInLocation === 1 
                                  ? '1 dia nesta localização'
                                  : `${movement.daysInLocation} dias nesta localização`
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          movement.type === 'Entrada' ? 'bg-green-100 text-green-800' :
                          movement.type === 'Saída' ? 'bg-red-100 text-red-800' :
                          movement.type === 'Transferência' ? 'bg-blue-100 text-blue-800' :
                          movement.type === 'Manutenção' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {movement.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Colaborador:</span>
                          <span className="font-medium text-gray-900">{movement.employee_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Técnico:</span>
                          <span className="font-medium text-gray-900">{movement.responsible_technician}</span>
                        </div>

                        {movement.store_name && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Destino:</span>
                            <span className="font-medium text-gray-900">
                              {movement.store_name} - {movement.store_city}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Quantidade:</span>
                          <span className="font-medium text-gray-900">{movement.quantity}</span>
                        </div>
                      </div>

                      {movement.observations && (
                        <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <span className="text-sm text-gray-600">Observações:</span>
                              <p className="text-sm text-gray-900 mt-1">{movement.observations}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                        Registrado por {movement.created_by_username} • {formatDistanceToNow(new Date(movement.movement_date), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      ) : activeTab === 'lifecycle' ? (
        /* Ciclo de Vida do Ativo */
        <AssetLifePath 
          asset={{
            ...asset,
            patrimony_tag: asset.patrimony_tag || '',
            serial_number: asset.serial_number || '',
            created_at: asset.created_at || new Date().toISOString()
          }} 
          movements={movements} 
        />
      ) : activeTab === 'analysis' ? (
        /* Análise Preditiva */
        <AssetPredictiveAnalysis
          asset={{
            ...asset,
            created_at: asset.created_at || new Date().toISOString()
          }}
          movements={movements}
        />
      ) : (
        /* Termos de Responsabilidade */
        <AssetTermsHistory assetId={parseInt(id!)} />
      )}

      {/* Modal de Geração de QR Code */}
      {showQRGenerator && historyData?.asset && (
        <QRCodeGenerator
          asset={historyData.asset}
          onClose={() => setShowQRGenerator(false)}
        />
      )}
    </div>
  )
}
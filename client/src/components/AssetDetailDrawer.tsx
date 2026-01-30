import React from 'react'
import { useQuery } from 'react-query'
import { 
  X, 
  Package, 
  Calendar, 
  User, 
  MapPin, 
  DollarSign,
  Clock,
  Activity,
  FileText,
  Wrench,
  TrendingUp
} from 'lucide-react'
import api from '../services/api'
import { Asset } from '../types'

interface AssetDetailDrawerProps {
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
  storeId: number
}

interface AssetHistory {
  id: number
  type: string
  employee_name: string
  responsible_technician: string
  movement_date: string
  observations?: string
  days_in_custody?: number
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({
  asset,
  isOpen,
  onClose,
  storeId
}) => {
  // Buscar histórico do ativo na unidade
  const { data: historyData, isLoading } = useQuery(
    ['asset-unit-history', asset?.id, storeId],
    async () => {
      if (!asset?.id) return null
      const response = await api.get(`/assets/${asset.id}/unit-history/${storeId}`)
      return response.data
    },
    { enabled: !!asset?.id && !!storeId && isOpen }
  )

  if (!isOpen || !asset) return null

  const getMovementIcon = (type: string) => {
    const icons = {
      'Entrada': <TrendingUp className="w-4 h-4 text-green-500" />,
      'Saída': <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />,
      'Transferência': <MapPin className="w-4 h-4 text-blue-500" />,
      'Manutenção': <Wrench className="w-4 h-4 text-yellow-500" />,
      'ENTRADA_ESTOQUE': <Package className="w-4 h-4 text-green-600" />
    }
    return icons[type as keyof typeof icons] || <Activity className="w-4 h-4 text-gray-500" />
  }

  const getMovementColor = (type: string) => {
    const colors = {
      'Entrada': 'bg-green-50 border-green-200',
      'Saída': 'bg-red-50 border-red-200',
      'Transferência': 'bg-blue-50 border-blue-200',
      'Manutenção': 'bg-yellow-50 border-yellow-200',
      'ENTRADA_ESTOQUE': 'bg-green-50 border-green-200'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-50 border-gray-200'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{asset.name}</h2>
                <p className="text-sm text-gray-500">{asset.brand_model}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Especificações Técnicas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Especificações Técnicas
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Patrimônio:</span>
                  <span className="ml-2 font-medium">{asset.patrimony_tag || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Serial:</span>
                  <span className="ml-2 font-medium">{asset.serial_number || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Categoria:</span>
                  <span className="ml-2 font-medium">{asset.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <span className="ml-2 font-medium">
                    {asset.asset_type === 'unique' ? 'Ativo Único' : 'Insumo'}
                  </span>
                </div>
                {asset.barcode && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Código de Barras:</span>
                    <span className="ml-2 font-mono text-xs bg-white px-2 py-1 rounded border">
                      {asset.barcode}
                    </span>
                  </div>
                )}
                {asset.location && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Localização:</span>
                    <span className="ml-2 font-medium">{asset.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informações Financeiras */}
            {(asset.purchase_date || asset.purchase_value || asset.warranty_expiry) && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Informações Financeiras
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {asset.purchase_date && (
                    <div>
                      <span className="text-gray-500">Data de Compra:</span>
                      <span className="ml-2 font-medium">
                        {new Date(asset.purchase_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {asset.purchase_value && (
                    <div>
                      <span className="text-gray-500">Valor:</span>
                      <span className="ml-2 font-medium text-green-600">
                        R$ {asset.purchase_value.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                  )}
                  {asset.warranty_expiry && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Garantia até:</span>
                      <span className="ml-2 font-medium">
                        {new Date(asset.warranty_expiry).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data de Chegada na Unidade */}
            {historyData?.arrivalDate && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Chegada na Unidade
                </h3>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-500">Data de chegada:</span>
                    <span className="font-medium">
                      {new Date(historyData.arrivalDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {historyData.daysInUnit && (
                    <div className="flex items-center gap-2 mt-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-500">Tempo na unidade:</span>
                      <span className="font-medium">{historyData.daysInUnit} dias</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Histórico de Custódia */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Histórico de Custódia nesta Unidade
              </h3>
              
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : historyData?.movements?.length > 0 ? (
                <div className="space-y-3">
                  {historyData.movements.map((movement: AssetHistory, index: number) => (
                    <div 
                      key={movement.id} 
                      className={`border rounded-lg p-3 ${getMovementColor(movement.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getMovementIcon(movement.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {movement.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(movement.movement_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            
                            <div className="mt-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>Colaborador: {movement.employee_name}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Wrench className="w-3 h-3" />
                                <span>Técnico: {movement.responsible_technician}</span>
                              </div>
                              {movement.days_in_custody && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Tempo de custódia: {movement.days_in_custody} dias</span>
                                </div>
                              )}
                            </div>
                            
                            {movement.observations && (
                              <div className="mt-2 text-xs text-gray-500 bg-white bg-opacity-50 rounded p-2">
                                {movement.observations}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhum histórico de movimentação encontrado nesta unidade</p>
                </div>
              )}
            </div>

            {/* Observações */}
            {asset.notes && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Observações
                </h3>
                <p className="text-sm text-gray-700">{asset.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
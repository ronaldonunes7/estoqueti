import React, { useState } from 'react'
import { 
  ShoppingCart, 
  ArrowRight, 
  RotateCcw, 
  MapPin, 
  Package,
  Wrench,
  Trash2,
  Clock,
  Building,
  User,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AssetLifePathProps {
  asset: {
    id: number
    name: string
    patrimony_tag: string
    serial_number: string
    category: string
    status: string
    purchase_date?: string
    purchase_value?: number
    warranty_expiry?: string
    created_at: string
  }
  movements: Array<{
    id: number
    type: string
    movement_date: string
    employee_name: string
    destination?: string
    store_name?: string
    store_city?: string
    responsible_technician: string
    observations?: string
    quantity: number
    daysInLocation?: number
  }>
}

export const AssetLifePath: React.FC<AssetLifePathProps> = ({ asset, movements }) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)

  // Calcular métricas do ciclo de vida
  const totalDays = differenceInDays(new Date(), new Date(asset.created_at))
  const totalMovements = movements.length
  const averageStayDuration = movements.length > 0 
    ? Math.round(movements.reduce((sum, m) => sum + (m.daysInLocation || 0), 0) / movements.length)
    : 0

  // Fases do ciclo de vida
  const lifecyclePhases = [
    {
      id: 'acquisition',
      name: 'Aquisição',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-blue-500',
      date: asset.purchase_date || asset.created_at,
      description: 'Ativo adquirido e cadastrado no sistema',
      details: {
        value: asset.purchase_value,
        category: asset.category,
        warranty: asset.warranty_expiry
      }
    },
    {
      id: 'deployment',
      name: 'Implantação',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-green-500',
      date: movements.find(m => m.type === 'Saída' || m.type === 'Transferência')?.movement_date,
      description: 'Primeiro uso ou transferência do ativo',
      details: {
        destination: movements.find(m => m.type === 'Saída' || m.type === 'Transferência')?.destination,
        technician: movements.find(m => m.type === 'Saída' || m.type === 'Transferência')?.responsible_technician
      }
    },
    {
      id: 'operation',
      name: 'Operação',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-purple-500',
      date: new Date().toISOString(),
      description: 'Ativo em uso operacional',
      details: {
        currentStatus: asset.status,
        totalMovements,
        averageStay: averageStayDuration
      }
    },
    {
      id: 'maintenance',
      name: 'Manutenção',
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-yellow-500',
      date: movements.find(m => m.type === 'Manutenção')?.movement_date,
      description: 'Períodos de manutenção e reparo',
      details: {
        maintenanceCount: movements.filter(m => m.type === 'Manutenção').length,
        lastMaintenance: movements.find(m => m.type === 'Manutenção')?.movement_date
      }
    },
    {
      id: 'disposal',
      name: 'Descarte',
      icon: <Trash2 className="h-5 w-5" />,
      color: 'bg-red-500',
      date: movements.find(m => m.type === 'Descarte')?.movement_date,
      description: 'Fim do ciclo de vida do ativo',
      details: {
        disposed: asset.status === 'Descartado',
        disposalDate: movements.find(m => m.type === 'Descarte')?.movement_date
      }
    }
  ]

  const getPhaseStatus = (phase: any) => {
    if (!phase.date) return 'pending'
    if (phase.id === 'disposal' && asset.status === 'Descartado') return 'completed'
    if (phase.id === 'maintenance' && movements.some(m => m.type === 'Manutenção')) return 'completed'
    if (phase.id === 'operation' && asset.status !== 'Disponível') return 'active'
    if (phase.id === 'deployment' && movements.some(m => m.type === 'Saída' || m.type === 'Transferência')) return 'completed'
    if (phase.id === 'acquisition') return 'completed'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-50'
      case 'active': return 'border-blue-500 bg-blue-50'
      case 'pending': return 'border-gray-300 bg-gray-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'active': return <Clock className="h-4 w-4 text-blue-600" />
      case 'pending': return <AlertTriangle className="h-4 w-4 text-gray-400" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Métricas do Ciclo de Vida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo de Vida</p>
              <p className="text-lg font-bold text-gray-900">{totalDays} dias</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Movimentações</p>
              <p className="text-lg font-bold text-gray-900">{totalMovements}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Permanência Média</p>
              <p className="text-lg font-bold text-gray-900">{averageStayDuration} dias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline do Ciclo de Vida */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Ciclo de Vida do Ativo</h3>
        
        <div className="relative">
          {/* Linha de conexão */}
          <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200"></div>
          
          <div className="flex justify-between items-start relative">
            {lifecyclePhases.map((phase, index) => {
              const status = getPhaseStatus(phase)
              const isSelected = selectedPhase === phase.id
              
              return (
                <div key={phase.id} className="flex flex-col items-center relative">
                  {/* Ícone da fase */}
                  <button
                    onClick={() => setSelectedPhase(isSelected ? null : phase.id)}
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-200 hover:scale-110 ${getStatusColor(status)} ${
                      isSelected ? 'ring-4 ring-blue-200' : ''
                    }`}
                  >
                    <div className={`${phase.color} text-white p-2 rounded-full`}>
                      {phase.icon}
                    </div>
                  </button>
                  
                  {/* Status indicator */}
                  <div className="absolute -top-2 -right-2">
                    {getStatusIcon(status)}
                  </div>
                  
                  {/* Nome da fase */}
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-gray-900">{phase.name}</p>
                    {phase.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(phase.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  
                  {/* Linha de conexão entre fases */}
                  {index < lifecyclePhases.length - 1 && (
                    <ArrowRight className="absolute top-6 -right-6 h-4 w-4 text-gray-400 z-10" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Detalhes da fase selecionada */}
        {selectedPhase && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            {(() => {
              const phase = lifecyclePhases.find(p => p.id === selectedPhase)
              if (!phase) return null

              return (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <div className={`${phase.color} text-white p-1 rounded`}>
                      {phase.icon}
                    </div>
                    {phase.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">{phase.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.id === 'acquisition' && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Valor de Compra</p>
                          <p className="text-sm text-gray-900">{formatCurrency(phase.details.value)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Categoria</p>
                          <p className="text-sm text-gray-900">{phase.details.category}</p>
                        </div>
                        {phase.details.warranty && (
                          <div>
                            <p className="text-xs font-medium text-gray-500">Garantia até</p>
                            <p className="text-sm text-gray-900">
                              {format(new Date(phase.details.warranty), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {phase.id === 'deployment' && phase.details.destination && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Destino</p>
                          <p className="text-sm text-gray-900">{phase.details.destination}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Técnico Responsável</p>
                          <p className="text-sm text-gray-900">{phase.details.technician}</p>
                        </div>
                      </>
                    )}
                    
                    {phase.id === 'operation' && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Status Atual</p>
                          <p className="text-sm text-gray-900">{phase.details.currentStatus}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Total de Movimentações</p>
                          <p className="text-sm text-gray-900">{phase.details.totalMovements}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Permanência Média</p>
                          <p className="text-sm text-gray-900">{phase.details.averageStay} dias</p>
                        </div>
                      </>
                    )}
                    
                    {phase.id === 'maintenance' && (phase.details.maintenanceCount || 0) > 0 && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Manutenções Realizadas</p>
                          <p className="text-sm text-gray-900">{phase.details.maintenanceCount}</p>
                        </div>
                        {phase.details.lastMaintenance && (
                          <div>
                            <p className="text-xs font-medium text-gray-500">Última Manutenção</p>
                            <p className="text-sm text-gray-900">
                              {format(new Date(phase.details.lastMaintenance), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {phase.id === 'disposal' && phase.details.disposed && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Data do Descarte</p>
                        <p className="text-sm text-gray-900">
                          {phase.details.disposalDate 
                            ? format(new Date(phase.details.disposalDate), 'dd/MM/yyyy', { locale: ptBR })
                            : 'N/A'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Movimentações Recentes */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Movimentações Recentes</h3>
        
        {movements.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma movimentação registrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {movements.slice(0, 5).map((movement) => (
              <div key={movement.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {movement.type === 'Entrada' && <Package className="h-4 w-4 text-blue-600" />}
                    {movement.type === 'Saída' && <ArrowRight className="h-4 w-4 text-blue-600" />}
                    {movement.type === 'Transferência' && <MapPin className="h-4 w-4 text-blue-600" />}
                    {movement.type === 'Manutenção' && <Wrench className="h-4 w-4 text-blue-600" />}
                    {movement.type === 'Descarte' && <Trash2 className="h-4 w-4 text-blue-600" />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{movement.type}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(movement.movement_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {movement.employee_name}
                    </div>
                    
                    {movement.store_name && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {movement.store_name}
                      </div>
                    )}
                    
                    {movement.daysInLocation && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {movement.daysInLocation} dias
                      </div>
                    )}
                  </div>
                  
                  {movement.observations && (
                    <p className="mt-2 text-xs text-gray-500 italic">
                      "{movement.observations}"
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {movements.length > 5 && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  E mais {movements.length - 5} movimentações...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
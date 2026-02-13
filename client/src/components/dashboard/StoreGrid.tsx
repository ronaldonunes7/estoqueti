import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, MapPin, Eye, TrendingUp, ArrowRight } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

interface Store {
  id: number
  name: string
  city: string
  responsible?: string
}

interface StoreValue {
  id: number
  total_value: number
  asset_count: number
}

interface StoreGridProps {
  stores: Store[]
  storesValue: StoreValue[]
  isLoading?: boolean
  onTransferClick?: (storeId: number) => void
}

export const StoreGrid: React.FC<StoreGridProps> = ({ 
  stores, 
  storesValue, 
  isLoading,
  onTransferClick 
}) => {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
            <div className="h-16 bg-gray-50 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="card text-center py-12">
        <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma unidade cadastrada
        </h3>
        <p className="text-gray-500 mb-4">
          Cadastre unidades para começar a gerenciar o inventário
        </p>
        <button
          onClick={() => navigate('/stores')}
          className="btn-primary"
        >
          Cadastrar Primeira Unidade
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stores.slice(0, 6).map((store) => {
        const storeValue = storesValue?.find((sv) => sv.id === store.id)
        const assetCount = storeValue?.asset_count || 0
        const totalValue = storeValue?.total_value || 0
        
        // Calcular "ocupação" baseado em uma média (exemplo: 50 ativos = 100%)
        const maxCapacity = 50
        const occupancyPercentage = Math.min((assetCount / maxCapacity) * 100, 100)
        
        return (
          <div
            key={store.id}
            className="card hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200 group bg-white"
          >
            {/* Header do Card */}
            <div 
              onClick={() => navigate(`/inventory/unit/${store.id}`)}
              className="flex items-start justify-between mb-3"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  {store.name}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{store.city}</span>
                </div>
                {store.responsible && (
                  <p className="text-xs text-gray-600 mt-1">
                    Resp.: {store.responsible}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>

            {/* Barra de Progresso de Ocupação */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Ocupação</span>
                <span className="font-medium">{assetCount} ativos</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    occupancyPercentage >= 80 
                      ? 'bg-red-500' 
                      : occupancyPercentage >= 50 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {occupancyPercentage.toFixed(0)}% da capacidade média
              </p>
            </div>

            {/* Valor Patrimonial */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Patrimônio:</span>
                </div>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>

            {/* Botão de Ação Rápida */}
            {onTransferClick && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTransferClick(store.id)
                  }}
                  className="w-full py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Transferir para esta unidade
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

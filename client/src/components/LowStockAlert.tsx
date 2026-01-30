import React from 'react'
import { AlertTriangle, Package, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LowStockItem {
  id: number
  name: string
  brand_model: string
  category: string
  stock_quantity: number
  min_stock: number
  deficit: number
  location?: string
  updated_at: string
}

interface LowStockAlertProps {
  items: LowStockItem[]
  isLoading?: boolean
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({ items, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Alerta de Reposição
          </h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const criticalItems = items.filter(item => item.stock_quantity === 0)
  const lowStockItems = items.filter(item => item.stock_quantity > 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Alerta de Reposição
          </h3>
          <Link 
            to="/assets?low_stock_only=true"
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Ver todos
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Todos os estoques estão adequados!</p>
            <p className="text-sm text-gray-400">Nenhum item precisa de reposição</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    {criticalItems.length} em falta
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">Estoque zerado</p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    {lowStockItems.length} baixo estoque
                  </span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">Abaixo do mínimo</p>
              </div>
            </div>

            {/* Lista de itens críticos */}
            {criticalItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Itens em Falta (Crítico)
                </h4>
                <div className="space-y-2">
                  {criticalItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-red-700">
                            {item.brand_model} • {item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">0 unidades</p>
                          <p className="text-xs text-red-500">Mín: {item.min_stock}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {criticalItems.length > 3 && (
                    <p className="text-xs text-red-600 text-center">
                      +{criticalItems.length - 3} outros itens em falta
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Lista de itens com estoque baixo */}
            {lowStockItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Estoque Baixo
                </h4>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-yellow-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-yellow-700">
                            {item.brand_model} • {item.category}
                          </p>
                          {item.location && (
                            <p className="text-xs text-yellow-600">
                              📍 {item.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-yellow-800">
                            {item.stock_quantity} unidades
                          </p>
                          <p className="text-xs text-yellow-600">
                            Mín: {item.min_stock} • Falta: {item.deficit}
                          </p>
                        </div>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="mt-2">
                        <div className="w-full bg-yellow-200 rounded-full h-1.5">
                          <div 
                            className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min((item.stock_quantity / item.min_stock) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {lowStockItems.length > 5 && (
                    <p className="text-xs text-yellow-600 text-center">
                      +{lowStockItems.length - 5} outros itens com estoque baixo
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Ações rápidas */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Link 
                  to="/assets?low_stock_only=true"
                  className="flex-1 btn btn-secondary text-sm py-2"
                >
                  Ver Todos os Itens
                </Link>
                <Link 
                  to="/assets?asset_type=consumable"
                  className="flex-1 btn btn-primary text-sm py-2"
                >
                  Gerenciar Estoque
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
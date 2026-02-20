import React from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  TrendingUp,
  TrendingDown,
  Wrench,
  AlertTriangle,
  DollarSign,
  Building,
  Eye,
  ArrowRight,
  Activity
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import api from '../services/api'
import { DashboardData } from '../types'
import { usePermissions } from '../hooks/usePermissions'
import { formatCurrencyCompact } from '../utils/currency'

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
  </div>
)

const SkeletonChart = () => (
  <div className="card animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
)

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin } = usePermissions()

  // Queries com tratamento de erro e fallback
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>(
    'dashboard',
    async () => {
      const response = await api.get('/dashboard/metrics')
      return response.data
    },
    {
      refetchInterval: 30000,
      retry: 2,
      onError: (error) => console.error('Erro ao carregar dashboard:', error)
    }
  )

  const { data: storesData, isLoading: storesLoading } = useQuery(
    'stores-summary',
    async () => {
      const response = await api.get('/stores')
      return response.data.stores || []
    },
    {
      retry: 2,
      onError: (error) => console.error('Erro ao carregar lojas:', error)
    }
  )

  const { data: storesValue } = useQuery(
    'stores-value',
    async () => {
      const response = await api.get('/dashboard/stores-value')
      return response.data.stores || []
    }
  )

  // Dados com fallback seguro (Optional Chaining)
  const metrics = dashboardData?.metrics ?? {
    totalAssets: 0,
    inUseAssets: 0,
    maintenanceAssets: 0,
    lowStockItems: 0,
    totalValue: 0
  }

  const chartData = dashboardData?.chartData ?? []

  // KPI Cards Data
  const kpiCards = [
    {
      title: 'Patrimônio Total',
      value: formatCurrencyCompact(metrics.totalValue ?? 0),
      subtitle: `${metrics.totalAssets ?? 0} ativos`,
      icon: DollarSign,
      color: 'emerald',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Itens em Uso',
      value: metrics.inUseAssets ?? 0,
      subtitle: `${Math.round(((metrics.inUseAssets ?? 0) / (metrics.totalAssets || 1)) * 100)}% do total`,
      icon: Package,
      color: 'blue',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'Em Manutenção',
      value: metrics.maintenanceAssets ?? 0,
      subtitle: 'Requer atenção',
      icon: Wrench,
      color: 'amber',
      trend: '-2%',
      trendUp: false
    },
    {
      title: 'Insumos Críticos',
      value: metrics.lowStockItems ?? 0,
      subtitle: 'Abaixo do mínimo',
      icon: AlertTriangle,
      color: 'red',
      trend: '3 novos',
      trendUp: false
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      amber: 'bg-amber-50 text-amber-600 border-amber-200',
      red: 'bg-red-50 text-red-600 border-red-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
          <p className="text-gray-600 mt-1">Visão geral dos ativos e movimentações</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          <span>Atualizado há 30s</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          kpiCards.map((kpi, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getColorClasses(kpi.color)}`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.subtitle}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Gráfico de Movimentações */}
      <div className="card">
        {dashboardLoading ? (
          <SkeletonChart />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Movimentações</h2>
                <p className="text-sm text-gray-600">Entradas vs Saídas - Últimos 30 dias</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-600">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Saídas</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="entradas" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEntradas)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="saidas" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSaidas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Grid de Unidades */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Unidades</h2>
          {isAdmin && (
            <button
              onClick={() => navigate('/stores')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storesLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            storesData?.slice(0, 6).map((store: any) => {
              const storeValueData = storesValue?.find((sv: any) => sv.store_id === store.id)
              const totalItems = storeValueData?.total_items ?? 0
              const totalValue = storeValueData?.total_value ?? 0
              const occupancy = Math.min(Math.round((totalItems / 100) * 100), 100)

              return (
                <div key={store.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{store.name}</h3>
                        <p className="text-xs text-gray-500">{store.city}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Ocupação</span>
                        <span className="font-medium text-gray-900">{totalItems} itens</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${occupancy}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Valor Total</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrencyCompact(totalValue)}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/inventory/unit/${store.id}`)}
                      className="w-full py-2 px-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Inventário
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

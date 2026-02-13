import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Building,
  Eye,
  DollarSign,
  TrendingUp,
  Wrench,
  AlertCircle,
  Info,
  Shield,
  Box
} from 'lucide-react'
import api from '../services/api'
import { DashboardData } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePermissions } from '../hooks/usePermissions'
import { AdminOnly, RoleGuard } from '../components/RoleGuard'
import { LowStockAlert } from '../components/LowStockAlert'
import { formatCurrency, formatCurrencyCompact } from '../utils/currency'
import { StatCard } from '../components/dashboard/StatCard'
import { MovementChart } from '../components/dashboard/MovementChart'
import { StatusDonutChart } from '../components/dashboard/StatusDonutChart'
import { StoreGrid } from '../components/dashboard/StoreGrid'
import { TimeFilter, TimePeriod } from '../components/dashboard/TimeFilter'
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const permissions = usePermissions()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')

  const { data: dashboardData, isLoading } = useQuery<DashboardData>(
    ['dashboard', timePeriod],
    async () => {
      const response = await api.get(`/dashboard/metrics?period=${timePeriod}`)
      return response.data
    },
    {
      refetchInterval: 30000, // Atualizar a cada 30 segundos
    }
  )

  const { data: recentMovements } = useQuery(
    'recent-movements',
    async () => {
      const response = await api.get('/dashboard/recent-movements?limit=5')
      return response.data.movements
    }
  )

  const { data: lowStockItems } = useQuery(
    'low-stock-items',
    async () => {
      const response = await api.get('/dashboard/low-stock-items')
      return response.data.items
    }
  )

  const { data: pendingTransfers } = useQuery(
    'pending-transfers-count',
    async () => {
      const response = await api.get('/movements/pending-receipts')
      return response.data.transfers
    }
  )

  const { data: storesData } = useQuery(
    'stores-summary',
    async () => {
      const response = await api.get('/stores')
      return response.data.stores
    }
  )

  const { data: storesValue } = useQuery(
    'stores-value',
    async () => {
      const response = await api.get('/dashboard/stores-value')
      return response.data.stores
    }
  )

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const metrics = dashboardData?.metrics
  const chartData = dashboardData?.chartData || []
  const statusBreakdown = dashboardData?.breakdowns.status || []

  // Cards de métricas com foco financeiro e indicadores de tendência
  const metricCards = [
    {
      title: 'Patrimônio Total',
      value: formatCurrency(metrics?.totalValue || 0),
      subtitle: `${metrics?.totalAssets || 0} ativos`,
      icon: DollarSign,
      bgColor: 'bg-emerald-50',
      iconColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      tooltip: 'Soma baseada no valor de compra dos ativos ativos',
      trend: metrics?.totalValueTrend ? {
        value: metrics.totalValueTrend,
        isPositive: metrics.totalValueTrend >= 0
      } : undefined
    },
    {
      title: 'Insumos Críticos',
      value: `${metrics?.lowStockItems || 0}`,
      subtitle: 'Abaixo do estoque mínimo',
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      iconColor: 'bg-red-500',
      textColor: 'text-red-600',
      tooltip: 'Itens que precisam de reposição urgente'
    },
    {
      title: 'Itens em Manutenção',
      value: `${metrics?.maintenanceAssets || 0}`,
      subtitle: formatCurrencyCompact(metrics?.maintenanceValue || 0),
      icon: Wrench,
      bgColor: 'bg-amber-50',
      iconColor: 'bg-amber-500',
      textColor: 'text-amber-600',
      tooltip: 'Ativos indisponíveis por reparo'
    },
    {
      title: 'Distribuição',
      value: `${((metrics?.uniqueAssets || 0) / (metrics?.totalAssets || 1) * 100).toFixed(0)}%`,
      subtitle: `${metrics?.uniqueAssets || 0} únicos / ${metrics?.supplyAssets || 0} insumos`,
      icon: Box,
      bgColor: 'bg-blue-50',
      iconColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      tooltip: 'Proporção entre ativos únicos e insumos'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header diferenciado por role com filtro temporal */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Dashboard
            {permissions.isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                <Shield className="w-3 h-3" />
                Administrador
              </span>
            )}
            {permissions.isViewer && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                <Eye className="w-3 h-3" />
                Visualização
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            {permissions.isAdmin 
              ? "Business Intelligence - Visão estratégica do inventário" 
              : "Visualização do inventário - Somente leitura"
            }
          </p>
        </div>

        {/* Filtro Temporal Global */}
        <TimeFilter selected={timePeriod} onChange={setTimePeriod} />
      </div>

      {/* Dashboard para Administradores - Controle Completo */}
      <AdminOnly>
        {/* Alertas de BI no topo */}
        <div className="flex gap-4">
          {/* Alerta de itens em trânsito há mais de 48h */}
          {(metrics?.itemsInTransitOver48h || 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <span className="text-sm font-medium text-amber-800">
                  {metrics?.itemsInTransitOver48h} {(metrics?.itemsInTransitOver48h || 0) === 1 ? 'item' : 'itens'} em trânsito há mais de 48h
                </span>
                <button className="ml-2 text-amber-700 hover:text-amber-900 text-sm underline">
                  Ver detalhes
                </button>
              </div>
            </div>
          )}

          {/* Alerta de estoque baixo */}
          {(metrics?.lowStockItems || 0) > 0 && (
            <Link 
              to="/assets?low_stock_only=true"
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3 hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {metrics?.lowStockItems} {(metrics?.lowStockItems || 0) === 1 ? 'item abaixo' : 'itens abaixo'} do estoque mínimo
              </span>
            </Link>
          )}
        </div>
      </AdminOnly>

      {/* Dashboard para Lojas - Visualização Simplificada */}
      <RoleGuard requiredRole="viewer">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Modo Visualização - Loja</h3>
              <p className="text-sm text-blue-700">
                Você pode visualizar o inventário e confirmar recebimentos via QR Code. 
                Para transferências e alterações, entre em contato com a equipe de TI.
              </p>
            </div>
          </div>
        </div>
      </RoleGuard>

      {/* Cards de métricas - Diferenciados por Role */}
      <AdminOnly fallback={
        /* Dashboard Simplificado para Lojas */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-blue-50 border-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">O que tenho aqui</p>
                <p className="text-2xl font-bold text-blue-600">{metrics?.availableAssets || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Itens disponíveis</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card bg-amber-50 border-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Aguardando chegada</p>
                <p className="text-2xl font-bold text-amber-600">{pendingTransfers?.length || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Transferências pendentes</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card bg-green-50 border-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Posso confirmar</p>
                <p className="text-2xl font-bold text-green-600">QR Code</p>
                <p className="text-sm text-gray-500 mt-1">Recebimentos via scanner</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      }>
        {/* Dashboard Completo para Administradores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </AdminOnly>

      {/* Seção de Unidades/Lojas com valor patrimonial */}
      {storesData && storesData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Unidades ({storesData.length})
            </h2>
            <Link
              to="/stores"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todas
            </Link>
          </div>
          
          <StoreGrid 
            stores={storesData}
            storesValue={storesValue || []}
            isLoading={!storesData}
            onTransferClick={(storeId) => navigate(`/transfer?destination=${storeId}`)}
          />
        </div>
      )}

      {/* Alerta de Transferências Pendentes */}
      {pendingTransfers && pendingTransfers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Transferências Pendentes de Confirmação
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Existem <strong>{pendingTransfers.length}</strong> {pendingTransfers.length === 1 ? 'item pendente' : 'itens pendentes'} de confirmação de recebimento.
                </p>
              </div>
              <div className="mt-3">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    to="/receipt-confirmation"
                    className="bg-yellow-100 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 transition-colors"
                  >
                    Confirmar Recebimentos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de movimentações com área */}
        <MovementChart data={chartData} isLoading={isLoading} />

        {/* Gráfico de status com donut */}
        <StatusDonutChart data={statusBreakdown} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimentações recentes */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Movimentações Recentes
          </h3>
          <div className="space-y-3">
            {recentMovements && recentMovements.length > 0 ? (
              recentMovements.map((movement: any) => (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{movement.asset_name}</p>
                    <p className="text-sm text-gray-600">
                      {movement.type} - {movement.employee_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {format(new Date(movement.movement_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma movimentação recente
                </h3>
                <p className="text-gray-500 mb-4">
                  Comece registrando entradas e saídas de ativos
                </p>
                <Link
                  to="/movements"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Registrar Movimentação
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Componente de Alerta de Estoque Baixo */}
        <LowStockAlert 
          items={lowStockItems || []} 
          isLoading={!lowStockItems}
        />
      </div>
    </div>
  )
}
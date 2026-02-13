import React from 'react'
import { useQuery } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  MapPin,
  Building,
  Eye,
  DollarSign,
  TrendingUp,
  Wrench,
  AlertCircle,
  Info,
  Shield,
  Users
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../services/api'
import { DashboardData } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePermissions } from '../hooks/usePermissions'
import { AdminOnly, RoleGuard } from '../components/RoleGuard'
import { LowStockAlert } from '../components/LowStockAlert'
import { formatCurrency, formatCurrencyCompact } from '../utils/currency'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const permissions = usePermissions()
  const { data: dashboardData, isLoading } = useQuery<DashboardData>(
    'dashboard',
    async () => {
      const response = await api.get('/dashboard/metrics')
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const metrics = dashboardData?.metrics
  const chartData = dashboardData?.chartData || []
  const statusBreakdown = dashboardData?.breakdowns.status || []

  // Cores semânticas do Tailwind
  const SEMANTIC_COLORS = {
    emerald: '#10b981', // Disponível/Positivo
    blue: '#3b82f6',    // Em Uso/Em Trânsito
    amber: '#f59e0b',   // Manutenção/Alerta
    red: '#ef4444'      // Crítico/Descartado
  }

  const COLORS = [SEMANTIC_COLORS.emerald, SEMANTIC_COLORS.blue, SEMANTIC_COLORS.amber, SEMANTIC_COLORS.red]

  // Cards de métricas com foco financeiro
  const metricCards = [
    {
      title: 'Patrimônio Total',
      value: formatCurrency(metrics?.totalValue || 0),
      subtitle: `${metrics?.totalAssets || 0} ativos`,
      icon: DollarSign,
      bgColor: 'bg-emerald-50',
      iconColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      tooltip: 'Soma baseada no valor de compra dos ativos ativos'
    },
    {
      title: 'Disponíveis',
      value: `${metrics?.availableAssets || 0}`,
      subtitle: formatCurrencyCompact(metrics?.availableValue || 0),
      icon: CheckCircle,
      bgColor: 'bg-emerald-50',
      iconColor: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      tooltip: 'Ativos prontos para uso'
    },
    {
      title: 'Custo Imobilizado',
      value: formatCurrency(metrics?.maintenanceValue || 0),
      subtitle: `${metrics?.maintenanceAssets || 0} em manutenção`,
      icon: Wrench,
      bgColor: 'bg-amber-50',
      iconColor: 'bg-amber-500',
      textColor: 'text-amber-600',
      tooltip: 'Valor dos ativos parados em conserto'
    },
    {
      title: 'Em Operação',
      value: `${metrics?.inUseAssets || 0}`,
      subtitle: formatCurrencyCompact(metrics?.inUseValue || 0),
      icon: TrendingUp,
      bgColor: 'bg-blue-50',
      iconColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      tooltip: 'Ativos atualmente em uso'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header diferenciado por role */}
      <div className="flex items-center justify-between">
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

        {/* Indicador de permissões */}
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Logado como: <span className="font-medium">{permissions.user?.username}</span>
          </div>
          <div className="text-xs text-gray-400">
            {permissions.isAdmin ? "Controle total do sistema" : "Acesso de visualização"}
          </div>
        </div>
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
          {metricCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className={`card ${card.bgColor} border-0`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {card.tooltip}
                        </div>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.iconColor}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storesData.slice(0, 6).map((store: any) => {
              const storeValue = storesValue?.find((sv: any) => sv.id === store.id)
              return (
                <div
                  key={store.id}
                  onClick={() => navigate(`/inventory/unit/${store.id}`)}
                  className="card hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200 group bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{store.city}</span>
                      </div>
                      {store.responsible && (
                        <p className="text-sm text-gray-600 mt-1">
                          Responsável: {store.responsible}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Patrimônio Alocado:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(storeValue?.total_value || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                      <span>{storeValue?.asset_count || 0} ativos</span>
                      <span className="text-blue-600 font-medium group-hover:text-blue-700">
                        Ver inventário →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
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
        {/* Gráfico de movimentações com cores semânticas */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Movimentações dos Últimos 30 Dias
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
              />
              <Line 
                type="monotone" 
                dataKey="saidas" 
                stroke={SEMANTIC_COLORS.blue}
                strokeWidth={2}
                name="Saídas"
              />
              <Line 
                type="monotone" 
                dataKey="entradas" 
                stroke={SEMANTIC_COLORS.emerald}
                strokeWidth={2}
                name="Entradas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de status com cores semânticas */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribuição por Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusBreakdown.map((entry, index) => {
                  let color = SEMANTIC_COLORS.emerald // Default: Disponível
                  if (entry.status === 'Em Uso' || entry.status === 'Em Trânsito') {
                    color = SEMANTIC_COLORS.blue
                  } else if (entry.status === 'Manutenção') {
                    color = SEMANTIC_COLORS.amber
                  } else if (entry.status === 'Descartado') {
                    color = SEMANTIC_COLORS.red
                  }
                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimentações recentes */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Movimentações Recentes
          </h3>
          <div className="space-y-3">
            {recentMovements?.map((movement: any) => (
              <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
            ))}
            {(!recentMovements || recentMovements.length === 0) && (
              <p className="text-gray-500 text-center py-4">Nenhuma movimentação recente</p>
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
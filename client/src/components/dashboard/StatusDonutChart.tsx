import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface StatusDonutChartProps {
  data: Array<{
    status: string
    count: number
  }>
  isLoading?: boolean
}

const SEMANTIC_COLORS: Record<string, string> = {
  'Disponível': '#10b981',
  'Em Uso': '#3b82f6',
  'Em Trânsito': '#3b82f6',
  'Manutenção': '#f59e0b',
  'Descartado': '#ef4444'
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-full mx-auto w-64"></div>
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.count / total) * 100).toFixed(1)
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.status}</p>
          <p className="text-sm text-gray-600">
            {data.count} ativos ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Distribuição de Ativos por Status
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Visão geral da situação atual do inventário
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={SEMANTIC_COLORS[entry.status] || '#6b7280'}
                className="transition-all duration-200 hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => {
              const percentage = ((entry.payload.count / total) * 100).toFixed(0)
              return `${value} (${percentage}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda adicional com números */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.status} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: SEMANTIC_COLORS[item.status] || '#6b7280' }}
              />
              <span className="text-sm text-gray-700">{item.status}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

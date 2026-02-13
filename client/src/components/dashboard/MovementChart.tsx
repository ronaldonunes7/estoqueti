import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MovementChartProps {
  data: Array<{
    date: string
    entradas: number
    saidas: number
  }>
  isLoading?: boolean
}

export const MovementChart: React.FC<MovementChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  // Calcular totais para o período
  const totalEntradas = data.reduce((sum, item) => sum + item.entradas, 0)
  const totalSaidas = data.reduce((sum, item) => sum + item.saidas, 0)
  const saldo = totalEntradas - totalSaidas

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Linha do Tempo de Movimentações
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Volume de entradas vs saídas nos últimos 30 dias
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-gray-600">
              <span className="font-semibold text-emerald-600">{totalEntradas}</span> entradas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">
              <span className="font-semibold text-blue-600">{totalSaidas}</span> saídas
            </span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            saldo >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            Saldo: {saldo >= 0 ? '+' : ''}{saldo}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
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
            tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Area 
            type="monotone" 
            dataKey="entradas" 
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorEntradas)"
            name="Entradas"
          />
          <Area 
            type="monotone" 
            dataKey="saidas" 
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSaidas)"
            name="Saídas"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

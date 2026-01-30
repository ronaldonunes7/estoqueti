import React from 'react'
import { clsx } from 'clsx'

export type StatusType = 'Disponível' | 'Em Uso' | 'Manutenção' | 'Descartado' | 'Em Trânsito'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusStyles = (status: StatusType) => {
    const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border'
    
    switch (status) {
      case 'Disponível':
        return `${baseStyles} bg-emerald-100 text-emerald-700 border-emerald-200`
      case 'Em Uso':
        return `${baseStyles} bg-blue-100 text-blue-700 border-blue-200`
      case 'Manutenção':
        return `${baseStyles} bg-amber-100 text-amber-700 border-amber-200`
      case 'Em Trânsito':
        return `${baseStyles} bg-purple-100 text-purple-700 border-purple-200`
      case 'Descartado':
        return `${baseStyles} bg-red-100 text-red-700 border-red-200`
      default:
        return `${baseStyles} bg-gray-100 text-gray-700 border-gray-200`
    }
  }

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'Disponível':
        return '✓'
      case 'Em Uso':
        return '▶'
      case 'Manutenção':
        return '🔧'
      case 'Em Trânsito':
        return '🚚'
      case 'Descartado':
        return '🗑'
      default:
        return ''
    }
  }

  return (
    <span className={clsx(getStatusStyles(status), className)}>
      <span className="mr-1" aria-hidden="true">
        {getStatusIcon(status)}
      </span>
      {status}
    </span>
  )
}
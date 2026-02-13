import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

interface StockIndicatorProps {
  currentStock: number
  minStock: number
  assetType: 'unique' | 'consumable'
  className?: string
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  currentStock,
  minStock,
  assetType,
  className
}) => {
  if (assetType === 'unique') {
    return (
      <span className={clsx('text-sm text-gray-500', className)}>
        N/A
      </span>
    )
  }

  const isCritical = currentStock <= minStock && minStock > 0
  const isLow = currentStock <= (minStock * 1.5) && minStock > 0
  const stockPercentage = minStock > 0 ? Math.min((currentStock / (minStock * 2)) * 100, 100) : 100

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500'
    if (isLow) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getTextColor = () => {
    if (isCritical) return 'text-red-600 font-bold'
    if (isLow) return 'text-amber-600 font-medium'
    return 'text-gray-900'
  }

  return (
    <div className={clsx('space-y-1', className)}>
      <div className="flex items-center gap-1">
        {isCritical && (
          <AlertTriangle className="w-4 h-4 text-red-500" aria-label="Estoque crítico" />
        )}
        <span className={clsx('text-sm', getTextColor())}>
          {currentStock} unidades
        </span>
      </div>
      
      {minStock > 0 && (
        <>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={clsx('h-1.5 rounded-full transition-all duration-300', getProgressColor())}
              style={{ width: `${stockPercentage}%` }}
              aria-label={`Nível de estoque: ${stockPercentage.toFixed(0)}%`}
            />
          </div>
          
          {/* Min Stock Info */}
          <div className="text-xs text-gray-500">
            Mín: {minStock}
            {isCritical && (
              <span className="ml-1 text-red-600 font-medium">
                (Déficit: {minStock - currentStock})
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
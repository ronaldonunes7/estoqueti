import React, { useState } from 'react'
import { Asset } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { format, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AssetTooltipProps {
  asset: Asset
  children: React.ReactNode
}

export const AssetTooltip: React.FC<AssetTooltipProps> = ({ asset, children }) => {
  const [isVisible, setIsVisible] = useState(false)

  const isWarrantyExpired = asset.warranty_expiry 
    ? !isAfter(new Date(asset.warranty_expiry), new Date())
    : false

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl border border-gray-700">
          {/* Seta do tooltip */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          
          <div className="space-y-3">
            {/* Header */}
            <div className="border-b border-gray-700 pb-2">
              <h4 className="font-semibold text-white">{asset.name}</h4>
              <p className="text-gray-300 text-xs">{asset.brand_model}</p>
            </div>

            {/* Informações Financeiras */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">Valor de Aquisição:</span>
                <p className="text-emerald-400 font-medium">
                  {asset.purchase_value ? formatCurrency(asset.purchase_value) : 'Não informado'}
                </p>
              </div>
              
              <div>
                <span className="text-gray-400">Data de Compra:</span>
                <p className="text-white">
                  {formatDate(asset.purchase_date)}
                </p>
              </div>
            </div>

            {/* Garantia */}
            {asset.warranty_expiry && (
              <div className="text-xs">
                <span className="text-gray-400">Garantia:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white">
                    {formatDate(asset.warranty_expiry)}
                  </span>
                  {isWarrantyExpired && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                      ⚠️ Expirada
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Identificação */}
            <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-700 pt-2">
              {asset.patrimony_tag && (
                <div>
                  <span className="text-gray-400">Patrimônio:</span>
                  <p className="text-white font-mono">{asset.patrimony_tag}</p>
                </div>
              )}
              
              {asset.serial_number && (
                <div>
                  <span className="text-gray-400">Serial:</span>
                  <p className="text-white font-mono">{asset.serial_number}</p>
                </div>
              )}
            </div>

            {/* Localização */}
            {asset.location && (
              <div className="text-xs">
                <span className="text-gray-400">Localização:</span>
                <p className="text-white">{asset.location}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
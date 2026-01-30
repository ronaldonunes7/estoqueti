import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  Wrench,
  Calendar,
  BarChart3
} from 'lucide-react'
import { differenceInDays, addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AssetPredictiveAnalysisProps {
  asset: {
    id: number
    name: string
    category: string
    status: string
    purchase_date?: string
    purchase_value?: number
    warranty_expiry?: string
    created_at: string
  }
  movements: Array<{
    id: number
    type: string
    movement_date: string
    daysInLocation?: number
  }>
}

export const AssetPredictiveAnalysis: React.FC<AssetPredictiveAnalysisProps> = ({ asset, movements }) => {
  // Cálculos preditivos
  const assetAge = differenceInDays(new Date(), new Date(asset.created_at))
  const maintenanceMovements = movements.filter(m => m.type === 'Manutenção')
  const totalMovements = movements.length
  
  // Análise de padrões de uso
  const averageMovementsPerMonth = totalMovements > 0 ? (totalMovements / (assetAge / 30)) : 0
  const maintenanceFrequency = maintenanceMovements.length > 0 ? (assetAge / maintenanceMovements.length) : 0
  
  // Previsões
  const predictNextMaintenance = () => {
    if (maintenanceMovements.length === 0) {
      // Se nunca teve manutenção, estimar baseado na categoria
      const categoryMaintenanceInterval = {
        'Hardware': 365, // 1 ano
        'Periférico': 730, // 2 anos
        'Licença': 0 // Não se aplica
      }
      const interval = categoryMaintenanceInterval[asset.category as keyof typeof categoryMaintenanceInterval] || 365
      return addDays(new Date(asset.created_at), interval)
    }
    
    const lastMaintenance = new Date(maintenanceMovements[0].movement_date)
    return addDays(lastMaintenance, Math.round(maintenanceFrequency))
  }

  const predictReplacement = () => {
    // Estimar vida útil baseada na categoria
    const categoryLifespan = {
      'Hardware': 1825, // 5 anos
      'Periférico': 1095, // 3 anos
      'Licença': 365 // 1 ano (renovação)
    }
    const lifespan = categoryLifespan[asset.category as keyof typeof categoryLifespan] || 1825
    return addDays(new Date(asset.created_at), lifespan)
  }

  const calculateDepreciation = () => {
    if (!asset.purchase_value) return 0
    
    // Depreciação linear baseada na categoria
    const categoryDepreciationRate = {
      'Hardware': 0.2, // 20% ao ano
      'Periférico': 0.33, // 33% ao ano
      'Licença': 1 // 100% ao ano
    }
    
    const rate = categoryDepreciationRate[asset.category as keyof typeof categoryDepreciationRate] || 0.2
    const yearsOld = assetAge / 365
    const depreciation = Math.min(asset.purchase_value * rate * yearsOld, asset.purchase_value)
    
    return asset.purchase_value - depreciation
  }

  const getHealthScore = () => {
    let score = 100
    
    // Reduzir score baseado na idade
    const ageImpact = Math.min((assetAge / 1825) * 30, 30) // Máximo 30 pontos por idade
    score -= ageImpact
    
    // Reduzir score baseado em manutenções
    const maintenanceImpact = maintenanceMovements.length * 5 // 5 pontos por manutenção
    score -= maintenanceImpact
    
    // Reduzir score se garantia expirou
    if (asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date()) {
      score -= 15
    }
    
    return Math.max(score, 0)
  }

  const nextMaintenance = predictNextMaintenance()
  const replacementDate = predictReplacement()
  const currentValue = calculateDepreciation()
  const healthScore = getHealthScore()

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5" />
    if (score >= 60) return <Clock className="h-5 w-5" />
    return <AlertTriangle className="h-5 w-5" />
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const isMaintenanceDue = differenceInDays(nextMaintenance, new Date()) <= 30
  const isReplacementDue = differenceInDays(replacementDate, new Date()) <= 90

  return (
    <div className="space-y-6">
      {/* Score de Saúde do Ativo */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Score de Saúde do Ativo</h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getHealthColor(healthScore)}`}>
            {getHealthIcon(healthScore)}
            <span className="font-medium">{Math.round(healthScore)}%</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              healthScore >= 80 ? 'bg-green-500' :
              healthScore >= 60 ? 'bg-yellow-500' :
              healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthScore}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Idade do Ativo</p>
            <p className="font-medium">{Math.round(assetAge / 365 * 10) / 10} anos</p>
          </div>
          <div>
            <p className="text-gray-600">Manutenções</p>
            <p className="font-medium">{maintenanceMovements.length} realizadas</p>
          </div>
          <div>
            <p className="text-gray-600">Status da Garantia</p>
            <p className="font-medium">
              {asset.warranty_expiry 
                ? (new Date(asset.warranty_expiry) > new Date() ? 'Válida' : 'Expirada')
                : 'N/A'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Previsões e Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Próxima Manutenção */}
        <div className={`bg-white rounded-lg border p-6 ${isMaintenanceDue ? 'border-yellow-300 bg-yellow-50' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isMaintenanceDue ? 'bg-yellow-500' : 'bg-blue-500'}`}>
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Próxima Manutenção</h4>
              <p className="text-sm text-gray-600">Previsão baseada no histórico</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-bold text-gray-900">
              {format(nextMaintenance, 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            <p className="text-sm text-gray-600">
              {differenceInDays(nextMaintenance, new Date()) > 0 
                ? `Em ${differenceInDays(nextMaintenance, new Date())} dias`
                : 'Manutenção em atraso'
              }
            </p>
            {isMaintenanceDue && (
              <div className="flex items-center gap-1 text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Manutenção próxima!</span>
              </div>
            )}
          </div>
        </div>

        {/* Previsão de Substituição */}
        <div className={`bg-white rounded-lg border p-6 ${isReplacementDue ? 'border-red-300 bg-red-50' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isReplacementDue ? 'bg-red-500' : 'bg-purple-500'}`}>
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Substituição Prevista</h4>
              <p className="text-sm text-gray-600">Baseada na vida útil estimada</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-bold text-gray-900">
              {format(replacementDate, 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            <p className="text-sm text-gray-600">
              {differenceInDays(replacementDate, new Date()) > 0 
                ? `Em ${Math.round(differenceInDays(replacementDate, new Date()) / 365 * 10) / 10} anos`
                : 'Substituição recomendada'
              }
            </p>
            {isReplacementDue && (
              <div className="flex items-center gap-1 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Substituição próxima!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Análise Financeira */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Análise Financeira
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Valor Original</p>
            <p className="text-xl font-bold text-gray-900">
              {asset.purchase_value ? formatCurrency(asset.purchase_value) : 'N/A'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Valor Atual (Depreciado)</p>
            <p className="text-xl font-bold text-gray-900">
              {asset.purchase_value ? formatCurrency(currentValue) : 'N/A'}
            </p>
            {asset.purchase_value && (
              <p className="text-sm text-gray-500">
                {Math.round((1 - currentValue / asset.purchase_value) * 100)}% depreciado
              </p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Custo de Manutenção</p>
            <p className="text-xl font-bold text-gray-900">
              {maintenanceMovements.length} manutenções
            </p>
            <p className="text-sm text-gray-500">
              Média: {maintenanceFrequency > 0 ? Math.round(maintenanceFrequency) : 0} dias entre manutenções
            </p>
          </div>
        </div>
      </div>

      {/* Padrões de Uso */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Padrões de Uso
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Atividade de Movimentação</p>
            <div className="flex items-center gap-2">
              {averageMovementsPerMonth > 2 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {Math.round(averageMovementsPerMonth * 10) / 10} movimentações/mês
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {averageMovementsPerMonth > 2 ? 'Alto uso' : 
               averageMovementsPerMonth > 1 ? 'Uso moderado' : 'Baixo uso'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Estabilidade</p>
            <div className="flex items-center gap-2">
              {maintenanceMovements.length <= 2 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {maintenanceMovements.length <= 2 ? 'Estável' : 'Instável'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Baseado no histórico de manutenções
            </p>
          </div>
        </div>
      </div>

      {/* Recomendações */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Recomendações
        </h4>
        
        <ul className="space-y-2 text-sm text-blue-800">
          {isMaintenanceDue && (
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <span>Agendar manutenção preventiva nos próximos 30 dias</span>
            </li>
          )}
          
          {healthScore < 60 && (
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <span>Considerar substituição devido ao baixo score de saúde</span>
            </li>
          )}
          
          {asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date() && (
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-red-600 mt-0.5" />
              <span>Garantia expirada - considerar extensão ou plano de manutenção</span>
            </li>
          )}
          
          {averageMovementsPerMonth < 0.5 && (
            <li className="flex items-start gap-2">
              <TrendingDown className="h-4 w-4 text-gray-600 mt-0.5" />
              <span>Baixo uso detectado - avaliar necessidade do ativo</span>
            </li>
          )}
          
          {maintenanceMovements.length === 0 && assetAge > 365 && (
            <li className="flex items-start gap-2">
              <Wrench className="h-4 w-4 text-blue-600 mt-0.5" />
              <span>Nenhuma manutenção registrada - considerar manutenção preventiva</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
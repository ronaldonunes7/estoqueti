/**
 * Formata um valor numérico para moeda brasileira (BRL)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0)
}

/**
 * Formata um valor numérico para moeda brasileira compacta (ex: R$ 1,2K)
 */
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`
  }
  return formatCurrency(value)
}

/**
 * Formata um número para exibição compacta (ex: 1.2K, 1.5M)
 */
export const formatNumberCompact = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}
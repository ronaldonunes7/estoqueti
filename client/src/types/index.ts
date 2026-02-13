export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'viewer'
}

export interface Store {
  id: number
  name: string
  address: string
  number?: string
  neighborhood?: string
  city: string
  cep?: string
  phone?: string
  responsible?: string
  created_at: string
  updated_at: string
}

export interface Asset {
  id: number
  name: string
  brand_model: string
  serial_number?: string
  patrimony_tag?: string
  barcode?: string
  category: 'Hardware' | 'Periférico' | 'Licença' | 'Insumos'
  status: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Descartado' | 'Em Trânsito'
  asset_type: 'unique' | 'consumable'
  stock_quantity: number
  min_stock: number
  purchase_date?: string
  purchase_value?: number
  warranty_expiry?: string
  location?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Movement {
  id: number
  asset_id: number
  type: 'Entrada' | 'Saída' | 'Manutenção' | 'Descarte' | 'Transferência' | 'ENTRADA_ESTOQUE'
  employee_name: string
  collaborator?: string // Alias para employee_name
  technician?: string // Alias para responsible_technician
  destination?: string
  store_id?: number
  quantity: number
  responsible_technician: string
  observations?: string
  movement_date: string
  created_at?: string
  created_by: number
  asset_name?: string
  patrimony_tag?: string
  serial_number?: string
  category?: string
  asset_type?: string
  purchase_value?: number
  store_name?: string
  store_city?: string
  created_by_username?: string
  assets?: Asset[] // Para quando a movimentação inclui múltiplos ativos
}

export interface MovementKPIs {
  totalSaidas: {
    count: number
    value: number
  }
  itensManutencao: {
    count: number
  }
  valorTotalMovimentacao: {
    value: number
  }
  movimentacoesPorTipo: Array<{
    type: string
    count: number
  }>
  tecnicosMaisAtivos: Array<{
    responsible_technician: string
    count: number
  }>
}

export interface MovementFilters {
  type?: string
  store_id?: number
  technician?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export interface DashboardMetrics {
  totalAssets: number
  availableAssets: number
  inUseAssets: number
  maintenanceAssets: number
  discardedAssets: number
  lowStockItems: number
  recentCheckouts: number
  // Valores financeiros
  totalValue: number
  maintenanceValue: number
  availableValue: number
  inUseValue: number
  // Alertas de BI
  itemsInTransitOver48h: number
}

export interface CategoryBreakdown {
  category: string
  count: number
}

export interface StatusBreakdown {
  status: string
  count: number
}

export interface ChartData {
  date: string
  saidas: number
  entradas: number
}

export interface DashboardData {
  metrics: DashboardMetrics
  breakdowns: {
    category: CategoryBreakdown[]
    status: StatusBreakdown[]
  }
  chartData: ChartData[]
}

export interface AssetFormData {
  name: string
  brand_model: string
  serial_number?: string
  patrimony_tag?: string
  barcode?: string
  category: Asset['category']
  status: Asset['status']
  asset_type: Asset['asset_type']
  stock_quantity: number
  min_stock: number
  purchase_date?: string
  purchase_value?: number
  warranty_expiry?: string
  location?: string
  notes?: string
}

export interface StoreFormData {
  name: string
  address: string
  number?: string
  neighborhood?: string
  city: string
  cep?: string
  phone?: string
  responsible?: string
}

export interface TransferFormData {
  asset_id: number
  store_id: number
  quantity: number
  employee_name: string
  responsible_technician: string
  observations?: string
}

export interface AssetHistory {
  asset: Asset & {
    current_store_name?: string
    current_store_city?: string
  }
  movements: Array<Movement & {
    store_name?: string
    store_city?: string
    store_address?: string
    store_responsible?: string
    created_by_username?: string
    created_by_email?: string
    daysInLocation?: number
  }>
  totalMovements: number
}

export interface MovementFormData {
  asset_id: number
  employee_name: string
  destination?: string
  responsible_technician: string
  observations?: string
  status?: Asset['status']
}

// Interfaces para o sistema de recebimento
export interface PendingTransfer {
  id: number
  asset_id: number
  asset_name: string
  asset_brand_model: string
  asset_barcode?: string
  quantity: number
  origin_store?: string
  destination_store: string
  employee_name: string
  responsible_technician: string
  transfer_date: string
  observations?: string
}

export interface ReceiptConfirmation {
  transfer_id: number
  asset_id: number
  confirmed_by: string
  confirmation_date: string
  received_quantity: number
  observations?: string
  has_divergence: boolean
  divergence_type?: 'damaged' | 'quantity_mismatch' | 'other'
  divergence_description?: string
}

// Interfaces para Termo de Responsabilidade
export interface ResponsibilityTerm {
  id: number
  term_number: string
  movement_id: number
  recipient_name: string
  recipient_cpf: string
  recipient_email?: string
  recipient_unit: string
  signature_data?: string
  pdf_blob?: string
  created_by: number
  created_at: string
  created_by_username?: string
  movement_type?: string
  movement_employee?: string
  movement_date?: string
}

export interface ResponsibilityTermFormData {
  termNumber: string
  movementId: number
  recipientName: string
  recipientCpf: string
  recipientEmail?: string
  recipientUnit: string
  signatureData?: string
  pdfBlob?: string
}
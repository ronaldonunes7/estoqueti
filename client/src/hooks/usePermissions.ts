import { useAuth } from '../contexts/AuthContext'

export const usePermissions = () => {
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin'
  const isViewer = user?.role === 'viewer'

  return {
    // Permissões de escrita (apenas admin)
    canCreateAssets: isAdmin,
    canEditAssets: isAdmin,
    canDeleteAssets: isAdmin,
    canTransferAssets: isAdmin,
    canAddStock: isAdmin,
    canManageStores: isAdmin,
    canAccessExternalReports: isAdmin,
    canManageUsers: isAdmin,
    
    // Permissões de leitura (todos os usuários autenticados)
    canViewAssets: true,
    canViewMovements: true,
    canViewReports: true,
    canViewDashboard: true,
    
    // Exceção: Confirmação de recebimento (todos podem fazer)
    canConfirmReceipt: true,
    
    // Informações do usuário
    user,
    isAdmin,
    isViewer,
    role: user?.role || 'viewer'
  }
}
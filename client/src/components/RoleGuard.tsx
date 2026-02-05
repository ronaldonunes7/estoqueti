import React from 'react'
import { usePermissions } from '../hooks/usePermissions'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'viewer'
  requiredPermission?: keyof ReturnType<typeof usePermissions>
  fallback?: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallback = null 
}) => {
  const permissions = usePermissions()

  // Verificar role específico
  if (requiredRole) {
    if (requiredRole === 'admin' && !permissions.isAdmin) {
      return <>{fallback}</>
    }
    if (requiredRole === 'viewer' && !permissions.isViewer) {
      return <>{fallback}</>
    }
  }

  // Verificar permissão específica
  if (requiredPermission) {
    const hasPermission = permissions[requiredPermission]
    if (!hasPermission) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Componente específico para ações administrativas
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <RoleGuard requiredRole="admin" fallback={fallback}>
    {children}
  </RoleGuard>
)

// Componente para mostrar mensagem de acesso negado
export const AccessDenied: React.FC<{ message?: string }> = ({ 
  message = "Acesso restrito a administradores" 
}) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm text-yellow-700">{message}</p>
      </div>
    </div>
  </div>
)
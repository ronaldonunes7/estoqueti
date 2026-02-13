import React from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { AccessDenied } from './RoleGuard'

interface AdminRouteProps {
  children: React.ReactNode
  redirectTo?: string
  showAccessDenied?: boolean
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard',
  showAccessDenied = true 
}) => {
  const permissions = usePermissions()

  if (!permissions.isAdmin) {
    if (showAccessDenied) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <AccessDenied message="Esta página é restrita a administradores. Entre em contato com a equipe de TI para obter acesso." />
        </div>
      )
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
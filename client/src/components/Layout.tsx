import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  FileText, 
  LogOut,
  User,
  Menu,
  X,
  Store,
  Settings,
  CheckCircle,
  Database,
  Scan
} from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ativos', href: '/assets', icon: Package },
    { name: 'Lojas', href: '/stores', icon: Store },
    { name: 'Transferência', href: '/transfer', icon: ArrowRightLeft },
    { 
      name: 'Scanner QR', 
      href: '/confirmar-recebimento', 
      icon: Scan,
      highlight: true,
      description: '📱 Confirmar Recebimento'
    },
    { name: 'Movimentações', href: '/movements', icon: ArrowRightLeft },
    { name: 'Relatórios', href: '/reports', icon: FileText },
    ...(user?.role === 'admin' ? [
      { name: 'Acessos Externos', href: '/external-access', icon: Settings }
    ] : [])
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Inventário TI</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isItemActive = isActive(item.href)
              const isHighlighted = item.highlight
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isItemActive
                      ? 'bg-blue-100 text-blue-900'
                      : isHighlighted
                      ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <div className="flex flex-col flex-1">
                    <span className={isHighlighted ? 'font-semibold' : ''}>
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="text-xs text-gray-500">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {isHighlighted && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Novo
                    </span>
                  )}
                </Link>
              )
            })}
            
            {/* Dev Tools - apenas em desenvolvimento */}
            {process.env.NODE_ENV !== 'production' && (
              <Link
                to="/dev-tools"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border-t pt-4 mt-4 ${
                  isActive('/dev-tools')
                    ? 'bg-red-100 text-red-700'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <Database className="mr-3 h-5 w-5" />
                Dev Tools
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Inventário TI</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isItemActive = isActive(item.href)
              const isHighlighted = item.highlight
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isItemActive
                      ? 'bg-blue-100 text-blue-900'
                      : isHighlighted
                      ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <div className="flex flex-col flex-1">
                    <span className={isHighlighted ? 'font-semibold' : ''}>
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="text-xs text-gray-500">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {isHighlighted && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Novo
                    </span>
                  )}
                </Link>
              )
            })}
            
            {/* Dev Tools - apenas em desenvolvimento */}
            {process.env.NODE_ENV !== 'production' && (
              <Link
                to="/dev-tools"
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border-t pt-4 mt-4 ${
                  isActive('/dev-tools')
                    ? 'bg-red-100 text-red-700'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <Database className="mr-3 h-5 w-5" />
                Dev Tools
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.username}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user?.role === 'admin' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.role === 'admin' ? 'Admin' : 'Viewer'}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
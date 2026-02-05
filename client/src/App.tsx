import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Assets } from './pages/Assets'
import { Stores } from './pages/Stores'
import { Transfer } from './pages/Transfer'
import { ReceiptConfirmation } from './pages/ReceiptConfirmation'
import { Movements } from './pages/Movements'
import { Reports } from './pages/Reports'
import { AssetHistoryPage } from './pages/AssetHistory'
import { PublicReport } from './pages/PublicReport'
import { PublicPortal } from './pages/PublicPortal'
import { DevTools } from './pages/DevTools'
import { ExternalAccess } from './pages/ExternalAccess'
import { UnitInventory } from './pages/UnitInventory'
import { TestQR } from './pages/TestQR'
import { DatabaseCleanup } from './pages/DatabaseCleanup'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Rotas públicas para visualização de relatórios */}
        <Route path="/view/report/:token" element={<PublicReport />} />
        <Route path="/portal/:token" element={<PublicPortal />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/transfer" element={<Transfer />} />
                  <Route path="/confirmar-recebimento" element={<ReceiptConfirmation />} />
                  <Route path="/test-qr" element={<TestQR />} />
                  <Route path="/database-cleanup" element={<DatabaseCleanup />} />
                  <Route path="/movements" element={<Movements />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/external-access" element={<ExternalAccess />} />
                  <Route path="/inventory/asset/:id/history" element={<AssetHistoryPage />} />
                  <Route path="/inventory/unit/:id" element={<UnitInventory />} />
                  <Route path="/dev-tools" element={<DevTools />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
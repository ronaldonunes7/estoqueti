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
import { ExternalAccess } from './pages/ExternalAccess'
import { UnitInventory } from './pages/UnitInventory'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Rota pública para visualização de relatórios */}
        <Route path="/view/report/:token" element={<PublicReport />} />
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
                  <Route path="/receipt-confirmation" element={<ReceiptConfirmation />} />
                  <Route path="/movements" element={<Movements />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/external-access" element={<ExternalAccess />} />
                  <Route path="/inventory/asset/:id/history" element={<AssetHistoryPage />} />
                  <Route path="/inventory/unit/:id" element={<UnitInventory />} />
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
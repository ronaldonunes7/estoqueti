import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QrCode, Camera, CheckCircle } from 'lucide-react'
import { QRScanner } from '../components/QRScanner'
import toast from 'react-hot-toast'

export const ReceiptConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  
  const movementId = searchParams.get('id')

  const handleQRCodeScan = (data: string) => {
    console.log('QR Code escaneado:', data)
    setScannedData(data)
    setShowScanner(false)
    toast.success('QR Code lido com sucesso!')
  }

  const handleScanError = (error: any) => {
    console.error('Erro no scanner:', error)
    toast.error('Erro ao acessar a câmera')
  }

  if (!movementId && !showScanner && !scannedData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Confirmar Recebimento
            </h3>
            <p className="text-gray-500 mb-6">
              Escaneie o QR Code da etiqueta de envio
            </p>
            
            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="h-5 w-5 mr-2" />
              Escanear QR Code
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showScanner) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Scanner QR Code
          </h3>
          
          <QRScanner
            onScan={handleQRCodeScan}
            onError={handleScanError}
          />
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowScanner(false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (scannedData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              QR Code Escaneado!
            </h3>
            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="text-sm text-gray-700 break-all">{scannedData}</p>
            </div>
            <button
              onClick={() => {
                setScannedData(null)
                setShowScanner(true)
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Escanear Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Confirmar Recebimento
        </h3>
        <p className="text-gray-500">
          ID da movimentação: {movementId}
        </p>
      </div>
    </div>
  )
}
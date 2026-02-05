import React, { useState, useEffect } from 'react'
import { QRScanner } from '../components/QRScanner'
import QRCode from 'qrcode'
import { QrCode, TestTube, CheckCircle, AlertCircle } from 'lucide-react'

export const TestQR: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [testQRCode, setTestQRCode] = useState<string>('')
  const [scanError, setScanError] = useState<string | null>(null)

  // Gerar QR Code de teste
  useEffect(() => {
    const generateTestQR = async () => {
      try {
        const testUrl = `${window.location.origin}/confirmar-recebimento?id=123`
        const qrDataUrl = await QRCode.toDataURL(testUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setTestQRCode(qrDataUrl)
      } catch (error) {
        console.error('Erro ao gerar QR de teste:', error)
      }
    }

    generateTestQR()
  }, [])

  const handleScan = (data: string) => {
    console.log('QR Code escaneado:', data)
    setScannedData(data)
    setShowScanner(false)
    setScanError(null)
  }

  const handleScanError = (error: any) => {
    console.error('Erro no scanner:', error)
    setScanError(error.message || 'Erro desconhecido no scanner')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <TestTube className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Teste do Scanner QR Code
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR Code de Teste */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code de Teste
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              {testQRCode ? (
                <div>
                  <img 
                    src={testQRCode} 
                    alt="QR Code de Teste" 
                    className="mx-auto mb-4"
                  />
                  <p className="text-sm text-gray-600">
                    Escaneie este QR Code com o scanner ao lado
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    URL: {window.location.origin}/confirmar-recebimento?id=123
                  </p>
                </div>
              ) : (
                <div className="py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Gerando QR Code...</p>
                </div>
              )}
            </div>
          </div>

          {/* Scanner */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Scanner QR Code
            </h2>
            
            {!showScanner ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <button
                  onClick={() => setShowScanner(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  Iniciar Scanner
                </button>
                
                {scanError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-red-700">{scanError}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <QRScanner 
                  onScan={handleScan}
                  onError={handleScanError}
                />
                
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowScanner(false)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Parar Scanner
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultado do Scan */}
        {scannedData && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-medium text-green-900">
                QR Code Escaneado com Sucesso!
              </h3>
            </div>
            
            <div className="bg-white rounded p-3 mt-3">
              <p className="text-sm font-medium text-gray-900 mb-1">Dados escaneados:</p>
              <p className="text-sm text-gray-700 break-all">{scannedData}</p>
            </div>
            
            <div className="mt-3">
              <button
                onClick={() => {
                  setScannedData(null)
                  setScanError(null)
                }}
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                Limpar resultado
              </button>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Como testar:
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Clique em "Iniciar Scanner" à direita</li>
            <li>Permita o acesso à câmera quando solicitado</li>
            <li>Aponte a câmera para o QR Code de teste à esquerda</li>
            <li>O scanner deve detectar automaticamente o código</li>
            <li>Verifique se os dados foram lidos corretamente</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
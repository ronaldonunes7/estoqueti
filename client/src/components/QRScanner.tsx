import React, { useRef, useEffect, useState } from 'react'
import QrScanner from 'qr-scanner'
import { Camera, X, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface QRScannerProps {
  onClose: () => void
  onScanSuccess?: (result: string) => void
}

export const QRScanner: React.FC<QRScannerProps> = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanner, setScanner] = useState<QrScanner | null>(null)
  const [hasCamera, setHasCamera] = useState<boolean>(true)
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const navigate = useNavigate()

  useEffect(() => {
    initializeScanner()
    return () => {
      if (scanner) {
        scanner.destroy()
      }
    }
  }, [])

  const initializeScanner = async () => {
    if (!videoRef.current) return

    try {
      // Verificar se há câmeras disponíveis
      const cameras = await QrScanner.listCameras(true)
      if (cameras.length === 0) {
        setHasCamera(false)
        return
      }

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // Câmera traseira em dispositivos móveis
        }
      )

      setScanner(qrScanner)
      await qrScanner.start()
      setIsScanning(true)
    } catch (error) {
      console.error('Erro ao inicializar scanner:', error)
      setHasCamera(false)
      toast.error('Não foi possível acessar a câmera')
    }
  }

  const handleScanResult = (data: string) => {
    console.log('QR Code escaneado:', data)
    
    try {
      // Verificar se é uma URL do nosso sistema
      const url = new URL(data)
      const pathname = url.pathname
      
      // Extrair ID do ativo da URL: /inventory/asset/{id}/history
      const assetMatch = pathname.match(/\/inventory\/asset\/(\d+)\/history/)
      
      if (assetMatch) {
        const assetId = assetMatch[1]
        toast.success('QR Code lido com sucesso!')
        
        // Redirecionar para transferência com ativo pré-selecionado
        navigate(`/transfer?asset_id=${assetId}`)
        onClose()
      } else {
        toast.error('QR Code não reconhecido como um ativo do sistema')
      }
    } catch (error) {
      // Se não for uma URL válida, tentar como ID direto
      if (/^\d+$/.test(data)) {
        toast.success('QR Code lido com sucesso!')
        navigate(`/transfer?asset_id=${data}`)
        onClose()
      } else {
        toast.error('QR Code inválido')
      }
    }

    if (onScanSuccess) {
      onScanSuccess(data)
    }
  }

  const handleManualInput = () => {
    const assetId = prompt('Digite o ID do ativo ou tag de patrimônio:')
    if (assetId) {
      navigate(`/transfer?asset_id=${assetId}`)
      onClose()
    }
  }

  if (!hasCamera) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Câmera Não Disponível
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Não foi possível acessar a câmera do dispositivo. Isso pode acontecer por:
            </p>
            <ul className="text-sm text-gray-500 text-left mb-6 space-y-1">
              <li>• Permissão de câmera negada</li>
              <li>• Navegador não suporta acesso à câmera</li>
              <li>• Dispositivo não possui câmera</li>
              <li>• Conexão não é HTTPS (necessário para câmera)</li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Fechar
              </button>
              <button
                onClick={handleManualInput}
                className="btn btn-primary flex-1"
              >
                Inserir Manualmente
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Scanner QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-lg"
            playsInline
          />
          
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-primary-500 w-48 h-48 rounded-lg opacity-50"></div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Posicione o QR Code dentro da área destacada para fazer a leitura
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleManualInput}
              className="btn btn-primary flex-1"
            >
              Inserir Manualmente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
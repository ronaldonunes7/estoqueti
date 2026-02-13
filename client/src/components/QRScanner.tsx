import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import jsQR from 'jsqr'

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: any) => void
}

interface ScannerState {
  isInitializing: boolean
  isScanning: boolean
  hasCamera: boolean
  error: string | null
  lastScanTime: number
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()
  
  const [state, setState] = useState<ScannerState>({
    isInitializing: true,
    isScanning: false,
    hasCamera: true,
    error: null,
    lastScanTime: 0
  })

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isInitializing: true, error: null }))

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API não suportada neste navegador')
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        setState(prev => ({
          ...prev,
          isInitializing: false,
          isScanning: true,
          hasCamera: true
        }))
        
        startScanning()
      }
    } catch (error: any) {
      console.error('Erro ao inicializar câmera:', error)
      
      let errorMessage = 'Erro desconhecido ao acessar câmera'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada. Permita o acesso à câmera e recarregue a página.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Câmera não suportada neste navegador.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Câmera está sendo usada por outro aplicativo.'
      }
      
      setState(prev => ({
        ...prev,
        isInitializing: false,
        hasCamera: false,
        error: errorMessage
      }))
      
      if (onError) {
        onError(error)
      }
    }
  }, [onError])

  // QR Code detection using canvas and jsQR
  const detectQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !state.isScanning) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectQRCode)
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Get image data for QR detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
      // Detect QR code using jsQR
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })
      
      if (qrCode && qrCode.data) {
        console.log('QR Code detectado:', qrCode.data)
        handleScanSuccess(qrCode.data)
        return // Stop scanning after successful detection
      }
      
      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(detectQRCode)
    } catch (error) {
      console.error('Erro na detecção de QR:', error)
      animationFrameRef.current = requestAnimationFrame(detectQRCode)
    }
  }, [state.isScanning, handleScanSuccess])

  // Start scanning process
  const startScanning = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(detectQRCode)
  }, [detectQRCode])

  // Handle successful scan
  const handleScanSuccess = useCallback((data: string) => {
    const now = Date.now()
    
    // Prevent duplicate scans within 2 seconds
    if (now - state.lastScanTime < 2000) {
      return
    }

    setState(prev => ({ ...prev, lastScanTime: now }))
    
    // Provide haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(200)
    }
    
    onScan(data)
  }, [onScan, state.lastScanTime])

  // Initialize on mount
  useEffect(() => {
    initializeCamera()
    return cleanup
  }, [initializeCamera, cleanup])

  // Render loading state
  if (state.isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Inicializando Câmera
        </h3>
        <p className="text-sm text-gray-600">
          Aguarde enquanto acessamos sua câmera...
        </p>
      </div>
    )
  }

  // Render error state
  if (!state.hasCamera || state.error) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Câmera Não Disponível
        </h3>
        <p className="text-gray-600 mb-4">
          {state.error || 'Não foi possível acessar a câmera do dispositivo.'}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Possíveis soluções:
          </h4>
          <ul className="text-sm text-gray-600 text-left space-y-1">
            <li>• Permita o acesso à câmera quando solicitado</li>
            <li>• Verifique se outro aplicativo não está usando a câmera</li>
            <li>• Recarregue a página e tente novamente</li>
            <li>• Use HTTPS (necessário para acesso à câmera)</li>
          </ul>
        </div>
        
        <button
          onClick={initializeCamera}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Camera className="h-4 w-4 mr-2" />
          Tentar Novamente
        </button>
      </div>
    )
  }

  // Render scanner
  return (
    <div className="relative">
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-64 bg-black rounded-lg object-cover"
        playsInline
        muted
      />
      
      {/* Hidden canvas for QR detection */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Scanning overlay */}
      {state.isScanning && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Scanning frame */}
          <div className="relative">
            <div className="border-2 border-blue-500 w-48 h-48 rounded-lg opacity-70">
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
            
            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-lg">
              <div className="absolute w-full h-0.5 bg-blue-500 animate-pulse" 
                   style={{ 
                     animation: 'scan 2s linear infinite',
                     top: '50%'
                   }}>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            Scanner Ativo
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Posicione o QR Code dentro da área destacada
        </p>
        
        {/* Debug info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Resolução: {videoRef.current?.videoWidth || 0} x {videoRef.current?.videoHeight || 0}</div>
          <div>Status: {state.isScanning ? 'Escaneando...' : 'Parado'}</div>
        </div>
      </div>
      
      {/* Custom CSS for scanning animation */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  )
}
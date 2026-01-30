import React, { useRef } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Download, QrCode } from 'lucide-react'
import { Asset } from '../types'

interface QRCodeGeneratorProps {
  asset: Asset
  onClose: () => void
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ asset, onClose }) => {
  const labelRef = useRef<HTMLDivElement>(null)
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')

  React.useEffect(() => {
    generateQRCode()
  }, [asset])

  const generateQRCode = async () => {
    try {
      // URL direta para o histórico do ativo
      const assetUrl = `${window.location.origin}/inventory/asset/${asset.id}/history`
      
      const qrCodeDataUrl = await QRCode.toDataURL(assetUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeUrl(qrCodeDataUrl)
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
    }
  }

  const downloadLabel = async () => {
    if (!labelRef.current) return

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      })

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [80, 50] // Tamanho da etiqueta: 80mm x 50mm
      })

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, 80, 50)
      
      const fileName = `etiqueta-${asset.patrimony_tag || asset.id}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error)
    }
  }

  const downloadQROnly = async () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `qrcode-${asset.patrimony_tag || asset.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Gerar Etiqueta do Ativo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Preview da Etiqueta */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Preview da Etiqueta</h3>
          <div className="flex justify-center">
            <div
              ref={labelRef}
              className="bg-white border-2 border-gray-300 p-4 flex items-center gap-4"
              style={{ width: '320px', height: '200px' }}
            >
              {/* QR Code à esquerda */}
              <div className="flex-shrink-0">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                )}
              </div>

              {/* Informações do ativo à direita */}
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-gray-900 mb-2 truncate">
                  {asset.name}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Tag:</span> {asset.patrimony_tag}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Série:</span> {asset.serial_number}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Categoria:</span> {asset.category}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Sistema de Inventário TI
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do QR Code */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Informações do QR Code</h4>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">URL:</span> {window.location.origin}/inventory/asset/{asset.id}/history
          </p>
          <p className="text-xs text-gray-500">
            Ao escanear este QR Code, o usuário será direcionado diretamente para o histórico completo deste ativo.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={downloadQROnly}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            QR Code PNG
          </button>
          <button
            onClick={downloadLabel}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Etiqueta PDF
          </button>
        </div>
      </div>
    </div>
  )
}
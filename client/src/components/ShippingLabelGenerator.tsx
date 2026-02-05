import React, { useState } from 'react'
import { Printer, Package, MapPin, QrCode, Download, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'

interface ShippingLabelProps {
  movementId: number
  assetName: string
  patrimonyTag?: string
  serialNumber?: string
  destinationStore: string
  destinationCity: string
  quantity: number
  responsibleTechnician: string
  onClose: () => void
}

export const ShippingLabelGenerator: React.FC<ShippingLabelProps> = ({
  movementId,
  assetName,
  patrimonyTag,
  serialNumber,
  destinationStore,
  destinationCity,
  quantity,
  responsibleTechnician,
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateShippingLabel = async () => {
    try {
      setIsGenerating(true)
      
      // URL para confirmação de recebimento (Single Source of Truth)
      const confirmationUrl = `${window.location.origin}/confirmar-recebimento?id=${movementId}`
      
      // Gerar QR Code com configurações otimizadas
      const qrCodeDataUrl = await QRCode.toDataURL(confirmationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' // Melhor balance entre tamanho e correção de erro
      })

      // Configurações do PDF seguindo padrões de design
      const pdfConfig = {
        orientation: 'portrait' as const,
        unit: 'mm' as const,
        format: [80, 120] as [number, number] // Formato otimizado 8x12cm
      }

      const pdf = new jsPDF(pdfConfig)

      // Aplicar layout seguindo Design System
      await renderPDFContent(pdf, {
        movementId,
        assetName,
        patrimonyTag,
        serialNumber,
        destinationStore,
        destinationCity,
        quantity,
        responsibleTechnician,
        qrCodeDataUrl,
        confirmationUrl
      })

      // Download com nomenclatura padronizada
      const fileName = `etiqueta-envio-${movementId}-${Date.now()}.pdf`
      pdf.save(fileName)
      
      toast.success('Etiqueta de envio gerada com sucesso!')
      
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error)
      toast.error('Erro ao gerar etiqueta de envio')
    } finally {
      setIsGenerating(false)
    }
  }

  // Função auxiliar para renderização do PDF (Separation of Concerns)
  const renderPDFContent = async (pdf: any, data: any) => {
    const { 
      movementId, 
      assetName, 
      patrimonyTag, 
      serialNumber, 
      destinationStore, 
      destinationCity, 
      quantity, 
      responsibleTechnician, 
      qrCodeDataUrl, 
      confirmationUrl 
    } = data

    // Header seguindo Design Tokens
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('ETIQUETA DE ENVIO', 40, 12, { align: 'center' })
    
    // Linha separadora
    pdf.setLineWidth(0.3)
    pdf.line(5, 16, 75, 16)

    // Informações de rastreamento
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    const currentDate = new Date()
    const dateStr = currentDate.toLocaleDateString('pt-BR')
    const timeStr = currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    
    pdf.text(`ID: #${movementId}`, 5, 22)
    pdf.text(`Data: ${dateStr} ${timeStr}`, 45, 22)

    // Seção PRODUTO com tipografia hierárquica
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('PRODUTO:', 5, 30)
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    
    // Nome do produto com quebra de linha responsiva
    const maxWidth = 70
    const productLines = pdf.splitTextToSize(assetName, maxWidth)
    pdf.text(productLines, 5, 35)
    
    let currentY = 35 + (productLines.length * 4)
    
    // Informações técnicas organizadas
    if (patrimonyTag) {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Patrimônio:', 5, currentY + 5)
      pdf.setFont('helvetica', 'normal')
      pdf.text(patrimonyTag, 25, currentY + 5)
    }
    
    if (serialNumber) {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Serial:', 45, currentY + 5)
      pdf.setFont('helvetica', 'normal')
      const shortSerial = serialNumber.length > 12 ? serialNumber.substring(0, 12) + '...' : serialNumber
      pdf.text(shortSerial, 55, currentY + 5)
      currentY += 5
    }
    
    // Status e quantidade
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Qtd:', 5, currentY + 8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(quantity.toString(), 15, currentY + 8)
    
    pdf.setFont('helvetica', 'bold')
    pdf.text('Status:', 35, currentY + 8)
    pdf.setFont('helvetica', 'normal')
    pdf.text('EM TRÂNSITO', 50, currentY + 8)

    // Seção DESTINO
    currentY += 15
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DESTINO:', 5, currentY)
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const storeLines = pdf.splitTextToSize(destinationStore, maxWidth)
    pdf.text(storeLines, 5, currentY + 4)
    
    pdf.setFontSize(8)
    pdf.text(destinationCity, 5, currentY + 4 + (storeLines.length * 4) + 3)

    // QR Code centralizado e otimizado
    const qrY = currentY + 20
    pdf.addImage(qrCodeDataUrl, 'PNG', 20, qrY, 40, 40)
    
    // Instruções claras
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'italic')
    pdf.text('Escaneie para confirmar recebimento', 40, qrY + 45, { align: 'center' })
    
    // Rodapé com informações de auditoria
    const footerY = qrY + 52
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Responsável: ${responsibleTechnician}`, 5, footerY)
    
    // URL para acesso manual (fallback)
    const shortUrl = confirmationUrl.replace('http://', '').replace('https://', '')
    pdf.text('URL: ' + shortUrl, 5, footerY + 4)
    
    // Código de barras simples para rastreamento
    pdf.setFont('helvetica', 'bold')
    pdf.text(`*${movementId}*`, 40, footerY + 8, { align: 'center' })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Gerar Etiqueta de Envio
              </h3>
              <div className="mt-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{assetName}</span>
                  </div>
                  
                  {patrimonyTag && (
                    <div className="text-sm text-gray-600">
                      Patrimônio: {patrimonyTag}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{destinationStore} - {destinationCity}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Quantidade: {quantity}
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <QrCode className="h-4 w-4 inline mr-1" />
                    A etiqueta conterá um QR Code único para confirmação de recebimento na loja de destino.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={generateShippingLabel}
              disabled={isGenerating}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Gerar Etiqueta
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
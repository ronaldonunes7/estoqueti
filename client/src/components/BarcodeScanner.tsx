import React, { useState, useRef, useEffect } from 'react'
import { Scan, Check, X, Package, Plus, Minus, AlertTriangle } from 'lucide-react'
import { useMutation } from 'react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Asset } from '../types'

interface BarcodeScannerProps {
  onAssetFound?: (asset: Asset) => void
  onQuantitySelect?: (asset: Asset, quantity: number) => void
  autoFocus?: boolean
  placeholder?: string
  movementType?: 'Entrada' | 'Saída'
  customValidation?: (asset: Asset) => { isValid: boolean; errorMessage?: string }
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onAssetFound,
  onQuantitySelect,
  autoFocus = true,
  placeholder = "Escaneie ou digite o código de barras...",
  movementType = 'Saída',
  customValidation
}) => {
  const [barcode, setBarcode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [quantityError, setQuantityError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus no input quando o componente monta
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Auto-focus e auto-select no campo de quantidade quando o modal abre
  useEffect(() => {
    if (showQuantityModal && quantityInputRef.current) {
      // Usar timeout para garantir que o modal esteja totalmente renderizado
      const timer = setTimeout(() => {
        if (quantityInputRef.current) {
          quantityInputRef.current.focus()
          quantityInputRef.current.select() // Selecionar o texto "1" para sobrescrever
        }
      }, 150) // Aumentar o delay para garantir renderização completa
      
      return () => clearTimeout(timer)
    }
  }, [showQuantityModal])

  const searchAssetMutation = useMutation(
    async (barcodeValue: string) => {
      const response = await api.get(`/assets/barcode/${barcodeValue}`)
      return response.data
    },
    {
      onSuccess: (asset: Asset) => {
        setIsScanning(false)
        
        // VALIDAÇÃO CUSTOMIZADA: Se fornecida, executar antes de processar
        if (customValidation) {
          const validation = customValidation(asset)
          if (!validation.isValid) {
            toast.error(validation.errorMessage || 'Item não pode ser processado', {
              duration: 5000,
              icon: '🚫'
            })
            
            // Limpar input e focar novamente
            setBarcode('')
            setTimeout(() => {
              inputRef.current?.focus()
            }, 100)
            return
          }
        }
        
        // Feedback visual de sucesso
        toast.success(`✅ ${asset.name} encontrado!`, {
          duration: 2000,
          icon: '📦'
        })

        // CORREÇÃO: Interrupção do fluxo automático para insumos
        if (asset.asset_type === 'consumable') {
          // NÃO chamar onQuantitySelect aqui - apenas setar o estado e abrir modal
          setSelectedAsset(asset)
          setQuantity(1)
          setQuantityError('')
          setShowQuantityModal(true)
          // O modal será responsável por chamar onQuantitySelect quando confirmado
        } else {
          // Para ativos únicos, processar imediatamente
          onAssetFound?.(asset)
          // Limpar e focar no scanner
          setBarcode('')
          setTimeout(() => {
            inputRef.current?.focus()
          }, 100)
        }

        // Para insumos, limpar o input mas não focar ainda (modal está aberto)
        if (asset.asset_type === 'consumable') {
          setBarcode('')
        }
      },
      onError: (error: any) => {
        setIsScanning(false)
        
        // Feedback visual e sonoro de erro
        toast.error(
          error.response?.data?.message || 'Código de barras não encontrado',
          {
            duration: 3000,
            icon: '❌'
          }
        )

        // Limpar input e focar novamente
        setBarcode('')
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }
    }
  )

  const handleScan = (value: string) => {
    if (!value.trim()) return

    setIsScanning(true)
    searchAssetMutation.mutate(value.trim())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Prevenir default para evitar submissão prematura do formulário
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      
      // Se o modal estiver aberto, não processar o scan
      if (showQuantityModal) {
        return
      }
      
      handleScan(barcode)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevenir default adicional para Enter
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  const validateQuantity = (qty: number): boolean => {
    if (qty <= 0) {
      setQuantityError('Quantidade deve ser maior que 0')
      return false
    }

    if (movementType === 'Saída' && selectedAsset && qty > selectedAsset.stock_quantity) {
      setQuantityError(`Estoque insuficiente! Disponível: ${selectedAsset.stock_quantity}`)
      // Feedback sonoro de erro (se suportado pelo navegador)
      if ('vibrate' in navigator) {
        navigator.vibrate(200)
      }
      return false
    }

    setQuantityError('')
    return true
  }

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
    validateQuantity(newQuantity)
  }

  const handleQuantityKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleQuantityConfirm()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleQuantityCancel()
    }
  }

  const handleQuantityConfirm = () => {
    // Validação final antes de processar
    if (!selectedAsset) {
      toast.error('Nenhum produto selecionado')
      return
    }

    if (quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }

    if (!validateQuantity(quantity)) {
      return // validateQuantity já mostra o erro
    }

    // CORREÇÃO: Esta é a única função responsável por chamar a API de movimentação
    console.log('Processando movimentação:', {
      productId: selectedAsset.id,
      productName: selectedAsset.name,
      quantity: quantity,
      movementType: movementType
    })

    // Chamar o callback que processará a movimentação
    onQuantitySelect?.(selectedAsset, quantity)
    
    // Limpar estados e fechar modal
    setShowQuantityModal(false)
    setSelectedAsset(null)
    setQuantity(1)
    setQuantityError('')
    
    // CORREÇÃO: Focar imediatamente no scanner após sucesso
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.value = '' // Garantir que o campo esteja limpo
      }
    }, 100)
  }

  const handleQuantityCancel = () => {
    // CORREÇÃO: Limpar estado do produto selecionado para evitar dados do item anterior
    console.log('Modal cancelado - limpando estados')
    
    setShowQuantityModal(false)
    setSelectedAsset(null) // Importante: limpar para evitar conflitos
    setQuantity(1)
    setQuantityError('')
    
    // Focar imediatamente no scanner
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.value = '' // Garantir que o campo esteja limpo
      }
    }, 100)
  }

  // Função para lidar com clique fora do modal ou ESC
  const handleModalClose = () => {
    handleQuantityCancel()
  }

  const incrementQuantity = () => {
    const newQuantity = quantity + 1
    if (!selectedAsset || newQuantity <= selectedAsset.stock_quantity || movementType === 'Entrada') {
      handleQuantityChange(newQuantity)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1)
    }
  }

  return (
    <>
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isScanning ? (
              <div className="animate-spin">
                <Scan className="h-5 w-5 text-primary-500" />
              </div>
            ) : (
              <Scan className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isScanning || showQuantityModal}
            className={`
              block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-gray-50 disabled:cursor-not-allowed
              text-lg font-mono
              ${isScanning ? 'bg-yellow-50 border-yellow-300' : ''}
              ${showQuantityModal ? 'bg-blue-50 border-blue-300' : ''}
            `}
          />
          
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {barcode && !isScanning && !showQuantityModal && (
              <button
                onClick={() => handleScan(barcode)}
                className="text-primary-600 hover:text-primary-800 transition-colors"
                title="Buscar"
              >
                <Check className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Indicador de status */}
        <div className="mt-2 flex items-center gap-2 text-sm">
          {isScanning ? (
            <div className="flex items-center gap-2 text-yellow-600">
              <div className="animate-pulse">
                <Package className="h-4 w-4" />
              </div>
              <span>Buscando produto...</span>
            </div>
          ) : showQuantityModal ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Package className="h-4 w-4" />
              <span>Aguardando quantidade...</span>
            </div>
          ) : (
            <div className="text-gray-500">
              <span>💡 Dica: Use o leitor ou digite o código e pressione Enter</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Quantidade Melhorado */}
      {showQuantityModal && selectedAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay com tratamento de clique fora */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={handleModalClose}
            />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                {/* Header com informações do produto */}
                <div className="flex items-start mb-6">
                  <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <Package className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {selectedAsset.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedAsset.brand_model}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        Estoque atual: <span className="font-medium text-gray-900">{selectedAsset.stock_quantity}</span>
                      </span>
                      {selectedAsset.min_stock > 0 && (
                        <span className="text-gray-500">
                          Mínimo: <span className="font-medium text-gray-900">{selectedAsset.min_stock}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Campo de quantidade com controles */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quantidade para {movementType}
                  </label>
                  
                  <div className="flex items-center justify-center gap-4">
                    {/* Botão - */}
                    <button
                      type="button"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-6 w-6 text-gray-600" />
                    </button>
                    
                    {/* Input de quantidade */}
                    <input
                      ref={quantityInputRef}
                      type="number"
                      min="1"
                      max={movementType === 'Saída' ? selectedAsset.stock_quantity : undefined}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      onKeyPress={handleQuantityKeyPress}
                      className={`w-24 text-center text-2xl font-bold py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        quantityError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    
                    {/* Botão + */}
                    <button
                      type="button"
                      onClick={incrementQuantity}
                      disabled={movementType === 'Saída' && quantity >= selectedAsset.stock_quantity}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-6 w-6 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Erro de quantidade */}
                  {quantityError && (
                    <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{quantityError}</span>
                    </div>
                  )}
                  
                  {/* Informações adicionais */}
                  {movementType === 'Saída' && selectedAsset.stock_quantity <= selectedAsset.min_stock && (
                    <div className="mt-3 flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        ⚠️ Estoque baixo! Após esta saída restará: {selectedAsset.stock_quantity - quantity} unidades
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3">
                <button
                  onClick={handleQuantityCancel}
                  className="flex-1 btn btn-secondary"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar (Esc)
                </button>
                <button
                  onClick={handleQuantityConfirm}
                  disabled={quantity <= 0 || !!quantityError}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar (Enter)
                </button>
              </div>
              
              {/* Dica de teclado */}
              <div className="bg-blue-50 px-6 py-2 text-center">
                <p className="text-xs text-blue-600">
                  💡 Use as teclas Enter para confirmar ou Esc para cancelar
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
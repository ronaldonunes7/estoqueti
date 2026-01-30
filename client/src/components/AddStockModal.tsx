import React, { useState, useEffect, useRef } from 'react'
import { X, Package, Scan, Plus } from 'lucide-react'
import { Asset } from '../types'
import api from '../services/api'
import toast from 'react-hot-toast'

interface AddStockModalProps {
  isOpen: boolean
  onClose: () => void
  selectedAsset?: Asset | null
  onSuccess: () => void
  bipMode?: boolean
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  selectedAsset,
  onSuccess,
  bipMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Asset | null>(selectedAsset || null)
  const [quantity, setQuantity] = useState('')
  const [unitValue, setUnitValue] = useState('')
  const [document, setDocument] = useState('')
  const [supplier, setSupplier] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Asset[]>([])
  const [showSearch, setShowSearch] = useState(!selectedAsset)

  const quantityInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (selectedAsset) {
        setSelectedProduct(selectedAsset)
        setShowSearch(false)
        // Focus quantity input if asset is pre-selected (bip mode)
        setTimeout(() => quantityInputRef.current?.focus(), 100)
      } else {
        setSelectedProduct(null)
        setShowSearch(true)
        // Focus search input
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      setQuantity('')
      setUnitValue('')
      setDocument('')
      setSupplier('')
      setSearchTerm('')
      setSearchResults([])
    }
  }, [isOpen, selectedAsset])

  // Search products (only consumables)
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const searchProducts = async () => {
        try {
          const response = await api.get(`/assets?search=${encodeURIComponent(searchTerm)}&asset_type=consumable`)
          setSearchResults(response.data.assets || [])
        } catch (error) {
          console.error('Erro ao buscar produtos:', error)
        }
      }
      
      const debounceTimer = setTimeout(searchProducts, 300)
      return () => clearTimeout(debounceTimer)
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const handleProductSelect = (asset: Asset) => {
    setSelectedProduct(asset)
    setShowSearch(false)
    setSearchTerm('')
    setSearchResults([])
    // Focus quantity input after selection
    setTimeout(() => quantityInputRef.current?.focus(), 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      toast.error('Selecione um produto e informe uma quantidade válida')
      return
    }

    setLoading(true)
    
    try {
      await api.post('/assets/add-stock', {
        asset_id: selectedProduct.id,
        quantity: parseInt(quantity),
        unit_value: unitValue ? parseFloat(unitValue) : undefined,
        document: document.trim() || undefined,
        supplier: supplier.trim() || undefined
      })

      const newStock = selectedProduct.stock_quantity + parseInt(quantity)
      
      toast.success(
        `Estoque atualizado! ${selectedProduct.name} agora tem ${newStock} unidades`,
        { duration: 4000 }
      )
      
      onSuccess()
      
      if (bipMode) {
        // In bip mode, reset for next scan
        setSelectedProduct(null)
        setShowSearch(true)
        setQuantity('')
        setUnitValue('')
        setDocument('')
        setSupplier('')
        setTimeout(() => searchInputRef.current?.focus(), 100)
      } else {
        onClose()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar estoque')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      if (showSearch && searchResults.length === 1) {
        handleProductSelect(searchResults[0])
      } else if (selectedProduct && quantity) {
        handleSubmit(e as any)
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const projectedStock = selectedProduct && quantity 
    ? selectedProduct.stock_quantity + parseInt(quantity || '0')
    : selectedProduct?.stock_quantity || 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Adicionar Saldo ao Estoque</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Search */}
          {showSearch && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Produto (Nome ou Código de Barras)
              </label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Digite o nome ou escaneie o código..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Scan className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleProductSelect(asset)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-gray-500">
                        Estoque atual: {asset.stock_quantity} | {asset.barcode}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Product Info */}
          {selectedProduct && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-600">{selectedProduct.brand_model}</p>
                </div>
                {showSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null)
                      setShowSearch(true)
                      setTimeout(() => searchInputRef.current?.focus(), 100)
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Alterar
                  </button>
                )}
              </div>
              
              {/* Stock Info */}
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Saldo Atual:</span>
                  <span className="ml-1 font-medium">{selectedProduct.stock_quantity}</span>
                </div>
                {quantity && parseInt(quantity) > 0 && (
                  <div>
                    <span className="text-gray-500">Novo Saldo:</span>
                    <span className="ml-1 font-medium text-green-600">{projectedStock}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity Input */}
          {selectedProduct && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Quantidade a Adicionar *
              </label>
              <input
                ref={quantityInputRef}
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={handleKeyPress}
                min="1"
                placeholder="Ex: 50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* Unit Value Input */}
          {selectedProduct && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Valor Unitário (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  value={unitValue}
                  onChange={(e) => setUnitValue(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500">
                Atualize se o preço de compra mudou. Deixe vazio para manter o valor atual.
              </p>
            </div>
          )}

          {/* Document/Supplier Info */}
          {selectedProduct && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nota Fiscal
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="Ex: NF 12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Ex: Dell Inc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedProduct || !quantity || parseInt(quantity) <= 0 || loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Adicionar Estoque
                </>
              )}
            </button>
          </div>
        </form>

        {/* Keyboard Shortcuts Help */}
        <div className="px-6 pb-4 text-xs text-gray-500">
          <div className="flex gap-4">
            <span>Enter: Confirmar</span>
            <span>Esc: Cancelar</span>
            {bipMode && <span>🔄 Modo Bip Ativo</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
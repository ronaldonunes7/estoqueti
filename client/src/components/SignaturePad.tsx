import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  isOpen,
  onClose,
  onSave,
  title = "Assinatura Digital"
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen && sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
  }, [isOpen]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (sigCanvas.current && !isEmpty) {
      try {
        const signature = sigCanvas.current.toDataURL('image/png');
        onSave(signature);
        onClose();
      } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
        alert('Erro ao processar assinatura. Tente novamente.');
      }
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Assine no campo abaixo usando o dedo (touch) ou mouse:
            </p>
          </div>

          {/* Signature Canvas */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-4">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-48 cursor-crosshair',
                style: { touchAction: 'none' }
              }}
              backgroundColor="rgba(255,255,255,0)"
              penColor="black"
              minWidth={1}
              maxWidth={3}
              onBegin={handleBegin}
            />
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 mb-4 space-y-1">
            <p>• Use movimentos suaves para uma assinatura clara</p>
            <p>• Em dispositivos touch, use o dedo diretamente na tela</p>
            <p>• No desktop, use o mouse para desenhar a assinatura</p>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
              Limpar
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isEmpty}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isEmpty
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                type="button"
              >
                <Check className="w-4 h-4" />
                Confirmar Assinatura
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { X, FileText, Download, AlertCircle } from 'lucide-react';
import { ResponsibilityTermGenerator } from './ResponsibilityTermGenerator';
import axios from 'axios';

interface Asset {
  id: number;
  name: string;
  patrimony_tag?: string;
  serial_number?: string;
  status: string;
  brand_model?: string;
}

interface Movement {
  id: number;
  type: string;
  collaborator?: string;
  employee_name?: string;
  technician?: string;
  responsible_technician?: string;
  created_at: string;
  movement_date?: string;
  assets: Asset[];
  store_name?: string;
  destination?: string;
}

interface ResponsibilityTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: Movement | null;
}

interface ExistingTerm {
  id: number;
  term_number: string;
  recipient_name: string;
  recipient_cpf: string;
  created_at: string;
  pdf_blob: string | null;
  signature_data: string | null;
}

export const ResponsibilityTermModal: React.FC<ResponsibilityTermModalProps> = ({
  isOpen,
  onClose,
  movement
}) => {
  const [existingTerms, setExistingTerms] = useState<ExistingTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && movement) {
      loadExistingTerms();
    }
  }, [isOpen, movement]);

  const loadExistingTerms = async () => {
    if (!movement) return;

    setLoading(true);
    setError('');

    try {
      // Buscar movimentação completa com ativos
      const movementResponse = await axios.get(`/api/movements/${movement.id}/with-assets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Atualizar movimento com dados completos
      const completeMovement = movementResponse.data;
      
      // Buscar termos existentes
      const termsResponse = await axios.get(`/api/responsibility-terms/movement/${movement.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setExistingTerms(termsResponse.data);
      
      // Atualizar o movimento com dados completos se necessário
      if (completeMovement.assets && completeMovement.assets.length > 0) {
        // Aqui podemos atualizar o estado do movimento se necessário
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados da movimentação');
    } finally {
      setLoading(false);
    }
  };

  const handleTermGenerated = async (termNumber: string, pdfBlob: Blob) => {
    if (!movement) return;

    try {
      // Converter blob para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const termData = {
          termNumber,
          movementId: movement.id,
          recipientName: movement.collaborator || movement.employee_name || '',
          recipientCpf: '', // Será preenchido no formulário
          recipientEmail: '',
          recipientUnit: movement.store_name || movement.destination || 'Matriz',
          pdfBlob: base64Data
        };

        try {
          await axios.post('/api/responsibility-terms', termData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          // Recarregar lista de termos
          await loadExistingTerms();
          
          alert('Termo de responsabilidade salvo com sucesso!');
        } catch (error) {
          console.error('Erro ao salvar termo:', error);
          alert('Erro ao salvar termo no servidor');
        }
      };

      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      alert('Erro ao processar o PDF gerado');
    }
  };

  const downloadTerm = async (termId: number, termNumber: string) => {
    try {
      const response = await axios.get(`/api/responsibility-terms/${termId}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Termo_${termNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar termo:', error);
      alert('Erro ao baixar o termo');
    }
  };

  if (!isOpen || !movement) return null;

  // Preparar dados da movimentação para o gerador
  const movementForGenerator = {
    ...movement,
    collaborator: movement.collaborator || movement.employee_name || '',
    technician: movement.technician || movement.responsible_technician || '',
    created_at: movement.created_at || movement.movement_date || new Date().toISOString()
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Termo de Responsabilidade
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Movimentação #{movement.id} - {movement.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Termos Existentes */}
          {existingTerms.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Termos Existentes
              </h4>
              <div className="space-y-2">
                {existingTerms.map((term) => (
                  <div
                    key={term.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{term.term_number}</p>
                      <p className="text-xs text-gray-600">
                        {term.recipient_name} - {new Date(term.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {term.pdf_blob && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            PDF
                          </span>
                        )}
                        {term.signature_data && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Assinado
                          </span>
                        )}
                      </div>
                    </div>
                    {term.pdf_blob && (
                      <button
                        onClick={() => downloadTerm(term.id, term.term_number)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Baixar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações da Movimentação */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Detalhes da Movimentação</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Tipo:</span> {movement.type}
              </div>
              <div>
                <span className="font-medium text-blue-800">Data:</span>{' '}
                {new Date(movement.created_at || movement.movement_date || '').toLocaleDateString('pt-BR')}
              </div>
              <div>
                <span className="font-medium text-blue-800">Colaborador:</span>{' '}
                {movement.collaborator || movement.employee_name || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-blue-800">Técnico:</span>{' '}
                {movement.technician || movement.responsible_technician || 'N/A'}
              </div>
              {(movement.store_name || movement.destination) && (
                <div className="md:col-span-2">
                  <span className="font-medium text-blue-800">Destino:</span>{' '}
                  {movement.store_name || movement.destination}
                </div>
              )}
            </div>
          </div>

          {/* Lista de Ativos */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Ativos Envolvidos ({movement.assets?.length || 0})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {movement.assets?.map((asset, index) => (
                <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <span className="font-medium">{asset.name}</span>
                    {asset.brand_model && (
                      <span className="text-gray-600 ml-2">({asset.brand_model})</span>
                    )}
                  </div>
                  <div className="text-gray-600">
                    {asset.patrimony_tag || asset.serial_number || 'N/A'}
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-4">
                  Nenhum ativo encontrado
                </div>
              )}
            </div>
          </div>

          {/* Aviso para movimentações sem colaborador */}
          {!movementForGenerator.collaborator && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Atenção</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esta movimentação não possui um colaborador definido. 
                    Você precisará preencher os dados do recebedor no formulário abaixo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gerador de Termo */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Gerar Novo Termo</h4>
            <ResponsibilityTermGenerator
              movement={movementForGenerator}
              onTermGenerated={handleTermGenerated}
            />
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Carregando...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
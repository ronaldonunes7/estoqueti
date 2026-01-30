import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, User, Eye } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ResponsibilityTerm {
  id: number;
  term_number: string;
  movement_id: number;
  recipient_name: string;
  recipient_cpf: string;
  recipient_email?: string;
  recipient_unit: string;
  signature_data?: string;
  pdf_blob?: string;
  created_at: string;
  created_by_username?: string;
  movement_type?: string;
  movement_employee?: string;
  movement_date?: string;
}

interface AssetTermsHistoryProps {
  assetId: number;
}

export const AssetTermsHistory: React.FC<AssetTermsHistoryProps> = ({ assetId }) => {
  const [terms, setTerms] = useState<ResponsibilityTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadTerms();
  }, [assetId]);

  const loadTerms = async () => {
    setLoading(true);
    setError('');

    try {
      // Buscar movimentações do ativo
      const movementsResponse = await axios.get(`/api/movements?asset_id=${assetId}&limit=100`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const movements = movementsResponse.data.movements || [];
      
      // Buscar termos para cada movimentação
      const termsPromises = movements.map(async (movement: any) => {
        try {
          const termsResponse = await axios.get(`/api/responsibility-terms/movement/${movement.id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          return termsResponse.data.map((term: ResponsibilityTerm) => ({
            ...term,
            movement_type: movement.type,
            movement_employee: movement.employee_name,
            movement_date: movement.movement_date
          }));
        } catch (error) {
          console.error(`Erro ao buscar termos da movimentação ${movement.id}:`, error);
          return [];
        }
      });

      const allTermsArrays = await Promise.all(termsPromises);
      const allTerms = allTermsArrays.flat();
      
      // Ordenar por data de criação (mais recente primeiro)
      allTerms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTerms(allTerms);
    } catch (error) {
      console.error('Erro ao carregar termos:', error);
      setError('Erro ao carregar histórico de termos');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Termos de Responsabilidade
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando termos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Termos de Responsabilidade
        </h3>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadTerms}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Termos de Responsabilidade ({terms.length})
      </h3>

      {terms.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum termo de responsabilidade encontrado para este ativo.</p>
          <p className="text-sm text-gray-400 mt-1">
            Termos são gerados quando há saídas ou transferências do ativo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {terms.map((term) => (
            <div
              key={term.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{term.term_number}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      term.movement_type === 'Saída' 
                        ? 'bg-red-100 text-red-800'
                        : term.movement_type === 'Transferência'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {term.movement_type}
                    </span>
                    {term.signature_data && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Assinado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>
                        <strong>Recebedor:</strong> {term.recipient_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        <strong>Data:</strong> {format(new Date(term.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <div>
                      <strong>CPF/Matrícula:</strong> {term.recipient_cpf}
                    </div>
                    <div>
                      <strong>Unidade:</strong> {term.recipient_unit}
                    </div>
                    {term.recipient_email && (
                      <div className="md:col-span-2">
                        <strong>E-mail:</strong> {term.recipient_email}
                      </div>
                    )}
                    {term.movement_employee && (
                      <div className="md:col-span-2">
                        <strong>Movimentação:</strong> {term.movement_employee} 
                        {term.movement_date && (
                          <span className="text-gray-500 ml-2">
                            em {format(new Date(term.movement_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    )}
                    {term.created_by_username && (
                      <div className="md:col-span-2">
                        <strong>Criado por:</strong> {term.created_by_username}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {term.pdf_blob && (
                    <button
                      onClick={() => downloadTerm(term.id, term.term_number)}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      title="Baixar PDF do termo"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
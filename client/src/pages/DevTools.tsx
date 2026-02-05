import React, { useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

interface DatabaseStatus {
  users: { count: number }
  assets: { count: number }
  stores: { count: number }
  movements: { count: number }
  external_report_links: { count: number }
}

export const DevTools: React.FC = () => {
  const [confirmReset, setConfirmReset] = useState(false)

  // Query para status do banco
  const { data: status, isLoading, refetch } = useQuery<{ database_status: DatabaseStatus }>(
    'database-status',
    async () => {
      const response = await api.get('/dev/database-status')
      return response.data
    },
    {
      refetchInterval: 5000 // Atualizar a cada 5 segundos
    }
  )

  // Mutation para reset do banco
  const resetMutation = useMutation(
    async () => {
      const response = await api.post('/dev/reset-database')
      return response.data
    },
    {
      onSuccess: (data) => {
        toast.success('Reset do banco concluído com sucesso!')
        setConfirmReset(false)
        refetch()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro durante reset')
        setConfirmReset(false)
      }
    }
  )

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    
    resetMutation.mutate()
  }

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Ferramentas de desenvolvimento não disponíveis em produção</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            Ferramentas de Desenvolvimento
          </h1>
          <p className="text-gray-600 mt-2">
            Utilitários para desenvolvimento e testes do sistema
          </p>
        </div>

        {/* Status do Banco */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                Status do Banco de Dados
              </h2>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                  </div>
                ))}
              </div>
            ) : status ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Usuários</p>
                  <p className="text-2xl font-bold text-blue-900">{status.database_status.users?.count || 0}</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Ativos</p>
                  <p className="text-2xl font-bold text-green-900">{status.database_status.assets?.count || 0}</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-600">Lojas</p>
                  <p className="text-2xl font-bold text-purple-900">{status.database_status.stores?.count || 0}</p>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-600">Movimentações</p>
                  <p className="text-2xl font-bold text-yellow-900">{status.database_status.movements?.count || 0}</p>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm font-medium text-indigo-600">Links Externos</p>
                  <p className="text-2xl font-bold text-indigo-900">{status.database_status.external_report_links?.count || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">Erro ao carregar status do banco</p>
              </div>
            )}
          </div>
        </div>

        {/* Limpeza Avançada */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-orange-500" />
              Limpeza Avançada do Banco
            </h2>
          </div>
          
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Sistema de Limpeza Premium</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    Acesse a página de limpeza avançada para controle granular sobre 
                    quais dados remover e quais preservar.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <a
                href="/database-cleanup"
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Limpeza Avançada
              </a>
              
              <button
                onClick={() => window.open('/database-cleanup', '_blank')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                Nova Aba
              </button>
            </div>
          </div>
        </div>

        {/* Reset do Banco */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Reset Completo do Banco
            </h2>
          </div>
          
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Atenção: Operação Irreversível</h3>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Remove TODOS os ativos, movimentações e lojas</li>
                    <li>• Reseta contadores de ID para começar do 1</li>
                    <li>• Preserva usuários e configurações do sistema</li>
                    <li>• Ideal para testes do zero</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 mb-2">Dados Preservados</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Usuários (admin, gerencia)</li>
                    <li>• Configurações do sistema</li>
                    <li>• Estrutura das tabelas</li>
                    <li>• Permissões e roles</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!confirmReset ? (
                <button
                  onClick={handleReset}
                  disabled={resetMutation.isLoading}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Resetar Banco de Dados
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    disabled={resetMutation.isLoading}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {resetMutation.isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Resetando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Confirmar Reset
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setConfirmReset(false)}
                    disabled={resetMutation.isLoading}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Informações</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Esta página só está disponível em ambiente de desenvolvimento</li>
                <li>• O reset pode ser executado via API: POST /api/dev/reset-database</li>
                <li>• Status do banco atualiza automaticamente a cada 5 segundos</li>
                <li>• Após o reset, o sistema criará 3 lojas de exemplo automaticamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
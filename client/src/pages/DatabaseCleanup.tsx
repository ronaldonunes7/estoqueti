import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Database, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

interface DatabaseStatus {
  counts: {
    movements: number
    assets: number
    stores: number
    users: number
  }
  tables: string[]
  canCleanup: boolean
  warnings: string[]
}

interface CleanupResult {
  cleaned: string[]
  preserved: string[]
  errors: string[]
  sequences_reset: string[]
  timestamp: string
  executed_by: string
}

export const DatabaseCleanup: React.FC = () => {
  const [confirmationCode, setConfirmationCode] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [cleanupOptions, setCleanupOptions] = useState({
    cleanMovements: true,
    cleanLogs: true,
    resetSequences: true,
    preserveAssets: true,
    preserveStores: true,
    preserveUsers: true
  })

  const queryClient = useQueryClient()

  // Query para status do banco
  const { data: status, isLoading, refetch } = useQuery<DatabaseStatus>(
    'database-status',
    async () => {
      const response = await api.get('/cleanup/status')
      return response.data.data
    },
    {
      refetchOnWindowFocus: false
    }
  )

  // Mutation para backup
  const backupMutation = useMutation(
    async () => {
      const response = await api.get('/cleanup/backup')
      return response.data
    },
    {
      onSuccess: (data) => {
        toast.success(`Backup criado: ${data.backup_name}`)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao criar backup')
      }
    }
  )

  // Mutation para limpeza
  const cleanupMutation = useMutation(
    async () => {
      const response = await api.post('/cleanup/execute', {
        ...cleanupOptions,
        confirmationCode
      })
      return response.data
    },
    {
      onSuccess: (data: { results: CleanupResult }) => {
        toast.success('Limpeza executada com sucesso!')
        setConfirmationCode('')
        refetch()
        queryClient.invalidateQueries('dashboard')
        queryClient.invalidateQueries('movements')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao executar limpeza')
      }
    }
  )

  // Mutation para reset demo
  const resetDemoMutation = useMutation(
    async () => {
      const response = await api.post('/cleanup/reset-demo-data')
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Sistema resetado para dados de demonstração!')
        refetch()
        queryClient.invalidateQueries('dashboard')
        queryClient.invalidateQueries('movements')
        queryClient.invalidateQueries('assets')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao resetar dados demo')
      }
    }
  )

  const canExecuteCleanup = confirmationCode === 'LIMPAR_BANCO_DADOS'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Limpeza do Banco de Dados
            </h1>
            <p className="text-gray-600">
              Sistema para resetar dados transacionais e preparar ambiente de teste
            </p>
          </div>
        </div>

        {/* Alerta de Segurança */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                ⚠️ OPERAÇÃO IRREVERSÍVEL
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Esta operação remove permanentemente dados do banco. 
                Certifique-se de fazer backup antes de prosseguir.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Atual */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Status Atual do Banco
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {status?.counts.movements || 0}
            </div>
            <div className="text-sm text-blue-700">Movimentações</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {status?.counts.assets || 0}
            </div>
            <div className="text-sm text-green-700">Ativos</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {status?.counts.stores || 0}
            </div>
            <div className="text-sm text-purple-700">Lojas</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {status?.counts.users || 0}
            </div>
            <div className="text-sm text-orange-700">Usuários</div>
          </div>
        </div>

        {status?.warnings && status.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <div className="text-sm text-yellow-800">
                {status.warnings.join(', ')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ações Rápidas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Reset Demo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Reset Rápido (Demo)
          </h3>
          
          <p className="text-gray-600 mb-4">
            Limpa apenas movimentações e reseta status dos ativos para "Disponível". 
            Ideal para demonstrações.
          </p>
          
          <button
            onClick={() => resetDemoMutation.mutate()}
            disabled={resetDemoMutation.isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resetDemoMutation.isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Reset para Demo
          </button>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Backup de Segurança
          </h3>
          
          <p className="text-gray-600 mb-4">
            Cria backup das tabelas principais antes de executar limpeza completa.
          </p>
          
          <button
            onClick={() => backupMutation.mutate()}
            disabled={backupMutation.isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {backupMutation.isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Criar Backup
          </button>
        </div>
      </div>

      {/* Limpeza Completa */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          Limpeza Completa do Banco
        </h3>

        {/* Opções Avançadas */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? '▼' : '▶'} Opções Avançadas
          </button>
        </div>

        {showAdvanced && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={cleanupOptions.cleanMovements}
                  onChange={(e) => setCleanupOptions(prev => ({
                    ...prev,
                    cleanMovements: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">Limpar Movimentações</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={cleanupOptions.cleanLogs}
                  onChange={(e) => setCleanupOptions(prev => ({
                    ...prev,
                    cleanLogs: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">Limpar Logs</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={cleanupOptions.resetSequences}
                  onChange={(e) => setCleanupOptions(prev => ({
                    ...prev,
                    resetSequences: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">Reset Auto-increment</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={cleanupOptions.preserveAssets}
                  onChange={(e) => setCleanupOptions(prev => ({
                    ...prev,
                    preserveAssets: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">Preservar Ativos</span>
              </label>
            </div>
          </div>
        )}

        {/* Código de Confirmação */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código de Confirmação
          </label>
          <input
            type="text"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="Digite: LIMPAR_BANCO_DADOS"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Digite exatamente: <code className="bg-gray-100 px-1 rounded">LIMPAR_BANCO_DADOS</code>
          </p>
        </div>

        {/* Botão de Execução */}
        <button
          onClick={() => cleanupMutation.mutate()}
          disabled={!canExecuteCleanup || cleanupMutation.isLoading}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {cleanupMutation.isLoading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Trash2 className="h-5 w-5" />
          )}
          {cleanupMutation.isLoading ? 'Executando Limpeza...' : 'EXECUTAR LIMPEZA COMPLETA'}
        </button>

        {!canExecuteCleanup && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Digite o código de confirmação para habilitar a limpeza
          </p>
        )}
      </div>

      {/* Resultado da Última Operação */}
      {cleanupMutation.data && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resultado da Limpeza
          </h3>
          
          <div className="space-y-3">
            {cleanupMutation.data.results.cleaned.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800">Tabelas Limpas:</h4>
                <ul className="text-sm text-green-700 ml-4">
                  {cleanupMutation.data.results.cleaned.map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {cleanupMutation.data.results.preserved.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-800">Tabelas Preservadas:</h4>
                <ul className="text-sm text-blue-700 ml-4">
                  {cleanupMutation.data.results.preserved.map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Executado em: {new Date(cleanupMutation.data.results.timestamp).toLocaleString('pt-BR')}
              por {cleanupMutation.data.results.executed_by}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
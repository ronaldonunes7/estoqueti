import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Store,
  MapPin,
  Phone,
  User,
  X,
  Eye,
  Package
} from 'lucide-react'
import api from '../services/api'
import { Store as StoreType, StoreFormData } from '../types'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const Stores: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreType | null>(null)
  const [page, setPage] = useState(1)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StoreFormData>()

  const { data: storesData, isLoading } = useQuery(
    ['stores', search, page],
    async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('page', page.toString())
      
      const response = await api.get(`/stores?${params}`)
      return response.data
    }
  )

  const createStoreMutation = useMutation(
    (data: StoreFormData) => api.post('/stores', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stores')
        setShowModal(false)
        reset()
        toast.success('Loja criada com sucesso!')
      }
    }
  )

  const updateStoreMutation = useMutation(
    ({ id, data }: { id: number; data: StoreFormData }) => api.put(`/stores/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stores')
        setShowModal(false)
        setEditingStore(null)
        reset()
        toast.success('Loja atualizada com sucesso!')
      }
    }
  )

  const deleteStoreMutation = useMutation(
    (id: number) => api.delete(`/stores/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stores')
        toast.success('Loja deletada com sucesso!')
      }
    }
  )

  const onSubmit = (data: StoreFormData) => {
    if (editingStore) {
      updateStoreMutation.mutate({ id: editingStore.id, data })
    } else {
      createStoreMutation.mutate(data)
    }
  }

  const handleEdit = (store: StoreType) => {
    setEditingStore(store)
    reset(store)
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja deletar esta loja?')) {
      deleteStoreMutation.mutate(id)
    }
  }

  const openModal = () => {
    setEditingStore(null)
    reset({
      name: '',
      address: '',
      city: '',
      responsible: ''
    })
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lojas / Unidades</h1>
          <p className="text-gray-600">Gerenciar destinos para transferência de ativos</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={openModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Loja
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nome, cidade ou responsável..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => {
              setSearch('')
              setPage(1)
            }}
            className="btn btn-secondary flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        </div>
      </div>

      {/* Lista de lojas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          storesData?.stores?.map((store: StoreType) => (
            <div key={store.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Store className="h-8 w-8 text-primary-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{store.name}</h3>
                    <p className="text-sm text-gray-500">ID: {store.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/inventory/unit/${store.id}`)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Ver Inventário"
                  >
                    <Package className="h-4 w-4" />
                  </button>
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => handleEdit(store)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(store.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p>{store.address}{store.number && `, ${store.number}`}</p>
                    {store.neighborhood && <p>{store.neighborhood}</p>}
                    <p>{store.city} {store.cep && `- ${store.cep}`}</p>
                  </div>
                </div>

                {store.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{store.phone}</span>
                  </div>
                )}

                {store.responsible && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{store.responsible}</span>
                  </div>
                )}
              </div>
              
              {/* Botão de Ver Inventário */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/inventory/unit/${store.id}`)}
                  className="w-full btn btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  Ver Inventário da Unidade
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {storesData?.pagination && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= storesData.pagination.pages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {(page - 1) * storesData.pagination.limit + 1}
                </span>{' '}
                até{' '}
                <span className="font-medium">
                  {Math.min(page * storesData.pagination.limit, storesData.pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{storesData.pagination.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= storesData.pagination.pages}
                  className="btn btn-secondary disabled:opacity-50 ml-2"
                >
                  Próximo
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingStore ? 'Editar Loja' : 'Nova Loja'}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome da Loja *</label>
                      <input
                        {...register('name', { required: 'Nome é obrigatório' })}
                        className="input mt-1"
                        placeholder="Ex: Shopping Prohospital"
                      />
                      {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Endereço *</label>
                        <input
                          {...register('address', { required: 'Endereço é obrigatório' })}
                          className="input mt-1"
                          placeholder="Rua, Avenida..."
                        />
                        {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Número</label>
                        <input
                          {...register('number')}
                          className="input mt-1"
                          placeholder="1200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bairro</label>
                        <input
                          {...register('neighborhood')}
                          className="input mt-1"
                          placeholder="Meireles"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cidade *</label>
                        <input
                          {...register('city', { required: 'Cidade é obrigatória' })}
                          className="input mt-1"
                          placeholder="Fortaleza"
                        />
                        {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">CEP</label>
                        <input
                          {...register('cep')}
                          className="input mt-1"
                          placeholder="60160-230"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input
                          {...register('phone')}
                          className="input mt-1"
                          placeholder="(85) 3456-7890"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Responsável</label>
                      <input
                        {...register('responsible')}
                        className="input mt-1"
                        placeholder="Nome do responsável pela loja"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createStoreMutation.isLoading || updateStoreMutation.isLoading}
                    className="btn btn-primary sm:ml-3 sm:w-auto"
                  >
                    {createStoreMutation.isLoading || updateStoreMutation.isLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary mt-3 sm:mt-0 sm:w-auto"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
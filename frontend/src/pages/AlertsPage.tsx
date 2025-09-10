import { useState, useEffect } from 'react';
import { Plus, Bell, Edit, Trash2, ToggleLeft, ToggleRight, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const alertSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  origin: z.string().min(3, 'Origem deve ter pelo menos 3 caracteres'),
  destination: z.string().min(3, 'Destino deve ter pelo menos 3 caracteres'),
  maxPrice: z.number().min(1, 'Preço máximo deve ser maior que 0'),
  classType: z.enum(['business', 'first']),
  departureDate: z.string().optional(),
  returnDate: z.string().optional()
});

type AlertFormData = z.infer<typeof alertSchema>;

interface Alert {
  id: string;
  name: string;
  origin: string;
  destination: string;
  maxPrice: number;
  classType: 'business' | 'first';
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  departureDate?: string;
  returnDate?: string;
}

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema)
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de alertas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados para demonstração
      const mockAlerts: Alert[] = [
        {
          id: '1',
          name: 'São Paulo → Rio de Janeiro',
          origin: 'São Paulo (GRU)',
          destination: 'Rio de Janeiro (GIG)',
          maxPrice: 2500,
          classType: 'business',
          isActive: true,
          createdAt: '2024-01-15T10:30:00Z',
          lastTriggered: '2024-01-20T14:22:00Z',
          departureDate: '2024-02-15'
        },
        {
          id: '2',
          name: 'Brasília → Salvador',
          origin: 'Brasília (BSB)',
          destination: 'Salvador (SSA)',
          maxPrice: 1800,
          classType: 'business',
          isActive: false,
          createdAt: '2024-01-10T08:15:00Z',
          departureDate: '2024-03-01'
        },
        {
          id: '3',
          name: 'São Paulo → Miami',
          origin: 'São Paulo (GRU)',
          destination: 'Miami (MIA)',
          maxPrice: 8500,
          classType: 'first',
          isActive: true,
          createdAt: '2024-01-05T16:45:00Z',
          departureDate: '2024-04-10',
          returnDate: '2024-04-20'
        }
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      toast.error('Erro ao carregar alertas');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AlertFormData) => {
    try {
      if (editingAlert) {
        // Atualizar alerta existente
        setAlerts(prev => prev.map(alert => 
          alert.id === editingAlert.id 
            ? { ...alert, ...data }
            : alert
        ));
        toast.success('Alerta atualizado com sucesso!');
        setEditingAlert(null);
      } else {
        // Criar novo alerta
        const newAlert: Alert = {
          id: Date.now().toString(),
          ...data,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        setAlerts(prev => [newAlert, ...prev]);
        toast.success('Alerta criado com sucesso!');
      }
      
      setShowCreateForm(false);
      reset();
    } catch (error) {
      toast.error('Erro ao salvar alerta');
    }
  };

  const toggleAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isActive: !alert.isActive }
          : alert
      ));
      toast.success('Status do alerta atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar alerta');
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Tem certeza que deseja excluir este alerta?')) return;
    
    try {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success('Alerta excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir alerta');
    }
  };

  const startEdit = (alert: Alert) => {
    setEditingAlert(alert);
    reset({
      name: alert.name,
      origin: alert.origin,
      destination: alert.destination,
      maxPrice: alert.maxPrice,
      classType: alert.classType,
      departureDate: alert.departureDate,
      returnDate: alert.returnDate
    });
    setShowCreateForm(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Meus Alertas
            </h1>
            <p className="text-gray-600">
              Monitore preços e receba notificações quando encontrarmos ofertas.
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingAlert(null);
              reset();
            }}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Alerta
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingAlert ? 'Editar Alerta' : 'Criar Novo Alerta'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Alerta
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Ex: São Paulo → Rio de Janeiro"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Máximo
                  </label>
                  <input
                    type="number"
                    {...register('maxPrice', { valueAsNumber: true })}
                    placeholder="2500"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.maxPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.maxPrice.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origem
                  </label>
                  <input
                    type="text"
                    {...register('origin')}
                    placeholder="São Paulo (GRU)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.origin && (
                    <p className="text-red-500 text-sm mt-1">{errors.origin.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destino
                  </label>
                  <input
                    type="text"
                    {...register('destination')}
                    placeholder="Rio de Janeiro (GIG)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.destination && (
                    <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe
                  </label>
                  <select
                    {...register('classType')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="business">Executiva</option>
                    <option value="first">Primeira Classe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Ida (Opcional)
                  </label>
                  <input
                    type="date"
                    {...register('departureDate')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {editingAlert ? 'Atualizar' : 'Criar'} Alerta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingAlert(null);
                    reset();
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Alerts List */}
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alert.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Rota:</span>
                        <div className="font-medium">{alert.origin} → {alert.destination}</div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Preço Máximo:</span>
                        <div className="font-medium text-blue-600">{formatPrice(alert.maxPrice)}</div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Classe:</span>
                        <div className="font-medium">
                          {alert.classType === 'business' ? 'Executiva' : 'Primeira Classe'}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Criado em:</span>
                        <div className="font-medium">{formatDate(alert.createdAt)}</div>
                      </div>
                    </div>
                    
                    {alert.lastTriggered && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                        <TrendingDown className="w-4 h-4" />
                        Última notificação: {formatDate(alert.lastTriggered)}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={alert.isActive ? 'Desativar alerta' : 'Ativar alerta'}
                    >
                      {alert.isActive ? (
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => startEdit(alert)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar alerta"
                    >
                      <Edit className="w-5 h-5 text-blue-600" />
                    </button>
                    
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Excluir alerta"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum alerta criado
            </h3>
            <p className="text-gray-600 mb-6">
              Crie seu primeiro alerta para monitorar preços de voos.
            </p>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingAlert(null);
                reset();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Alerta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
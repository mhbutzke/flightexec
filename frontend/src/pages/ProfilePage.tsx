import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Bell, Shield, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserStats {
  totalAlerts: number;
  activeAlerts: number;
  totalSearches: number;
  avgSavings: number;
}

const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalAlerts: 0,
    activeAlerts: 0,
    totalSearches: 0,
    avgSavings: 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento do perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Dados mockados para demonstração
      const mockProfile = {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '+55 11 99999-9999',
        dateOfBirth: '1985-03-15',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      };

      const mockStats = {
        totalAlerts: 5,
        activeAlerts: 3,
        totalSearches: 28,
        avgSavings: 32,
      };

      reset(mockProfile);
      setStats(mockStats);
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Meu Perfil</h1>
          <p className='text-gray-600'>
            Gerencie suas informações pessoais e preferências.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Stats Cards */}
          <div className='lg:col-span-3'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='bg-white rounded-lg p-6 shadow-md text-center'
              >
                <Bell className='w-8 h-8 text-blue-600 mx-auto mb-2' />
                <div className='text-2xl font-bold text-gray-900'>
                  {stats.totalAlerts}
                </div>
                <div className='text-sm text-gray-600'>Total de Alertas</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className='bg-white rounded-lg p-6 shadow-md text-center'
              >
                <Bell className='w-8 h-8 text-green-600 mx-auto mb-2' />
                <div className='text-2xl font-bold text-gray-900'>
                  {stats.activeAlerts}
                </div>
                <div className='text-sm text-gray-600'>Alertas Ativos</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className='bg-white rounded-lg p-6 shadow-md text-center'
              >
                <User className='w-8 h-8 text-purple-600 mx-auto mb-2' />
                <div className='text-2xl font-bold text-gray-900'>
                  {stats.totalSearches}
                </div>
                <div className='text-sm text-gray-600'>Buscas Realizadas</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className='bg-white rounded-lg p-6 shadow-md text-center'
              >
                <Shield className='w-8 h-8 text-orange-600 mx-auto mb-2' />
                <div className='text-2xl font-bold text-gray-900'>
                  {stats.avgSavings}%
                </div>
                <div className='text-sm text-gray-600'>Economia Média</div>
              </motion.div>
            </div>
          </div>

          {/* Profile Form */}
          <div className='lg:col-span-2'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className='bg-white rounded-lg shadow-md p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                <User className='w-5 h-5' />
                Informações Pessoais
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Nome Completo
                    </label>
                    <input
                      type='text'
                      {...register('name')}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                    {errors.name && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Email
                    </label>
                    <input
                      type='email'
                      {...register('email')}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                    {errors.email && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Telefone
                    </label>
                    <input
                      type='tel'
                      {...register('phone')}
                      placeholder='+55 11 99999-9999'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Data de Nascimento
                    </label>
                    <input
                      type='date'
                      {...register('dateOfBirth')}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                </div>

                <div className='flex justify-end pt-4'>
                  <button
                    type='submit'
                    disabled={!isDirty || isSaving}
                    className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2'
                  >
                    {isSaving ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className='w-4 h-4' />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Notification Preferences */}
          <div className='lg:col-span-1'>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='bg-white rounded-lg shadow-md p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                <Bell className='w-5 h-5' />
                Notificações
              </h2>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Mail className='w-5 h-5 text-gray-600' />
                    <div>
                      <div className='font-medium text-gray-900'>Email</div>
                      <div className='text-sm text-gray-600'>
                        Receber por email
                      </div>
                    </div>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      {...register('notifications.email')}
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Bell className='w-5 h-5 text-gray-600' />
                    <div>
                      <div className='font-medium text-gray-900'>Push</div>
                      <div className='text-sm text-gray-600'>
                        Notificações push
                      </div>
                    </div>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      {...register('notifications.push')}
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Phone className='w-5 h-5 text-gray-600' />
                    <div>
                      <div className='font-medium text-gray-900'>SMS</div>
                      <div className='text-sm text-gray-600'>
                        Mensagens de texto
                      </div>
                    </div>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      {...register('notifications.sms')}
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

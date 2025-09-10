import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  PlaneTakeoff,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'Você deve aceitar os termos de uso',
    }),
    acceptNewsletter: z.boolean().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const { handleError, showSuccess } = useErrorHandler();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  const getPasswordStrength = (password: string) => {
    if (!password) {
      return { strength: 0, label: '', color: '' };
    }

    let strength = 0;
    if (password.length >= 8) {
      strength++;
    }
    if (/[A-Z]/.test(password)) {
      strength++;
    }
    if (/[a-z]/.test(password)) {
      strength++;
    }
    if (/\d/.test(password)) {
      strength++;
    }
    if (/[^\w\s]/.test(password)) {
      strength++;
    }

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Muito fraca', color: 'bg-red-500' },
      { strength: 2, label: 'Fraca', color: 'bg-orange-500' },
      { strength: 3, label: 'Média', color: 'bg-yellow-500' },
      { strength: 4, label: 'Forte', color: 'bg-green-500' },
      { strength: 5, label: 'Muito forte', color: 'bg-green-600' },
    ];

    return levels[strength];
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.name);
      showSuccess('Conta criada com sucesso!');
      navigate('/');
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='max-w-md w-full'
      >
        {/* Logo and Title */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center gap-2 mb-4'>
            <PlaneTakeoff className='w-8 h-8 text-blue-600' />
            <span className='text-2xl font-bold text-gray-900'>FlightExec</span>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Criar sua conta
          </h1>
          <p className='text-gray-600'>
            Junte-se a nós e encontre os melhores voos executivos
          </p>
        </div>

        {/* Register Form */}
        <div className='bg-white rounded-xl shadow-lg p-8'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Name */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Nome Completo
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='text'
                  {...register('name')}
                  placeholder='Seu nome completo'
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                />
              </div>
              {errors.name && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Email
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='email'
                  {...register('email')}
                  placeholder='seu@email.com'
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                />
              </div>
              {errors.email && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Senha
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder='••••••••'
                  className='w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className='mt-2'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='flex-1 bg-gray-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <span className='text-xs text-gray-600'>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className='text-xs text-gray-500 space-y-1'>
                    <div className='flex items-center gap-1'>
                      <Check
                        className={`w-3 h-3 ${password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`}
                      />
                      <span>Pelo menos 8 caracteres</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Check
                        className={`w-3 h-3 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`}
                      />
                      <span>Uma letra maiúscula</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Check
                        className={`w-3 h-3 ${/\d/.test(password) ? 'text-green-500' : 'text-gray-300'}`}
                      />
                      <span>Um número</span>
                    </div>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Confirmar Senha
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder='••••••••'
                  className='w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms and Newsletter */}
            <div className='space-y-3'>
              <label className='flex items-start gap-3'>
                <input
                  type='checkbox'
                  {...register('acceptTerms')}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5'
                />
                <span className='text-sm text-gray-600'>
                  Eu aceito os{' '}
                  <Link
                    to='/terms'
                    className='text-blue-600 hover:text-blue-700 underline'
                  >
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link
                    to='/privacy'
                    className='text-blue-600 hover:text-blue-700 underline'
                  >
                    Política de Privacidade
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className='text-red-500 text-sm'>
                  {errors.acceptTerms.message}
                </p>
              )}

              <label className='flex items-start gap-3'>
                <input
                  type='checkbox'
                  {...register('acceptNewsletter')}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5'
                />
                <span className='text-sm text-gray-600'>
                  Quero receber ofertas especiais e novidades por email
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent' />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className='mt-8 pt-6 border-t border-gray-200'>
            <p className='text-center text-sm text-gray-600'>
              Já tem uma conta?{' '}
              <Link
                to='/login'
                className='text-blue-600 hover:text-blue-700 font-semibold transition-colors'
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

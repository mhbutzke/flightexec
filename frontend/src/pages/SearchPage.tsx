import { useState } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Plane,
  Clock,
  TrendingDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { flightApi } from '@/services/apiService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ButtonLoader } from '@/components/LoadingSpinner';
import { FlightListSkeleton, SearchFormSkeleton } from '@/components/SkeletonLoader';

const searchSchema = z.object({
  origin: z.string().min(3, 'Origem deve ter pelo menos 3 caracteres'),
  destination: z.string().min(3, 'Destino deve ter pelo menos 3 caracteres'),
  departureDate: z.string().min(1, 'Data de ida é obrigatória'),
  returnDate: z.string().optional(),
  passengers: z
    .number()
    .min(1, 'Pelo menos 1 passageiro')
    .max(9, 'Máximo 9 passageiros'),
  classType: z.enum(['business', 'first']),
  tripType: z.enum(['roundtrip', 'oneway']),
  flexibleDays: z
    .number()
    .min(0, 'Flexibilidade deve ser 0 ou mais dias')
    .max(7, 'Máximo 7 dias de flexibilidade'),
  enableFlexibleSearch: z.boolean(),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  classType: string;
  aircraft?: string;
  bookingUrl?: string;
  isOffer?: boolean;
}

const SearchPage = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [priceCalendar, setPriceCalendar] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showFlexibleOptions, setShowFlexibleOptions] = useState(false);
  const { handleError, showSuccess } = useErrorHandler();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      passengers: 1,
      classType: 'business',
      tripType: 'roundtrip',
      flexibleDays: 3,
      enableFlexibleSearch: false,
    },
  });

  const tripType = watch('tripType');
  const enableFlexibleSearch = watch('enableFlexibleSearch');

  const onSubmit = async (data: SearchFormData) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchPayload = {
        origin: data.origin,
        destination: data.destination,
        departureDate: data.departureDate,
        returnDate: data.returnDate,
        passengers: data.passengers,
        classType: data.classType,
        ...(data.enableFlexibleSearch && {
          flexibleDays: data.flexibleDays,
        }),
      };

      const result = data.enableFlexibleSearch
        ? await flightApi.searchFlexible(searchPayload)
        : await flightApi.search(searchPayload);

      if (result.success && result.data) {
        if (data.enableFlexibleSearch) {
          const flexibleData = result.data as any;
          setFlights(flexibleData.flights || []);
          setPriceCalendar(flexibleData.priceCalendar || []);
          setRecommendations(flexibleData.recommendations || []);
          showSuccess(
            `Busca flexível concluída! ${flexibleData.flights?.length || 0} voos encontrados`
          );
        } else {
          const flights = Array.isArray(result.data) ? result.data : [];
          setFlights(flights);
          showSuccess(`${flights.length} voos encontrados!`);
        }
      } else {
        throw new Error(result.error?.message || 'Erro na busca de voos');
      }
    } catch (error) {
      handleError(error);

      // Fallback para dados mockados em caso de erro
      const mockFlights: Flight[] = [
        {
          id: '1',
          airline: 'LATAM',
          flightNumber: 'LA3001',
          origin: data.origin,
          destination: data.destination,
          departureTime: '08:30',
          arrivalTime: '11:45',
          duration: '3h 15m',
          price: 2850,
          classType: data.classType,
          aircraft: 'Boeing 787',
          bookingUrl: 'https://www.latam.com/pt_br/ofertas-voos',
          isOffer: true,
        },
        {
          id: '2',
          airline: 'GOL',
          flightNumber: 'G31234',
          origin: data.origin,
          destination: data.destination,
          departureTime: '14:20',
          arrivalTime: '17:35',
          duration: '3h 15m',
          price: 2650,
          classType: data.classType,
          aircraft: 'Boeing 737 MAX',
          bookingUrl: 'https://www.voegol.com.br/pt/ofertas',
          isOffer: false,
        },
      ];

      const mockRecommendations = [
        {
          title: 'Melhor Preço - LATAM',
          description: 'Voo direto com excelente custo-benefício',
          price: 7800,
          savings: 25,
          bookingUrl: 'https://www.latam.com/pt_br/ofertas-voos',
        },
        {
          title: 'Oferta Relâmpago - GOL',
          description: 'Promoção válida por tempo limitado',
          price: 6900,
          savings: 35,
          bookingUrl: 'https://www.voegol.com.br/pt/ofertas',
        },
      ];

      setFlights(mockFlights);
      setRecommendations(mockRecommendations);
    } finally {
      setIsSearching(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Search Form */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
              Buscar Voos Executivos
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {/* Trip Type */}
              <div className='flex justify-center mb-6'>
                <div className='bg-gray-100 rounded-lg p-1 flex'>
                  <label className='flex items-center'>
                    <input
                      type='radio'
                      value='roundtrip'
                      {...register('tripType')}
                      className='sr-only'
                    />
                    <span
                      className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                        tripType === 'roundtrip'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Ida e Volta
                    </span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='radio'
                      value='oneway'
                      {...register('tripType')}
                      className='sr-only'
                    />
                    <span
                      className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                        tripType === 'oneway'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Somente Ida
                    </span>
                  </label>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                {/* Origin */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <MapPin className='w-4 h-4 inline mr-1' />
                    Origem
                  </label>
                  <input
                    type='text'
                    {...register('origin')}
                    placeholder='São Paulo (GRU)'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                  {errors.origin && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.origin.message}
                    </p>
                  )}
                </div>

                {/* Destination */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <MapPin className='w-4 h-4 inline mr-1' />
                    Destino
                  </label>
                  <input
                    type='text'
                    {...register('destination')}
                    placeholder='Rio de Janeiro (GIG)'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                  {errors.destination && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.destination.message}
                    </p>
                  )}
                </div>

                {/* Departure Date */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <Calendar className='w-4 h-4 inline mr-1' />
                    Data de Ida
                  </label>
                  <input
                    type='date'
                    {...register('departureDate')}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                  {errors.departureDate && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.departureDate.message}
                    </p>
                  )}
                </div>

                {/* Return Date */}
                {tripType === 'roundtrip' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      <Calendar className='w-4 h-4 inline mr-1' />
                      Data de Volta
                    </label>
                    <input
                      type='date'
                      {...register('returnDate')}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                )}
              </div>

              {/* Flexible Search Toggle */}
              <div className='bg-blue-50 rounded-lg p-4 mb-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Clock className='w-5 h-5 text-blue-600' />
                    <div>
                      <h3 className='font-semibold text-gray-900'>
                        Busca Flexível
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Encontre as melhores ofertas com flexibilidade de datas
                      </p>
                    </div>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      {...register('enableFlexibleSearch')}
                      className='sr-only peer'
                      onChange={e => setShowFlexibleOptions(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {enableFlexibleSearch && (
                  <div className='mt-4 pt-4 border-t border-blue-200'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          <Calendar className='w-4 h-4 inline mr-1' />
                          Flexibilidade (± dias)
                        </label>
                        <select
                          {...register('flexibleDays', { valueAsNumber: true })}
                          className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        >
                          <option value={0}>Data exata</option>
                          <option value={1}>± 1 dia</option>
                          <option value={2}>± 2 dias</option>
                          <option value={3}>± 3 dias</option>
                          <option value={5}>± 5 dias</option>
                          <option value={7}>± 7 dias</option>
                        </select>
                      </div>
                      <div className='flex items-end'>
                        <div className='bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm'>
                          <TrendingDown className='w-4 h-4 inline mr-1' />
                          Economize até 40% com busca flexível
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Passengers */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <Users className='w-4 h-4 inline mr-1' />
                    Passageiros
                  </label>
                  <select
                    {...register('passengers', { valueAsNumber: true })}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <option key={num} value={num}>
                        {num} passageiro{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Type */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <Plane className='w-4 h-4 inline mr-1' />
                    Classe
                  </label>
                  <select
                    {...register('classType')}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='business'>Executiva</option>
                    <option value='first'>Primeira Classe</option>
                  </select>
                </div>

                {/* Search Button */}
                <div className='flex items-end'>
                  <button
                    type='submit'
                    disabled={isSearching}
                    className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2'
                  >
                    {isSearching ? (
                      <>
                        <ButtonLoader size="sm" />
                        {enableFlexibleSearch
                          ? 'Buscando ofertas...'
                          : 'Buscando...'}
                      </>
                    ) : (
                      <>
                        <Search className='w-4 h-4' />
                        {enableFlexibleSearch ? 'Buscar Ofertas' : 'Buscar'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Results */}
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Flexible Search Results */}
            {enableFlexibleSearch && priceCalendar.length > 0 && (
              <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2'>
                  <Calendar className='w-6 h-6 text-blue-600' />
                  Calendário de Preços
                </h2>
                <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3'>
                  {priceCalendar.map((day, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                        day.isRecommended
                          ? 'bg-green-50 border-green-300 hover:bg-green-100'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className='text-sm font-medium text-gray-900'>
                        {day.date}
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          day.isRecommended ? 'text-green-600' : 'text-blue-600'
                        }`}
                      >
                        R$ {day.price.toLocaleString()}
                      </div>
                      {day.isRecommended && (
                        <div className='text-xs text-green-600 font-medium'>
                          Melhor oferta
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {enableFlexibleSearch && recommendations.length > 0 && (
              <div className='bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6 mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2'>
                  <TrendingDown className='w-6 h-6 text-green-600' />
                  Recomendações Especiais
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className='bg-white rounded-lg p-4 border border-green-200'
                    >
                      <div className='flex justify-between items-start mb-3'>
                        <div>
                          <h3 className='font-semibold text-gray-900'>
                            {rec.title}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            {rec.description}
                          </p>
                        </div>
                        <div className='bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium'>
                          {rec.savings}% OFF
                        </div>
                      </div>
                      <div className='flex justify-between items-center'>
                        <div className='text-lg font-bold text-green-600'>
                          R$ {rec.price.toLocaleString()}
                        </div>
                        <a
                          href={rec.bookingUrl || '#'}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1'
                          onClick={() => {
                            console.log(
                              `Redirecionando para oferta: ${rec.title}`
                            );
                          }}
                        >
                          <svg
                            className='w-3 h-3'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                            />
                          </svg>
                          Ver Oferta
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isSearching ? (
              <>
                <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                  Buscando voos...
                </h2>
                <FlightListSkeleton count={5} />
              </>
            ) : flights.length > 0 ? (
              <>
                <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                  {enableFlexibleSearch
                    ? 'Todas as Opções'
                    : `${flights.length} voos encontrados`}
                </h2>
                <div className='space-y-4'>
                  {flights.map(flight => (
                    <div
                      key={flight.id}
                      className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
                    >
                      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-4 mb-4'>
                            <div className='text-lg font-semibold text-gray-900'>
                              {flight.airline}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {flight.flightNumber} • {flight.aircraft}
                            </div>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div>
                              <div className='text-sm text-gray-500'>Saída</div>
                              <div className='font-semibold'>
                                {flight.departureTime}
                              </div>
                              <div className='text-sm text-gray-600'>
                                {flight.origin}
                              </div>
                            </div>

                            <div className='text-center'>
                              <div className='text-sm text-gray-500'>
                                Duração
                              </div>
                              <div className='font-semibold'>
                                {flight.duration}
                              </div>
                              <div className='text-sm text-blue-600'>
                                {flight.classType === 'business'
                                  ? 'Executiva'
                                  : 'Primeira Classe'}
                              </div>
                            </div>

                            <div>
                              <div className='text-sm text-gray-500'>
                                Chegada
                              </div>
                              <div className='font-semibold'>
                                {flight.arrivalTime}
                              </div>
                              <div className='text-sm text-gray-600'>
                                {flight.destination}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className='mt-4 lg:mt-0 lg:ml-8 text-right'>
                          <div className='text-2xl font-bold text-blue-600 mb-2'>
                            {formatPrice(flight.price)}
                          </div>
                          <div className='flex flex-col gap-2'>
                            {flight.bookingUrl && (
                              <a
                                href={flight.bookingUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center'
                                onClick={() => {
                                  // Track click for analytics
                                  console.log(
                                    `Redirecionando para: ${flight.airline} - ${flight.flightNumber}`
                                  );
                                }}
                              >
                                <svg
                                  className='w-4 h-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                  />
                                </svg>
                                Comprar na {flight.airline}
                              </a>
                            )}
                            <button className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors'>
                              Detalhes
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className='text-center py-12'>
                <Plane className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  Nenhum voo encontrado
                </h3>
                <p className='text-gray-600'>
                  Tente ajustar seus critérios de busca.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

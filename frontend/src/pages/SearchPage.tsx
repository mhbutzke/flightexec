import { useState } from 'react';
import { Search, Calendar, MapPin, Users, Plane } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const searchSchema = z.object({
  origin: z.string().min(3, 'Origem deve ter pelo menos 3 caracteres'),
  destination: z.string().min(3, 'Destino deve ter pelo menos 3 caracteres'),
  departureDate: z.string().min(1, 'Data de ida é obrigatória'),
  returnDate: z.string().optional(),
  passengers: z.number().min(1, 'Pelo menos 1 passageiro').max(9, 'Máximo 9 passageiros'),
  classType: z.enum(['business', 'first']),
  tripType: z.enum(['roundtrip', 'oneway'])
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
  aircraft: string;
}

const SearchPage = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      passengers: 1,
      classType: 'business',
      tripType: 'roundtrip'
    }
  });

  const tripType = watch('tripType');

  const onSubmit = async (data: SearchFormData) => {
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Simular busca de voos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dados mockados para demonstração
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
          aircraft: 'Boeing 787'
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
          aircraft: 'Boeing 737 MAX'
        },
        {
          id: '3',
          airline: 'Azul',
          flightNumber: 'AD4567',
          origin: data.origin,
          destination: data.destination,
          departureTime: '19:10',
          arrivalTime: '22:25',
          duration: '3h 15m',
          price: 2750,
          classType: data.classType,
          aircraft: 'Airbus A320neo'
        }
      ];
      
      setFlights(mockFlights);
      toast.success(`${mockFlights.length} voos encontrados!`);
    } catch (error) {
      toast.error('Erro ao buscar voos. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Form */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Buscar Voos Executivos
            </h1>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Trip Type */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 rounded-lg p-1 flex">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="roundtrip"
                      {...register('tripType')}
                      className="sr-only"
                    />
                    <span className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                      tripType === 'roundtrip' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}>
                      Ida e Volta
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="oneway"
                      {...register('tripType')}
                      className="sr-only"
                    />
                    <span className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                      tripType === 'oneway' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}>
                      Somente Ida
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Origin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
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

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
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

                {/* Departure Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data de Ida
                  </label>
                  <input
                    type="date"
                    {...register('departureDate')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.departureDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.departureDate.message}</p>
                  )}
                </div>

                {/* Return Date */}
                {tripType === 'roundtrip' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Data de Volta
                    </label>
                    <input
                      type="date"
                      {...register('returnDate')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Passengers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Passageiros
                  </label>
                  <select
                    {...register('passengers', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <option key={num} value={num}>{num} passageiro{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Class Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Plane className="w-4 h-4 inline mr-1" />
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

                {/* Search Button */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Buscar
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {flights.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {flights.length} voos encontrados
                </h2>
                <div className="space-y-4">
                  {flights.map((flight) => (
                    <div key={flight.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-lg font-semibold text-gray-900">
                              {flight.airline}
                            </div>
                            <div className="text-sm text-gray-500">
                              {flight.flightNumber} • {flight.aircraft}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">Saída</div>
                              <div className="font-semibold">{flight.departureTime}</div>
                              <div className="text-sm text-gray-600">{flight.origin}</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Duração</div>
                              <div className="font-semibold">{flight.duration}</div>
                              <div className="text-sm text-blue-600">{flight.classType === 'business' ? 'Executiva' : 'Primeira Classe'}</div>
                            </div>
                            
                            <div>
                              <div className="text-sm text-gray-500">Chegada</div>
                              <div className="font-semibold">{flight.arrivalTime}</div>
                              <div className="text-sm text-gray-600">{flight.destination}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 lg:mt-0 lg:ml-8 text-right">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {formatPrice(flight.price)}
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                            Selecionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum voo encontrado
                </h3>
                <p className="text-gray-600">
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
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlaneTakeoff,
  Search,
  Bell,
  TrendingUp,
  Star,
  Shield,
  Clock,
  Award,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Filter,
  Plane,
  Globe,
  CheckCircle,
  Heart,
  Camera,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ButtonLoader } from '@/components/LoadingSpinner';
import { StatsSkeleton } from '@/components/SkeletonLoader';

const HomePage = () => {
  const [stats, setStats] = useState({
    totalFlights: 0,
    activeAlerts: 0,
    avgSavings: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [searchForm, setSearchForm] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    classType: 'economy',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStats({
        totalFlights: 15000,
        activeAlerts: 25,
        avgSavings: 35,
      });
      setIsLoadingStats(false);
    };
    loadStats();
  }, []);

  const popularDestinations = [
    {
      city: 'São Paulo',
      country: 'Brasil',
      flights: '2.5k voos/mês',
      price: 'A partir de R$ 850',
      image: '/api/placeholder/300/200',
    },
    {
      city: 'Rio de Janeiro',
      country: 'Brasil',
      flights: '1.8k voos/mês',
      price: 'A partir de R$ 920',
      image: '/api/placeholder/300/200',
    },
    {
      city: 'Miami',
      country: 'EUA',
      flights: '850 voos/mês',
      price: 'A partir de R$ 2.850',
      image: '/api/placeholder/300/200',
    },
    {
      city: 'Buenos Aires',
      country: 'Argentina',
      flights: '650 voos/mês',
      price: 'A partir de R$ 1.450',
      image: '/api/placeholder/300/200',
    },
  ];

  const premiumAirlines = [
    {
      name: 'Azul Linhas Aéreas',
      logo: '/api/placeholder/120/60',
      rating: 4.8,
      routes: '150+ rotas',
    },
    {
      name: 'LATAM Airlines',
      logo: '/api/placeholder/120/60',
      rating: 4.7,
      routes: '200+ rotas',
    },
    {
      name: 'GOL Linhas Aéreas',
      logo: '/api/placeholder/120/60',
      rating: 4.6,
      routes: '120+ rotas',
    },
    {
      name: 'Avianca Brasil',
      logo: '/api/placeholder/120/60',
      rating: 4.5,
      routes: '80+ rotas',
    },
  ];

  const features = [
    {
      icon: Search,
      title: 'Busca Inteligente',
      description:
        'Algoritmos avançados que encontram as melhores ofertas em tempo real',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Bell,
      title: 'Alertas Personalizados',
      description:
        'Receba notificações quando os preços dos seus voos favoritos baixarem',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Compra Segura',
      description:
        'Transações protegidas e garantia de reembolso em caso de problemas',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Clock,
      title: 'Suporte 24/7',
      description:
        'Atendimento especializado disponível a qualquer hora do dia',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Executiva de Vendas',
      content:
        'Economizei mais de R$ 3.000 no último ano usando o FlightExec. O sistema de alertas é fantástico!',
      rating: 5,
      avatar: '/api/placeholder/60/60',
    },
    {
      name: 'João Santos',
      role: 'Consultor de TI',
      content:
        'A interface é muito intuitiva e as opções de filtro me ajudam a encontrar exatamente o que preciso.',
      rating: 5,
      avatar: '/api/placeholder/60/60',
    },
    {
      name: 'Ana Costa',
      role: 'Diretora Comercial',
      content:
        'Recomendo para todos os executivos. Praticidade e economia em um só lugar.',
      rating: 5,
      avatar: '/api/placeholder/60/60',
    },
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    console.log('Searching with:', searchForm);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50'>
      {/* Hero Section */}
      <section className='relative pt-20 pb-32 px-4 overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-cyan-600/10' />
        <div className='absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000' />

        <div className='relative max-w-7xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='text-center mb-16'
          >
            <div className='inline-flex items-center gap-2 bg-blue-100/80 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-200/50'>
              <Sparkles className='w-4 h-4' />
              <span>Mais de 15.000 voos monitorados diariamente</span>
            </div>

            <h1 className='text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight'>
              Voos Executivos
              <br />
              <span className='bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent'>
                Inteligentes
              </span>
            </h1>

            <p className='text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed'>
              Encontre as melhores ofertas de voos executivos com nossa
              tecnologia de busca avançada. Economize tempo e dinheiro em cada
              viagem.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/50 max-w-6xl mx-auto'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <MapPin className='w-4 h-4 text-blue-600' />
                  Origem
                </label>
                <input
                  type='text'
                  placeholder='São Paulo (GRU)'
                  value={searchForm.origin}
                  onChange={e => handleInputChange('origin', e.target.value)}
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <MapPin className='w-4 h-4 text-purple-600' />
                  Destino
                </label>
                <input
                  type='text'
                  placeholder='Rio de Janeiro (GIG)'
                  value={searchForm.destination}
                  onChange={e =>
                    handleInputChange('destination', e.target.value)
                  }
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/80'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <Calendar className='w-4 h-4 text-green-600' />
                  Ida
                </label>
                <input
                  type='date'
                  value={searchForm.departureDate}
                  onChange={e =>
                    handleInputChange('departureDate', e.target.value)
                  }
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <Users className='w-4 h-4 text-orange-600' />
                  Passageiros
                </label>
                <select
                  value={searchForm.passengers}
                  onChange={e =>
                    handleInputChange('passengers', parseInt(e.target.value))
                  }
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white/80'
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Passageiro' : 'Passageiros'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className='flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200'
              >
                <Filter className='w-4 h-4' />
                Filtros Avançados
              </button>

              <div className='flex gap-4'>
                <select
                  value={searchForm.classType}
                  onChange={e => handleInputChange('classType', e.target.value)}
                  className='px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80'
                >
                  <option value='economy'>Econômica</option>
                  <option value='premium'>Premium Economy</option>
                  <option value='business'>Executiva</option>
                  <option value='first'>Primeira Classe</option>
                </select>

                <Link
                  to='/search'
                  onClick={handleSearch}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl'
                >
                  <Search className='w-5 h-5' />
                  Buscar Voos Executivos
                </Link>
              </div>
            </div>

            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mt-6 pt-6 border-t border-gray-200'
              >
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>
                      Volta (Opcional)
                    </label>
                    <input
                      type='date'
                      value={searchForm.returnDate}
                      onChange={e =>
                        handleInputChange('returnDate', e.target.value)
                      }
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80'
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>
                      Companhia Preferida
                    </label>
                    <select className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80'>
                      <option value=''>Todas as companhias</option>
                      <option value='azul'>Azul</option>
                      <option value='latam'>LATAM</option>
                      <option value='gol'>GOL</option>
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>
                      Orçamento Máximo
                    </label>
                    <input
                      type='number'
                      placeholder='R$ 2.000'
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80'
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='flex flex-wrap justify-center gap-4 mt-12'
          >
            <Link
              to='/alerts'
              className='flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-blue-600 px-6 py-3 rounded-full font-medium transition-all duration-200 border border-gray-200/50 hover:border-blue-200 hover:shadow-lg'
            >
              <Bell className='w-4 h-4' />
              Criar Alerta
            </Link>
            <button className='flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-purple-600 px-6 py-3 rounded-full font-medium transition-all duration-200 border border-gray-200/50 hover:border-purple-200 hover:shadow-lg'>
              <TrendingUp className='w-4 h-4' />
              Ver Tendências
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className='flex flex-wrap justify-center items-center gap-8 mt-16 text-gray-600'
          >
            <div className='flex items-center gap-2'>
              <Shield className='w-4 h-4 text-green-500' />
              <span className='font-medium'>Pagamento Seguro</span>
            </div>
            <div className='flex items-center gap-2'>
              <Award className='w-4 h-4 text-yellow-500' />
              <span className='font-medium'>Melhor Avaliado 2024</span>
            </div>
            <div className='flex items-center gap-2'>
              <PlaneTakeoff className='w-4 h-4 text-blue-500' />
              <span className='font-medium'>+1000 voos diários</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Destinations & Premium Airlines */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            {/* Popular Destinations */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
                <Globe className='w-6 h-6 text-blue-600' />
                Destinos Populares
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {popularDestinations.map((destination, index) => (
                  <motion.div
                    key={destination.city}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className='group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer'
                  >
                    <div className='aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-3 flex items-center justify-center'>
                      <Camera className='w-8 h-8 text-gray-400' />
                    </div>
                    <h4 className='font-semibold text-gray-900 mb-1'>
                      {destination.city}
                    </h4>
                    <p className='text-sm text-gray-600 mb-2'>
                      {destination.country}
                    </p>
                    <div className='flex justify-between items-center text-xs text-gray-500'>
                      <span>{destination.flights}</span>
                      <span className='font-medium text-blue-600'>
                        {destination.price}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Premium Airlines */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
                <Plane className='w-6 h-6 text-purple-600' />
                Companhias Premium
              </h3>
              <div className='space-y-4'>
                {premiumAirlines.map((airline, index) => (
                  <motion.div
                    key={airline.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className='group bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <div className='w-16 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center'>
                          <Plane className='w-6 h-6 text-gray-400' />
                        </div>
                        <div>
                          <h4 className='font-semibold text-gray-900'>
                            {airline.name}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            {airline.routes}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='flex items-center gap-1 mb-1'>
                          <Star className='w-4 h-4 text-yellow-400 fill-current' />
                          <span className='font-medium text-gray-900'>
                            {airline.rating}
                          </span>
                        </div>
                        <p className='text-xs text-gray-500'>Avaliação</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className='py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
              Por que escolher o{' '}
              <span className='text-blue-600'>FlightExec</span>?
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Tecnologia de ponta, atendimento personalizado e as melhores
              ofertas do mercado
            </p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-center border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2'
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className='w-8 h-8 text-white' />
                  </div>
                  <h3 className='text-xl font-bold text-gray-900 mb-4'>
                    {feature.title}
                  </h3>
                  <p className='text-gray-600 leading-relaxed'>
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Additional Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className='mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center'
          >
            <h3 className='text-3xl md:text-4xl font-bold mb-6'>
              Benefícios Exclusivos
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='flex flex-col items-center'>
                <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4'>
                  <Heart className='w-6 h-6' />
                </div>
                <h4 className='font-semibold mb-2'>Programa de Fidelidade</h4>
                <p className='text-blue-100 text-sm'>
                  Acumule pontos e ganhe voos gratuitos
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4'>
                  <Shield className='w-6 h-6' />
                </div>
                <h4 className='font-semibold mb-2'>Garantia de Preço</h4>
                <p className='text-blue-100 text-sm'>
                  Encontrou mais barato? Igualamos o preço
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4'>
                  <Clock className='w-6 h-6' />
                </div>
                <h4 className='font-semibold mb-2'>Check-in Expresso</h4>
                <p className='text-blue-100 text-sm'>
                  Evite filas com nosso check-in automático
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-20 px-4 bg-white/50 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center mb-16'
          >
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
              Números que <span className='text-blue-600'>Impressionam</span>
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Milhares de usuários já economizaram tempo e dinheiro com nossa
              plataforma
            </p>
          </motion.div>

          {isLoadingStats ? (
            <StatsSkeleton />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className='group bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-center border border-blue-100/50 hover:border-blue-200 transform hover:-translate-y-2'
              >
                <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <PlaneTakeoff className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-4xl font-bold text-gray-900 mb-2'>
                  {stats.totalFlights.toLocaleString()}+
                </h3>
                <p className='text-gray-600 font-medium'>
                  Voos Monitorados Diariamente
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className='group bg-gradient-to-br from-white to-purple-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-center border border-purple-100/50 hover:border-purple-200 transform hover:-translate-y-2'
              >
                <div className='w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <Bell className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-4xl font-bold text-gray-900 mb-2'>
                  {stats.activeAlerts}k+
                </h3>
                <p className='text-gray-600 font-medium'>Alertas Ativos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className='group bg-gradient-to-br from-white to-green-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-center border border-green-100/50 hover:border-green-200 transform hover:-translate-y-2'
              >
                <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <TrendingUp className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-4xl font-bold text-gray-900 mb-2'>
                  {stats.avgSavings}%
                </h3>
                <p className='text-gray-600 font-medium'>
                  Economia Média por Viagem
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Trust & Reviews Section */}
      <section className='py-16 bg-gradient-to-br from-blue-50 to-indigo-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
              O que nossos <span className='text-blue-600'>clientes</span> dizem
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Mais de 50.000 executivos já confiam em nossa plataforma
            </p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100'
              >
                <div className='flex items-center gap-1 mb-4'>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className='w-5 h-5 text-yellow-400 fill-current'
                    />
                  ))}
                </div>
                <p className='text-gray-700 mb-6 leading-relaxed'>
                  "{testimonial.content}"
                </p>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center'>
                    <span className='font-semibold text-blue-600'>
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900'>
                      {testimonial.name}
                    </h4>
                    <p className='text-sm text-gray-600'>{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className='mt-16 bg-white rounded-3xl p-8 shadow-lg border border-gray-100'
          >
            <h3 className='text-2xl font-bold text-gray-900 text-center mb-8'>
              Certificações e Parcerias
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
              {[
                'Certificado SSL',
                'IATA Certificado',
                'Pagamento Seguro',
                'Suporte 24/7',
              ].map((badge, index) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='text-center'
                >
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3'>
                    <CheckCircle className='w-8 h-8 text-blue-600' />
                  </div>
                  <p className='font-medium text-gray-700'>{badge}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600'>
        <div className='max-w-4xl mx-auto text-center text-white'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className='text-4xl md:text-5xl font-bold mb-6'>
              Pronto para economizar em suas viagens?
            </h2>
            <p className='text-xl mb-8 text-blue-100'>
              Junte-se a milhares de executivos que já descobriram a forma mais
              inteligente de viajar
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                to='/register'
                className='bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg'
              >
                Criar Conta Gratuita
                <ArrowRight className='w-5 h-5' />
              </Link>
              <Link
                to='/search'
                className='border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105'
              >
                <Search className='w-5 h-5' />
                Buscar Voos Agora
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

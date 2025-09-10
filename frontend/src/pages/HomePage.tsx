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
  Camera
} from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const [stats, setStats] = useState({
    totalFlights: 0,
    activeAlerts: 0,
    avgSavings: 0
  });

  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    class: 'business',
    preferredAirlines: [] as string[],
    timePreference: 'any',
    amenities: [] as string[]
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    // Simular carregamento de estatísticas
    setStats({
      totalFlights: 1250,
      activeAlerts: 8,
      avgSavings: 35
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar lógica de busca
    console.log('Busca:', searchForm);
  };

  const popularDestinations = [
    { 
      city: 'Nova York', 
      country: 'Estados Unidos', 
      price: 'R$ 8.500',
      code: 'JFK',
      gradient: 'from-blue-500 to-purple-600',
      icon: '🗽'
    },
    { 
      city: 'Londres', 
      country: 'Reino Unido', 
      price: 'R$ 7.200',
      code: 'LHR',
      gradient: 'from-red-500 to-pink-600',
      icon: '🏰'
    },
    { 
      city: 'Dubai', 
      country: 'Emirados Árabes', 
      price: 'R$ 6.800',
      code: 'DXB',
      gradient: 'from-yellow-500 to-orange-600',
      icon: '🏜️'
    },
    { 
      city: 'Tóquio', 
      country: 'Japão', 
      price: 'R$ 9.200',
      code: 'NRT',
      gradient: 'from-pink-500 to-rose-600',
      icon: '🗾'
    },
    { 
      city: 'Paris', 
      country: 'França', 
      price: 'R$ 7.800',
      code: 'CDG',
      gradient: 'from-indigo-500 to-blue-600',
      icon: '🗼'
    },
    { 
      city: 'Singapura', 
      country: 'Singapura', 
      price: 'R$ 8.900',
      code: 'SIN',
      gradient: 'from-green-500 to-teal-600',
      icon: '🌆'
    }
  ];

  const premiumAirlines = [
    { name: 'Emirates', logo: '✈️', rating: 4.9 },
    { name: 'Qatar Airways', logo: '🛩️', rating: 4.8 },
    { name: 'Singapore Airlines', logo: '🛫', rating: 4.9 },
    { name: 'LATAM', logo: '✈️', rating: 4.6 }
  ];

  const timePreferences = [
    { value: 'any', label: 'Qualquer horário' },
    { value: 'morning', label: 'Manhã (06:00 - 12:00)' },
    { value: 'afternoon', label: 'Tarde (12:00 - 18:00)' },
    { value: 'evening', label: 'Noite (18:00 - 24:00)' }
  ];

  const businessAmenities = [
    { value: 'lie_flat', label: 'Assento totalmente reclinável' },
    { value: 'wifi', label: 'Wi-Fi gratuito' },
    { value: 'lounge', label: 'Acesso ao lounge' },
    { value: 'priority_boarding', label: 'Embarque prioritário' },
    { value: 'gourmet_dining', label: 'Refeições gourmet' },
    { value: 'entertainment', label: 'Sistema de entretenimento premium' }
  ];

  const features = [
    {
      icon: Search,
      title: 'Busca Inteligente',
      description: 'Compare preços de voos executivos em tempo real com nossa IA avançada',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Bell,
      title: 'Alertas Personalizados',
      description: 'Receba notificações instantâneas quando os preços baixarem',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Análise de Tendências',
      description: 'Veja o histórico de preços e tome decisões inteligentes',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Segurança Garantida',
      description: 'Transações 100% seguras e dados protegidos'
    },
    {
      icon: Clock,
      title: 'Economia de Tempo',
      description: 'Compare todas as opções em segundos'
    },
    {
      icon: Award,
      title: 'Melhor Preço',
      description: 'Garantimos os melhores preços do mercado'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section with Search */}
      <section className="relative py-16 px-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-blue-600 mb-6 border border-blue-200/50">
              <Sparkles className="w-4 h-4" />
              Plataforma #1 em Voos Executivos
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Encontre voos executivos com os
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent block">
                melhores preços
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Compare preços de voos executivos das melhores companhias aéreas e 
              encontre ofertas exclusivas com nossa tecnologia avançada.
            </p>
          </motion.div>
          
          {/* Advanced Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50"
          >
            <form onSubmit={handleSearchSubmit} className="space-y-6">
              {/* Trip Type */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <input type="radio" id="roundtrip" name="tripType" className="text-blue-600" defaultChecked />
                  <label htmlFor="roundtrip" className="text-sm font-medium text-gray-700">Ida e volta</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="oneway" name="tripType" className="text-blue-600" />
                  <label htmlFor="oneway" className="text-sm font-medium text-gray-700">Somente ida</label>
                </div>
              </div>
              
              {/* Search Fields */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* From */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">De onde</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="São Paulo (GRU)"
                      value={searchForm.from}
                      onChange={(e) => setSearchForm({...searchForm, from: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                
                {/* To */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Para onde</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nova York (JFK)"
                      value={searchForm.to}
                      onChange={(e) => setSearchForm({...searchForm, to: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                
                {/* Departure Date */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Partida</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={searchForm.departDate}
                      onChange={(e) => setSearchForm({...searchForm, departDate: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                
                {/* Return Date */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retorno</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={searchForm.returnDate}
                      onChange={(e) => setSearchForm({...searchForm, returnDate: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
              
              {/* Passengers and Class */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passageiros</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={searchForm.passengers}
                      onChange={(e) => setSearchForm({...searchForm, passengers: parseInt(e.target.value)})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {[1,2,3,4,5,6].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'passageiro' : 'passageiros'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classe</label>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={searchForm.class}
                      onChange={(e) => setSearchForm({...searchForm, class: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="business">Executiva</option>
                      <option value="first">Primeira Classe</option>
                      <option value="premium">Premium Economy</option>
                    </select>
                  </div>
                </div>
              </div>
               
               {/* Advanced Filters Toggle */}
               <div className="flex justify-center">
                 <button
                   type="button"
                   onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                   className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                 >
                   <Filter className="w-4 h-4" />
                   {showAdvancedFilters ? 'Ocultar filtros avançados' : 'Mostrar filtros avançados'}
                 </button>
               </div>
               
               {/* Advanced Filters */}
               {showAdvancedFilters && (
                 <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   transition={{ duration: 0.3 }}
                   className="space-y-6 pt-6 border-t border-gray-100"
                 >
                   {/* Preferred Airlines */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-3">Companhias Aéreas Preferenciais</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                       {premiumAirlines.map((airline) => (
                         <label key={airline.name} className="flex items-center gap-2 cursor-pointer">
                           <input
                             type="checkbox"
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                             checked={searchForm.preferredAirlines.includes(airline.name)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSearchForm({
                                   ...searchForm,
                                   preferredAirlines: [...searchForm.preferredAirlines, airline.name]
                                 });
                               } else {
                                 setSearchForm({
                                   ...searchForm,
                                   preferredAirlines: searchForm.preferredAirlines.filter(a => a !== airline.name)
                                 });
                               }
                             }}
                           />
                           <span className="text-sm text-gray-700">{airline.name}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                   
                   {/* Time Preference */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-3">Horário Preferencial</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {timePreferences.map((time) => (
                         <label key={time.value} className="flex items-center gap-2 cursor-pointer">
                           <input
                             type="radio"
                             name="timePreference"
                             value={time.value}
                             className="border-gray-300 text-blue-600 focus:ring-blue-500"
                             checked={searchForm.timePreference === time.value}
                             onChange={(e) => setSearchForm({...searchForm, timePreference: e.target.value})}
                           />
                           <span className="text-sm text-gray-700">{time.label}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                   
                   {/* Business Amenities */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-3">Amenidades Desejadas</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {businessAmenities.map((amenity) => (
                         <label key={amenity.value} className="flex items-center gap-2 cursor-pointer">
                           <input
                             type="checkbox"
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                             checked={searchForm.amenities.includes(amenity.value)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSearchForm({
                                   ...searchForm,
                                   amenities: [...searchForm.amenities, amenity.value]
                                 });
                               } else {
                                 setSearchForm({
                                   ...searchForm,
                                   amenities: searchForm.amenities.filter(a => a !== amenity.value)
                                 });
                               }
                             }}
                           />
                           <span className="text-sm text-gray-700">{amenity.label}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 </motion.div>
               )}
               
               {/* Search Button */}
               <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  <Search className="w-6 h-6" />
                  Buscar Voos Executivos
                </button>
                <Link
                  to="/alerts"
                  className="bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-lg"
                >
                  <Bell className="w-5 h-5" />
                  Criar Alerta
                </Link>
              </div>
            </form>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">4.9/5 avaliação</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="font-medium">100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <PlaneTakeoff className="w-4 h-4 text-blue-500" />
                <span className="font-medium">+1000 voos diários</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Destinations & Premium Airlines */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Popular Destinations */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Globe className="w-6 h-6 text-blue-600" />
                Destinos Populares
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {popularDestinations.map((destination, index) => (
                  <motion.div
                    key={destination.city}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${destination.gradient} rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        {destination.icon}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 font-medium">{destination.code}</span>
                        <Plane className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors ml-auto mt-1" />
                      </div>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                      {destination.city}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{destination.country}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-blue-600">{destination.price}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Heart className="w-3 h-3 mr-1" />
                        <span>Popular</span>
                      </div>
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
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-500" />
                Companhias Premium
              </h3>
              <div className="space-y-4">
                {premiumAirlines.map((airline, index) => (
                  <motion.div
                    key={airline.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer bg-gradient-to-r from-white to-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <Plane className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {airline.name}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < airline.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">{airline.rating}/5</span>
                          </div>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Reviews Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Confiança e Excelência
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Milhares de executivos confiam em nossa plataforma para suas viagens de negócios
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
            {/* Customer Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">5.0/5</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Plataforma excepcional! Economizei mais de R$ 15.000 em viagens corporativas este ano."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Marina Silva</p>
                  <p className="text-sm text-gray-600">CEO, TechCorp</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">5.0/5</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Interface intuitiva e alertas precisos. Nunca mais perco uma promoção de classe executiva."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  R
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Roberto Santos</p>
                  <p className="text-sm text-gray-600">Diretor, Global Inc</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">5.0/5</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Suporte excepcional e tecnologia de ponta. Recomendo para todos os executivos."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Ana Costa</p>
                  <p className="text-sm text-gray-600">VP, Finance Pro</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Certificações e Parcerias
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 items-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-3">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 text-center">SSL Certificado</p>
                <p className="text-xs text-gray-500 text-center">Segurança Máxima</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 text-center">IATA Certificado</p>
                <p className="text-xs text-gray-500 text-center">Padrão Internacional</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mb-3">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 text-center">5 Estrelas</p>
                <p className="text-xs text-gray-500 text-center">Avaliação Média</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-3">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 text-center">50K+ Clientes</p>
                <p className="text-xs text-gray-500 text-center">Satisfeitos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Números que <span className="text-blue-600">Impressionam</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Milhares de usuários já economizaram tempo e dinheiro com nossa plataforma
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-center border border-blue-100/50 hover:border-blue-200 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <PlaneTakeoff className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalFlights.toLocaleString()}+
              </h3>
              <p className="text-gray-600 font-medium">Voos Monitorados Diariamente</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="group bg-gradient-to-br from-white to-purple-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-center border border-purple-100/50 hover:border-purple-200 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {stats.activeAlerts}k+
              </h3>
              <p className="text-gray-600 font-medium">Alertas Ativos</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="group bg-gradient-to-br from-white to-green-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-center border border-green-100/50 hover:border-green-200 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {stats.avgSavings}%
              </h3>
              <p className="text-gray-600 font-medium">Economia Média por Viagem</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Recursos Premium
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Por que escolher o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">FlightExec</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Nossa plataforma oferece as melhores ferramentas para encontrar voos executivos com o melhor custo-benefício, 
              combinando tecnologia avançada com uma experiência de usuário excepcional.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/50 hover:border-blue-200/50 transform hover:-translate-y-2"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-purple-600 transition-colors duration-300">
                    <span className="text-sm">Saiba mais</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              Vantagens Exclusivas
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Benefícios que fazem a <span className="text-yellow-300">diferença</span>
            </h2>
            <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Descubra as vantagens de usar nossa plataforma para suas viagens executivas e 
              experimente um novo nível de conveniência e economia.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                      <benefit.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {benefit.title}
                    </h3>
                    <p className="text-blue-100 leading-relaxed mb-4">
                      {benefit.description}
                    </p>
                    <div className="flex items-center text-yellow-300 font-medium group-hover:text-yellow-200 transition-colors duration-300">
                      <span className="text-sm">Descubra mais</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Comece Agora
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Pronto para <span className="text-yellow-300">revolucionar</span><br />suas viagens?
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              Junte-se a milhares de executivos que já descobriram a melhor forma de viajar 
              com economia, conforto e praticidade.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link
              to="/search"
              className="group bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 inline-flex items-center justify-center shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
            >
              <Search className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              Buscar Voos Agora
            </Link>
            <Link
              to="/register"
              className="group border-2 border-white/50 backdrop-blur-sm bg-white/10 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 inline-flex items-center justify-center transform hover:-translate-y-1 hover:scale-105"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex items-center justify-center gap-8 text-blue-200"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">100% Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Suporte 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span className="text-sm font-medium">Avaliação 4.9/5</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
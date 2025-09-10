import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import flightSearchService, {
  FlightSearchParams,
} from '../services/flightSearchService';
import { flightService } from '../services/flightService';
import flexibleSearchService, {
  FlexibleSearchParams,
} from '../services/flexibleSearchService';
import recommendationService from '../services/recommendationService';
import airlineApiService from '../services/airlineApiService';
import cacheService from '../services/cacheService';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Buscar voos
export const searchFlights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      classType = 'business',
    } = req.query;

    // Validação básica
    if (!origin || !destination || !departureDate) {
      res.status(400).json({
        success: false,
        message: 'Origem, destino e data de partida são obrigatórios',
      });
      return;
    }

    const searchParams = {
      origin: origin as string,
      destination: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string,
      passengers: parseInt(passengers as string) || 1,
      classType: classType as 'business' | 'economy' | 'both',
    };

    logger.info('Iniciando busca de voos:', searchParams);

    const searchResult = await flightService.searchAllFlights(searchParams);

    // Salvar busca no histórico (se usuário autenticado)
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await prisma.search.create({
        data: {
          userId: authReq.user.id,
          departureCode: searchParams.origin,
          arrivalCode: searchParams.destination,
          departureDate: new Date(searchParams.departureDate),
          returnDate: searchParams.returnDate
            ? new Date(searchParams.returnDate)
            : null,
          passengers: searchParams.passengers,
          classType: 'business',
          resultsCount: searchResult.flights.length,
        },
      });
    }

    res.json({
      success: true,
      data: {
        flights: searchResult.flights,
        searchId: searchResult.searchId,
        totalResults: searchResult.flights.length,
      },
    });

    logger.info(
      `Busca concluída: ${searchResult.flights.length} voos encontrados`
    );
  } catch (error) {
    logger.error('Erro na busca de voos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar voos',
    });
  }
};

// Obter detalhes de um voo específico
export const getFlightDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { flightId } = req.params;

    if (!flightId) {
      res.status(400).json({
        success: false,
        message: 'ID do voo é obrigatório',
      });
      return;
    }

    // Buscar voo no banco de dados
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: {
        airline: true,
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 30, // Últimos 30 registros de preço
        },
      },
    });

    if (!flight) {
      res.status(404).json({
        success: false,
        message: 'Voo não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: flight,
    });

    logger.info(`Detalhes do voo ${flightId} consultados`);
  } catch (error) {
    logger.error('Erro ao obter detalhes do voo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Comparar preços de voos
export const compareFlights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { flightIds } = req.body;

    if (!flightIds || !Array.isArray(flightIds) || flightIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Lista de IDs de voos é obrigatória',
      });
      return;
    }

    if (flightIds.length > 5) {
      res.status(400).json({
        success: false,
        message: 'Máximo de 5 voos para comparação',
      });
      return;
    }

    // Buscar voos no banco
    const flights = await prisma.flight.findMany({
      where: {
        id: { in: flightIds },
      },
      include: {
        airline: true,
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Preço mais recente
        },
      },
    });

    if (flights.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Nenhum voo encontrado para comparação',
      });
      return;
    }

    // Calcular estatísticas de comparação usando businessPrice
    const prices = flights
      .map(f => (f.businessPrice ? Number(f.businessPrice) : 0))
      .filter(p => p > 0);
    const comparison = {
      flights,
      statistics: {
        cheapest: prices.length > 0 ? Math.min(...prices) : 0,
        mostExpensive: prices.length > 0 ? Math.max(...prices) : 0,
        averagePrice:
          prices.length > 0
            ? prices.reduce((a, b) => a + b, 0) / prices.length
            : 0,
        priceDifference:
          prices.length > 0 ? Math.max(...prices) - Math.min(...prices) : 0,
      },
      recommendations: {
        bestValue: flights.find(
          f =>
            f.businessPrice && Number(f.businessPrice) === Math.min(...prices)
        ),
        shortest: flights.reduce((prev, current) =>
          prev.duration < current.duration ? prev : current
        ),
        fewestStops: flights.reduce((prev, current) =>
          prev.stops < current.stops ? prev : current
        ),
      },
    };

    res.json({
      success: true,
      data: comparison,
    });

    logger.info(`Comparação realizada para ${flights.length} voos`);
  } catch (error) {
    logger.error('Erro na comparação de voos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Obter histórico de preços
export const getPriceHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { origin, destination, days = 30 } = req.query;

    if (!origin || !destination) {
      res.status(400).json({
        success: false,
        message: 'Origem e destino são obrigatórios',
      });
      return;
    }

    const daysLimit = Math.min(parseInt(days as string) || 30, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysLimit);

    // Buscar histórico de preços
    const priceHistory = await prisma.priceHistory.findMany({
      where: {
        flight: {
          departureAirport: {
            code: origin as string,
          },
          arrivalAirport: {
            code: destination as string,
          },
        },
        timestamp: {
          gte: startDate,
        },
      },
      include: {
        flight: {
          include: {
            airline: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Agrupar por data para análise de tendências
    const groupedByDate = priceHistory.reduce(
      (acc, record) => {
        const date = record.timestamp.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(record);
        return acc;
      },
      {} as Record<string, typeof priceHistory>
    );

    // Calcular estatísticas diárias
    const dailyStats = Object.entries(groupedByDate).map(([date, records]) => {
      const businessPrices = records
        .map(r => (r.businessPrice ? Number(r.businessPrice) : 0))
        .filter(p => p > 0);
      return {
        date,
        minPrice: businessPrices.length > 0 ? Math.min(...businessPrices) : 0,
        maxPrice: businessPrices.length > 0 ? Math.max(...businessPrices) : 0,
        avgPrice:
          businessPrices.length > 0
            ? businessPrices.reduce((a, b) => a + b, 0) / businessPrices.length
            : 0,
        recordCount: records.length,
      };
    });

    res.json({
      success: true,
      data: {
        route: `${origin} → ${destination}`,
        period: `${daysLimit} dias`,
        dailyStats,
        totalRecords: priceHistory.length,
        priceRange: {
          min:
            priceHistory.length > 0
              ? Math.min(
                  ...priceHistory
                    .map(p => (p.businessPrice ? Number(p.businessPrice) : 0))
                    .filter(p => p > 0)
                )
              : 0,
          max:
            priceHistory.length > 0
              ? Math.max(
                  ...priceHistory
                    .map(p => (p.businessPrice ? Number(p.businessPrice) : 0))
                    .filter(p => p > 0)
                )
              : 0,
        },
      },
    });

    logger.info(`Histórico de preços consultado: ${origin} → ${destination}`);
  } catch (error) {
    logger.error('Erro ao obter histórico de preços:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Obter aeroportos disponíveis
export const getAirports = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search, country, limit = 50 } = req.query;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (country) {
      where.country = country as string;
    }

    const airports = await prisma.airport.findMany({
      where,
      take: parseInt(limit as string) || 50,
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });

    res.json({
      success: true,
      data: airports,
    });

    logger.debug(`Consulta de aeroportos: ${airports.length} resultados`);
  } catch (error) {
    logger.error('Erro ao obter aeroportos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Obter companhias aéreas disponíveis
export const getAirlines = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { country } = req.query;

    const where: any = {
      isActive: true,
    };

    if (country) {
      where.country = country as string;
    }

    const airlines = await prisma.airline.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: airlines,
    });

    logger.debug(
      `Consulta de companhias aéreas: ${airlines.length} resultados`
    );
  } catch (error) {
    logger.error('Erro ao obter companhias aéreas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Obter estatísticas de voos
export const getFlightStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Implementação básica de estatísticas
    const totalFlights = await prisma.flight.count({
      where: { isActive: true },
    });
    const totalAirlines = await prisma.airline.count({
      where: { isActive: true },
    });
    const totalAirports = await prisma.airport.count();

    res.json({
      success: true,
      data: {
        totalFlights,
        totalAirlines,
        totalAirports,
      },
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas de voos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Comparar preços de voos e fornecer análise detalhada
export const compareFlightPrices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array(),
      });
      return;
    }

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      flightClass = 'business',
      maxPrice,
      preferredAirlines,
      directFlightsOnly = false,
    } = req.body;

    const searchParams: FlightSearchParams = {
      origin,
      destination,
      departureDate: new Date(departureDate),
      returnDate: returnDate ? new Date(returnDate) : undefined,
      passengers,
      flightClass,
      maxPrice,
      preferredAirlines,
      directFlightsOnly,
    };

    const comparison =
      await flightSearchService.compareFlightPrices(searchParams);

    // Salvar busca no histórico se usuário estiver logado
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id) {
      await prisma.search.create({
        data: {
          userId: authReq.user.id,
          departureCode: searchParams.origin,
          arrivalCode: searchParams.destination,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.returnDate || null,
          passengers: searchParams.passengers,
          classType: searchParams.flightClass,
          resultsCount: comparison.flights.length,
        },
      });
    }

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    logger.error('Erro ao comparar preços:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Erro interno do servidor',
    });
  }
};

// Buscar especificamente voos de classe executiva
export const searchBusinessClassFlights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array(),
      });
      return;
    }

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      maxPrice,
      preferredAirlines,
      directFlightsOnly = false,
    } = req.body;

    const searchParams = {
      origin,
      destination,
      departureDate: new Date(departureDate),
      returnDate: returnDate ? new Date(returnDate) : undefined,
      passengers,
      maxPrice,
      preferredAirlines,
      directFlightsOnly,
    };

    const flights =
      await flightSearchService.searchBusinessClassFlights(searchParams);

    // Salvar busca no histórico se usuário estiver logado
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id) {
      await prisma.search.create({
        data: {
          userId: authReq.user.id,
          departureCode: searchParams.origin,
          arrivalCode: searchParams.destination,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.returnDate || null,
          passengers: searchParams.passengers,
          classType: 'business',
          resultsCount: flights.length,
        },
      });
    }

    res.json({
      success: true,
      data: {
        flights,
        total: flights.length,
        searchParams: { ...searchParams, flightClass: 'business' },
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar voos executivos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar voos executivos',
    });
  }
};

// Busca flexível de voos com ofertas
export const searchFlexibleFlights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      classType = 'business',
      flexibleDays = 3,
      maxPrice,
      preferredAirlines,
      directFlightsOnly = false,
    } = req.body;

    // Validação
    if (!origin || !destination || !departureDate) {
      res.status(400).json({
        success: false,
        message: 'Origem, destino e data de partida são obrigatórios',
      });
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `flexible_${origin}_${destination}_${departureDate}_${flexibleDays}_${classType}`;
    const cachedResult = cacheService.get(cacheKey);

    if (cachedResult) {
      res.json({
        success: true,
        data: cachedResult,
        cached: true,
      });
      return;
    }

    const searchParams: FlexibleSearchParams = {
      origin: origin as string,
      destination: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string,
      passengers: parseInt(passengers as string) || 1,
      classType: classType as 'business' | 'economy' | 'first',
      flexibleDays: parseInt(flexibleDays as string) || 3,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      preferredAirlines: preferredAirlines as string[],
      directFlightsOnly:
        directFlightsOnly === 'true' || directFlightsOnly === true,
    };

    logger.info('Iniciando busca flexível de voos:', searchParams);

    const authReq = req as AuthenticatedRequest;
    const result =
      await flexibleSearchService.searchFlexibleFlights(searchParams);

    // Gerar recomendações personalizadas
    const recommendations =
      await recommendationService.generatePersonalizedRecommendations(
        result.bestOffers,
        authReq.user?.id
      );

    const finalResult = {
      ...result,
      recommendations,
    };

    // Cache do resultado
    cacheService.cacheFlexibleSearch(cacheKey, finalResult);

    // Salvar busca no histórico
    if (authReq.user) {
      await prisma.search.create({
        data: {
          userId: authReq.user.id,
          departureCode: searchParams.origin,
          arrivalCode: searchParams.destination,
          departureDate: new Date(searchParams.departureDate),
          returnDate: searchParams.returnDate
            ? new Date(searchParams.returnDate)
            : null,
          passengers: searchParams.passengers,
          classType: searchParams.classType,
          resultsCount: result.bestOffers.length,
        },
      });
    }

    res.json({
      success: true,
      data: finalResult,
    });

    logger.info(
      `Busca flexível concluída: ${result.searchMetadata.totalFlights} voos encontrados`
    );
  } catch (error: any) {
    logger.error('Erro na busca flexível de voos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor ao buscar voos',
    });
  }
};

// Buscar ofertas especiais
export const getSpecialOffers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      passengers = 1,
      classType = 'business',
    } = req.query;

    if (!origin || !destination || !departureDate) {
      res.status(400).json({
        success: false,
        message: 'Origem, destino e data de partida são obrigatórios',
      });
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `offers_${origin}_${destination}_${departureDate}_${classType}`;
    const cachedOffers = cacheService.get(cacheKey);

    if (cachedOffers) {
      res.json({
        success: true,
        data: cachedOffers,
        cached: true,
      });
      return;
    }

    const searchParams = {
      origin: origin as string,
      destination: destination as string,
      departureDate: departureDate as string,
      passengers: parseInt(passengers as string) || 1,
      classType: classType as 'business' | 'economy' | 'first',
    };

    logger.info('Buscando ofertas especiais:', searchParams);

    const offers =
      await flexibleSearchService.searchSpecialOffers(searchParams);
    const dealRecommendations =
      await recommendationService.findSpecialDeals(offers);

    const result = {
      offers,
      recommendations: dealRecommendations,
      count: offers.length,
    };

    // Cache do resultado
    cacheService.cacheSpecialOffers(
      origin as string,
      destination as string,
      new Date().toISOString().split('T')[0],
      result.offers
    );

    res.json({
      success: true,
      data: result,
    });

    logger.info(`${offers.length} ofertas especiais encontradas`);
  } catch (error: any) {
    logger.error('Erro ao buscar ofertas especiais:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor',
    });
  }
};

// Obter calendário de preços
export const getPriceCalendar = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { origin, destination, startDate, days = 30 } = req.query;

    if (!origin || !destination || !startDate) {
      res.status(400).json({
        success: false,
        message: 'Origem, destino e data inicial são obrigatórios',
      });
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `calendar_${origin}_${destination}_${startDate}_${days}`;
    const cachedCalendar = cacheService.get(cacheKey);

    if (cachedCalendar) {
      res.json({
        success: true,
        data: cachedCalendar,
        cached: true,
      });
      return;
    }

    logger.info('Gerando calendário de preços:', {
      origin,
      destination,
      startDate,
      days,
    });

    const calendar = await flexibleSearchService.generatePriceCalendar(
      origin as string,
      destination as string,
      startDate as string,
      parseInt(days as string) || 30
    );

    const result = {
      calendar,
      route: `${origin}-${destination}`,
      period: `${startDate} - ${days} dias`,
    };

    // Cache do resultado
    cacheService.cachePriceCalendar(
      origin as string,
      destination as string,
      startDate as string,
      parseInt(days as string) || 30,
      [result]
    );

    res.json({
      success: true,
      data: result,
    });

    logger.info(`Calendário de preços gerado com ${calendar.length} entradas`);
  } catch (error: any) {
    logger.error('Erro ao gerar calendário de preços:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor',
    });
  }
};

// Obter recomendações de melhor época para comprar
export const getBestBookingTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { origin, destination, targetDate } = req.query;

    if (!origin || !destination || !targetDate) {
      res.status(400).json({
        success: false,
        message: 'Origem, destino e data alvo são obrigatórios',
      });
      return;
    }

    logger.info('Analisando melhor época para comprar:', {
      origin,
      destination,
      targetDate,
    });

    const recommendation = await recommendationService.recommendBestBookingTime(
      origin as string,
      destination as string,
      targetDate as string
    );

    res.json({
      success: true,
      data: recommendation,
    });

    logger.info('Recomendação de compra gerada');
  } catch (error: any) {
    logger.error('Erro ao gerar recomendação de compra:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor',
    });
  }
};

// Sugerir rotas alternativas
export const getAlternativeRoutes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { origin, destination, maxDetour = 2 } = req.query;

    if (!origin || !destination) {
      res.status(400).json({
        success: false,
        message: 'Origem e destino são obrigatórios',
      });
      return;
    }

    logger.info('Buscando rotas alternativas:', {
      origin,
      destination,
      maxDetour,
    });

    const alternatives = await recommendationService.suggestAlternativeRoutes(
      origin as string,
      destination as string,
      parseInt(maxDetour as string) || 2
    );

    res.json({
      success: true,
      data: {
        alternatives,
        originalRoute: `${origin}-${destination}`,
        count: alternatives.length,
      },
    });

    logger.info(`${alternatives.length} rotas alternativas encontradas`);
  } catch (error: any) {
    logger.error('Erro ao buscar rotas alternativas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor',
    });
  }
};

// Monitorar preços de uma rota
export const monitorRoutePrice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      origin,
      destination,
      targetPrice,
      priceDropPercent = 10,
    } = req.body;

    if (!origin || !destination || !targetPrice) {
      res.status(400).json({
        success: false,
        message: 'Origem, destino e preço alvo são obrigatórios',
      });
      return;
    }

    logger.info('Configurando monitoramento de preços:', {
      origin,
      destination,
      targetPrice,
    });

    const isTriggered = await flexibleSearchService.monitorRoutePrice(
      origin as string,
      destination as string,
      parseFloat(targetPrice as string),
      parseInt(priceDropPercent as string) || 10
    );

    res.json({
      success: true,
      data: {
        monitoring: true,
        route: `${origin}-${destination}`,
        targetPrice: parseFloat(targetPrice as string),
        alertTriggered: isTriggered,
      },
    });

    logger.info('Monitoramento de preços configurado');
  } catch (error: any) {
    logger.error('Erro ao configurar monitoramento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor',
    });
  }
};

export default {
  searchFlights,
  getFlightDetails,
  compareFlights,
  getPriceHistory,
  getAirports,
  getAirlines,
  getFlightStats,
  compareFlightPrices,
  searchBusinessClassFlights,
  searchFlexibleFlights,
  getSpecialOffers,
  getPriceCalendar,
  getBestBookingTime,
  getAlternativeRoutes,
  monitorRoutePrice,
};

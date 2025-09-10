# Análise de Mudanças - FlightExec para Radar de Ofertas de Voos Executivos

## Visão Geral
Este documento detalha as mudanças necessárias para transformar o FlightExec em um buscador/radar de boas ofertas de voos executivos, focando em:
- Busca flexível de datas (±3-7 dias)
- Integração com APIs reais de companhias aéreas
- Foco exclusivo em classe executiva
- Redirecionamento para links de compra
- Monitoramento contínuo de ofertas

## 1. Mudanças no Backend

### 1.1 Schema do Banco de Dados
**Arquivo:** `backend/prisma/schema.prisma`

**Mudanças necessárias:**
```prisma
// Adicionar campos para ofertas flexíveis
model Flight {
  // ... campos existentes
  
  // Novos campos para ofertas
  isOffer          Boolean  @default(false)
  originalPrice    Decimal?
  discountPercent  Float?
  offerValidUntil  DateTime?
  bookingUrl       String?  // URL direta para compra
  deepLinkUrl      String?  // Deep link da companhia
  
  // Campos para busca flexível
  flexibleDates    Boolean  @default(false)
  dateRange        Int?     // ±dias de flexibilidade
  
  // Metadados da oferta
  offerSource      String?  // origem da oferta
  lastPriceCheck   DateTime @default(now())
  priceChangeAlert Boolean  @default(false)
}

// Nova tabela para ofertas especiais
model SpecialOffer {
  id               String   @id @default(cuid())
  flightId         String
  title            String
  description      String?
  discountPercent  Float
  originalPrice    Decimal
  offerPrice       Decimal
  validFrom        DateTime
  validUntil       DateTime
  maxBookings      Int?
  currentBookings  Int      @default(0)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  
  flight           Flight   @relation(fields: [flightId], references: [id])
  
  @@map("special_offers")
}

// Tabela para monitoramento de preços
model PriceAlert {
  id               String   @id @default(cuid())
  route            String   // "GRU-JFK"
  targetPrice      Decimal
  currentPrice     Decimal?
  priceDropPercent Float?   // % de queda necessária
  isTriggered      Boolean  @default(false)
  lastCheck        DateTime @default(now())
  createdAt        DateTime @default(now())
  
  @@map("price_alerts")
}
```

### 1.2 Serviços de Integração com APIs
**Arquivo:** `backend/src/services/airlineApiService.ts` (NOVO)

**Funcionalidades:**
- Integração com APIs das principais companhias:
  - LATAM Connect API
  - GOL API
  - Azul TudoAzul API
  - TAP Miles&Go API
  - Lufthansa API
  - American Airlines API
- Padronização de respostas
- Rate limiting por API
- Fallback entre APIs
- Cache inteligente por rota

### 1.3 Serviço de Busca Flexível
**Arquivo:** `backend/src/services/flexibleSearchService.ts` (NOVO)

**Funcionalidades:**
- Busca em múltiplas datas (±3-7 dias)
- Comparação de preços por período
- Identificação automática de ofertas
- Algoritmo de recomendação
- Agregação de resultados de múltiplas APIs

### 1.4 Sistema de Monitoramento
**Arquivo:** `backend/src/services/priceMonitoringService.ts` (NOVO)

**Funcionalidades:**
- Monitoramento contínuo de preços (cron jobs)
- Detecção de quedas de preço
- Alertas automáticos
- Histórico de variações
- Previsão de tendências

## 2. Mudanças no Frontend

### 2.1 Interface de Busca Flexível
**Arquivo:** `frontend/src/components/FlexibleSearchForm.tsx` (NOVO)

**Funcionalidades:**
- Seletor de flexibilidade de datas
- Visualização de calendário com preços
- Filtros avançados para ofertas
- Comparação visual de preços

### 2.2 Página de Resultados Otimizada
**Arquivo:** `frontend/src/pages/OffersPage.tsx` (NOVO)

**Funcionalidades:**
- Grid de ofertas com destaque visual
- Filtros por desconto, companhia, horário
- Ordenação por melhor oferta, preço, horário
- Links diretos para compra
- Alertas de preço em tempo real

### 2.3 Dashboard de Ofertas
**Arquivo:** `frontend/src/pages/OffersDashboard.tsx` (NOVO)

**Funcionalidades:**
- Ofertas em destaque
- Tendências de preços
- Rotas mais procuradas
- Alertas personalizados

## 3. APIs Recomendadas para Integração

### 3.1 APIs Nacionais
1. **LATAM Connect API**
   - Endpoint: https://api.latam.com/v1/
   - Classe executiva: Premium Business
   - Rate limit: 1000 req/hour

2. **GOL API**
   - Endpoint: https://api.voegol.com.br/v1/
   - Classe executiva: GOL+ Premium
   - Rate limit: 500 req/hour

3. **Azul TudoAzul API**
   - Endpoint: https://api.tudoazul.com/v2/
   - Classe executiva: Azul Business
   - Rate limit: 800 req/hour

### 3.2 APIs Internacionais
1. **Amadeus Flight Offers API**
   - Endpoint: https://api.amadeus.com/v2/
   - Cobertura global
   - Rate limit: 2000 req/hour

2. **Skyscanner API**
   - Endpoint: https://partners.api.skyscanner.net/
   - Comparação de preços
   - Rate limit: 1000 req/hour

3. **Google Flights API**
   - Endpoint: https://developers.google.com/travel/
   - Dados em tempo real
   - Rate limit: 10000 req/day

## 4. Algoritmo de Recomendação

### 4.1 Critérios de Pontuação
```typescript
interface OfferScore {
  priceScore: number;      // 0-100 (menor preço = maior score)
  timeScore: number;       // 0-100 (horários convenientes)
  airlineScore: number;    // 0-100 (qualidade da companhia)
  flexibilityScore: number; // 0-100 (flexibilidade de datas)
  totalScore: number;      // média ponderada
}
```

### 4.2 Pesos dos Critérios
- Preço: 40%
- Horário: 25%
- Companhia: 20%
- Flexibilidade: 15%

## 5. Sistema de Cache Inteligente

### 5.1 Estratégias de Cache
- **Rotas populares**: Cache de 5 minutos
- **Rotas menos procuradas**: Cache de 15 minutos
- **Ofertas especiais**: Cache de 2 minutos
- **Dados de aeroportos**: Cache de 24 horas

### 5.2 Invalidação de Cache
- Por mudança de preço significativa (>5%)
- Por expiração de ofertas
- Por atualização manual

## 6. Monitoramento e Alertas

### 6.1 Tipos de Alertas
1. **Queda de preço**: >10% de desconto
2. **Oferta relâmpago**: Disponibilidade limitada
3. **Melhor época**: Preços históricos baixos
4. **Última chance**: Ofertas expirando

### 6.2 Canais de Notificação
- Email
- Push notifications
- WhatsApp (Twilio)
- SMS

## 7. Métricas e Analytics

### 7.1 KPIs Principais
- Taxa de conversão (cliques → compras)
- Economia média por usuário
- Tempo médio de resposta das APIs
- Precisão das recomendações

### 7.2 Dashboards
- Performance das APIs
- Ofertas mais populares
- Rotas com maior demanda
- Satisfação dos usuários

## 8. Cronograma de Implementação

### Fase 1 (Semana 1-2): Fundação
- [ ] Atualizar schema do banco
- [ ] Implementar serviço de APIs
- [ ] Criar busca flexível básica

### Fase 2 (Semana 3-4): Integração
- [ ] Integrar APIs reais
- [ ] Implementar cache inteligente
- [ ] Criar sistema de monitoramento

### Fase 3 (Semana 5-6): Interface
- [ ] Atualizar frontend
- [ ] Implementar dashboard de ofertas
- [ ] Adicionar links de compra

### Fase 4 (Semana 7-8): Otimização
- [ ] Algoritmo de recomendação
- [ ] Sistema de alertas
- [ ] Testes e ajustes finais

## 9. Considerações de Segurança

### 9.1 Proteção de APIs
- Rate limiting por IP e usuário
- Autenticação JWT
- Criptografia de chaves de API
- Logs de auditoria

### 9.2 Dados Sensíveis
- Não armazenar dados de pagamento
- Criptografar preferências do usuário
- LGPD compliance
- Anonimização de dados analíticos

## 10. Custos Estimados

### 10.1 APIs (Mensal)
- Amadeus: $500-1000
- Skyscanner: $300-600
- Google Flights: $200-400
- APIs nacionais: $800-1500

### 10.2 Infraestrutura
- Servidor: $100-200/mês
- Banco de dados: $50-100/mês
- Cache (Redis): $30-60/mês
- CDN: $20-50/mês

**Total estimado: $2000-4000/mês**

## Conclusão

A transformação do FlightExec em um radar de ofertas de voos executivos requer mudanças significativas, mas o projeto já possui uma base sólida. As principais mudanças envolvem:

1. **Integração com APIs reais** das companhias aéreas
2. **Busca flexível de datas** para encontrar melhores ofertas
3. **Sistema de monitoramento contínuo** de preços
4. **Interface otimizada** para visualização de ofertas
5. **Links diretos** para compra nas companhias

Com essas implementações, o sistema se tornará uma ferramenta poderosa para encontrar as melhores ofertas de voos executivos no mercado.
# 📋 Documentação do Sistema FlightExec

## 🚀 Visão Geral

O FlightExec é um sistema completo de busca flexível de voos executivos que integra múltiplas companhias aéreas brasileiras, oferecendo aos usuários a capacidade de encontrar as melhores ofertas com flexibilidade de datas.

## 🏗️ Arquitetura do Sistema

### Backend (Node.js + TypeScript)
- **Framework**: Express.js
- **Banco de Dados**: SQLite com Prisma ORM
- **Cache**: Redis (implementação em memória para desenvolvimento)
- **APIs Externas**: Integração com LATAM, GOL, Azul

### Frontend (React + TypeScript)
- **Framework**: React 18 com Vite
- **Estilização**: Tailwind CSS
- **Estado**: React Hooks (useState, useEffect)
- **Ícones**: Lucide React

## 🔧 Configuração das APIs

### 1. Variáveis de Ambiente

Crie um arquivo `.env` no diretório `backend/` com as seguintes configurações:

```env
# Banco de Dados
DATABASE_URL="file:./dev.db"

# APIs das Companhias Aéreas
LATAM_API_KEY="sua_chave_latam_aqui"
LATAM_API_URL="https://api.latam.com/v1"

GOL_API_KEY="sua_chave_gol_aqui"
GOL_API_URL="https://api.voegol.com.br/v1"

AZUL_API_KEY="sua_chave_azul_aqui"
AZUL_API_URL="https://api.voeazul.com.br/v1"

# Configurações do Servidor
PORT=3001
NODE_ENV=development

# Cache
REDIS_URL="redis://localhost:6379"
CACHE_TTL=300

# Logs
LOG_LEVEL=info
```

### 2. Configuração das APIs das Companhias

#### LATAM Airlines
- **Endpoint**: `/flights/search`
- **Método**: POST
- **Headers**: `Authorization: Bearer {LATAM_API_KEY}`
- **Rate Limit**: 100 requests/minuto

#### GOL Linhas Aéreas
- **Endpoint**: `/flight-search`
- **Método**: GET
- **Headers**: `X-API-Key: {GOL_API_KEY}`
- **Rate Limit**: 60 requests/minuto

#### Azul Linhas Aéreas
- **Endpoint**: `/search/flights`
- **Método**: POST
- **Headers**: `Api-Key: {AZUL_API_KEY}`
- **Rate Limit**: 80 requests/minuto

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `Flight`
```prisma
model Flight {
  id          String   @id @default(cuid())
  airline     String
  flightNumber String
  origin      String
  destination String
  departureTime DateTime
  arrivalTime DateTime
  price       Float
  currency    String   @default("BRL")
  bookingUrl  String?
  deepLinkUrl String?
  isOffer     Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### `FlexibleOffer`
```prisma
model FlexibleOffer {
  id          String   @id @default(cuid())
  baseFlightId String
  flexDays    Int
  originalPrice Float
  flexiblePrice Float
  savings     Float
  validUntil  DateTime
  createdAt   DateTime @default(now())
}
```

#### `PriceAlert`
```prisma
model PriceAlert {
  id          String   @id @default(cuid())
  route       String
  targetPrice Float
  currentPrice Float
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

## 🛠️ Instalação e Configuração

### 1. Pré-requisitos
- Node.js 18+
- npm ou yarn
- Redis (opcional, para cache em produção)

### 2. Instalação do Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Instalação do Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔄 Funcionalidades Implementadas

### 1. Busca Flexível de Datas
- **Endpoint**: `POST /api/flights/search-flexible`
- **Parâmetros**:
  - `origin`: Aeroporto de origem (código IATA)
  - `destination`: Aeroporto de destino (código IATA)
  - `departureDate`: Data base de partida
  - `flexibleDays`: Dias de flexibilidade (±1 a ±7)
  - `passengers`: Número de passageiros

### 2. Sistema de Cache Inteligente
- **TTL**: 5 minutos para buscas regulares
- **TTL**: 15 minutos para ofertas especiais
- **Invalidação**: Automática quando novos preços são detectados

### 3. Algoritmo de Recomendações
- **Critérios**:
  - Menor preço (peso: 40%)
  - Menor duração (peso: 30%)
  - Ofertas especiais (peso: 20%)
  - Horários convenientes (peso: 10%)

### 4. Monitoramento de Preços
- **Frequência**: A cada 30 minutos
- **Alertas**: Notificação quando preço cai 10% ou mais
- **Histórico**: Mantém 30 dias de dados de preços

## 📱 Interface do Usuário

### Componentes Principais

#### 1. Formulário de Busca
- Campos básicos: origem, destino, data, passageiros
- Toggle para busca flexível
- Seletor de dias de flexibilidade (±1 a ±7)

#### 2. Resultados de Busca
- Lista de voos com preços e horários
- Botões de compra diretos para cada companhia
- Indicadores visuais para ofertas especiais

#### 3. Calendário de Preços
- Visualização de preços por data
- Destaque para melhores ofertas
- Navegação por mês

#### 4. Recomendações Especiais
- Cards com ofertas destacadas
- Informações de economia
- Links diretos para compra

## 🔍 Endpoints da API

### Busca Regular
```http
POST /api/flights/search
Content-Type: application/json

{
  "origin": "GRU",
  "destination": "SDU",
  "departureDate": "2024-02-15",
  "passengers": 1
}
```

### Busca Flexível
```http
POST /api/flights/search-flexible
Content-Type: application/json

{
  "origin": "GRU",
  "destination": "SDU",
  "departureDate": "2024-02-15",
  "flexibleDays": 3,
  "passengers": 1
}
```

### Ofertas Especiais
```http
GET /api/flights/special-offers?route=GRU-SDU&limit=5
```

### Calendário de Preços
```http
GET /api/flights/price-calendar?origin=GRU&destination=SDU&month=2024-02
```

## 🚨 Tratamento de Erros

### Códigos de Status
- `200`: Sucesso
- `400`: Parâmetros inválidos
- `429`: Rate limit excedido
- `500`: Erro interno do servidor
- `503`: Serviço de companhia aérea indisponível

### Fallbacks
- Cache de dados anteriores quando API está indisponível
- Dados mockados para desenvolvimento
- Retry automático com backoff exponencial

## 📈 Monitoramento e Logs

### Logs Estruturados
- **Arquivo**: `backend/logs/combined.log`
- **Formato**: JSON com timestamp, level, message
- **Níveis**: error, warn, info, debug

### Métricas Importantes
- Tempo de resposta das APIs
- Taxa de sucesso das buscas
- Cache hit ratio
- Número de ofertas encontradas

## 🔒 Segurança

### Medidas Implementadas
- Rate limiting por IP
- Validação de entrada com Joi
- Sanitização de dados
- Headers de segurança (CORS, CSP)
- Logs de auditoria

### Recomendações para Produção
- HTTPS obrigatório
- Autenticação JWT
- Criptografia de dados sensíveis
- Backup automático do banco
- Monitoramento de segurança

## 🚀 Deploy

### Desenvolvimento
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Produção
```bash
# Build
npm run build

# Start
npm start
```

### Docker (Opcional)
```dockerfile
# Dockerfile exemplo para backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte os logs em `backend/logs/`
- Verifique a configuração das APIs
- Teste a conectividade com as companhias aéreas
- Monitore o uso de cache e performance

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2024  
**Autor**: Equipe FlightExec
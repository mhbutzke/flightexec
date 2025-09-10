# 🔧 Guia de Configuração das APIs de Companhias Aéreas

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [LATAM Airlines](#latam-airlines)
3. [GOL Linhas Aéreas](#gol-linhas-aéreas)
4. [Azul Linhas Aéreas](#azul-linhas-aéreas)
5. [Configuração do Ambiente](#configuração-do-ambiente)
6. [Testes de Integração](#testes-de-integração)
7. [Troubleshooting](#troubleshooting)

## 🌟 Visão Geral

Este guia detalha como configurar e integrar as APIs das principais companhias aéreas brasileiras no sistema FlightExec. Cada companhia possui suas particularidades de autenticação, endpoints e formatos de dados.

## ✈️ LATAM Airlines

### Configuração Inicial

#### 1. Obtenção da API Key
1. Acesse o [Portal de Desenvolvedores LATAM](https://developer.latam.com)
2. Crie uma conta corporativa
3. Solicite acesso à API de Busca de Voos
4. Aguarde aprovação (2-5 dias úteis)
5. Obtenha sua `API_KEY` e `CLIENT_SECRET`

#### 2. Configuração no Sistema
```env
# .env
LATAM_API_KEY="lat_live_abc123def456ghi789"
LATAM_CLIENT_SECRET="secret_xyz789abc123def456"
LATAM_API_URL="https://api.latam.com/v2"
LATAM_ENVIRONMENT="production" # ou "sandbox"
```

#### 3. Endpoints Disponíveis

**Busca de Voos**
```http
POST /flights/search
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "origin": "GRU",
  "destination": "SDU",
  "departureDate": "2024-02-15",
  "returnDate": null,
  "passengers": {
    "adults": 1,
    "children": 0,
    "infants": 0
  },
  "cabinClass": "ECONOMY"
}
```

**Resposta Esperada**
```json
{
  "flights": [
    {
      "id": "LA3001",
      "airline": "LATAM",
      "flightNumber": "LA3001",
      "origin": "GRU",
      "destination": "SDU",
      "departureTime": "2024-02-15T08:30:00Z",
      "arrivalTime": "2024-02-15T09:45:00Z",
      "price": {
        "amount": 450.00,
        "currency": "BRL"
      },
      "bookingUrl": "https://www.latam.com/booking/LA3001",
      "availability": 9
    }
  ]
}
```

#### 4. Rate Limits
- **Produção**: 100 requests/minuto
- **Sandbox**: 20 requests/minuto
- **Header de controle**: `X-RateLimit-Remaining`

## 🛩️ GOL Linhas Aéreas

### Configuração Inicial

#### 1. Obtenção da API Key
1. Acesse o [Portal B2B GOL](https://b2b.voegol.com.br/developers)
2. Registre sua empresa
3. Solicite credenciais de API
4. Complete o processo de homologação
5. Receba suas credenciais de produção

#### 2. Configuração no Sistema
```env
# .env
GOL_API_KEY="gol_prod_123abc456def789ghi"
GOL_PARTNER_ID="PARTNER_12345"
GOL_API_URL="https://api.voegol.com.br/v1"
GOL_ENVIRONMENT="production"
```

#### 3. Endpoints Disponíveis

**Busca de Voos**
```http
GET /flight-search?origin=GRU&destination=SDU&departureDate=2024-02-15&passengers=1
X-API-Key: {GOL_API_KEY}
X-Partner-ID: {GOL_PARTNER_ID}
```

**Resposta Esperada**
```json
{
  "searchId": "search_789xyz123abc",
  "flights": [
    {
      "flightId": "G31001",
      "airline": "GOL",
      "flightNumber": "G31001",
      "route": {
        "origin": "GRU",
        "destination": "SDU"
      },
      "schedule": {
        "departure": "2024-02-15T10:15:00-03:00",
        "arrival": "2024-02-15T11:30:00-03:00"
      },
      "pricing": {
        "totalPrice": 380.50,
        "currency": "BRL",
        "fareClass": "LIGHT"
      },
      "bookingUrl": "https://www.voegol.com.br/booking/G31001",
      "seatsAvailable": 15
    }
  ]
}
```

#### 4. Rate Limits
- **Produção**: 60 requests/minuto
- **Homologação**: 10 requests/minuto
- **Header de controle**: `X-Rate-Limit-Remaining`

## 🔵 Azul Linhas Aéreas

### Configuração Inicial

#### 1. Obtenção da API Key
1. Acesse o [Portal de Parceiros Azul](https://partners.voeazul.com.br)
2. Cadastre-se como agência de viagens
3. Solicite acesso à API de Distribuição
4. Passe pelo processo de certificação
5. Obtenha suas credenciais

#### 2. Configuração no Sistema
```env
# .env
AZUL_API_KEY="azul_live_456def789ghi123abc"
AZUL_AGENCY_CODE="AG12345"
AZUL_API_URL="https://api.voeazul.com.br/v1"
AZUL_ENVIRONMENT="production"
```

#### 3. Endpoints Disponíveis

**Busca de Voos**
```http
POST /search/flights
Api-Key: {AZUL_API_KEY}
Agency-Code: {AZUL_AGENCY_CODE}
Content-Type: application/json

{
  "searchCriteria": {
    "origin": "GRU",
    "destination": "SDU",
    "departureDate": "2024-02-15",
    "passengerCount": 1,
    "cabinPreference": "ECONOMY"
  }
}
```

**Resposta Esperada**
```json
{
  "searchToken": "azul_search_abc123def456",
  "results": [
    {
      "flightKey": "AD4001_20240215",
      "airline": "AZUL",
      "flightNumber": "AD4001",
      "origin": {
        "code": "GRU",
        "name": "São Paulo/Guarulhos"
      },
      "destination": {
        "code": "SDU",
        "name": "Rio de Janeiro/Santos Dumont"
      },
      "departure": "2024-02-15T07:00:00-03:00",
      "arrival": "2024-02-15T08:15:00-03:00",
      "fare": {
        "total": 420.90,
        "currency": "BRL",
        "type": "MAIS_AZUL"
      },
      "bookingUrl": "https://www.voeazul.com.br/booking/AD4001",
      "availability": 12
    }
  ]
}
```

#### 4. Rate Limits
- **Produção**: 80 requests/minuto
- **Homologação**: 15 requests/minuto
- **Header de controle**: `X-RateLimit-Limit`

## ⚙️ Configuração do Ambiente

### 1. Arquivo .env Completo
```env
# Banco de Dados
DATABASE_URL="file:./dev.db"

# LATAM Airlines
LATAM_API_KEY="lat_live_abc123def456ghi789"
LATAM_CLIENT_SECRET="secret_xyz789abc123def456"
LATAM_API_URL="https://api.latam.com/v2"
LATAM_ENVIRONMENT="production"

# GOL Linhas Aéreas
GOL_API_KEY="gol_prod_123abc456def789ghi"
GOL_PARTNER_ID="PARTNER_12345"
GOL_API_URL="https://api.voegol.com.br/v1"
GOL_ENVIRONMENT="production"

# Azul Linhas Aéreas
AZUL_API_KEY="azul_live_456def789ghi123abc"
AZUL_AGENCY_CODE="AG12345"
AZUL_API_URL="https://api.voeazul.com.br/v1"
AZUL_ENVIRONMENT="production"

# Configurações Gerais
PORT=3001
NODE_ENV=production
REDIS_URL="redis://localhost:6379"
CACHE_TTL=300
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Validação das Configurações

Crie um script de validação:

```javascript
// scripts/validate-apis.js
const axios = require('axios');
require('dotenv').config();

async function validateAPIs() {
  const results = {
    latam: false,
    gol: false,
    azul: false
  };

  // Teste LATAM
  try {
    const response = await axios.get(`${process.env.LATAM_API_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${process.env.LATAM_API_KEY}`
      }
    });
    results.latam = response.status === 200;
  } catch (error) {
    console.error('LATAM API Error:', error.message);
  }

  // Teste GOL
  try {
    const response = await axios.get(`${process.env.GOL_API_URL}/health`, {
      headers: {
        'X-API-Key': process.env.GOL_API_KEY,
        'X-Partner-ID': process.env.GOL_PARTNER_ID
      }
    });
    results.gol = response.status === 200;
  } catch (error) {
    console.error('GOL API Error:', error.message);
  }

  // Teste Azul
  try {
    const response = await axios.get(`${process.env.AZUL_API_URL}/health`, {
      headers: {
        'Api-Key': process.env.AZUL_API_KEY,
        'Agency-Code': process.env.AZUL_AGENCY_CODE
      }
    });
    results.azul = response.status === 200;
  } catch (error) {
    console.error('Azul API Error:', error.message);
  }

  console.log('API Validation Results:', results);
  return results;
}

validateAPIs();
```

## 🧪 Testes de Integração

### 1. Teste de Busca Básica
```bash
# Teste LATAM
curl -X POST "http://localhost:3001/api/flights/search" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "GRU",
    "destination": "SDU",
    "departureDate": "2024-02-15",
    "passengers": 1,
    "airline": "LATAM"
  }'

# Teste GOL
curl -X POST "http://localhost:3001/api/flights/search" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "GRU",
    "destination": "SDU",
    "departureDate": "2024-02-15",
    "passengers": 1,
    "airline": "GOL"
  }'

# Teste Azul
curl -X POST "http://localhost:3001/api/flights/search" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "GRU",
    "destination": "SDU",
    "departureDate": "2024-02-15",
    "passengers": 1,
    "airline": "AZUL"
  }'
```

### 2. Teste de Busca Flexível
```bash
curl -X POST "http://localhost:3001/api/flights/search-flexible" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "GRU",
    "destination": "SDU",
    "departureDate": "2024-02-15",
    "flexibleDays": 3,
    "passengers": 1
  }'
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro 401 - Unauthorized
**Causa**: API Key inválida ou expirada
**Solução**:
- Verifique se a API Key está correta no .env
- Confirme se a key não expirou
- Teste a autenticação diretamente com a API

#### 2. Erro 429 - Rate Limit Exceeded
**Causa**: Muitas requisições em pouco tempo
**Solução**:
- Implemente backoff exponencial
- Use cache para reduzir chamadas
- Monitore os headers de rate limit

#### 3. Erro 503 - Service Unavailable
**Causa**: API da companhia aérea indisponível
**Solução**:
- Implemente fallback para cache
- Use circuit breaker pattern
- Monitore status das APIs

#### 4. Timeout de Requisição
**Causa**: API lenta ou sobregregada
**Solução**:
- Aumente o timeout (máximo 30s)
- Implemente retry com backoff
- Use requisições paralelas quando possível

### Logs de Debug

Para debugar problemas, ative logs detalhados:

```env
LOG_LEVEL=debug
API_DEBUG=true
```

E monitore os arquivos de log:
```bash
tail -f backend/logs/combined.log | grep "API_CALL"
```

### Monitoramento de Saúde

Crie um endpoint de health check:

```javascript
// routes/health.js
app.get('/health/apis', async (req, res) => {
  const health = {
    latam: await checkLatamHealth(),
    gol: await checkGolHealth(),
    azul: await checkAzulHealth(),
    timestamp: new Date().toISOString()
  };
  
  const allHealthy = Object.values(health).every(status => status === true);
  
  res.status(allHealthy ? 200 : 503).json(health);
});
```

## 📞 Suporte das Companhias

### LATAM Airlines
- **Email**: api-support@latam.com
- **Telefone**: +55 11 2445-2500
- **Horário**: Segunda a Sexta, 8h às 18h

### GOL Linhas Aéreas
- **Email**: b2b-support@voegol.com.br
- **Telefone**: +55 11 2125-3200
- **Horário**: Segunda a Sexta, 7h às 19h

### Azul Linhas Aéreas
- **Email**: partners-api@voeazul.com.br
- **Telefone**: +55 11 4003-1118
- **Horário**: Segunda a Sexta, 8h às 17h

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2024  
**Próxima Revisão**: Março 2024
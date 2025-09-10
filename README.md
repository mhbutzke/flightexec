# ✈️ FlightExec - Sistema de Busca Flexível de Voos Executivos

Sistema completo de busca de voos executivos com integração a múltiplas companhias aéreas brasileiras, oferecendo busca flexível de datas, recomendações inteligentes e links diretos para compra.

## 🚀 Funcionalidades Principais

- **Busca Flexível de Datas**: Encontre voos com ±1 a ±7 dias de flexibilidade
- **Integração Multi-Companhias**: LATAM, GOL, Azul e outras
- **Recomendações Inteligentes**: Algoritmo que sugere as melhores ofertas
- **Cache Inteligente**: Performance otimizada com sistema de cache
- **Links Diretos**: Redirecionamento direto para compra nas companhias
- **Calendário de Preços**: Visualização de preços por data
- **Monitoramento de Ofertas**: Sistema de alertas para melhores preços

## 🏗️ Tecnologias Utilizadas

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados (desenvolvimento)
- **Redis** - Cache (produção)
- **Winston** - Sistema de logs

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **React Hooks** - Gerenciamento de estado

## 📋 Pré-requisitos

- **Node.js 18+**
- **npm** ou **yarn**
- **Redis** (opcional, para cache em produção)

## 🚀 Instalação Rápida

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/flightexec.git
cd flightexec
```

### 2. Configuração do Backend
```bash
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais das APIs

# Configure o banco de dados
npx prisma generate
npx prisma db push

# Inicie o servidor backend
npm run dev
```

### 3. Configuração do Frontend
```bash
cd ../frontend
npm install

# Inicie o servidor frontend
npm run dev
```

### 4. Acesse a aplicação
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## ⚙️ Configuração das APIs

Para utilizar as funcionalidades completas, configure as APIs das companhias aéreas no arquivo `.env`:

```env
# LATAM Airlines
LATAM_API_KEY="sua_chave_latam"
LATAM_API_URL="https://api.latam.com/v2"

# GOL Linhas Aéreas
GOL_API_KEY="sua_chave_gol"
GOL_API_URL="https://api.voegol.com.br/v1"

# Azul Linhas Aéreas
AZUL_API_KEY="sua_chave_azul"
AZUL_API_URL="https://api.voeazul.com.br/v1"
```

📖 **Guia Completo**: Consulte o [Guia de Configuração das APIs](GUIA_CONFIGURACAO_APIS.md) para instruções detalhadas.

## 🛠️ Configuração Avançada

### Configuração do Banco de Dados PostgreSQL

1. Crie um banco PostgreSQL:
```sql
CREATE DATABASE flightexec;
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Edite o arquivo `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/flightexec"

# JWT
JWT_SECRET="seu-jwt-secret-muito-seguro"
JWT_EXPIRES_IN="7d"

# APIs de Voos
GOOGLE_FLIGHTS_API_KEY="sua-chave-google-flights"
LATAM_API_KEY="sua-chave-latam"
GOL_API_KEY="sua-chave-gol"
AZUL_API_KEY="sua-chave-azul"

# Email (SendGrid)
SENDGRID_API_KEY="sua-chave-sendgrid"
FROM_EMAIL="noreply@flightexec.com"

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID="seu-twilio-sid"
TWILIO_AUTH_TOKEN="seu-twilio-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Server
PORT=5000
```

4. Execute as migrações:
```bash
npx prisma migrate dev
npx prisma generate
```

5. (Opcional) Popule o banco com dados de exemplo:
```bash
npx prisma db seed
```

### Configuração do Frontend Avançada

```bash
cd ../frontend
npm install
```

Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

## 🚀 Executando o Projeto

### Desenvolvimento

1. **Backend** (Terminal 1):
```bash
cd backend
npm run dev
```

2. **Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

3. Acesse:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Documentação da API: http://localhost:5000/api-docs

### Produção

1. **Build do Frontend**:
```bash
cd frontend
npm run build
```

2. **Build do Backend**:
```bash
cd backend
npm run build
```

3. **Executar em produção**:
```bash
cd backend
npm start
```

## 📊 Monitoramento e Cache

### Sistema de Cache
- **Buscas de voos**: Cache de 15 minutos
- **Histórico de preços**: Cache de 1 hora
- **Dados de aeroportos**: Cache de 24 horas

### Rate Limiting
- **Buscas de voos**: 20 requisições por 5 minutos
- **Autenticação**: 5 tentativas por 15 minutos
- **APIs gerais**: 100 requisições por 15 minutos
- **Usuários autenticados**: 200 requisições por 15 minutos

## 📱 Como Usar

### 1. Busca Básica de Voos
1. Acesse http://localhost:5173
2. Preencha **origem**, **destino** e **data**
3. Selecione o **número de passageiros**
4. Clique em **"Buscar Voos"**
5. Compare preços e horários
6. Clique em **"Comprar na [Companhia]"** para ser redirecionado

### 2. Busca Flexível de Datas
1. Ative o toggle **"Busca Flexível"**
2. Selecione a **flexibilidade de dias** (±1 a ±7)
3. Clique em **"Buscar com Flexibilidade"**
4. Visualize o **calendário de preços**
5. Explore as **recomendações especiais**

### 3. Recursos Avançados
- **Calendário de Preços**: Veja variações por data
- **Ofertas Especiais**: Descontos e promoções destacadas
- **Recomendações**: Sugestões baseadas em algoritmos inteligentes
- **Links Diretos**: Compra direta nas companhias aéreas

## 📊 Endpoints da API

### Busca Regular
```http
POST /api/flights/search
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

## 🔧 Scripts Disponíveis

### Backend
- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm start` - Executar versão de produção
- `npm run test` - Executar testes
- `npm run migrate` - Executar migrações do banco

### Frontend
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview da build de produção
- `npm run test` - Executar testes
- `npm run lint` - Verificar código com ESLint

## 🌐 Deploy

### Opções de Deploy

#### 1. Docker (Recomendado)
```bash
# Build das imagens
docker-compose build

# Executar em produção
docker-compose up -d
```

#### 2. Vercel (Frontend) + Railway (Backend)
- Frontend: Deploy automático no Vercel
- Backend: Deploy no Railway com PostgreSQL

#### 3. AWS/DigitalOcean
- EC2/Droplet com PM2 para o backend
- S3/Spaces para arquivos estáticos
- RDS/Managed Database para PostgreSQL

## 🔒 Segurança

- **Autenticação JWT** com refresh tokens
- **Rate limiting** por IP e usuário
- **Validação de entrada** em todas as rotas
- **Sanitização de dados** para prevenir XSS
- **CORS configurado** adequadamente
- **Headers de segurança** com Helmet.js

## 📈 Performance

- **Cache inteligente** para reduzir chamadas às APIs
- **Compressão gzip** habilitada
- **Lazy loading** de componentes React
- **Otimização de bundle** com Vite
- **Índices de banco** otimizados

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**:
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no `.env`
   - Execute `npx prisma migrate dev`

2. **APIs de voos não funcionam**:
   - Verifique as chaves de API no `.env`
   - Confirme se as APIs estão ativas
   - Verifique os logs do servidor

3. **Frontend não conecta com backend**:
   - Confirme se o backend está rodando na porta 5000
   - Verifique a configuração de CORS
   - Confirme as URLs no `.env` do frontend

## 📚 Documentação Completa

- 📖 [**Documentação do Sistema**](DOCUMENTACAO_SISTEMA.md) - Guia completo da arquitetura e funcionalidades
- 🔧 [**Guia de Configuração das APIs**](GUIA_CONFIGURACAO_APIS.md) - Instruções detalhadas para integração com companhias aéreas
- 📋 [**Análise de Mudanças**](ANALISE_MUDANCAS_RADAR_VOOS.md) - Detalhamento das implementações realizadas

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
# Build do projeto
npm run build

# Iniciar em produção
npm start
```

### Docker (Opcional)
```dockerfile
# Exemplo de Dockerfile para backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔍 Monitoramento

### Logs
- **Localização**: `backend/logs/`
- **Formato**: JSON estruturado
- **Níveis**: error, warn, info, debug

### Health Check
```bash
# Verificar status das APIs
curl http://localhost:3001/health/apis

# Status geral do sistema
curl http://localhost:3001/health
```

## 🤝 Contribuição

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um **Pull Request**

### Padrões de Código
- **TypeScript** para tipagem estática
- **ESLint** para linting
- **Prettier** para formatação
- **Conventional Commits** para mensagens de commit

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- 📧 **Email**: suporte@flightexec.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/flightexec/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/flightexec/discussions)

## 🏆 Funcionalidades Implementadas

- ✅ **Busca flexível de datas** com ±1 a ±7 dias
- ✅ **Integração com APIs** das principais companhias aéreas
- ✅ **Sistema de cache inteligente** para performance
- ✅ **Algoritmo de recomendações** baseado em preço e conveniência
- ✅ **Interface moderna** com React e Tailwind CSS
- ✅ **Links diretos** para compra nas companhias
- ✅ **Calendário de preços** visual e interativo
- ✅ **Monitoramento de ofertas** especiais
- ✅ **Sistema de logs** estruturado
- ✅ **Documentação completa** do sistema

---

**Desenvolvido com ❤️ pela equipe FlightExec**  
**Versão**: 1.0.0 | **Última atualização**: Janeiro 2024
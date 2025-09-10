# FlightExec - Sistema de Comparação de Voos Executivos

Um sistema completo para comparação de preços de voos executivos com alertas personalizados e monitoramento em tempo real.

## 🚀 Funcionalidades

- **Comparação de Preços**: Integração com múltiplas APIs de companhias aéreas
- **Alertas Personalizados**: Notificações por email e WhatsApp quando preços atingem valores desejados
- **Histórico de Preços**: Análise de tendências e variações de preços
- **Interface Responsiva**: Frontend React moderno e intuitivo
- **Sistema de Cache**: Otimização de performance com cache inteligente
- **Rate Limiting**: Proteção contra uso excessivo das APIs
- **Autenticação Segura**: Sistema completo de login e gerenciamento de usuários

## 🏗️ Arquitetura

### Backend (Node.js + Express)
- **API RESTful** com TypeScript
- **Banco de dados** PostgreSQL com Prisma ORM
- **Cache** com NodeCache para otimização
- **Rate Limiting** configurável por endpoint
- **WebSocket** para atualizações em tempo real
- **Sistema de Alertas** com notificações automáticas

### Frontend (React + TypeScript)
- **Interface responsiva** com Tailwind CSS
- **Estado global** com Zustand
- **Comunicação em tempo real** via WebSocket
- **Formulários validados** com React Hook Form
- **Componentes reutilizáveis** e modulares

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

## 🛠️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd FlightExec
```

### 2. Configuração do Backend

```bash
cd backend
npm install
```

#### Configuração do Banco de Dados

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

### 3. Configuração do Frontend

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

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@flightexec.com

---

**FlightExec** - Encontre os melhores preços para voos executivos! ✈️
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import { prisma } from '../setup';

describe('Auth Integration Tests', () => {
  let server: any;

  beforeAll(async () => {
    // Inicializar servidor para testes
    const port = process.env.PORT || 3002;
    server = app.listen(port);
  });

  afterAll(async () => {
    // Fechar servidor
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Limpar dados antes de cada teste
    await prisma.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: {
            name: userData.name,
            email: userData.email,
          },
          token: expect.any(String),
        },
      });

      // Verificar se usuário foi criado no banco
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(userInDb).toBeTruthy();
      expect(userInDb?.name).toBe(userData.name);
    });

    it('deve retornar erro para email duplicado', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123',
      };

      // Criar usuário primeiro
      await request(app).post('/api/auth/register').send(userData);

      // Tentar criar novamente
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Usuário já existe com este email',
      });
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Nome, email e senha são obrigatórios',
      });
    });

    it('deve validar formato do email', async () => {
      const userData = {
        name: 'João Silva',
        email: 'email_invalido',
        password: 'senha123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Formato de email inválido',
      });
    });

    it('deve validar tamanho mínimo da senha', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para testes de login
      await request(app).post('/api/auth/register').send({
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123',
      });
    });

    it('deve fazer login com credenciais válidas', async () => {
      const loginData = {
        email: 'joao@teste.com',
        password: 'senha123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            email: loginData.email,
            name: 'João Silva',
          },
          token: expect.any(String),
        },
      });
    });

    it('deve retornar erro para credenciais inválidas', async () => {
      const loginData = {
        email: 'joao@teste.com',
        password: 'senha_errada',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Credenciais inválidas',
      });
    });

    it('deve retornar erro para usuário não encontrado', async () => {
      const loginData = {
        email: 'naoexiste@teste.com',
        password: 'senha123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Credenciais inválidas',
      });
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Email e senha são obrigatórios',
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      // Registrar e fazer login para obter token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao@teste.com',
          password: 'senha123',
        });

      authToken = registerResponse.body.data.token;
    });

    it('deve retornar perfil do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            name: 'João Silva',
            email: 'joao@teste.com',
          },
        },
      });
    });

    it('deve retornar erro sem token de autenticação', async () => {
      const response = await request(app).get('/api/auth/profile').expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Token de acesso requerido',
      });
    });

    it('deve retornar erro com token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Token inválido',
      });
    });
  });
});

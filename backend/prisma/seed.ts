import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar companhias aéreas brasileiras
  const airlines = await Promise.all([
    prisma.airline.create({
      data: {
        code: 'G3',
        name: 'GOL Linhas Aéreas',
        country: 'Brasil'
      }
    }),
    prisma.airline.create({
      data: {
        code: 'AD',
        name: 'Azul Linhas Aéreas',
        country: 'Brasil'
      }
    }),
    prisma.airline.create({
      data: {
        code: 'JJ',
        name: 'LATAM Airlines Brasil',
        country: 'Brasil'
      }
    })
  ]);

  console.log(`✅ Criadas ${airlines.length} companhias aéreas`);

  // Criar aeroportos brasileiros principais
  const airports = await Promise.all([
    prisma.airport.create({
      data: {
        code: 'GRU',
        name: 'Aeroporto Internacional de São Paulo/Guarulhos',
        city: 'São Paulo',
        country: 'Brasil',
        timezone: 'America/Sao_Paulo'
      }
    }),
    prisma.airport.create({
      data: {
        code: 'CGH',
        name: 'Aeroporto de São Paulo/Congonhas',
        city: 'São Paulo',
        country: 'Brasil',
        timezone: 'America/Sao_Paulo'
      }
    }),
    prisma.airport.create({
      data: {
        code: 'GIG',
        name: 'Aeroporto Internacional do Rio de Janeiro/Galeão',
        city: 'Rio de Janeiro',
        country: 'Brasil',
        timezone: 'America/Sao_Paulo'
      }
    }),
    prisma.airport.create({
      data: {
        code: 'BSB',
        name: 'Aeroporto Internacional de Brasília',
        city: 'Brasília',
        country: 'Brasil',
        timezone: 'America/Sao_Paulo'
      }
    })
  ]);

  console.log(`✅ Criados ${airports.length} aeroportos`);

  // Criar usuário de teste
  const testUser = await prisma.user.create({
    data: {
      email: 'teste@flightexec.com',
      name: 'Usuário Teste',
      password: '$2b$10$rQZ8kHWKQYXHjQXHjQXHjQXHjQXHjQXHjQXHjQXHjQXHjQXHjQXHjQ'
    }
  });

  console.log(`✅ Criado usuário de teste: ${testUser.email}`);

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
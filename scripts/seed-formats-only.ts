import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando seeds de formatos de campeonatos...\n');

  try {
    // Limpar formatos existentes primeiro
    console.log('🗑️  Removendo formatos existentes...');
    await prisma.leagueFormat.deleteMany({});
    console.log('✓ Formatos removidos\n');
    
    // Criar formatos um por vez usando create ao invés de upsert
    console.log('📋 Criando formato: Rachão');
    await prisma.leagueFormat.create({
      data: {
        name: 'Rachão',
        slug: 'rachao',
        description: 'Formato simples e flexível para torneios rápidos entre amigos',
        type: 'CUSTOM',
        isTemplate: true,
      },
    });
    
    console.log('📋 Criando formato: Copa do Brasil');
    await prisma.leagueFormat.create({
      data: {
        name: 'Copa do Brasil',
        slug: 'copa-do-brasil',
        description: 'Sistema eliminatório com partidas de ida e volta',
        type: 'KNOCKOUT',
        isTemplate: true,
      },
    });
    
    console.log('📋 Criando formato: Libertadores');
    await prisma.leagueFormat.create({
      data: {
        name: 'Libertadores',
        slug: 'libertadores',
        description: 'Fase de grupos seguida de mata-mata',
        type: 'MIXED',
        isTemplate: true,
      },
    });
    
    console.log('📋 Criando formato: Copa do Mundo');
    await prisma.leagueFormat.create({
      data: {
        name: 'Copa do Mundo',
        slug: 'copa-do-mundo',
        description: 'Fase de grupos seguida de mata-mata em jogo único',
        type: 'MIXED',
        isTemplate: true,
      },
    });
    
    console.log('📋 Criando formato: Champions League');
    await prisma.leagueFormat.create({
      data: {
        name: 'Champions League',
        slug: 'champions-league',
        description: 'Fase de liga única seguida de playoffs e mata-mata',
        type: 'LEAGUE_PHASE',
        isTemplate: true,
      },
    });
    
    console.log('📋 Criando formato: Brasileirão');
    await prisma.leagueFormat.create({
      data: {
        name: 'Brasileirão',
        slug: 'brasileirao',
        description: 'Pontos corridos - todos contra todos',
        type: 'ROUND_ROBIN',
        isTemplate: true,
      },
    });
    
    console.log('📋 Criando formato: Estadual (Paulista)');
    await prisma.leagueFormat.create({
      data: {
        name: 'Estadual (Paulista)',
        slug: 'estadual-paulista',
        description: 'Fase de grupos seguida de mata-mata',
        type: 'MIXED',
        isTemplate: true,
      },
    });
    
    console.log('\n✅ 7 formatos criados com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao criar seeds de formatos:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

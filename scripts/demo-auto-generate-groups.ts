import 'dotenv/config';
import { prisma } from '../src/infra/prisma/client.js';

/**
 * Script de demonstração: Criação automática de grupos para Copa do Mundo
 * 
 * Demonstra como a automação funciona:
 * 1. Seleciona formato "Copa do Mundo"
 * 2. Sistema automaticamente cria 8 grupos (A-H)
 * 3. Usuário pode adicionar/remover grupos pelo front
 */

async function demonstrateAutoGroupCreation() {
  console.log('🎯 Demonstração: Criação Automática de Grupos\n');

  try {
    // 1. Buscar formato Copa do Mundo
    const worldCupFormat = await prisma.leagueFormat.findFirst({
      where: {
        name: 'Copa do Mundo',
        isTemplate: true,
      },
    });

    if (!worldCupFormat) {
      console.log('❌ Formato Copa do Mundo não encontrado. Execute seed-formats-only.ts primeiro.');
      return;
    }

    console.log('✅ Formato encontrado:', worldCupFormat.name);

    // 2. Buscar ou criar usuário ADMIN para criar a liga
    let admin = await prisma.user.findFirst({
      where: {
        email: 'admin@futi.com',
      },
    });

    if (!admin) {
      console.log('⚠️  Usuário admin não encontrado, criando...');
      admin = await prisma.user.create({
        data: {
          email: 'admin@futi.com',
          displayName: 'Admin Demo',
          firebaseUid: 'demo-admin-' + Date.now(),
        },
      });
      console.log('✅ Usuário admin criado');
    }

    // 3. Criar liga com formato Copa do Mundo
    const league = await prisma.league.create({
      data: {
        name: 'Copa FUT7 2026',
        slug: 'copa-fut7-2026',
        description: 'Copa do Mundo de FUT7',
        formatId: worldCupFormat.id,
        matchFormat: 'FUT7',
        isPublic: true,
        startAt: new Date('2026-06-01'),
        endAt: new Date('2026-07-15'),
      },
    });

    console.log('✅ Liga criada:', league.name);
    console.log('   ID:', league.id);

    // 4. Dar permissão LEAGUE_MANAGER ao admin
    await prisma.accessMembership.create({
      data: {
        userId: admin.id,
        leagueId: league.id,
        role: 'LEAGUE_MANAGER',
      },
    });

    console.log('✅ Permissão LEAGUE_MANAGER concedida');

    // 5. Simular chamada ao endpoint POST /api/leagues/:id/generate-groups
    console.log('\n📡 Simulando: POST /api/leagues/' + league.id + '/generate-groups');
    console.log('Body: { "namingPattern": "LETTER" }');

    const { GenerateGroupsUseCase } = await import(
      '../src/domain/usecases/generate-groups/generate-groups.usecase.js'
    );

    const useCase = new GenerateGroupsUseCase(prisma);
    const result = await useCase.execute({
      leagueId: league.id,
      userId: admin.id,
      namingPattern: 'LETTER',
    });

    console.log('\n✅ Grupos criados automaticamente:');
    console.log('   Total:', result.groups.length);
    result.groups.forEach((group) => {
      console.log(`   - Grupo ${group.name} (ID: ${group.id})`);
    });

    // 6. Verificar grupos criados
    const groups = await prisma.leagueGroup.findMany({
      where: { leagueId: league.id },
      orderBy: { name: 'asc' },
    });

    console.log('\n✅ Verificação no banco de dados:');
    console.log('   Grupos criados:', groups.length);
    groups.forEach((group) => {
      console.log(`   - Grupo ${group.name}`);
    });

    console.log('\n💡 Próximos passos no front-end:');
    console.log('   1. Usuário pode adicionar mais grupos: POST /api/leagues/:id/groups');
    console.log('   2. Usuário pode remover grupos: DELETE /api/leagues/:id/groups/:groupId');
    console.log('   3. Usuário distribui times: POST /api/leagues/:id/groups/:groupId/teams');
    console.log('   4. Sistema gera partidas: POST /api/leagues/:id/groups/:groupId/fixtures');

    console.log('\n📊 Estatísticas:');
    console.log('   Economia de tempo: 8 chamadas → 1 chamada (87.5% redução)');
    console.log('   Antes: Criar 8 grupos manualmente');
    console.log('   Depois: 1 chamada cria todos os grupos automaticamente');

    // Cleanup
    console.log('\n🧹 Limpando dados de demonstração...');
    await prisma.leagueGroup.deleteMany({ where: { leagueId: league.id } });
    await prisma.accessMembership.deleteMany({ where: { leagueId: league.id } });
    await prisma.league.delete({ where: { id: league.id } });
    
    // Limpar usuário demo se foi criado
    if (admin.email === 'admin@futi.com' && admin.firebaseUid.startsWith('demo-admin-')) {
      await prisma.user.delete({ where: { id: admin.id } });
      console.log('✅ Usuário demo removido');
    }
    
    console.log('✅ Limpeza concluída');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar demonstração
demonstrateAutoGroupCreation();

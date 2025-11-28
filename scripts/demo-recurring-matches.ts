import 'dotenv/config';
import { prisma } from '../src/infra/prisma/client.js';

/**
 * Script de demonstração: Criar partidas recorrentes
 * 
 * Exemplos:
 * 1. Pelada toda segunda às 19h (10 jogos)
 * 2. Rachão toda terça e quinta às 20h até fim do ano
 * 3. Amistoso semanal aos sábados às 15h por 3 meses
 */

async function demonstrateRecurringMatches() {
  console.log('⚽ Demonstração: Criar Partidas Recorrentes\n');

  try {
    // 1. Buscar ou criar times
    let team1 = await prisma.team.findFirst({ where: { name: 'Time Demo A' } });
    if (!team1) {
      team1 = await prisma.team.create({
        data: {
          name: 'Time Demo A',
          icon: 'https://via.placeholder.com/100',
          isActive: true,
        },
      });
    }

    let team2 = await prisma.team.findFirst({ where: { name: 'Time Demo B' } });
    if (!team2) {
      team2 = await prisma.team.create({
        data: {
          name: 'Time Demo B',
          icon: 'https://via.placeholder.com/100',
          isActive: true,
        },
      });
    }

    console.log('✅ Times encontrados:');
    console.log(`   - ${team1.name} (${team1.id})`);
    console.log(`   - ${team2.name} (${team2.id})`);

    // 2. Buscar ou criar usuário manager
    let user = await prisma.user.findFirst({
      where: { email: 'manager@demo.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'manager@demo.com',
          displayName: 'Manager Demo',
          firebaseUid: 'demo-manager-' + Date.now(),
        },
      });
      console.log('✅ Usuário manager criado');
    }

    // 3. Dar permissão de MANAGER ao usuário
    const existingMembership = await prisma.accessMembership.findFirst({
      where: {
        userId: user.id,
        teamId: team1.id,
        role: 'MANAGER',
      },
    });

    if (!existingMembership) {
      await prisma.accessMembership.create({
        data: {
          userId: user.id,
          teamId: team1.id,
          role: 'MANAGER',
        },
      });
    }

    console.log('✅ Permissão de MANAGER concedida\n');

    // 4. Simular criação de partidas recorrentes
    console.log('📅 Exemplo 1: Pelada toda segunda às 19h (10 jogos)');
    console.log('POST /api/matches/recurring');
    console.log(JSON.stringify({
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      venue: 'Quadra do Parque',
      startDate: '2025-12-02', // Próxima segunda
      pattern: 'WEEKLY',
      daysOfWeek: [1], // Segunda
      time: '19:00',
      occurrences: 10,
    }, null, 2));

    const { CreateRecurringMatchesUseCase } = await import(
      '../src/domain/usecases/create-recurring-matches/create-recurring-matches.usecase.js'
    );

    const useCase = new CreateRecurringMatchesUseCase(prisma);
    const result1 = await useCase.execute({
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      venue: 'Quadra do Parque',
      startDate: new Date('2025-12-02'),
      pattern: 'WEEKLY',
      daysOfWeek: [1], // Segunda
      time: '19:00',
      occurrences: 10,
      userId: user.id,
    });

    console.log(`\n✅ ${result1.matches.length} partidas criadas:`);
    result1.matches.slice(0, 3).forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.scheduledAt.toLocaleString('pt-BR')}`);
    });
    if (result1.matches.length > 3) {
      console.log(`   ... e mais ${result1.matches.length - 3} partidas`);
    }

    // 5. Exemplo 2: Terça e Quinta
    console.log('\n📅 Exemplo 2: Rachão terça e quinta às 20h (6 jogos)');
    const result2 = await useCase.execute({
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      venue: 'Arena Central',
      startDate: new Date('2025-12-03'),
      pattern: 'WEEKLY',
      daysOfWeek: [2, 4], // Terça e Quinta
      time: '20:00',
      occurrences: 6,
      userId: user.id,
    });

    console.log(`\n✅ ${result2.matches.length} partidas criadas:`);
    result2.matches.forEach((match, i) => {
      const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][match.scheduledAt.getDay()];
      console.log(`   ${i + 1}. ${dayName} - ${match.scheduledAt.toLocaleString('pt-BR')}`);
    });

    // 6. Exemplo 3: Mensal
    console.log('\n📅 Exemplo 3: Amistoso mensal todo dia 15 às 15h (6 meses)');
    const result3 = await useCase.execute({
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      venue: 'Estádio Municipal',
      startDate: new Date('2025-12-15'),
      pattern: 'MONTHLY',
      time: '15:00',
      occurrences: 6,
      userId: user.id,
    });

    console.log(`\n✅ ${result3.matches.length} partidas criadas:`);
    result3.matches.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.scheduledAt.toLocaleString('pt-BR', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
    });

    // 7. Verificar MATCH_MANAGER atribuído
    const matchManager = await prisma.accessMembership.findFirst({
      where: {
        matchId: result1.matches[0].id,
        role: 'MATCH_MANAGER',
      },
    });

    console.log('\n✅ MATCH_MANAGER automaticamente atribuído:', matchManager ? 'Sim' : 'Não');

    console.log('\n📊 Resumo:');
    console.log(`   Total de partidas criadas: ${result1.matches.length + result2.matches.length + result3.matches.length}`);
    console.log(`   Economia de tempo: ${result1.matches.length + result2.matches.length + result3.matches.length} chamadas → 3 chamadas`);

    console.log('\n💡 Padrões suportados:');
    console.log('   - DAILY: Todos os dias');
    console.log('   - WEEKLY: Semanalmente (pode escolher dias da semana)');
    console.log('   - BIWEEKLY: Quinzenalmente');
    console.log('   - MONTHLY: Mensalmente');

    // Cleanup
    console.log('\n🧹 Limpando dados de demonstração...');
    await prisma.match.deleteMany({
      where: {
        OR: [
          { homeTeamId: team1.id },
          { awayTeamId: team1.id },
          { homeTeamId: team2.id },
          { awayTeamId: team2.id },
        ],
      },
    });
    await prisma.accessMembership.deleteMany({
      where: {
        OR: [
          { userId: user.id },
        ],
      },
    });
    await prisma.team.deleteMany({
      where: { id: { in: [team1.id, team2.id] } },
    });
    if (user.firebaseUid.startsWith('demo-manager-')) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    console.log('✅ Limpeza concluída');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

demonstrateRecurringMatches();

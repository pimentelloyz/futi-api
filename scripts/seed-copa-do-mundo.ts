import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de exemplo para criar uma Copa do Mundo estilo FIFA
 * 
 * Estrutura:
 * - 32 times
 * - 8 grupos de 4 times cada (A, B, C, D, E, F, G, H)
 * - Fase de grupos: todos contra todos (48 partidas)
 * - Mata-mata: Oitavas (16 times), Quartas (8), Semi (4), Final (2)
 * - Total: 64 partidas
 */

async function main() {
  console.log('🌍 Criando Copa do Mundo...\n');

  // 1. Criar usuário admin
  console.log('👤 Criando usuário admin...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@copamundo.com' },
    update: {},
    create: {
      firebaseUid: 'admin-copa-' + Date.now(),
      email: 'admin@copamundo.com',
      displayName: 'Admin Copa do Mundo',
    },
  });
  console.log('✓ Admin criado');

  // 2. Criar 32 times (exemplo com nomes de países)
  console.log('\n⚽ Criando 32 times...');
  const paisesExemplo = [
    'Brasil', 'Argentina', 'França', 'Alemanha',
    'Espanha', 'Inglaterra', 'Itália', 'Portugal',
    'Holanda', 'Bélgica', 'Croácia', 'Uruguai',
    'Colômbia', 'México', 'Estados Unidos', 'Canadá',
    'Senegal', 'Marrocos', 'Nigéria', 'Gana',
    'Japão', 'Coreia do Sul', 'Austrália', 'Irã',
    'Suíça', 'Dinamarca', 'Polônia', 'Sérvia',
    'Equador', 'Peru', 'Chile', 'Costa Rica',
  ];

  const teams = [];
  for (const pais of paisesExemplo) {
    const team = await prisma.team.create({
      data: {
        name: pais,
        isActive: true,
      },
    });
    teams.push(team);
  }
  console.log(`✓ ${teams.length} times criados`);

  // 3. Criar liga Copa do Mundo
  console.log('\n🏆 Criando liga Copa do Mundo...');
  const league = await prisma.league.create({
    data: {
      name: 'Copa do Mundo 2026',
      slug: 'copa-mundo-2026',
      description: 'Copa do Mundo FIFA 2026',
      matchFormat: 'FUT11',
      startAt: new Date('2026-06-01'),
      endAt: new Date('2026-07-20'),
      isActive: true,
      isPublic: true,
    },
  });
  console.log('✓ Liga criada:', league.name);

  // 4. Adicionar permissão de LEAGUE_MANAGER ao admin
  await prisma.accessMembership.create({
    data: {
      userId: adminUser.id,
      role: 'LEAGUE_MANAGER',
      leagueId: league.id,
    },
  });

  // 5. Adicionar times à liga
  console.log('\n📝 Adicionando times à liga...');
  for (const team of teams) {
    await prisma.leagueTeam.create({
      data: {
        leagueId: league.id,
        teamId: team.id,
      },
    });
  }
  console.log(`✓ ${teams.length} times adicionados à liga`);

  // 6. Criar 8 grupos (A, B, C, D, E, F, G, H)
  console.log('\n📊 Criando grupos...');
  const grupos = [];
  const letrasGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  for (const letra of letrasGrupos) {
    const grupo = await prisma.leagueGroup.create({
      data: {
        leagueId: league.id,
        name: `Grupo ${letra}`,
      },
    });
    grupos.push(grupo);
    console.log(`✓ Grupo ${letra} criado`);
  }

  // 7. Distribuir times nos grupos (4 times por grupo)
  console.log('\n🎯 Distribuindo times nos grupos...');
  for (let i = 0; i < 32; i++) {
    const grupoIndex = Math.floor(i / 4); // 0-7
    await prisma.leagueGroupTeam.create({
      data: {
        groupId: grupos[grupoIndex].id,
        teamId: teams[i].id,
      },
    });
    console.log(`✓ ${teams[i].name} → Grupo ${letrasGrupos[grupoIndex]}`);
  }

  // 8. Criar fase de grupos
  console.log('\n📅 Criando fase de grupos...');
  const faseGrupos = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Fase de Grupos',
      order: 1,
      type: 'GROUP_STAGE',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-20'),
      hasHomeAway: false,
      hasExtraTime: false,
      hasPenalties: false,
    },
  });
  console.log('✓ Fase de grupos criada');

  // 9. Gerar partidas da fase de grupos (todos contra todos em cada grupo)
  console.log('\n⚽ Gerando partidas da fase de grupos...');
  let matchCount = 0;
  let currentDate = new Date('2026-06-01T15:00:00Z');

  for (let g = 0; g < 8; g++) {
    const grupo = grupos[g];
    const timesDoGrupo = teams.slice(g * 4, (g + 1) * 4);

    // Gerar todos contra todos (4 times = 6 jogos)
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        await prisma.match.create({
          data: {
            leagueId: league.id,
            groupId: grupo.id,
            homeTeamId: timesDoGrupo[i].id,
            awayTeamId: timesDoGrupo[j].id,
            scheduledAt: new Date(currentDate),
            status: 'SCHEDULED',
          },
        });
        matchCount++;
        
        // Incrementar data (distribuir jogos ao longo dos dias)
        if (matchCount % 4 === 0) {
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // +1 dia
        } else {
          currentDate = new Date(currentDate.getTime() + 4 * 60 * 60 * 1000); // +4 horas
        }
      }
    }
  }
  console.log(`✓ ${matchCount} partidas da fase de grupos criadas`);

  // 10. Criar fases eliminatórias
  console.log('\n🏅 Criando fases eliminatórias...');
  
  const faseOitavas = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Oitavas de Final',
      order: 2,
      type: 'KNOCKOUT',
      startDate: new Date('2026-06-24'),
      endDate: new Date('2026-06-28'),
      hasHomeAway: false,
      hasExtraTime: true,
      hasPenalties: true,
    },
  });
  console.log('✓ Oitavas de Final criada');

  const faseQuartas = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Quartas de Final',
      order: 3,
      type: 'KNOCKOUT',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-04'),
      hasHomeAway: false,
      hasExtraTime: true,
      hasPenalties: true,
    },
  });
  console.log('✓ Quartas de Final criada');

  const faseSemi = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Semifinais',
      order: 4,
      type: 'KNOCKOUT',
      startDate: new Date('2026-07-07'),
      endDate: new Date('2026-07-08'),
      hasHomeAway: false,
      hasExtraTime: true,
      hasPenalties: true,
    },
  });
  console.log('✓ Semifinais criada');

  const faseTerceiro = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Disputa de 3º Lugar',
      order: 5,
      type: 'KNOCKOUT',
      startDate: new Date('2026-07-14'),
      hasHomeAway: false,
      hasExtraTime: true,
      hasPenalties: true,
    },
  });
  console.log('✓ Disputa de 3º Lugar criada');

  const faseFinal = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Final',
      order: 6,
      type: 'KNOCKOUT',
      startDate: new Date('2026-07-15'),
      hasHomeAway: false,
      hasExtraTime: true,
      hasPenalties: true,
    },
  });
  console.log('✓ Final criada');

  // 11. Criar partidas das oitavas (placeholders - serão atualizadas após fase de grupos)
  console.log('\n🎯 Criando partidas das oitavas (placeholders)...');
  const oitavasConfig = [
    { descricao: '1º A vs 2º B', data: '2026-06-24T15:00:00Z' },
    { descricao: '1º C vs 2º D', data: '2026-06-24T19:00:00Z' },
    { descricao: '1º E vs 2º F', data: '2026-06-25T15:00:00Z' },
    { descricao: '1º G vs 2º H', data: '2026-06-25T19:00:00Z' },
    { descricao: '1º B vs 2º A', data: '2026-06-26T15:00:00Z' },
    { descricao: '1º D vs 2º C', data: '2026-06-26T19:00:00Z' },
    { descricao: '1º F vs 2º E', data: '2026-06-27T15:00:00Z' },
    { descricao: '1º H vs 2º G', data: '2026-06-27T19:00:00Z' },
  ];

  // Usar times placeholders (primeiros 16 times)
  for (let i = 0; i < 8; i++) {
    await prisma.match.create({
      data: {
        leagueId: league.id,
        homeTeamId: teams[i * 2].id, // Placeholder
        awayTeamId: teams[i * 2 + 1].id, // Placeholder
        scheduledAt: new Date(oitavasConfig[i].data),
        status: 'SCHEDULED',
        venue: `Estádio ${i + 1}`,
      },
    });
  }
  console.log('✓ 8 partidas das oitavas criadas (placeholders)');
  console.log('ℹ️  Os times reais serão definidos após o término da fase de grupos');

  // 12. Criar standings iniciais
  console.log('\n📊 Inicializando classificação...');
  for (let g = 0; g < 8; g++) {
    const grupo = grupos[g];
    const timesDoGrupo = teams.slice(g * 4, (g + 1) * 4);
    
    for (const team of timesDoGrupo) {
      await prisma.leagueStanding.create({
        data: {
          phaseId: faseGrupos.id,
          teamId: team.id,
          groupId: grupo.id,
        },
      });
    }
  }
  console.log('✓ Classificação inicializada para todos os times');

  // 13. Criar regras de disciplina
  console.log('\n⚖️ Criando regras de disciplina...');
  await prisma.disciplineRule.create({
    data: {
      leagueId: league.id,
      yellowCardsForSuspension: 2, // Copa do Mundo: 2 amarelos = suspensão
      yellowCardsAccumulation: true,
      redCardMinimumGames: 1,
      doubleYellowGames: 1,
    },
  });
  console.log('✓ Regras de disciplina criadas');

  console.log('\n✅ Copa do Mundo criada com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - Liga: ${league.name} (ID: ${league.id})`);
  console.log(`   - Times: 32`);
  console.log(`   - Grupos: 8 (A até H, 4 times cada)`);
  console.log(`   - Fases: 6 (Grupos + Oitavas + Quartas + Semi + 3º + Final)`);
  console.log(`   - Partidas fase de grupos: ${matchCount}`);
  console.log(`   - Total estimado de partidas: 64`);
  console.log('\n📝 Próximos passos:');
  console.log('   1. Jogar a fase de grupos');
  console.log('   2. Atualizar as oitavas com os times classificados (1º e 2º de cada grupo)');
  console.log('   3. Criar partidas das quartas, semi e final conforme os vencedores');
  console.log('\n🔑 Credenciais Admin:');
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   User ID: ${adminUser.id}`);
  console.log(`   League ID: ${league.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar Copa do Mundo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, AccessRole, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏆 Criando Campeonato de FUT7...\n');

  // 1. Criar usuário admin
  console.log('👤 Criando usuário admin...');
  const timestamp = Date.now();
  const adminUser = await prisma.user.create({
    data: {
      firebaseUid: 'admin-fut7-' + timestamp,
      email: `admin-fut7-${timestamp}@example.com`,
      displayName: 'Admin FUT7',
    },
  });

  await prisma.accessMembership.create({
    data: {
      userId: adminUser.id,
      role: AccessRole.ADMIN,
    },
  });
  console.log('✓ Admin criado:', adminUser.email);

  // 2. Criar 8 times
  console.log('\n⚽ Criando 8 times...');
  const teamsData = [
    'Relâmpagos FC',
    'Tigres United',
    'Águias do Norte',
    'Leões da Sul',
    'Falcões FC',
    'Tubarões SC',
    'Panteras Negras',
    'Dragões FC',
  ];

  const teams = [];
  for (const teamName of teamsData) {
    const team = await prisma.team.create({
      data: {
        name: teamName,
        isActive: true,
      },
    });
    teams.push(team);
    console.log(`✓ Time criado: ${team.name}`);
  }

  // 3. Criar jogadores para cada time (7 por time: 1 goleiro + 6 jogadores de linha)
  console.log('\n👥 Criando jogadores (56 no total)...');
  
  const playerNames = [
    'João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Felipe', 'Bruno',
    'Carlos', 'Diego', 'Eduardo', 'Fernando', 'Gustavo', 'Henrique', 'Igor',
    'Julio', 'Kaique', 'Leonardo', 'Marcelo', 'Nathan', 'Otávio', 'Paulo',
    'Ricardo', 'Samuel', 'Thiago', 'Victor', 'Wellington', 'Yuri', 'André',
    'Bernardo', 'Caio', 'Daniel', 'Enzo', 'Fabrício', 'Guilherme', 'Hugo',
    'Isaac', 'João Pedro', 'Kevin', 'Luan', 'Matheus', 'Nicolas', 'Oscar',
    'Patrick', 'Raul', 'Sergio', 'Tiago', 'Vitor', 'William', 'Xavier',
    'Yan', 'Zé', 'Arthur', 'Breno', 'Cauã', 'Davi', 'Emanuel',
  ];

  let playerIndex = 0;
  for (const team of teams) {
    // Criar 7 jogadores por time
    for (let i = 0; i < 7; i++) {
      const isGoalkeeper = i === 0;
      const playerName = playerNames[playerIndex++];
      
      // Criar usuário para o jogador
      const userPlayer = await prisma.user.create({
        data: {
          firebaseUid: `player-${team.id}-${i}-${Date.now()}`,
          email: `${playerName.toLowerCase().replace(/\s/g, '')}${i}@${team.name.toLowerCase().replace(/\s/g, '')}.com`,
          displayName: playerName,
        },
      });

      // Criar player
      const player = await prisma.player.create({
        data: {
          userId: userPlayer.id,
          name: playerName,
          isActive: true,
        },
      });

      // Associar ao time
      await prisma.playersOnTeams.create({
        data: {
          playerId: player.id,
          teamId: team.id,
        },
      });
    }
    console.log(`✓ 7 jogadores criados para ${team.name}`);
  }

  // 4. Criar a liga
  console.log('\n🏆 Criando liga FUT7...');
  const league = await prisma.league.create({
    data: {
      name: 'Campeonato FUT7 2025',
      slug: 'campeonato-fut7-2025',
      description: 'Campeonato de FUT7 com 8 times divididos em 2 grupos',
      matchFormat: 'FUT7',
      startAt: new Date('2025-12-01'),
      endAt: new Date('2026-03-15'),
      isActive: true,
    },
  });
  console.log('✓ Liga criada:', league.name);

  // 5. Associar times à liga
  console.log('\n🔗 Associando times à liga...');
  for (const team of teams) {
    await prisma.leagueTeam.create({
      data: {
        leagueId: league.id,
        teamId: team.id,
      },
    });
  }
  console.log('✓ 8 times associados à liga');

  // 6. Criar grupos A e B
  console.log('\n📊 Criando grupos A e B...');
  
  // Fase de grupos
  const groupPhase = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Fase de Grupos',
      order: 1,
      type: 'GROUP_STAGE',
      status: 'NOT_STARTED',
      startDate: new Date('2025-12-07'),
      endDate: new Date('2026-01-25'),
      hasHomeAway: true,
      hasExtraTime: false,
      hasPenalties: false,
    },
  });

  const groupA = await prisma.leagueGroup.create({
    data: {
      leagueId: league.id,
      phaseId: groupPhase.id,
      name: 'Grupo A',
    },
  });

  const groupB = await prisma.leagueGroup.create({
    data: {
      leagueId: league.id,
      phaseId: groupPhase.id,
      name: 'Grupo B',
    },
  });
  console.log('✓ Grupos A e B criados');

  // 7. Distribuir times nos grupos
  console.log('\n👥 Distribuindo times nos grupos...');
  // Grupo A: primeiros 4 times
  for (let i = 0; i < 4; i++) {
    await prisma.leagueGroupTeam.create({
      data: {
        groupId: groupA.id,
        teamId: teams[i].id,
        position: i + 1,
      },
    });
    console.log(`✓ ${teams[i].name} → Grupo A`);
  }

  // Grupo B: últimos 4 times
  for (let i = 4; i < 8; i++) {
    await prisma.leagueGroupTeam.create({
      data: {
        groupId: groupB.id,
        teamId: teams[i].id,
        position: i - 3,
      },
    });
    console.log(`✓ ${teams[i].name} → Grupo B`);
  }

  // 8. Criar partidas da fase de grupos (todos contra todos em cada grupo)
  console.log('\n📅 Criando calendário da fase de grupos...');
  
  let matchDate = new Date('2025-12-07');
  const groupATeams = teams.slice(0, 4);
  const groupBTeams = teams.slice(4, 8);

  // Grupo A - 6 partidas (4 times, todos contra todos)
  const groupAMatches = [
    [0, 1], [2, 3], // Rodada 1
    [0, 2], [1, 3], // Rodada 2
    [0, 3], [1, 2], // Rodada 3
  ];

  for (const [homeIdx, awayIdx] of groupAMatches) {
    await prisma.match.create({
      data: {
        homeTeamId: groupATeams[homeIdx].id,
        awayTeamId: groupATeams[awayIdx].id,
        leagueId: league.id,
        groupId: groupA.id,
        scheduledAt: new Date(matchDate),
        status: MatchStatus.SCHEDULED,
      },
    });
    matchDate.setDate(matchDate.getDate() + 7); // +1 semana
  }

  // Grupo B - 6 partidas
  const groupBMatches = [
    [0, 1], [2, 3],
    [0, 2], [1, 3],
    [0, 3], [1, 2],
  ];

  for (const [homeIdx, awayIdx] of groupBMatches) {
    await prisma.match.create({
      data: {
        homeTeamId: groupBTeams[homeIdx].id,
        awayTeamId: groupBTeams[awayIdx].id,
        leagueId: league.id,
        groupId: groupB.id,
        scheduledAt: new Date(matchDate),
        status: MatchStatus.SCHEDULED,
      },
    });
    matchDate.setDate(matchDate.getDate() + 7);
  }
  console.log('✓ 12 partidas da fase de grupos criadas');

  // 9. Criar fase de semifinais
  console.log('\n🏅 Criando fase de semifinais...');
  const semiPhase = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Semifinais',
      order: 2,
      type: 'KNOCKOUT',
      status: 'NOT_STARTED',
      startDate: new Date('2026-02-01'),
      hasHomeAway: false,
      hasExtraTime: true,
      hasPenalties: true,
    },
  });

  // Semifinal 1: 1º Grupo A vs 2º Grupo B (placeholder)
  await prisma.match.create({
    data: {
      homeTeamId: teams[0].id, // Placeholder - será definido após fase de grupos
      awayTeamId: teams[5].id, // Placeholder
      leagueId: league.id,
      scheduledAt: new Date('2026-02-08T15:00:00'),
      status: MatchStatus.SCHEDULED,
    },
  });

  // Semifinal 2: 1º Grupo B vs 2º Grupo A (placeholder)
  await prisma.match.create({
    data: {
      homeTeamId: teams[4].id, // Placeholder
      awayTeamId: teams[1].id, // Placeholder
      leagueId: league.id,
      scheduledAt: new Date('2026-02-08T17:00:00'),
      status: MatchStatus.SCHEDULED,
    },
  });
  console.log('✓ 2 semifinais criadas');

  // 10. Criar fase da final
  console.log('\n🏆 Criando fase da final...');
  const finalPhase = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Final',
      order: 3,
      type: 'KNOCKOUT',
      status: 'NOT_STARTED',
      startDate: new Date('2026-03-01'),
      hasHomeAway: false,
      hasExtraTime: true,
      hasPenalties: true,
    },
  });

  // Final (placeholder)
  await prisma.match.create({
    data: {
      homeTeamId: teams[0].id, // Placeholder - vencedor semi 1
      awayTeamId: teams[4].id, // Placeholder - vencedor semi 2
      leagueId: league.id,
      scheduledAt: new Date('2026-03-15T16:00:00'),
      status: MatchStatus.SCHEDULED,
    },
  });
  console.log('✓ Final criada');

  // 11. Criar regras de disciplina
  console.log('\n📋 Criando regras de disciplina...');
  await prisma.disciplineRule.create({
    data: {
      leagueId: league.id,
      yellowCardsForSuspension: 3,
      redCardMinimumGames: 1,
    },
  });
  console.log('✓ Regras de disciplina criadas');

  // 12. Criar tabelas de classificação para cada time
  console.log('\n📊 Inicializando tabelas de classificação...');
  
  // Grupo A
  for (let i = 0; i < 4; i++) {
    await prisma.leagueStanding.create({
      data: {
        phaseId: groupPhase.id,
        teamId: teams[i].id,
        groupId: groupA.id,
        position: i + 1,
      },
    });
  }

  // Grupo B
  for (let i = 4; i < 8; i++) {
    await prisma.leagueStanding.create({
      data: {
        phaseId: groupPhase.id,
        teamId: teams[i].id,
        groupId: groupB.id,
        position: i - 3,
      },
    });
  }
  console.log('✓ Classificação inicial criada para 8 times');

  console.log('\n✅ Campeonato FUT7 criado com sucesso!');
  console.log(`\n📋 Resumo:`);
  console.log(`   Liga: ${league.name} (ID: ${league.id})`);
  console.log(`   Times: 8`);
  console.log(`   Jogadores: 56 (7 por time)`);
  console.log(`   Grupos: 2 (A e B com 4 times cada)`);
  console.log(`   Fases: 3 (Grupos, Semifinais, Final)`);
  console.log(`   Partidas: 15 (12 fase de grupos + 2 semifinais + 1 final)`);
  console.log(`\n🔐 Credenciais admin:`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   UID: ${adminUser.firebaseUid}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar campeonato:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

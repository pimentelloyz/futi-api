import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏆 Criando Campeonato de FUT7...\n');

  // 1. Criar usuário administrador
  console.log('👤 Criando usuário admin...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fut7.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@fut7.com',
      displayName: 'Admin FUT7',
      firebaseUid: 'admin-fut7-uid',
    },
  });
  console.log('✓ Admin criado:', adminUser.email);

  // 2. Criar 8 times
  console.log('\n⚽ Criando 8 times...');
  const teamsData = [
    { name: 'Relâmpagos FC', color: '#FF0000' },
    { name: 'Tigres United', color: '#FFA500' },
    { name: 'Águias do Norte', color: '#0000FF' },
    { name: 'Leões da Sul', color: '#FFD700' },
    { name: 'Falcões FC', color: '#008000' },
    { name: 'Tubarões SC', color: '#00FFFF' },
    { name: 'Panteras Negras', color: '#000000' },
    { name: 'Dragões FC', color: '#800080' },
  ];

  const teams = [];
  for (const teamData of teamsData) {
    const team = await prisma.team.create({
      data: {
        name: teamData.name,
        isActive: true,
      },
    });
    teams.push(team);
    console.log(`✓ Time criado: ${team.name}`);
  }

  // 3. Criar posições
  console.log('\n📍 Criando posições...');
  const positionsData = [
    { slug: 'GK', name: 'Goleiro', description: 'Goleiro' },
    { slug: 'CB', name: 'Zagueiro', description: 'Zagueiro Central' },
    { slug: 'LB', name: 'Lateral Esquerdo', description: 'Lateral Esquerdo' },
    { slug: 'RB', name: 'Lateral Direito', description: 'Lateral Direito' },
    { slug: 'CDM', name: 'Volante', description: 'Volante' },
    { slug: 'CM', name: 'Meio-Campo', description: 'Meio-Campista' },
    { slug: 'CAM', name: 'Meia-Atacante', description: 'Meia-Atacante' },
    { slug: 'LW', name: 'Ponta Esquerda', description: 'Ponta Esquerda' },
    { slug: 'RW', name: 'Ponta Direita', description: 'Ponta Direita' },
    { slug: 'ST', name: 'Atacante', description: 'Atacante' },
  ];

  for (const posData of positionsData) {
    await prisma.position.upsert({
      where: { slug: posData.slug },
      update: {},
      create: posData,
    });
  }
  console.log(`✓ ${positionsData.length} posições criadas`);

  // 4. Criar jogadores para cada time (7 por time: 1 goleiro + 6 jogadores de linha)
  console.log('\n👥 Criando jogadores...');
  const positions = await prisma.position.findMany();
  const gkPosition = positions.find((p) => p.slug === 'GK');
  const linePositions = positions.filter((p) => p.slug !== 'GK');

  const playerNames = [
    'João Silva',
    'Pedro Santos',
    'Lucas Oliveira',
    'Gabriel Costa',
    'Rafael Souza',
    'Bruno Lima',
    'Matheus Ferreira',
  ];

  for (const team of teams) {
    for (let i = 0; i < 7; i++) {
      const isGK = i === 0;
      const position = isGK ? gkPosition : linePositions[i % linePositions.length];

      await prisma.player.create({
        data: {
          name: `${playerNames[i]} (${team.name})`,
          number: i + 1,
          positionSlug: position?.slug || 'CAM',
          isActive: true,
          teams: {
            create: {
              teamId: team.id,
            },
          },
        },
      });
    }
    console.log(`✓ 7 jogadores criados para ${team.name}`);
  }

  // 5. Criar a liga FUT7
  console.log('\n🏆 Criando liga FUT7...');
  const league = await prisma.league.create({
    data: {
      name: 'Campeonato FUT7 2025',
      slug: 'campeonato-fut7-2025',
      description: 'Campeonato de futebol 7 com 8 times divididos em 2 grupos',
      matchFormat: 'FUT7',
      startAt: new Date('2025-12-01'),
      endAt: new Date('2026-03-31'),
      isActive: true,
      isPublic: true,
    },
  });
  console.log('✓ Liga criada:', league.name);

  // 6. Adicionar acesso de LEAGUE_MANAGER ao admin
  await prisma.accessMembership.create({
    data: {
      userId: adminUser.id,
      role: 'LEAGUE_MANAGER',
      leagueId: league.id,
    },
  });
  console.log('✓ Permissão LEAGUE_MANAGER concedida ao admin');

  // 7. Adicionar os 8 times à liga
  console.log('\n📝 Adicionando times à liga...');
  for (const team of teams) {
    await prisma.leagueTeam.create({
      data: {
        leagueId: league.id,
        teamId: team.id,
      },
    });
    console.log(`✓ ${team.name} adicionado à liga`);
  }

  // 8. Criar 2 grupos (Grupo A e Grupo B)
  console.log('\n📊 Criando grupos...');
  const groupA = await prisma.leagueGroup.create({
    data: {
      leagueId: league.id,
      name: 'Grupo A',
    },
  });

  const groupB = await prisma.leagueGroup.create({
    data: {
      leagueId: league.id,
      name: 'Grupo B',
    },
  });
  console.log('✓ Grupo A criado');
  console.log('✓ Grupo B criado');

  // 9. Distribuir times nos grupos (4 em cada)
  console.log('\n🎯 Distribuindo times nos grupos...');
  for (let i = 0; i < 4; i++) {
    await prisma.leagueGroupTeam.create({
      data: {
        groupId: groupA.id,
        teamId: teams[i].id,
      },
    });
    console.log(`✓ ${teams[i].name} → Grupo A`);
  }

  for (let i = 4; i < 8; i++) {
    await prisma.leagueGroupTeam.create({
      data: {
        groupId: groupB.id,
        teamId: teams[i].id,
      },
    });
    console.log(`✓ ${teams[i].name} → Grupo B`);
  }

  // 10. Criar fase de grupos
  console.log('\n📅 Criando fase de grupos...');
  const groupPhase = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Fase de Grupos',
      type: 'GROUP_STAGE',
      order: 1,
      startDate: new Date('2025-12-01'),
      endDate: new Date('2026-01-31'),
    },
  });
  console.log('✓ Fase de grupos criada');

  // 11. Criar partidas da fase de grupos (todos contra todos em cada grupo)
  console.log('\n⚽ Gerando calendário de partidas...');
  let matchCount = 0;
  const matchDate = new Date('2025-12-07T15:00:00Z');

  // Grupo A - todos contra todos
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      await prisma.match.create({
        data: {
          leagueId: league.id,
          groupId: groupA.id,
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          scheduledAt: new Date(matchDate.getTime() + matchCount * 7 * 24 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      });
      console.log(
        `✓ Partida ${matchCount + 1}: ${teams[i].name} vs ${teams[j].name} (Grupo A)`,
      );
      matchCount++;
    }
  }

  // Grupo B - todos contra todos
  for (let i = 4; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      await prisma.match.create({
        data: {
          leagueId: league.id,
          groupId: groupB.id,
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          scheduledAt: new Date(matchDate.getTime() + matchCount * 7 * 24 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      });
      console.log(
        `✓ Partida ${matchCount + 1}: ${teams[i].name} vs ${teams[j].name} (Grupo B)`,
      );
      matchCount++;
    }
  }

  // 12. Criar fase de semifinais
  console.log('\n🏅 Criando fase de semifinais...');
  const semiPhase = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Semifinais',
      type: 'KNOCKOUT',
      order: 2,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
    },
  });
  console.log('✓ Fase de semifinais criada');

  // 13. Criar partidas de semifinais (placeholders - serão definidas após fase de grupos)
  await prisma.match.create({
    data: {
      leagueId: league.id,
      homeTeamId: teams[0].id, // 1º Grupo A (placeholder)
      awayTeamId: teams[5].id, // 2º Grupo B (placeholder)
      scheduledAt: new Date('2026-02-08T15:00:00Z'),
      status: 'SCHEDULED',
    },
  });

  await prisma.match.create({
    data: {
      leagueId: league.id,
      homeTeamId: teams[4].id, // 1º Grupo B (placeholder)
      awayTeamId: teams[1].id, // 2º Grupo A (placeholder)
      scheduledAt: new Date('2026-02-08T17:00:00Z'),
      status: 'SCHEDULED',
    },
  });
  console.log('✓ 2 partidas de semifinais criadas');

  // 14. Criar fase de final
  console.log('\n🏆 Criando fase final...');
  const finalPhase = await prisma.leaguePhase.create({
    data: {
      leagueId: league.id,
      name: 'Final',
      type: 'KNOCKOUT',
      order: 3,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    },
  });

  await prisma.match.create({
    data: {
      leagueId: league.id,
      homeTeamId: teams[0].id, // Vencedor semi 1 (placeholder)
      awayTeamId: teams[4].id, // Vencedor semi 2 (placeholder)
      scheduledAt: new Date('2026-03-15T16:00:00Z'),
      status: 'SCHEDULED',
    },
  });
  console.log('✓ Partida final criada');

  // 15. Criar regras de disciplina
  console.log('\n⚖️ Criando regras de disciplina...');
  await prisma.disciplineRule.create({
    data: {
      leagueId: league.id,
      yellowCardsForSuspension: 3,
      yellowCardsAccumulation: true,
      redCardMinimumGames: 1,
      doubleYellowGames: 1,
    },
  });
  console.log('✓ Regras de disciplina criadas (3 amarelos = suspensão)');

  // 16. Inicializar classificação
  console.log('\n📊 Inicializando classificação...');
  for (const team of teams.slice(0, 4)) {
    await prisma.leagueStanding.create({
      data: {
        phaseId: groupPhase.id,
        groupId: groupA.id,
        teamId: team.id,
      },
    });
  }

  for (const team of teams.slice(4, 8)) {
    await prisma.leagueStanding.create({
      data: {
        phaseId: groupPhase.id,
        groupId: groupB.id,
        teamId: team.id,
      },
    });
  }
  console.log('✓ Classificação inicializada para todos os times');

  console.log('\n✅ Campeonato FUT7 criado com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - Liga: ${league.name} (ID: ${league.id})`);
  console.log(`   - Times: 8 times`);
  console.log(`   - Jogadores: 56 jogadores (7 por time)`);
  console.log(`   - Grupos: 2 (Grupo A e Grupo B)`);
  console.log(`   - Partidas fase de grupos: ${matchCount} jogos`);
  console.log(`   - Semifinais: 2 jogos`);
  console.log(`   - Final: 1 jogo`);
  console.log(`   - Total de partidas: ${matchCount + 3}`);
  console.log('\n🎮 Formato: FUT7 (7 jogadores)');
  console.log('📅 Período: Dezembro/2025 - Março/2026');
  console.log('\n🔑 Credenciais Admin:');
  console.log('   Email: admin@fut7.com');
  console.log(`   User ID: ${adminUser.id}`);
  console.log(`   League ID: ${league.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar campeonato:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

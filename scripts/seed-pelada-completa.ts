import { PrismaClient } from '@prisma/client';

/**
 * Script para criar estrutura COMPLETA de pelada FUT7
 * 
 * Cria:
 * 1. Usuários (Firebase fake IDs para desenvolvimento)
 * 2. Players (perfis de jogadores)
 * 3. Times (2 times com 7 jogadores cada)
 * 4. Liga "Pelada das Segundas"
 * 5. Partidas recorrentes (toda segunda-feira às 19h)
 * 
 * ATENÇÃO: Este seed é para DESENVOLVIMENTO. Em produção, usuários
 * devem fazer login via Firebase e criar seus próprios perfis.
 */

const prisma = new PrismaClient();

/**
 * Seed de posições dos jogadores (pré-requisito)
 */
async function seedPositions() {
  console.log('\n📍 [0/6] Garantindo que posições existem...');

  const positions: Array<{ slug: string; name: string; description: string }> = [
    { slug: 'GK', name: 'Goalkeeper', description: 'Goleiro' },
    { slug: 'CB', name: 'Centre Back', description: 'Zagueiro central' },
    { slug: 'LB', name: 'Left Back', description: 'Lateral-esquerdo' },
    { slug: 'RB', name: 'Right Back', description: 'Lateral-direito' },
    { slug: 'CDM', name: 'Central Defensive Midfielder', description: 'Volante / meio-campista defensivo' },
    { slug: 'CM', name: 'Central Midfielder', description: 'Meio-campista central' },
    { slug: 'CAM', name: 'Central Attacking Midfielder', description: 'Meia ofensivo / armador' },
    { slug: 'LM', name: 'Left Midfielder', description: 'Meia-esquerda' },
    { slug: 'RM', name: 'Right Midfielder', description: 'Meia-direita' },
    { slug: 'LW', name: 'Left Winger', description: 'Ponta-esquerda' },
    { slug: 'RW', name: 'Right Winger', description: 'Ponta-direita' },
    { slug: 'ST', name: 'Striker', description: 'Centroavante' },
    { slug: 'CF', name: 'Centre Forward', description: 'Segundo atacante / centroavante recuado' },
  ];

  for (const p of positions) {
    await prisma.$executeRaw`
      INSERT INTO "Position" ("slug","name","description","createdAt","updatedAt")
      VALUES (${p.slug}, ${p.name}, ${p.description}, NOW(), NOW())
      ON CONFLICT ("slug") DO UPDATE SET 
        "name" = EXCLUDED."name", 
        "description" = EXCLUDED."description", 
        "updatedAt" = NOW()
    `;
  }

  console.log(`   ✓ ${positions.length} posições garantidas`);
}

/**
 * Seed do formato "Rachão / Pelada" (pré-requisito)
 */
async function seedPeladaFormat() {
  console.log('\n🏆 [0.5/7] Garantindo que formato "Rachão / Pelada" existe...');

  const rachao = await prisma.leagueFormat.upsert({
    where: { slug: 'rachao-pelada' },
    create: {
      name: 'Rachão / Pelada',
      slug: 'rachao-pelada',
      description: 'Formato flexível: pontos corridos simples ou com fase final (configurável)',
      type: 'CUSTOM',
      isTemplate: true,
      phases: {
        create: [
          {
            name: 'Fase de Classificação',
            order: 1,
            type: 'LEAGUE',
            teamsCount: null,
            hasHomeAway: false,
            hasExtraTime: false,
            hasPenalties: false,
            hasAwayGoal: false,
            advancingTeams: 4,
            advancingFrom: 'TOP_4',
            tiebreakRules: {
              create: [
                { order: 1, criterion: 'POINTS' },
                { order: 2, criterion: 'HEAD_TO_HEAD_POINTS' },
                { order: 3, criterion: 'GOAL_DIFFERENCE' },
                { order: 4, criterion: 'GOALS_FOR' },
                { order: 5, criterion: 'DRAW' },
              ],
            },
          },
          {
            name: 'Semifinal (Opcional)',
            order: 2,
            type: 'KNOCKOUT',
            teamsCount: 4,
            hasHomeAway: false,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 2,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Final (Opcional)',
            order: 3,
            type: 'KNOCKOUT',
            teamsCount: 2,
            hasHomeAway: false,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 1,
            advancingFrom: 'WINNER',
          },
        ],
      },
    },
    update: {},
  });

  console.log(`   ✓ Formato garantido: ${rachao.name} (${rachao.slug})`);
}

// IDs fixos para desenvolvimento (simular Firebase UIDs)
const FIREBASE_UIDS = {
  manager1: 'firebase-uid-manager-1-dev',
  manager2: 'firebase-uid-manager-2-dev',
  // Time 1
  player1_1: 'firebase-uid-player-1-1-dev',
  player1_2: 'firebase-uid-player-1-2-dev',
  player1_3: 'firebase-uid-player-1-3-dev',
  player1_4: 'firebase-uid-player-1-4-dev',
  player1_5: 'firebase-uid-player-1-5-dev',
  player1_6: 'firebase-uid-player-1-6-dev',
  player1_7: 'firebase-uid-player-1-7-dev',
  // Time 2
  player2_1: 'firebase-uid-player-2-1-dev',
  player2_2: 'firebase-uid-player-2-2-dev',
  player2_3: 'firebase-uid-player-2-3-dev',
  player2_4: 'firebase-uid-player-2-4-dev',
  player2_5: 'firebase-uid-player-2-5-dev',
  player2_6: 'firebase-uid-player-2-6-dev',
  player2_7: 'firebase-uid-player-2-7-dev',
};

/**
 * Cria usuários no sistema (simulando login Firebase)
 */
async function seedUsers() {
  console.log('\n👤 [1/7] Criando usuários...');
  
  const users = [
    { firebaseUid: FIREBASE_UIDS.manager1, email: 'manager1@pelada.dev', displayName: 'Carlos Manager' },
    { firebaseUid: FIREBASE_UIDS.manager2, email: 'manager2@pelada.dev', displayName: 'João Manager' },
    { firebaseUid: FIREBASE_UIDS.player1_1, email: 'player1.1@pelada.dev', displayName: 'Pedro Silva' },
    { firebaseUid: FIREBASE_UIDS.player1_2, email: 'player1.2@pelada.dev', displayName: 'Lucas Santos' },
    { firebaseUid: FIREBASE_UIDS.player1_3, email: 'player1.3@pelada.dev', displayName: 'Rafael Costa' },
    { firebaseUid: FIREBASE_UIDS.player1_4, email: 'player1.4@pelada.dev', displayName: 'Gabriel Lima' },
    { firebaseUid: FIREBASE_UIDS.player1_5, email: 'player1.5@pelada.dev', displayName: 'Thiago Rocha' },
    { firebaseUid: FIREBASE_UIDS.player1_6, email: 'player1.6@pelada.dev', displayName: 'Bruno Alves' },
    { firebaseUid: FIREBASE_UIDS.player1_7, email: 'player1.7@pelada.dev', displayName: 'Diego Martins' },
    { firebaseUid: FIREBASE_UIDS.player2_1, email: 'player2.1@pelada.dev', displayName: 'André Souza' },
    { firebaseUid: FIREBASE_UIDS.player2_2, email: 'player2.2@pelada.dev', displayName: 'Felipe Oliveira' },
    { firebaseUid: FIREBASE_UIDS.player2_3, email: 'player2.3@pelada.dev', displayName: 'Marcos Pereira' },
    { firebaseUid: FIREBASE_UIDS.player2_4, email: 'player2.4@pelada.dev', displayName: 'Rodrigo Ferreira' },
    { firebaseUid: FIREBASE_UIDS.player2_5, email: 'player2.5@pelada.dev', displayName: 'Vinicius Gomes' },
    { firebaseUid: FIREBASE_UIDS.player2_6, email: 'player2.6@pelada.dev', displayName: 'Gustavo Cardoso' },
    { firebaseUid: FIREBASE_UIDS.player2_7, email: 'player2.7@pelada.dev', displayName: 'Mateus Ribeiro' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { firebaseUid: u.firebaseUid },
      create: {
        firebaseUid: u.firebaseUid,
        email: u.email,
        displayName: u.displayName,
      },
      update: {
        email: u.email,
        displayName: u.displayName,
      },
    });
  }

  console.log(`   ✓ ${users.length} usuários criados/atualizados`);
}

/**
 * Cria perfis de jogadores
 */
async function seedPlayers() {
  console.log('\n🏃 [2/7] Criando perfis de jogadores...');

  const positions = ['GK', 'CB', 'LB', 'RB', 'CM', 'LW', 'ST'];
  
  const playersData = [
    // Time 1
    { firebaseUid: FIREBASE_UIDS.player1_1, name: 'Pedro Silva', position: 'GK', number: 1 },
    { firebaseUid: FIREBASE_UIDS.player1_2, name: 'Lucas Santos', position: 'CB', number: 3 },
    { firebaseUid: FIREBASE_UIDS.player1_3, name: 'Rafael Costa', position: 'LB', number: 6 },
    { firebaseUid: FIREBASE_UIDS.player1_4, name: 'Gabriel Lima', position: 'RB', number: 2 },
    { firebaseUid: FIREBASE_UIDS.player1_5, name: 'Thiago Rocha', position: 'CM', number: 8 },
    { firebaseUid: FIREBASE_UIDS.player1_6, name: 'Bruno Alves', position: 'LW', number: 11 },
    { firebaseUid: FIREBASE_UIDS.player1_7, name: 'Diego Martins', position: 'ST', number: 9 },
    // Time 2
    { firebaseUid: FIREBASE_UIDS.player2_1, name: 'André Souza', position: 'GK', number: 1 },
    { firebaseUid: FIREBASE_UIDS.player2_2, name: 'Felipe Oliveira', position: 'CB', number: 4 },
    { firebaseUid: FIREBASE_UIDS.player2_3, name: 'Marcos Pereira', position: 'LB', number: 6 },
    { firebaseUid: FIREBASE_UIDS.player2_4, name: 'Rodrigo Ferreira', position: 'RB', number: 2 },
    { firebaseUid: FIREBASE_UIDS.player2_5, name: 'Vinicius Gomes', position: 'CM', number: 5 },
    { firebaseUid: FIREBASE_UIDS.player2_6, name: 'Gustavo Cardoso', position: 'LW', number: 7 },
    { firebaseUid: FIREBASE_UIDS.player2_7, name: 'Mateus Ribeiro', position: 'ST', number: 10 },
  ];

  for (const p of playersData) {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: p.firebaseUid },
    });

    if (!user) continue;

    await prisma.player.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: p.name,
        positionSlug: p.position,
        number: p.number,
        isActive: true,
      },
      update: {
        name: p.name,
        positionSlug: p.position,
        number: p.number,
      },
    });
  }

  console.log(`   ✓ ${playersData.length} jogadores criados/atualizados`);
}

/**
 * Cria os dois times
 */
async function seedTeams() {
  console.log('\n👥 [3/7] Criando times...');

  const manager1 = await prisma.user.findUnique({
    where: { firebaseUid: FIREBASE_UIDS.manager1 },
  });
  const manager2 = await prisma.user.findUnique({
    where: { firebaseUid: FIREBASE_UIDS.manager2 },
  });

  if (!manager1 || !manager2) {
    throw new Error('Managers não encontrados');
  }

  // Time 1: Os Craques
  let team1 = await prisma.team.findFirst({
    where: { name: 'Os Craques' },
  });
  if (!team1) {
    team1 = await prisma.team.create({
      data: {
        name: 'Os Craques',
        description: 'Time das segundas-feiras - Os Craques',
        isActive: true,
      },
    });
  }

  // Time 2: Os Artilheiros
  let team2 = await prisma.team.findFirst({
    where: { name: 'Os Artilheiros' },
  });
  if (!team2) {
    team2 = await prisma.team.create({
      data: {
        name: 'Os Artilheiros',
        description: 'Time das segundas-feiras - Os Artilheiros',
        isActive: true,
      },
    });
  }

  console.log(`   ✓ Time 1: ${team1.name} (${team1.id})`);
  console.log(`   ✓ Time 2: ${team2.name} (${team2.id})`);

  // Conceder role MANAGER aos managers
  const existingManager1 = await prisma.accessMembership.findFirst({
    where: {
      userId: manager1.id,
      teamId: team1.id,
      role: 'MANAGER',
    },
  });
  if (!existingManager1) {
    await prisma.accessMembership.create({
      data: {
        userId: manager1.id,
        role: 'MANAGER',
        teamId: team1.id,
      },
    });
  }

  const existingManager2 = await prisma.accessMembership.findFirst({
    where: {
      userId: manager2.id,
      teamId: team2.id,
      role: 'MANAGER',
    },
  });
  if (!existingManager2) {
    await prisma.accessMembership.create({
      data: {
        userId: manager2.id,
        role: 'MANAGER',
        teamId: team2.id,
      },
    });
  }

  // Vincular jogadores aos times
  const team1PlayerUids = [
    FIREBASE_UIDS.player1_1, FIREBASE_UIDS.player1_2, FIREBASE_UIDS.player1_3,
    FIREBASE_UIDS.player1_4, FIREBASE_UIDS.player1_5, FIREBASE_UIDS.player1_6,
    FIREBASE_UIDS.player1_7,
  ];

  const team2PlayerUids = [
    FIREBASE_UIDS.player2_1, FIREBASE_UIDS.player2_2, FIREBASE_UIDS.player2_3,
    FIREBASE_UIDS.player2_4, FIREBASE_UIDS.player2_5, FIREBASE_UIDS.player2_6,
    FIREBASE_UIDS.player2_7,
  ];

  for (const uid of team1PlayerUids) {
    const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
    const player = await prisma.player.findUnique({ where: { userId: user?.id } });
    if (player && user) {
      // Vincular jogador ao time
      const existingLink = await prisma.playersOnTeams.findUnique({
        where: {
          playerId_teamId: {
            playerId: player.id,
            teamId: team1.id,
          },
        },
      });
      if (!existingLink) {
        await prisma.playersOnTeams.create({
          data: {
            teamId: team1.id,
            playerId: player.id,
          },
        });
      }

      // Conceder role PLAYER
      const existingRole = await prisma.accessMembership.findFirst({
        where: {
          userId: user.id,
          teamId: team1.id,
          role: 'PLAYER',
        },
      });
      if (!existingRole) {
        await prisma.accessMembership.create({
          data: {
            userId: user.id,
            role: 'PLAYER',
            teamId: team1.id,
          },
        });
      }
    }
  }

  for (const uid of team2PlayerUids) {
    const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
    const player = await prisma.player.findUnique({ where: { userId: user?.id } });
    if (player && user) {
      // Vincular jogador ao time
      const existingLink = await prisma.playersOnTeams.findUnique({
        where: {
          playerId_teamId: {
            playerId: player.id,
            teamId: team2.id,
          },
        },
      });
      if (!existingLink) {
        await prisma.playersOnTeams.create({
          data: {
            teamId: team2.id,
            playerId: player.id,
          },
        });
      }

      // Conceder role PLAYER
      const existingRole = await prisma.accessMembership.findFirst({
        where: {
          userId: user.id,
          teamId: team2.id,
          role: 'PLAYER',
        },
      });
      if (!existingRole) {
        await prisma.accessMembership.create({
          data: {
            userId: user.id,
            role: 'PLAYER',
            teamId: team2.id,
          },
        });
      }
    }
  }

  console.log(`   ✓ 7 jogadores vinculados ao time "${team1.name}"`);
  console.log(`   ✓ 7 jogadores vinculados ao time "${team2.name}"`);

  return { team1, team2 };
}

/**
 * Cria a liga "Pelada das Segundas"
 */
async function seedLeague(team1Id: string, team2Id: string) {
  console.log('\n🏆 [4/7] Criando liga "Pelada das Segundas"...');

  const manager1 = await prisma.user.findUnique({
    where: { firebaseUid: FIREBASE_UIDS.manager1 },
  });

  if (!manager1) {
    throw new Error('Manager 1 não encontrado');
  }

  // Buscar formato "rachao-pelada"
  const format = await prisma.leagueFormat.findUnique({
    where: { slug: 'rachao-pelada' },
  });

  if (!format) {
    throw new Error('Formato "rachao-pelada" não encontrado. Erro inesperado após seed.');
  }

  const league = await prisma.league.upsert({
    where: { slug: 'pelada-segundas-fut7' },
    create: {
      name: 'Pelada das Segundas - FUT7',
      slug: 'pelada-segundas-fut7',
      description: 'Pelada todas as segundas-feiras às 19h no campo do bairro',
      formatId: format.id,
      matchFormat: 'FUT7',
      isPublic: false,
      isActive: true,
      startAt: new Date('2025-01-06T19:00:00'), // Primeira segunda de 2025
    },
    update: {},
  });

  console.log(`   ✓ Liga criada: ${league.name} (${league.id})`);

  // Conceder role LEAGUE_MANAGER ao manager1
  const existingLeagueManager = await prisma.accessMembership.findFirst({
    where: {
      userId: manager1.id,
      leagueId: league.id,
      role: 'LEAGUE_MANAGER',
    },
  });
  if (!existingLeagueManager) {
    await prisma.accessMembership.create({
      data: {
        userId: manager1.id,
        role: 'LEAGUE_MANAGER',
        leagueId: league.id,
      },
    });
  }

  // Vincular times à liga
  await prisma.leagueTeam.upsert({
    where: {
      leagueId_teamId: {
        leagueId: league.id,
        teamId: team1Id,
      },
    },
    create: {
      leagueId: league.id,
      teamId: team1Id,
    },
    update: {},
  });

  await prisma.leagueTeam.upsert({
    where: {
      leagueId_teamId: {
        leagueId: league.id,
        teamId: team2Id,
      },
    },
    create: {
      leagueId: league.id,
      teamId: team2Id,
    },
    update: {},
  });

  console.log(`   ✓ Times vinculados à liga`);

  return league;
}

/**
 * Cria partidas recorrentes (segundas e quartas às 19h até o final do ano)
 */
async function seedMatches(leagueId: string, team1Id: string, team2Id: string) {
  console.log('\n⚽ [5/7] Criando partidas recorrentes...');

  const manager1 = await prisma.user.findUnique({
    where: { firebaseUid: FIREBASE_UIDS.manager1 },
  });

  if (!manager1) {
    throw new Error('Manager 1 não encontrado');
  }

  const matches = [];
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // 31 de dezembro

  // Encontrar a próxima segunda-feira
  let currentDate = new Date(now);
  currentDate.setHours(19, 0, 0, 0);
  
  // Avançar para a próxima segunda (dia da semana 1)
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Criar partidas às segundas e quartas até o final do ano
  while (currentDate <= endOfYear) {
    const dayOfWeek = currentDate.getDay();
    
    // Segunda (1) ou Quarta (3)
    if (dayOfWeek === 1 || dayOfWeek === 3) {
      const match = await prisma.match.create({
        data: {
          leagueId,
          homeTeamId: team1Id,
          awayTeamId: team2Id,
          scheduledAt: new Date(currentDate),
          venue: 'Campo do Bairro',
          status: 'SCHEDULED',
        },
      });

      matches.push(match);

      // Conceder role MATCH_MANAGER ao manager1
      const existingMatchManager = await prisma.accessMembership.findFirst({
        where: {
          userId: manager1.id,
          matchId: match.id,
          role: 'MATCH_MANAGER',
        },
      });
      if (!existingMatchManager) {
        await prisma.accessMembership.create({
          data: {
            userId: manager1.id,
            role: 'MATCH_MANAGER',
            matchId: match.id,
          },
        });
      }
    }

    // Avançar 1 dia
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`   ✓ ${matches.length} partidas criadas (segundas e quartas às 19h)`);
  if (matches.length > 0) {
    console.log(`   ✓ Primeira partida: ${matches[0].scheduledAt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`);
    console.log(`   ✓ Última partida: ${matches[matches.length - 1].scheduledAt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`);
  }
}

/**
 * Exibe resumo final
 */
async function showSummary() {
  console.log('\n📊 [6/7] Resumo da estrutura criada...');

  const users = await prisma.user.count();
  const players = await prisma.player.count();
  const teams = await prisma.team.count();
  const leagues = await prisma.league.count();
  const matches = await prisma.match.count({ where: { status: 'SCHEDULED' } });

  console.log(`   ✓ ${users} usuários`);
  console.log(`   ✓ ${players} jogadores`);
  console.log(`   ✓ ${teams} times`);
  console.log(`   ✓ ${leagues} ligas`);
  console.log(`   ✓ ${matches} partidas agendadas`);
}

async function main() {
  console.log('\n⚽ ========================================');
  console.log('⚽ SEED COMPLETO: PELADA FUT7');
  console.log('⚽ ========================================\n');

  const startTime = Date.now();

  try {
    // 0. Garantir que posições existem (pré-requisito)
    await seedPositions();

    // 0.5. Garantir que formato existe (pré-requisito)
    await seedPeladaFormat();

    // 1. Criar usuários
    await seedUsers();

    // 2. Criar perfis de jogadores
    await seedPlayers();

    // 3. Criar times e vincular jogadores
    const { team1, team2 } = await seedTeams();

    // 4. Criar liga
    const league = await seedLeague(team1.id, team2.id);

    // 5. Criar partidas recorrentes
    await seedMatches(league.id, team1.id, team2.id);

    // 6. Exibir resumo
    await showSummary();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ ========================================');
    console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
    console.log(`✅ Tempo total: ${duration}s`);
    console.log('✅ ========================================\n');

    console.log('🎮 CREDENCIAIS DE TESTE:\n');
    console.log('   Manager Time 1:');
    console.log('   Email: manager1@pelada.dev');
    console.log('   Firebase UID: firebase-uid-manager-1-dev\n');
    
    console.log('   Manager Time 2:');
    console.log('   Email: manager2@pelada.dev');
    console.log('   Firebase UID: firebase-uid-manager-2-dev\n');

    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. Use um dos managers para fazer login (simular Firebase)');
    console.log('   2. Acesse GET /api/leagues/me para ver a liga');
    console.log('   3. Acesse GET /api/matches para ver as partidas (segundas e quartas até 31/12)');
    console.log('   4. Use PATCH /api/matches/:id para atualizar resultados');
    console.log('   5. Classificação será atualizada automaticamente após resultados\n');

    console.log('💡 QUERIES ÚTEIS:');
    console.log('   -- Ver times da liga');
    console.log('   SELECT t.name FROM "Team" t');
    console.log('   JOIN "LeagueTeam" lt ON lt."teamId" = t.id');
    console.log('   WHERE lt."leagueId" = (SELECT id FROM "League" WHERE slug = \'pelada-segundas-fut7\');\n');

    console.log('   -- Ver partidas agendadas (segundas e quartas)');
    console.log('   SELECT');
    console.log('     TO_CHAR("scheduledAt", \'DD/MM/YYYY (Day)\') as data,');
    console.log('     TO_CHAR("scheduledAt", \'HH24:MI\') as hora,');
    console.log('     "venue", "status"');
    console.log('   FROM "Match"');
    console.log('   WHERE "leagueId" = (SELECT id FROM "League" WHERE slug = \'pelada-segundas-fut7\')');
    console.log('   ORDER BY "scheduledAt";\n');
    
    console.log('   -- Contar partidas por mês');
    console.log('   SELECT');
    console.log('     TO_CHAR("scheduledAt", \'MM/YYYY\') as mes,');
    console.log('     COUNT(*) as total_jogos');
    console.log('   FROM "Match"');
    console.log('   WHERE "leagueId" = (SELECT id FROM "League" WHERE slug = \'pelada-segundas-fut7\')');
    console.log('   GROUP BY TO_CHAR("scheduledAt", \'MM/YYYY\')');
    console.log('   ORDER BY mes;\n');

  } catch (error) {
    console.error('\n❌ Erro durante o seed:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('👋 Conexão com banco encerrada.\n');
  })
  .catch(async (e) => {
    console.error('❌ Erro fatal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from '@prisma/client';

/**
 * Seed Champions League 2024/25
 * 
 * Cria uma liga completa de Champions League com:
 * - 36 times europeus famosos
 * - Formato novo da Champions (fase de liga única)
 * - Calendário de jogos começando em 23/11/2025
 * - 8 rodadas na fase de liga
 * - Cada time joga 8 partidas (4 casa, 4 fora)
 */

export async function seedChampionsLeague(prisma: PrismaClient) {
  console.log('\n[seed-champions] ========================================');
  console.log('[seed-champions] Iniciando seed Champions League 2024/25');
  console.log('[seed-champions] ========================================\n');

  // ============================================================================
  // 1. BUSCAR FORMATO DA CHAMPIONS LEAGUE
  // ============================================================================
  
  console.log('[seed-champions] Buscando formato Champions League...');
  let format = await prisma.leagueFormat.findUnique({
    where: { slug: 'champions-league' },
    include: { phases: true },
  });

  if (!format) {
    console.log('[seed-champions] Formato não encontrado, criando...');
    format = await prisma.leagueFormat.create({
      data: {
        name: 'Champions League',
        slug: 'champions-league',
        description: 'Fase de liga única (36 times) seguida de playoffs e mata-mata',
        type: 'LEAGUE_PHASE',
        isTemplate: true,
        phases: {
          create: [
            {
              name: 'Fase de Liga',
              order: 1,
              type: 'LEAGUE',
              teamsCount: 36,
              hasHomeAway: false,
              hasExtraTime: false,
              hasPenalties: false,
              hasAwayGoal: false,
              advancingTeams: 24,
              advancingFrom: 'TOP_24',
              tiebreakRules: {
                create: [
                  { order: 1, criterion: 'POINTS' },
                  { order: 2, criterion: 'GOAL_DIFFERENCE' },
                  { order: 3, criterion: 'GOALS_FOR' },
                  { order: 4, criterion: 'AWAY_GOALS' },
                  { order: 5, criterion: 'WINS' },
                  { order: 6, criterion: 'WINS_AWAY' },
                ],
              },
            },
          ],
        },
      },
      include: { phases: true },
    });
  }

  console.log('[seed-champions] ✓ Formato encontrado/criado:', format.name);

  // ============================================================================
  // 2. CRIAR OS 36 TIMES EUROPEUS
  // ============================================================================
  
  console.log('[seed-champions] Criando times...');
  
  const teamsData = [
    // Inglaterra (4 times)
    { name: 'Manchester City', icon: '🔵', description: 'Campeão Inglês' },
    { name: 'Arsenal', icon: '🔴', description: 'Inglaterra' },
    { name: 'Liverpool', icon: '🔴', description: 'Inglaterra' },
    { name: 'Aston Villa', icon: '🟣', description: 'Inglaterra' },
    
    // Espanha (4 times)
    { name: 'Real Madrid', icon: '⚪', description: 'Campeão Europeu' },
    { name: 'Barcelona', icon: '🔵', description: 'Espanha' },
    { name: 'Atlético de Madrid', icon: '🔴', description: 'Espanha' },
    { name: 'Girona', icon: '🔴', description: 'Espanha' },
    
    // Alemanha (5 times)
    { name: 'Bayern de Munique', icon: '🔴', description: 'Alemanha' },
    { name: 'Borussia Dortmund', icon: '🟡', description: 'Alemanha' },
    { name: 'RB Leipzig', icon: '🔴', description: 'Alemanha' },
    { name: 'Bayer Leverkusen', icon: '🔴', description: 'Campeão Alemão' },
    { name: 'Stuttgart', icon: '⚪', description: 'Alemanha' },
    
    // Itália (5 times)
    { name: 'Inter de Milão', icon: '🔵', description: 'Campeão Italiano' },
    { name: 'Milan', icon: '🔴', description: 'Itália' },
    { name: 'Juventus', icon: '⚪', description: 'Itália' },
    { name: 'Atalanta', icon: '🔵', description: 'Itália' },
    { name: 'Bologna', icon: '🔴', description: 'Itália' },
    
    // França (4 times)
    { name: 'Paris Saint-Germain', icon: '🔵', description: 'França' },
    { name: 'Monaco', icon: '🔴', description: 'França' },
    { name: 'Brest', icon: '🔴', description: 'França' },
    { name: 'Lille', icon: '🔴', description: 'França' },
    
    // Portugal (3 times)
    { name: 'Sporting', icon: '🟢', description: 'Portugal' },
    { name: 'Benfica', icon: '🔴', description: 'Portugal' },
    { name: 'Porto', icon: '🔵', description: 'Portugal' },
    
    // Holanda (2 times)
    { name: 'PSV Eindhoven', icon: '🔴', description: 'Holanda' },
    { name: 'Feyenoord', icon: '🔴', description: 'Holanda' },
    
    // Outros países (9 times)
    { name: 'Celtic', icon: '🟢', description: 'Escócia' },
    { name: 'Club Brugge', icon: '🔵', description: 'Bélgica' },
    { name: 'Shakhtar Donetsk', icon: '🟠', description: 'Ucrânia' },
    { name: 'RB Salzburg', icon: '🔴', description: 'Áustria' },
    { name: 'Young Boys', icon: '🟡', description: 'Suíça' },
    { name: 'Estrela Vermelha', icon: '🔴', description: 'Sérvia' },
    { name: 'Sparta Praga', icon: '🔴', description: 'República Tcheca' },
    { name: 'Dínamo Zagreb', icon: '🔵', description: 'Croácia' },
    { name: 'Slovan Bratislava', icon: '🔵', description: 'Eslováquia' },
  ];

  const teams = [];
  for (const teamData of teamsData) {
    let team = await prisma.team.findFirst({
      where: { name: teamData.name },
    });
    
    if (!team) {
      team = await prisma.team.create({
        data: teamData,
      });
    }
    
    teams.push(team);
  }

  console.log('[seed-champions] ✓ Criados', teams.length, 'times');

  // ============================================================================
  // 3. CRIAR A LIGA
  // ============================================================================
  
  console.log('[seed-champions] Criando liga Champions League...');
  
  const league = await prisma.league.upsert({
    where: { slug: 'champions-league-2024-25' },
    create: {
      name: 'UEFA Champions League 2024/25',
      slug: 'champions-league-2024-25',
      description: 'A maior competição de clubes da Europa',
      icon: '⚽',
      banner: '🏆',
      startAt: new Date('2025-11-23'),
      endAt: new Date('2026-05-31'),
      isActive: true,
      isPublic: true,
      formatId: format.id,
    },
    update: {},
  });

  console.log('[seed-champions] ✓ Liga criada:', league.name);

  // ============================================================================
  // 4. VINCULAR TIMES À LIGA
  // ============================================================================
  
  console.log('[seed-champions] Vinculando times à liga...');
  
  for (const team of teams) {
    await prisma.leagueTeam.upsert({
      where: {
        leagueId_teamId: {
          leagueId: league.id,
          teamId: team.id,
        },
      },
      create: {
        leagueId: league.id,
        teamId: team.id,
      },
      update: {},
    });
  }

  console.log('[seed-champions] ✓ Times vinculados à liga');

  // ============================================================================
  // 5. CRIAR FASE DE LIGA
  // ============================================================================
  
  console.log('[seed-champions] Criando fase de liga...');
  
  const phaseConfig = format.phases[0]; // Fase de Liga
  
  const phase = await prisma.leaguePhase.upsert({
    where: {
      leagueId_order: {
        leagueId: league.id,
        order: 1,
      },
    },
    create: {
      leagueId: league.id,
      configId: phaseConfig?.id,
      name: 'Fase de Liga',
      order: 1,
      type: 'LEAGUE',
      status: 'IN_PROGRESS',
      startDate: new Date('2025-11-23'),
      endDate: new Date('2026-01-29'),
      hasHomeAway: false,
      hasExtraTime: false,
      hasPenalties: false,
    },
    update: {},
  });

  console.log('[seed-champions] ✓ Fase de liga criada');

  // ============================================================================
  // 6. CRIAR TABELA DE CLASSIFICAÇÃO INICIAL
  // ============================================================================
  
  console.log('[seed-champions] Criando tabela de classificação...');
  
  for (let i = 0; i < teams.length; i++) {
    await prisma.leagueStanding.upsert({
      where: {
        phaseId_teamId_groupId: {
          phaseId: phase.id,
          teamId: teams[i].id,
          groupId: undefined as any,
        },
      },
      create: {
        phaseId: phase.id,
        teamId: teams[i].id,
        position: i + 1,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      },
      update: {},
    });
  }

  console.log('[seed-champions] ✓ Tabela de classificação criada');

  // ============================================================================
  // 7. CRIAR CALENDÁRIO DE JOGOS
  // ============================================================================
  
  console.log('[seed-champions] Criando calendário de jogos...');
  
  // Algoritmo para criar jogos balanceados:
  // - Cada time joga 8 partidas (4 casa, 4 fora)
  // - 8 rodadas com múltiplos jogos simultâneos
  // - Distribuição equilibrada dos confrontos
  
  const startDate = new Date('2025-11-23T20:00:00');
  let matchesCreated = 0;
  
  // Rodada 1: 23/11/2025
  const round1Matches = [
    { home: 0, away: 18 }, // Man City vs PSG
    { home: 4, away: 8 }, // Real Madrid vs Bayern
    { home: 13, away: 5 }, // Inter vs Barcelona
    { home: 2, away: 11 }, // Liverpool vs Leverkusen
    { home: 22, away: 1 }, // Sporting vs Arsenal
    { home: 9, away: 14 }, // Dortmund vs Milan
    { home: 19, away: 3 }, // Monaco vs Aston Villa
    { home: 25, away: 6 }, // PSV vs Atlético
    { home: 10, away: 15 }, // Leipzig vs Juventus
    { home: 7, away: 16 }, // Girona vs Atalanta
    { home: 20, away: 12 }, // Brest vs Stuttgart
    { home: 23, away: 17 }, // Benfica vs Bologna
    { home: 24, away: 21 }, // Porto vs Lille
    { home: 26, away: 27 }, // Feyenoord vs Celtic
    { home: 28, away: 29 }, // Club Brugge vs Shakhtar
    { home: 30, away: 31 }, // Salzburg vs Young Boys
    { home: 32, away: 33 }, // Estrela Vermelha vs Sparta
    { home: 34, away: 35 }, // Zagreb vs Slovan
  ];

  for (const match of round1Matches) {
    await prisma.match.create({
      data: {
        homeTeamId: teams[match.home].id,
        awayTeamId: teams[match.away].id,
        leagueId: league.id,
        scheduledAt: new Date(startDate),
        venue: `Estádio ${teams[match.home].name}`,
        status: 'SCHEDULED',
      },
    });
    matchesCreated++;
  }

  // Rodada 2: 26/11/2025
  const round2Date = new Date('2025-11-26T20:00:00');
  const round2Matches = [
    { home: 18, away: 13 }, // PSG vs Inter
    { home: 8, away: 2 }, // Bayern vs Liverpool
    { home: 5, away: 22 }, // Barcelona vs Sporting
    { home: 1, away: 9 }, // Arsenal vs Dortmund
    { home: 11, away: 0 }, // Leverkusen vs Man City
    { home: 6, away: 25 }, // Atlético vs PSV
    { home: 3, away: 20 }, // Aston Villa vs Brest
    { home: 14, away: 4 }, // Milan vs Real Madrid
    { home: 15, away: 7 }, // Juventus vs Girona
    { home: 16, away: 10 }, // Atalanta vs Leipzig
    { home: 12, away: 23 }, // Stuttgart vs Benfica
    { home: 17, away: 24 }, // Bologna vs Porto
    { home: 21, away: 26 }, // Lille vs Feyenoord
    { home: 27, away: 28 }, // Celtic vs Club Brugge
    { home: 29, away: 30 }, // Shakhtar vs Salzburg
    { home: 31, away: 32 }, // Young Boys vs Estrela Vermelha
    { home: 33, away: 34 }, // Sparta vs Zagreb
    { home: 35, away: 19 }, // Slovan vs Monaco
  ];

  for (const match of round2Matches) {
    await prisma.match.create({
      data: {
        homeTeamId: teams[match.home].id,
        awayTeamId: teams[match.away].id,
        leagueId: league.id,
        scheduledAt: new Date(round2Date),
        venue: `Estádio ${teams[match.home].name}`,
        status: 'SCHEDULED',
      },
    });
    matchesCreated++;
  }

  // Rodada 3: 30/11/2025
  const round3Date = new Date('2025-11-30T17:00:00');
  const round3Matches = [
    { home: 4, away: 1 }, // Real Madrid vs Arsenal
    { home: 0, away: 5 }, // Man City vs Barcelona
    { home: 13, away: 8 }, // Inter vs Bayern
    { home: 22, away: 2 }, // Sporting vs Liverpool
    { home: 9, away: 11 }, // Dortmund vs Leverkusen
    { home: 25, away: 3 }, // PSV vs Aston Villa
    { home: 19, away: 18 }, // Monaco vs PSG
    { home: 20, away: 6 }, // Brest vs Atlético
    { home: 7, away: 12 }, // Girona vs Stuttgart
    { home: 10, away: 16 }, // Leipzig vs Atalanta
    { home: 23, away: 15 }, // Benfica vs Juventus
    { home: 24, away: 14 }, // Porto vs Milan
    { home: 26, away: 21 }, // Feyenoord vs Lille
    { home: 28, away: 27 }, // Club Brugge vs Celtic
    { home: 30, away: 29 }, // Salzburg vs Shakhtar
    { home: 32, away: 31 }, // Estrela Vermelha vs Young Boys
    { home: 34, away: 33 }, // Zagreb vs Sparta
    { home: 17, away: 35 }, // Bologna vs Slovan
  ];

  for (const match of round3Matches) {
    await prisma.match.create({
      data: {
        homeTeamId: teams[match.home].id,
        awayTeamId: teams[match.away].id,
        leagueId: league.id,
        scheduledAt: new Date(round3Date),
        venue: `Estádio ${teams[match.home].name}`,
        status: 'SCHEDULED',
      },
    });
    matchesCreated++;
  }

  // Rodada 4: 10/12/2025
  const round4Date = new Date('2025-12-10T20:00:00');
  const round4Matches = [
    { home: 1, away: 0 }, // Arsenal vs Man City
    { home: 5, away: 4 }, // Barcelona vs Real Madrid
    { home: 2, away: 13 }, // Liverpool vs Inter
    { home: 8, away: 22 }, // Bayern vs Sporting
    { home: 11, away: 9 }, // Leverkusen vs Dortmund
    { home: 3, away: 19 }, // Aston Villa vs Monaco
    { home: 18, away: 25 }, // PSG vs PSV
    { home: 6, away: 20 }, // Atlético vs Brest
    { home: 12, away: 10 }, // Stuttgart vs Leipzig
    { home: 16, away: 7 }, // Atalanta vs Girona
    { home: 15, away: 23 }, // Juventus vs Benfica
    { home: 14, away: 24 }, // Milan vs Porto
    { home: 21, away: 26 }, // Lille vs Feyenoord
    { home: 27, away: 28 }, // Celtic vs Club Brugge
    { home: 29, away: 30 }, // Shakhtar vs Salzburg
    { home: 31, away: 32 }, // Young Boys vs Estrela Vermelha
    { home: 33, away: 34 }, // Sparta vs Zagreb
    { home: 35, away: 17 }, // Slovan vs Bologna
  ];

  for (const match of round4Matches) {
    await prisma.match.create({
      data: {
        homeTeamId: teams[match.home].id,
        awayTeamId: teams[match.away].id,
        leagueId: league.id,
        scheduledAt: new Date(round4Date),
        venue: `Estádio ${teams[match.home].name}`,
        status: 'SCHEDULED',
      },
    });
    matchesCreated++;
  }

  // Rodada 5: 21/01/2026
  const round5Date = new Date('2026-01-21T20:00:00');
  const round5Matches = [
    { home: 4, away: 13 }, // Real Madrid vs Inter
    { home: 0, away: 8 }, // Man City vs Bayern
    { home: 5, away: 1 }, // Barcelona vs Arsenal
    { home: 22, away: 11 }, // Sporting vs Leverkusen
    { home: 2, away: 9 }, // Liverpool vs Dortmund
    { home: 19, away: 6 }, // Monaco vs Atlético
    { home: 25, away: 20 }, // PSV vs Brest
    { home: 18, away: 3 }, // PSG vs Aston Villa
    { home: 7, away: 10 }, // Girona vs Leipzig
    { home: 16, away: 12 }, // Atalanta vs Stuttgart
    { home: 23, away: 14 }, // Benfica vs Milan
    { home: 24, away: 15 }, // Porto vs Juventus
    { home: 26, away: 27 }, // Feyenoord vs Celtic
    { home: 28, away: 21 }, // Club Brugge vs Lille
    { home: 30, away: 31 }, // Salzburg vs Young Boys
    { home: 32, away: 29 }, // Estrela Vermelha vs Shakhtar
    { home: 34, away: 35 }, // Zagreb vs Slovan
    { home: 17, away: 33 }, // Bologna vs Sparta
  ];

  for (const match of round5Matches) {
    await prisma.match.create({
      data: {
        homeTeamId: teams[match.home].id,
        awayTeamId: teams[match.away].id,
        leagueId: league.id,
        scheduledAt: new Date(round5Date),
        venue: `Estádio ${teams[match.home].name}`,
        status: 'SCHEDULED',
      },
    });
    matchesCreated++;
  }

  // Rodada 6: 25/01/2026
  const round6Date = new Date('2026-01-25T17:00:00');
  const round6Matches = [
    { home: 13, away: 5 }, // Inter vs Barcelona
    { home: 8, away: 0 }, // Bayern vs Man City
    { home: 1, away: 4 }, // Arsenal vs Real Madrid
    { home: 11, away: 22 }, // Leverkusen vs Sporting
    { home: 9, away: 2 }, // Dortmund vs Liverpool
    { home: 6, away: 19 }, // Atlético vs Monaco
    { home: 20, away: 25 }, // Brest vs PSV
    { home: 3, away: 18 }, // Aston Villa vs PSG
    { home: 10, away: 7 }, // Leipzig vs Girona
    { home: 12, away: 16 }, // Stuttgart vs Atalanta
    { home: 14, away: 23 }, // Milan vs Benfica
    { home: 15, away: 24 }, // Juventus vs Porto
    { home: 27, away: 26 }, // Celtic vs Feyenoord
    { home: 21, away: 28 }, // Lille vs Club Brugge
    { home: 31, away: 30 }, // Young Boys vs Salzburg
    { home: 29, away: 32 }, // Shakhtar vs Estrela Vermelha
    { home: 35, away: 34 }, // Slovan vs Zagreb
    { home: 33, away: 17 }, // Sparta vs Bologna
  ];

  for (const match of round6Matches) {
    await prisma.match.create({
      data: {
        homeTeamId: teams[match.home].id,
        awayTeamId: teams[match.away].id,
        leagueId: league.id,
        scheduledAt: new Date(round6Date),
        venue: `Estádio ${teams[match.home].name}`,
        status: 'SCHEDULED',
      },
    });
    matchesCreated++;
  }

  // Rodada 7: 28/01/2026
  const round7Date = new Date('2026-01-28T20:00:00');
  const round7Matches = [
    { home: 4, away: 2 }, // Real Madrid vs Liverpool
    { home: 0, away: 13 }, // Man City vs Inter
    { home: 5, away: 8 }, // Barcelona vs Bayern
    { home: 22, away: 1 }, // Sporting vs Arsenal
    { home: 9, away: 22 }, // Dortmund vs Sporting
    { home: 19, away: 11 }, // Monaco vs Leverkusen
    { home: 25, away: 18 }, // PSV vs PSG
    { home: 6, away: 3 }, // Atlético vs Aston Villa
    { home: 7, away: 16 }, // Girona vs Atalanta
    { home: 10, away: 12 }, // Leipzig vs Stuttgart
    { home: 23, away: 15 }, // Benfica vs Juventus
    { home: 24, away: 14 }, // Porto vs Milan
    { home: 26, away: 21 }, // Feyenoord vs Lille
    { home: 28, away: 27 }, // Club Brugge vs Celtic
    { home: 30, away: 29 }, // Salzburg vs Shakhtar
    { home: 32, away: 31 }, // Estrela Vermelha vs Young Boys
    { home: 34, away: 33 }, // Zagreb vs Sparta
    { home: 17, away: 35 }, // Bologna vs Slovan
  ];

  for (const match of round7Matches) {
    await prisma.match.create({
      data: {
        homeTeamId: teams[match.home].id,
        awayTeamId: teams[match.away].id,
        leagueId: league.id,
        scheduledAt: new Date(round7Date),
        venue: `Estádio ${teams[match.home].name}`,
        status: 'SCHEDULED',
      },
    });
    matchesCreated++;
  }

  // Rodada 8 (Final): 29/01/2026 - Todos jogos simultâneos às 20h
  const round8Date = new Date('2026-01-29T20:00:00');
  const round8Matches = [
    { home: 2, away: 4 }, // Liverpool vs Real Madrid
    { home: 13, away: 0 }, // Inter vs Man City
    { home: 8, away: 5 }, // Bayern vs Barcelona
    { home: 1, away: 22 }, // Arsenal vs Sporting
    { home: 11, away: 19 }, // Leverkusen vs Monaco
    { home: 18, away: 25 }, // PSG vs PSV
    { home: 3, away: 6 }, // Aston Villa vs Atlético
    { home: 20, away: 9 }, // Brest vs Dortmund
    { home: 16, away: 7 }, // Atalanta vs Girona
    { home: 12, away: 10 }, // Stuttgart vs Leipzig
    { home: 15, away: 23 }, // Juventus vs Benfica
    { home: 14, away: 24 }, // Milan vs Porto
    { home: 21, away: 26 }, // Lille vs Feyenoord
    { home: 27, away: 28 }, // Celtic vs Club Brugge
    { home: 29, away: 30 }, // Shakhtar vs Salzburg
    { home: 31, away: 32 }, // Young Boys vs Estrela Vermelha
    { home: 33, away: 34 }, // Sparta vs Zagreb
    { home: 35, away: 17 }, // Slovan vs Bologna
  ];

  for (const match of round8Matches) {
    await prisma.match.create({
      data: {
        homeTeamId: teams[match.home].id,
        awayTeamId: teams[match.away].id,
        leagueId: league.id,
        scheduledAt: new Date(round8Date),
        venue: `Estádio ${teams[match.home].name}`,
        status: 'SCHEDULED',
      },
    });
    matchesCreated++;
  }

  console.log('[seed-champions] ✓ Calendário criado:', matchesCreated, 'jogos');

  console.log('\n[seed-champions] ========================================');
  console.log('[seed-champions] ✅ Champions League seed concluído!');
  console.log('[seed-champions] Liga:', league.name);
  console.log('[seed-champions] Times:', teams.length);
  console.log('[seed-champions] Jogos:', matchesCreated);
  console.log('[seed-champions] Início:', '23/11/2025');
  console.log('[seed-champions] ========================================\n');

  return { league, teams, phase, format };
}

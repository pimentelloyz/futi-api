import { PrismaClient, MatchEventType } from '@prisma/client';

/**
 * Seed de partidas
 * 
 * Cria partidas históricas e recentes para testes e demonstração
 */

export async function seedMatches(
  prisma: PrismaClient,
  teamId: string,
  opponentTeamId: string,
) {
  console.log('\n[seed-matches] ========================================');
  console.log('[seed-matches] Iniciando seed de partidas');
  console.log('[seed-matches] ========================================\n');

  // Create matches relative to now
  const now = new Date();
  const match12hAgoDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const match1WeekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const match1MonthAgoDate = new Date(now);
  match1MonthAgoDate.setMonth(now.getMonth() - 1);
  const match1YearAgoDate = new Date(now);
  match1YearAgoDate.setFullYear(now.getFullYear() - 1);

  async function ensureFinishedMatchAt(
    date: Date, 
    venue: string, 
    homeScore = 0, 
    awayScore = 0
  ) {
    const existing = await prisma.match.findFirst({
      where: { 
        homeTeamId: teamId, 
        awayTeamId: opponentTeamId, 
        scheduledAt: date 
      },
    });
    
    if (existing) {
      return await prisma.match.update({ 
        where: { id: existing.id }, 
        data: { status: 'FINISHED', homeScore, awayScore } 
      });
    }
    
    return await prisma.match.create({
      data: {
        homeTeamId: teamId,
        awayTeamId: opponentTeamId,
        scheduledAt: date,
        venue,
        status: 'FINISHED',
        homeScore,
        awayScore,
      },
    });
  }

  const match12h = await ensureFinishedMatchAt(
    match12hAgoDate, 
    'Estádio 12h Atrás', 
    Math.floor(Math.random() * 4), 
    Math.floor(Math.random() * 4)
  );
  
  const matchWeek = await ensureFinishedMatchAt(
    match1WeekAgoDate, 
    'Estádio Semana', 
    Math.floor(Math.random() * 4), 
    Math.floor(Math.random() * 4)
  );
  
  const matchMonth = await ensureFinishedMatchAt(
    match1MonthAgoDate, 
    'Estádio Mês', 
    Math.floor(Math.random() * 4), 
    Math.floor(Math.random() * 4)
  );
  
  const matchYear = await ensureFinishedMatchAt(
    match1YearAgoDate, 
    'Estádio Ano', 
    Math.floor(Math.random() * 4), 
    Math.floor(Math.random() * 4)
  );

  console.log('[seed-matches] ✓ Partidas históricas criadas:', {
    match12h: match12h.scheduledAt.toISOString(),
    matchWeek: matchWeek.scheduledAt.toISOString(),
    matchMonth: matchMonth.scheduledAt.toISOString(),
    matchYear: matchYear.scheduledAt.toISOString(),
  });

  // Create events for the 12h-ago match
  const teamPlayersLinks = await prisma.playersOnTeams.findMany({ 
    where: { teamId }, 
    select: { playerId: true } 
  });
  
  const teamPlayerIds = teamPlayersLinks.map((l) => l.playerId).filter(Boolean);

  if (teamPlayerIds.length > 0) {
    const eventTypes: MatchEventType[] = ['GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL'];
    let eventsCreated = 0;
    
    for (let i = 0; i < teamPlayerIds.length; i++) {
      const playerId = teamPlayerIds[i];
      const eventsForPlayer = Math.floor(Math.random() * 3) + 1;
      
      for (let e = 0; e < eventsForPlayer; e++) {
        const type = eventTypes[(i + e) % eventTypes.length];
        const minute = Math.floor(Math.random() * 90) + 1;
        
        await prisma.matchEvent.create({
          data: {
            matchId: match12h.id,
            teamId,
            playerId,
            minute,
            type,
          },
        });
        eventsCreated += 1;
      }
    }
    
    console.log(`[seed-matches] ✓ ${eventsCreated} eventos criados para partida de 12h atrás`);
  }

  // Recent match for evaluation tests (within last 24h)
  const recentFinishedDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
  let recentFinishedMatch = await prisma.match.findFirst({
    where: {
      homeTeamId: teamId,
      awayTeamId: opponentTeamId,
      scheduledAt: recentFinishedDate,
    },
  });

  if (recentFinishedMatch) {
    recentFinishedMatch = await prisma.match.update({
      where: { id: recentFinishedMatch.id },
      data: { status: 'FINISHED', homeScore: 2, awayScore: 1 },
    });
  } else {
    recentFinishedMatch = await prisma.match.create({
      data: {
        homeTeamId: teamId,
        awayTeamId: opponentTeamId,
        scheduledAt: recentFinishedDate,
        venue: 'Estádio Dinâmico',
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
      },
    });
  }

  console.log('[seed-matches] ✓ Partida recente criada:', recentFinishedMatch.scheduledAt.toISOString());

  // Create evaluation assignments for recent match
  const existingAssignments = await prisma.matchPlayerEvaluationAssignment.findMany({
    where: { matchId: recentFinishedMatch.id },
    select: { id: true },
  });

  if (existingAssignments.length === 0 && teamPlayerIds.length >= 2) {
    const toCreate: Array<{ 
      matchId: string; 
      evaluatorPlayerId: string; 
      targetPlayerId: string;
    }> = [];
    
    const slice = teamPlayerIds.slice(0, Math.min(teamPlayerIds.length, 4));
    
    for (let i = 0; i < slice.length; i++) {
      const evaluator = slice[i];
      const target = slice[(i + 1) % slice.length];
      
      if (evaluator !== target) {
        toCreate.push({ 
          matchId: recentFinishedMatch.id, 
          evaluatorPlayerId: evaluator, 
          targetPlayerId: target 
        });
      }
    }

    for (const a of toCreate) {
      await prisma.matchPlayerEvaluationAssignment.create({ data: a });
    }
    
    console.log(`[seed-matches] ✓ ${toCreate.length} atribuições de avaliação criadas`);
  }

  console.log('\n[seed-matches] ========================================');
  console.log('[seed-matches] Seed de partidas concluído!');
  console.log('[seed-matches] Total: 5 partidas históricas + eventos + avaliações');
  console.log('[seed-matches] ========================================\n');
}

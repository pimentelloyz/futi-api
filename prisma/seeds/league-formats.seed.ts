import { PrismaClient } from '@prisma/client';

/**
 * Seeds para os 7 formatos principais de campeonatos
 * 
 * 1. Copa do Brasil - Mata-mata com ida e volta
 * 2. Libertadores - Grupos + Mata-mata
 * 3. Copa do Mundo - Grupos + Mata-mata + jogo único
 * 4. Champions League - Liga única + Mata-mata
 * 5. Brasileirão - Pontos corridos
 * 6. Estaduais (Paulista) - Grupos + Mata-mata
 * 7. Rachão - Formato flexível/simples
 */

export async function seedLeagueFormats(prisma: PrismaClient) {
  console.log('\n[seed-formats] ========================================');
  console.log('[seed-formats] Iniciando seed de formatos de campeonatos');
  console.log('[seed-formats] ========================================\n');

  const formats = [];

  // ============================================================================
  // 1. COPA DO BRASIL
  // ============================================================================
  
  console.log('[seed-formats] Criando formato: Copa do Brasil');
  const copaBrasil = await prisma.leagueFormat.upsert({
    where: { slug: 'copa-do-brasil' },
    create: {
      name: 'Copa do Brasil',
      slug: 'copa-do-brasil',
      description: 'Sistema eliminatório com partidas de ida e volta em todas as fases',
      type: 'KNOCKOUT',
      isTemplate: true,
      phases: {
        create: [
          {
            name: 'Primeira Fase',
            order: 1,
            type: 'KNOCKOUT',
            teamsCount: 80,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 40,
            advancingFrom: 'WINNERS',
            tiebreakRules: {
              create: [
                { order: 1, criterion: 'POINTS' },
                { order: 2, criterion: 'GOAL_DIFFERENCE' },
              ],
            },
          },
          {
            name: 'Segunda Fase',
            order: 2,
            type: 'KNOCKOUT',
            teamsCount: 40,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 20,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Terceira Fase',
            order: 3,
            type: 'KNOCKOUT',
            teamsCount: 20,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 10,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Oitavas de Final',
            order: 4,
            type: 'KNOCKOUT',
            teamsCount: 16,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 8,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Quartas de Final',
            order: 5,
            type: 'KNOCKOUT',
            teamsCount: 8,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 4,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Semifinal',
            order: 6,
            type: 'KNOCKOUT',
            teamsCount: 4,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 2,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Final',
            order: 7,
            type: 'KNOCKOUT',
            teamsCount: 2,
            hasHomeAway: true,
            hasExtraTime: true,
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
  formats.push(copaBrasil);

  // ============================================================================
  // 2. LIBERTADORES
  // ============================================================================
  
  console.log('[seed-formats] Criando formato: Libertadores');
  const libertadores = await prisma.leagueFormat.upsert({
    where: { slug: 'libertadores' },
    create: {
      name: 'Libertadores',
      slug: 'libertadores',
      description: 'Fase de grupos (8 grupos de 4) seguida de mata-mata',
      type: 'MIXED',
      isTemplate: true,
      phases: {
        create: [
          {
            name: 'Fase de Grupos',
            order: 1,
            type: 'GROUP_STAGE',
            teamsCount: 32,
            groupsCount: 8,
            teamsPerGroup: 4,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: false,
            hasAwayGoal: false,
            advancingTeams: 16,
            advancingFrom: 'TOP_2_EACH_GROUP',
            tiebreakRules: {
              create: [
                { order: 1, criterion: 'POINTS' },
                { order: 2, criterion: 'WINS' },
                { order: 3, criterion: 'GOAL_DIFFERENCE' },
                { order: 4, criterion: 'GOALS_FOR' },
                { order: 5, criterion: 'HEAD_TO_HEAD_POINTS' },
                { order: 6, criterion: 'HEAD_TO_HEAD_GOALS_AWAY' },
                { order: 7, criterion: 'DRAW' },
              ],
            },
          },
          {
            name: 'Oitavas de Final',
            order: 2,
            type: 'KNOCKOUT',
            teamsCount: 16,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 8,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Quartas de Final',
            order: 3,
            type: 'KNOCKOUT',
            teamsCount: 8,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 4,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Semifinal',
            order: 4,
            type: 'KNOCKOUT',
            teamsCount: 4,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 2,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Final',
            order: 5,
            type: 'KNOCKOUT',
            teamsCount: 2,
            hasHomeAway: false,
            hasExtraTime: true,
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
  formats.push(libertadores);

  // ============================================================================
  // 3. COPA DO MUNDO
  // ============================================================================
  
  console.log('[seed-formats] Criando formato: Copa do Mundo');
  const copaMundo = await prisma.leagueFormat.upsert({
    where: { slug: 'copa-do-mundo' },
    create: {
      name: 'Copa do Mundo',
      slug: 'copa-do-mundo',
      description: 'Fase de grupos (8 grupos de 4) seguida de mata-mata em jogo único',
      type: 'MIXED',
      isTemplate: true,
      phases: {
        create: [
          {
            name: 'Fase de Grupos',
            order: 1,
            type: 'GROUP_STAGE',
            teamsCount: 32,
            groupsCount: 8,
            teamsPerGroup: 4,
            hasHomeAway: false,
            hasExtraTime: false,
            hasPenalties: false,
            hasAwayGoal: false,
            advancingTeams: 16,
            advancingFrom: 'TOP_2_EACH_GROUP',
            tiebreakRules: {
              create: [
                { order: 1, criterion: 'POINTS' },
                { order: 2, criterion: 'GOAL_DIFFERENCE' },
                { order: 3, criterion: 'GOALS_FOR' },
                { order: 4, criterion: 'HEAD_TO_HEAD_POINTS' },
                { order: 5, criterion: 'FAIR_PLAY' },
                { order: 6, criterion: 'DRAW' },
              ],
            },
          },
          {
            name: 'Oitavas de Final',
            order: 2,
            type: 'KNOCKOUT',
            teamsCount: 16,
            hasHomeAway: false,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 8,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Quartas de Final',
            order: 3,
            type: 'KNOCKOUT',
            teamsCount: 8,
            hasHomeAway: false,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 4,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Semifinal',
            order: 4,
            type: 'KNOCKOUT',
            teamsCount: 4,
            hasHomeAway: false,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 2,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Disputa de Terceiro Lugar',
            order: 5,
            type: 'KNOCKOUT',
            teamsCount: 2,
            hasHomeAway: false,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 1,
            advancingFrom: 'WINNER',
          },
          {
            name: 'Final',
            order: 6,
            type: 'KNOCKOUT',
            teamsCount: 2,
            hasHomeAway: false,
            hasExtraTime: true,
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
  formats.push(copaMundo);

  // ============================================================================
  // 4. CHAMPIONS LEAGUE
  // ============================================================================
  
  console.log('[seed-formats] Criando formato: Champions League');
  const championsLeague = await prisma.leagueFormat.upsert({
    where: { slug: 'champions-league' },
    create: {
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
                { order: 7, criterion: 'UEFA_COEFFICIENT' },
              ],
            },
          },
          {
            name: 'Playoffs',
            order: 2,
            type: 'PLAYOFF',
            teamsCount: 16,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 8,
            advancingFrom: 'PLAYOFF_WINNERS',
          },
          {
            name: 'Oitavas de Final',
            order: 3,
            type: 'KNOCKOUT',
            teamsCount: 16,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 8,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Quartas de Final',
            order: 4,
            type: 'KNOCKOUT',
            teamsCount: 8,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 4,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Semifinal',
            order: 5,
            type: 'KNOCKOUT',
            teamsCount: 4,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 2,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Final',
            order: 6,
            type: 'KNOCKOUT',
            teamsCount: 2,
            hasHomeAway: false,
            hasExtraTime: true,
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
  formats.push(championsLeague);

  // ============================================================================
  // 5. BRASILEIRÃO
  // ============================================================================
  
  console.log('[seed-formats] Criando formato: Brasileirão');
  const brasileirao = await prisma.leagueFormat.upsert({
    where: { slug: 'brasileirao' },
    create: {
      name: 'Brasileirão',
      slug: 'brasileirao',
      description: 'Pontos corridos - todos contra todos em ida e volta',
      type: 'ROUND_ROBIN',
      isTemplate: true,
      phases: {
        create: [
          {
            name: 'Pontos Corridos',
            order: 1,
            type: 'LEAGUE',
            teamsCount: 20,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: false,
            hasAwayGoal: false,
            advancingTeams: 1,
            advancingFrom: 'TOP_1',
            tiebreakRules: {
              create: [
                { order: 1, criterion: 'POINTS' },
                { order: 2, criterion: 'WINS' },
                { order: 3, criterion: 'GOAL_DIFFERENCE' },
                { order: 4, criterion: 'GOALS_FOR' },
                { order: 5, criterion: 'HEAD_TO_HEAD_POINTS' },
                { order: 6, criterion: 'RED_CARDS' },
                { order: 7, criterion: 'YELLOW_CARDS' },
                { order: 8, criterion: 'DRAW' },
              ],
            },
          },
        ],
      },
    },
    update: {},
  });
  formats.push(brasileirao);

  // ============================================================================
  // 6. ESTADUAL (PAULISTA)
  // ============================================================================
  
  console.log('[seed-formats] Criando formato: Estadual (Paulista)');
  const estadual = await prisma.leagueFormat.upsert({
    where: { slug: 'estadual-paulista' },
    create: {
      name: 'Estadual (Paulista)',
      slug: 'estadual-paulista',
      description: 'Fase de grupos (4 grupos de 4) seguida de quartas, semi e final',
      type: 'MIXED',
      isTemplate: true,
      phases: {
        create: [
          {
            name: 'Fase de Grupos',
            order: 1,
            type: 'GROUP_STAGE',
            teamsCount: 16,
            groupsCount: 4,
            teamsPerGroup: 4,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: false,
            hasAwayGoal: false,
            advancingTeams: 8,
            advancingFrom: 'TOP_2_EACH_GROUP',
            tiebreakRules: {
              create: [
                { order: 1, criterion: 'POINTS' },
                { order: 2, criterion: 'WINS' },
                { order: 3, criterion: 'GOAL_DIFFERENCE' },
                { order: 4, criterion: 'GOALS_FOR' },
                { order: 5, criterion: 'HEAD_TO_HEAD_POINTS' },
                { order: 6, criterion: 'DRAW' },
              ],
            },
          },
          {
            name: 'Quartas de Final',
            order: 2,
            type: 'KNOCKOUT',
            teamsCount: 8,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 4,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Semifinal',
            order: 3,
            type: 'KNOCKOUT',
            teamsCount: 4,
            hasHomeAway: true,
            hasExtraTime: true,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 2,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Final',
            order: 4,
            type: 'KNOCKOUT',
            teamsCount: 2,
            hasHomeAway: true,
            hasExtraTime: true,
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
  formats.push(estadual);

  // ============================================================================
  // 7. RACHÃO / PELADA
  // ============================================================================
  
  console.log('[seed-formats] Criando formato: Rachão / Pelada');
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
            teamsCount: null, // Flexível: 6 a 12 times
            hasHomeAway: false, // Turno único por padrão
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
  formats.push(rachao);

  console.log('\n[seed-formats] ========================================');
  console.log('[seed-formats] Seed de formatos concluído!');
  console.log(`[seed-formats] Total de formatos criados: ${formats.length}`);
  console.log('[seed-formats] Formatos:');
  formats.forEach((f: any) => {
    console.log(`[seed-formats]   - ${f.name} (${f.slug})`);
  });
  console.log('[seed-formats] ========================================\n');
}

// Execução standalone
if (require.main === module) {
  const prisma = new PrismaClient();
  seedLeagueFormats(prisma)
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

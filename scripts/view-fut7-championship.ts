import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar a liga
  const league = await prisma.league.findFirst({
    where: { slug: 'campeonato-fut7-2025' },
    include: {
      teams: {
        include: {
          team: {
            include: {
              players: {
                include: {
                  player: true,
                },
              },
            },
          },
        },
      },
      groups: {
        include: {
          teams: {
            include: {
              team: true,
            },
          },
        },
      },
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
          group: true,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      },
      phases: {
        orderBy: {
          order: 'asc',
        },
        include: {
          standings: {
            include: {
              team: true,
              group: true,
            },
            orderBy: [
              { groupId: 'asc' },
              { points: 'desc' },
            ],
          },
        },
      },
    },
  });

  if (!league) {
    console.log('❌ Liga não encontrada');
    return;
  }

  console.log('\n🏆 CAMPEONATO FUT7 2025\n');
  console.log(`📋 ${league.name}`);
  console.log(`   ID: ${league.id}`);
  console.log(`   Formato: ${league.matchFormat}`);
  console.log(`   Período: ${league.startAt?.toLocaleDateString('pt-BR')} - ${league.endAt?.toLocaleDateString('pt-BR')}`);

  // Times
  console.log(`\n⚽ TIMES (${league.teams.length})`);
  for (const leagueTeam of league.teams) {
    const playerCount = leagueTeam.team.players.length;
    console.log(`   • ${leagueTeam.team.name} (${playerCount} jogadores)`);
  }

  // Grupos
  console.log(`\n📊 GRUPOS`);
  for (const group of league.groups) {
    console.log(`\n   ${group.name}:`);
    for (const groupTeam of group.teams) {
      console.log(`   ${groupTeam.position}. ${groupTeam.team.name}`);
    }
  }

  // Fases
  console.log(`\n🎯 FASES`);
  for (const phase of league.phases) {
    console.log(`\n   Fase ${phase.order}: ${phase.name}`);
    console.log(`   Tipo: ${phase.type}`);
    console.log(`   Status: ${phase.status}`);
    if (phase.startDate) {
      console.log(`   Início: ${phase.startDate.toLocaleDateString('pt-BR')}`);
    }
  }

  // Partidas
  console.log(`\n📅 CALENDÁRIO (${league.matches.length} partidas)`);
  
  const groupPhaseMatches = league.matches.filter((m) => m.groupId);
  console.log(`\n   Fase de Grupos (${groupPhaseMatches.length} partidas):`);
  
  const groupAMatches = groupPhaseMatches.filter((m) => m.group?.name === 'Grupo A');
  const groupBMatches = groupPhaseMatches.filter((m) => m.group?.name === 'Grupo B');
  
  console.log(`\n   Grupo A:`);
  groupAMatches.forEach((match, i) => {
    console.log(`   ${i + 1}. ${match.homeTeam.name} x ${match.awayTeam.name} - ${match.scheduledAt.toLocaleDateString('pt-BR')}`);
  });
  
  console.log(`\n   Grupo B:`);
  groupBMatches.forEach((match, i) => {
    console.log(`   ${i + 1}. ${match.homeTeam.name} x ${match.awayTeam.name} - ${match.scheduledAt.toLocaleDateString('pt-BR')}`);
  });
  
  const knockoutMatches = league.matches.filter((m) => !m.groupId);
  if (knockoutMatches.length > 0) {
    console.log(`\n   Mata-mata (${knockoutMatches.length} partidas):`);
    knockoutMatches.forEach((match, i) => {
      const stage = i < 2 ? 'Semifinal' : 'Final';
      console.log(`   ${stage}: ${match.homeTeam.name} x ${match.awayTeam.name} - ${match.scheduledAt.toLocaleDateString('pt-BR')}`);
    });
  }

  // Classificação
  console.log(`\n📈 CLASSIFICAÇÃO ATUAL`);
  const groupAStandings = league.phases[0]?.standings.filter((s) => s.group?.name === 'Grupo A') || [];
  const groupBStandings = league.phases[0]?.standings.filter((s) => s.group?.name === 'Grupo B') || [];
  
  console.log(`\n   Grupo A:`);
  groupAStandings.forEach((standing) => {
    console.log(`   ${standing.position}. ${standing.team.name} - ${standing.points} pts (${standing.played} J)`);
  });
  
  console.log(`\n   Grupo B:`);
  groupBStandings.forEach((standing) => {
    console.log(`   ${standing.position}. ${standing.team.name} - ${standing.points} pts (${standing.played} J)`);
  });

  // Regras de disciplina
  const disciplineRule = await prisma.disciplineRule.findUnique({
    where: { leagueId: league.id },
  });

  if (disciplineRule) {
    console.log(`\n📋 REGRAS DE DISCIPLINA`);
    console.log(`   • ${disciplineRule.yellowCardsForSuspension} cartões amarelos = suspensão`);
    console.log(`   • Cartão vermelho = ${disciplineRule.redCardMinimumGames} jogo(s) de suspensão`);
  }

  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

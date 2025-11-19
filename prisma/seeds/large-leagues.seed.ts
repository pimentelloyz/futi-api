import { PrismaClient } from '@prisma/client';

/**
 * Seed de ligas grandes
 * 
 * Cria 10 ligas (3 públicas + 7 privadas) com times, jogadores e calendário completo
 * Também cria 2 ligas específicas: "Refugio's Premiere" e "CTec League"
 */

interface LeagueConfig {
  name: string;
  slug: string;
  description: string;
  isPublic: boolean;
  teamsCount: number;
  startAt: Date;
  endAt: Date;
}

const LEAGUE_CONFIGS: LeagueConfig[] = [
  // 3 PÚBLICAS
  {
    name: 'Copa Brasil Amateur',
    slug: 'copa-brasil-amateur',
    description: 'Campeonato aberto para times amadores de todo o Brasil',
    isPublic: true,
    teamsCount: 16,
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-11-30'),
  },
  {
    name: 'Liga Estadual Aberta',
    slug: 'liga-estadual-aberta',
    description: 'Liga estadual com inscrições abertas para todos os times',
    isPublic: true,
    teamsCount: 12,
    startAt: new Date('2024-02-15'),
    endAt: new Date('2024-10-15'),
  },
  {
    name: 'Campeonato Regional Sul',
    slug: 'campeonato-regional-sul',
    description: 'Torneio regional aberto para times do sul do país',
    isPublic: true,
    teamsCount: 10,
    startAt: new Date('2024-04-01'),
    endAt: new Date('2024-09-30'),
  },
  // 7 PRIVADAS/FECHADAS
  {
    name: 'Liga Master Profissional',
    slug: 'liga-master-profissional',
    description: 'Liga exclusiva para times profissionais certificados',
    isPublic: false,
    teamsCount: 20,
    startAt: new Date('2024-01-15'),
    endAt: new Date('2024-12-15'),
  },
  {
    name: 'Copa Elite Empresarial',
    slug: 'copa-elite-empresarial',
    description: 'Torneio exclusivo para times de empresas parceiras',
    isPublic: false,
    teamsCount: 8,
    startAt: new Date('2024-03-10'),
    endAt: new Date('2024-08-10'),
  },
  {
    name: 'Liga Universitária Privada',
    slug: 'liga-universitaria-privada',
    description: 'Liga restrita para times de universidades conveniadas',
    isPublic: false,
    teamsCount: 14,
    startAt: new Date('2024-02-20'),
    endAt: new Date('2024-11-20'),
  },
  {
    name: 'Torneio VIP Convidados',
    slug: 'torneio-vip-convidados',
    description: 'Torneio exclusivo por convite para times selecionados',
    isPublic: false,
    teamsCount: 6,
    startAt: new Date('2024-05-01'),
    endAt: new Date('2024-07-31'),
  },
  {
    name: 'Liga Premium Sócio-Torcedor',
    slug: 'liga-premium-socio-torcedor',
    description: 'Liga exclusiva para times de sócios-torcedores premium',
    isPublic: false,
    teamsCount: 12,
    startAt: new Date('2024-03-15'),
    endAt: new Date('2024-10-30'),
  },
  {
    name: 'Copa Empresas Tech',
    slug: 'copa-empresas-tech',
    description: 'Campeonato fechado para empresas do setor de tecnologia',
    isPublic: false,
    teamsCount: 8,
    startAt: new Date('2024-04-05'),
    endAt: new Date('2024-09-05'),
  },
  {
    name: 'Liga Clube dos Campeões',
    slug: 'liga-clube-dos-campeoes',
    description: 'Liga exclusiva para times campeões de edições anteriores',
    isPublic: false,
    teamsCount: 10,
    startAt: new Date('2024-01-20'),
    endAt: new Date('2024-12-20'),
  },
];

const TEAM_NAMES = [
  'Flamengo da Vila', 'Corinthians do Bairro', 'São Paulo FC Amador', 'Palmeiras Jovem',
  'Santos Praia', 'Vasco da Gama Local', 'Grêmio Porto', 'Internacional Gaúcho',
  'Cruzeiro Mineiro', 'Atlético MG Jovem', 'Botafogo RJ', 'Fluminense Tricolor',
  'Barcelona Brasil', 'Real Madrid Local', 'Manchester City', 'Liverpool FC Amateur',
  'Bayern Munich Brasil', 'Juventus Brasileiro', 'PSG Parisiense', 'Chelsea Brasil',
  'Raio Verde FC', 'Águias Douradas', 'Leões do Norte', 'Tigres do Sul',
  'Falcões do Leste', 'Dragões do Oeste', 'Unidos da Bola', 'Estrela da Manhã',
  'Furacão Azul', 'Relâmpago Vermelho', 'Trovão Branco', 'Tempestade Negra',
  'Vitória BA', 'Bahia Tradicional', 'Sport Recife', 'Náutico PE',
  'Fortaleza CE', 'Ceará SC', 'Goiás EC', 'Atlético GO',
  'Coritiba PR', 'Athletico Paranaense', 'Avaí SC', 'Figueirense SC',
  'Academia de Futebol', 'Escola de Craques', 'Fábrica de Talentos', 'Cantera Brasileira',
  'Juventude FC', 'Promessas do Futuro', 'Nova Geração', 'Futuro Campeão',
  'Guerreiros FC', 'Gladiadores', 'Espartanos', 'Centuriões',
  'Titãs do Campo', 'Gigantes da Bola', 'Colosos FC', 'Hércules United',
  'Pioneiros FC', 'Vanguarda Esportiva', 'Elite Sports', 'Champions United',
  'Victory FC', 'Triumph United', 'Glory Sports', 'Honor FC',
  'Bravos da Bola', 'Audazes FC', 'Destemidos United', 'Intrépidos SC',
  'Campeões do Povo', 'Unidos Venceremos', 'Juntos FC', 'União Esportiva',
  'Esperança FC', 'Sonho Campeão', 'Destino Glorioso', 'Legado FC',
  'Tradição Esportiva', 'História Viva FC', 'Raízes do Futebol', 'Cultura Bola',
];

const FIRST_NAMES = [
  'João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Bruno', 'Thiago', 'Matheus',
  'André', 'Felipe', 'Gustavo', 'Rodrigo', 'Diego', 'Carlos', 'Fernando', 'Marcelo',
  'Ricardo', 'Paulo', 'Renato', 'Roberto', 'Sandro', 'Vitor', 'Wellington', 'Daniel',
  'Leandro', 'Leonardo', 'Márcio', 'Fábio', 'Alexandre', 'Vinícius', 'Caio', 'Renan',
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Almeida',
  'Nascimento', 'Araújo', 'Melo', 'Barbosa', 'Cardoso', 'Correia', 'Dias', 'Fernandes',
  'Freitas', 'Gonçalves', 'Lopes', 'Mendes', 'Monteiro', 'Moreira', 'Nunes', 'Ramos',
];

const POSITION_SLUGS = [
  'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF',
];

function generatePlayerName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

function generateRandomPositionSlug(): string {
  return POSITION_SLUGS[Math.floor(Math.random() * POSITION_SLUGS.length)];
}

function generateRandomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

const usedTeamNames = new Set<string>();

function getUniqueTeamName(): string {
  const availableNames = TEAM_NAMES.filter(name => !usedTeamNames.has(name));
  if (availableNames.length === 0) {
    const uniqueName = `Time ${Math.random().toString(36).substr(2, 9)}`;
    usedTeamNames.add(uniqueName);
    return uniqueName;
  }
  const name = availableNames[Math.floor(Math.random() * availableNames.length)];
  usedTeamNames.add(name);
  return name;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function roundRobinPairs(ids: string[]) {
  const n = ids.length;
  if (n < 2) return [] as Array<Array<[string, string]>>;
  const arr = ids.slice();
  if (n % 2 === 1) arr.push('__BYE__');
  const m = arr.length;
  const rounds: Array<Array<[string, string]>> = [];
  
  for (let r = 0; r < m - 1; r++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < m / 2; i++) {
      const a = arr[i];
      const b = arr[m - 1 - i];
      if (a !== '__BYE__' && b !== '__BYE__') pairs.push([a, b]);
    }
    arr.splice(1, 0, arr.pop()!);
    rounds.push(pairs);
  }
  
  return rounds;
}

export async function seedLargeLeagues(prisma: PrismaClient) {
  console.log('\n[seed-large-leagues] ========================================');
  console.log('[seed-large-leagues] Iniciando seed de ligas grandes');
  console.log('[seed-large-leagues] ========================================\n');

  let totalTeams = 0;
  let totalPlayers = 0;
  let totalMatches = 0;

  // Seed das 10 ligas configuradas
  for (const leagueConfig of LEAGUE_CONFIGS) {
    console.log(`\n[seed-large-leagues] Processando: ${leagueConfig.name} (${leagueConfig.isPublic ? 'PÚBLICA' : 'PRIVADA'})`);
    
    let league = await prisma.league.findFirst({
      where: { slug: leagueConfig.slug },
    });

    if (!league) {
      league = await prisma.league.create({
        data: {
          name: leagueConfig.name,
          slug: leagueConfig.slug,
          description: leagueConfig.description,
          isPublic: leagueConfig.isPublic,
          isActive: true,
          startAt: leagueConfig.startAt,
          endAt: leagueConfig.endAt,
        },
      });
      console.log(`[seed-large-leagues]   ✓ Liga criada: ${league.name}`);
    } else {
      console.log(`[seed-large-leagues]   ℹ Liga já existe: ${league.name}`);
    }

    const teamIds: string[] = [];
    
    for (let i = 0; i < leagueConfig.teamsCount; i++) {
      const teamName = getUniqueTeamName();
      let team = await prisma.team.findFirst({ where: { name: teamName } });

      if (!team) {
        team = await prisma.team.create({
          data: { name: teamName, isActive: true },
        });
        totalTeams++;
      }

      teamIds.push(team.id);

      const existingLink = await prisma.leagueTeam.findFirst({
        where: { leagueId: league.id, teamId: team.id },
      });

      if (!existingLink) {
        await prisma.leagueTeam.create({
          data: { leagueId: league.id, teamId: team.id, division: 'A' },
        });
      }

      // 18 jogadores por time
      const playersPerTeam = 18;
      for (let j = 0; j < playersPerTeam; j++) {
        const playerName = `${generatePlayerName()} (${teamName})`;
        const positionSlug = j === 0 ? 'GK' : generateRandomPositionSlug();

        const existingPlayer = await prisma.player.findFirst({
          where: { name: playerName },
        });

        if (!existingPlayer) {
          const player = await prisma.player.create({
            data: { name: playerName, isActive: true, positionSlug },
          });

          await prisma.playersOnTeams.create({
            data: { playerId: player.id, teamId: team.id },
          });

          totalPlayers++;
        }
      }
    }

    console.log(`[seed-large-leagues]   ✓ ${teamIds.length} times vinculados`);

    // Criar partidas (5 rodadas)
    const matchesPerRound = Math.floor(teamIds.length / 2);
    const totalRounds = 5;
    const matchStatuses: Array<'SCHEDULED' | 'FINISHED' | 'IN_PROGRESS' | 'CANCELED'> = [
      'SCHEDULED', 'FINISHED', 'IN_PROGRESS', 'CANCELED',
    ];

    for (let round = 0; round < totalRounds; round++) {
      for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
        const homeTeamIndex = (matchIndex * 2) % teamIds.length;
        const awayTeamIndex = (matchIndex * 2 + 1) % teamIds.length;
        const homeTeamId = teamIds[homeTeamIndex];
        const awayTeamId = teamIds[awayTeamIndex];
        const scheduledAt = generateRandomDate(leagueConfig.startAt, leagueConfig.endAt);
        const status = matchStatuses[Math.floor(Math.random() * matchStatuses.length)];

        const existingMatch = await prisma.match.findFirst({
          where: { leagueId: league.id, homeTeamId, awayTeamId, scheduledAt },
        });

        if (!existingMatch) {
          await prisma.match.create({
            data: {
              leagueId: league.id,
              homeTeamId,
              awayTeamId,
              scheduledAt,
              status,
              homeScore: status === 'FINISHED' ? Math.floor(Math.random() * 4) : undefined,
              awayScore: status === 'FINISHED' ? Math.floor(Math.random() * 4) : undefined,
            },
          });
          totalMatches++;
        }
      }
    }

    console.log(`[seed-large-leagues]   ✓ ~${matchesPerRound * totalRounds} partidas criadas\n`);
  }

  // Ligas específicas: Refugio's Premiere e CTec League
  async function ensureLeagueCalendar(
    leagueName: string, 
    teamNames: string[], 
    startOffsetDays = 2
  ) {
    const slug = slugify(leagueName);
    let league = await prisma.league.findFirst({ where: { slug } });
    
    if (!league) {
      league = await prisma.league.create({
        data: { 
          name: leagueName, 
          slug, 
          description: `${leagueName} (seeded)`, 
          startAt: new Date(), 
          isActive: true 
        },
      });
      console.log(`[seed-large-leagues]   ✓ Liga criada: ${leagueName}`);
    }

    const teams = [] as Array<{ id: string; name: string }>;
    
    for (const name of teamNames) {
      let t = await prisma.team.findFirst({ where: { name } });
      if (!t) {
        t = await prisma.team.create({ data: { name, isActive: true } });
        totalTeams++;
      }
      
      const existsLink = await prisma.leagueTeam.findFirst({ 
        where: { leagueId: league.id, teamId: t.id } 
      });
      
      if (!existsLink) {
        await prisma.leagueTeam.create({ 
          data: { leagueId: league.id, teamId: t.id, division: 'A' } 
        });
      }
      
      teams.push(t);
    }

    const teamIds = teams.map((t) => t.id);
    const rounds = roundRobinPairs(teamIds);
    if (rounds.length === 0) return;

    const base = new Date();
    base.setDate(base.getDate() + startOffsetDays);
    let createdCount = 0;

    for (let r = 0; r < rounds.length; r++) {
      const day = new Date(base);
      day.setDate(base.getDate() + r * 7);
      
      for (const [home, away] of rounds[r]) {
        const exists = await prisma.match.findFirst({
          where: { leagueId: league.id, homeTeamId: home, awayTeamId: away, scheduledAt: day },
        });
        
        if (!exists) {
          await prisma.match.create({
            data: {
              homeTeamId: home,
              awayTeamId: away,
              scheduledAt: day,
              status: 'SCHEDULED',
              leagueId: league.id,
            },
          });
          createdCount++;
          totalMatches++;
        }
      }
    }

    console.log(`[seed-large-leagues]   ✓ ${createdCount} partidas criadas para ${leagueName}`);
  }

  await ensureLeagueCalendar("Refugio's Premiere", [
    'Refugio FC', 'Premiere United', 'Vale Verde', 'Porto Azul',
    'Serra Negra', 'Atlético Refúgio', 'Estrela do Sul', 'Montanha Real',
  ], 2);

  await ensureLeagueCalendar('CTec League', [
    'CTec Lions', 'CTec Hackers', 'CTec Wizards', 'Tech Valley',
    'Code Warriors', 'Binary United', 'Pixel City', 'Quantum FC',
  ], 3);

  console.log('\n[seed-large-leagues] ========================================');
  console.log('[seed-large-leagues] Seed concluído!');
  console.log(`[seed-large-leagues] Total de ligas: ${LEAGUE_CONFIGS.length + 2}`);
  console.log(`[seed-large-leagues] Total de times: ~${totalTeams}`);
  console.log(`[seed-large-leagues] Total de jogadores: ~${totalPlayers}`);
  console.log(`[seed-large-leagues] Total de partidas: ~${totalMatches}`);
  console.log('[seed-large-leagues] ========================================\n');
}

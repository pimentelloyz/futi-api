import { PrismaClient, MatchEventType } from '@prisma/client';
import { seedLeagueFormats } from './seeds/league-formats.seed.js';

// Prefer DIRECT_URL (5432) para evitar problemas de PgBouncer (porta 6543) em seeds pesados.
// Se DIRECT_URL não estiver definido, cai no DATABASE_URL.
let datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!datasourceUrl) {
  console.warn('[seed] Nenhuma DIRECT_URL ou DATABASE_URL definida. Verifique o .env antes de continuar.');
} else if (/:6543\b/.test(datasourceUrl)) {
  const directCandidate = datasourceUrl.replace(':6543', ':5432');
  console.log('[seed] Detectado URL pooled (PgBouncer 6543). Usando fallback direto 5432:', directCandidate);
  datasourceUrl = directCandidate;
}
const prisma = new PrismaClient({ datasourceUrl });
console.log('[seed] usando datasourceUrl=', datasourceUrl?.replace(/:[^:@/]*@/,'://***:***@')); // máscara básica de credenciais

// Seed an admin user using Firebase data provided
// You can override via env if needed
const SEED_EMAIL = process.env.SEED_EMAIL ?? 'andre.loyz@gmail.com';
const SEED_DISPLAY_NAME = process.env.SEED_DISPLAY_NAME ?? 'André Pimentel';
const SEED_TEAM_NAME = process.env.SEED_TEAM_NAME ?? 'Futi FC';
const SEED_TEAM_ICON = process.env.SEED_TEAM_ICON || undefined;
const SEED_TEAM_DESCRIPTION = process.env.SEED_TEAM_DESCRIPTION || undefined;

// Support either a plain Firebase UID (SEED_FIREBASE_UID) or a Firebase ID token (SEED_FIREBASE_ID_TOKEN)
const RAW_SEED_FIREBASE_UID = process.env.SEED_FIREBASE_UID ??
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjM4MDI5MzRmZTBlZWM0NmE1ZWQwMDA2ZDE0YTFiYWIwMWUzNDUwODMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQW5kcsOpIFBpbWVudGVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pUNGRwbS0wZDRaRnFBQmk5RHhqSC1uWDJuWmQ4MWFUNkJ5bXFieEFILTBoVWlrZzJ1Wnc9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZnV0aS1kZXYtMThhY2QiLCJhdWQiOiJmdXRpLWRldi0xOGFjZCIsImF1dGhfdGltZSI6MTc2Mjk3NjE5OCwidXNlcl9pZCI6IlhVaFdHUEVKUnllcTJUcHVaUTlLcjgwU2x6RzIiLCJzdWIiOiJYVWhXR1BFSlJ5ZXEyVHB1WlE5S3I4MFNsekcyIiwiaWF0IjoxNzYyOTc2MTk4LCJleHAiOjE3NjI5Nzk3OTgsImVtYWlsIjoiYW5kcmUubG95ekBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExNzQ5NTYzOTg5NTM0NTExMzc5NyJdLCJlbWFpbCI6WyJhbmRyZS5sb3l6QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.TXterPhnSEs1bgxEmUhXk-wUsOjuvbYmEtenKzgB_kiTWXiFll6zRa2S57mBUfcc7-hTV3YJdF8VZZs-igPL8cFg0qGN_zDWiIolGGmzNcphMrjbBwZHiTwyko9S8ZbCJcPLa6SvV0j-SXybMHVDoITEntYNstRAAku4_ZIoVlocPTEA4gOje17RZUiq6lBjwEo3iO24sfxKfQInefpoCiy6l6F0qFDmhFjaUzHiWKkiLQDy8TiMROHzs3x5xMoRAsMMqBinRP0nIXoxvYX5uEMN9xIXpfm0dd0LGcQJGW8Csu_sZeKIlljd2byV90wZoh7IUvJdWiSZMpLzDgZWCQ';
const RAW_SEED_FIREBASE_ID_TOKEN = process.env.SEED_FIREBASE_ID_TOKEN;

function extractUidFromJwt(token: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return obj.user_id || obj.sub || undefined;
  } catch {
    return undefined;
  }
}

function resolveFirebaseUid(): string {
  // Priority: explicit UID env -> ID token env -> RAW default (may be UID or token)
  if (process.env.SEED_FIREBASE_UID) return process.env.SEED_FIREBASE_UID;
  if (RAW_SEED_FIREBASE_ID_TOKEN) {
    const fromToken = extractUidFromJwt(RAW_SEED_FIREBASE_ID_TOKEN);
    if (fromToken) return fromToken;
  }
  // If RAW uid looks like a JWT (has dots), try to extract; else use as-is
  if (RAW_SEED_FIREBASE_UID && RAW_SEED_FIREBASE_UID.includes('.')) {
    const fromRaw = extractUidFromJwt(RAW_SEED_FIREBASE_UID);
    if (fromRaw) return fromRaw;
  }
  return RAW_SEED_FIREBASE_UID;
}

const SEED_FIREBASE_UID = resolveFirebaseUid();

// ============================================================================
// LEAGUES SEED - Inline consolidation from leagues.seed.ts
// ============================================================================

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
  // Times brasileiros clássicos
  'Flamengo da Vila', 'Corinthians do Bairro', 'São Paulo FC Amador', 'Palmeiras Jovem',
  'Santos Praia', 'Vasco da Gama Local', 'Grêmio Porto', 'Internacional Gaúcho',
  'Cruzeiro Mineiro', 'Atlético MG Jovem', 'Botafogo RJ', 'Fluminense Tricolor',
  // Times internacionais adaptados
  'Barcelona Brasil', 'Real Madrid Local', 'Manchester City', 'Liverpool FC Amateur',
  'Bayern Munich Brasil', 'Juventus Brasileiro', 'PSG Parisiense', 'Chelsea Brasil',
  // Times amadores criativos
  'Raio Verde FC', 'Águias Douradas', 'Leões do Norte', 'Tigres do Sul',
  'Falcões do Leste', 'Dragões do Oeste', 'Unidos da Bola', 'Estrela da Manhã',
  'Furacão Azul', 'Relâmpago Vermelho', 'Trovão Branco', 'Tempestade Negra',
  // Times regionais brasileiros
  'Vitória BA', 'Bahia Tradicional', 'Sport Recife', 'Náutico PE',
  'Fortaleza CE', 'Ceará SC', 'Goiás EC', 'Atlético GO',
  'Coritiba PR', 'Athletico Paranaense', 'Avaí SC', 'Figueirense SC',
  // Times temáticos
  'Academia de Futebol', 'Escola de Craques', 'Fábrica de Talentos', 'Cantera Brasileira',
  'Juventude FC', 'Promessas do Futuro', 'Nova Geração', 'Futuro Campeão',
  'Guerreiros FC', 'Gladiadores', 'Espartanos', 'Centuriões',
  'Titãs do Campo', 'Gigantes da Bola', 'Colosos FC', 'Hércules United',
  // Times adicionais para completar
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

async function seedLeagues(prisma: PrismaClient) {
  console.log('\n[seed-leagues] ========================================');
  console.log('[seed-leagues] Iniciando seed de 10 ligas (3 públicas + 7 privadas)');
  console.log('[seed-leagues] ========================================\n');

  let totalTeams = 0;
  let totalPlayers = 0;
  let totalMatches = 0;

  for (const leagueConfig of LEAGUE_CONFIGS) {
    console.log(`\n[seed-leagues] Processando liga: ${leagueConfig.name} (${leagueConfig.isPublic ? 'PÚBLICA' : 'PRIVADA'})`);
    
    // Criar ou buscar liga
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
      console.log(`[seed-leagues]   ✓ Liga criada: ${league.name} (ID: ${league.id})`);
    } else {
      console.log(`[seed-leagues]   ℹ Liga já existe: ${league.name} (ID: ${league.id})`);
    }

    // Criar times para esta liga
    const teamIds: string[] = [];
    for (let i = 0; i < leagueConfig.teamsCount; i++) {
      const teamName = getUniqueTeamName();
      
      let team = await prisma.team.findFirst({
        where: { name: teamName },
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: teamName,
            isActive: true,
          },
        });
        totalTeams++;
        console.log(`[seed-leagues]     ✓ Time criado: ${team.name}`);
      }

      teamIds.push(team.id);

      // Associar time à liga via LeagueTeam
      const existingLink = await prisma.leagueTeam.findFirst({
        where: {
          leagueId: league.id,
          teamId: team.id,
        },
      });

      if (!existingLink) {
        await prisma.leagueTeam.create({
          data: {
            leagueId: league.id,
            teamId: team.id,
            division: 'A',
          },
        });
      }

      // Criar jogadores para este time (18 jogadores por time)
      const playersPerTeam = 18;
      for (let j = 0; j < playersPerTeam; j++) {
        const playerName = `${generatePlayerName()} (${teamName})`;
        const positionSlug = j === 0 ? 'GK' : generateRandomPositionSlug();

        const existingPlayer = await prisma.player.findFirst({
          where: { name: playerName },
        });

        if (!existingPlayer) {
          const player = await prisma.player.create({
            data: {
              name: playerName,
              isActive: true,
              positionSlug,
            },
          });

          await prisma.playersOnTeams.create({
            data: {
              playerId: player.id,
              teamId: team.id,
            },
          });

          totalPlayers++;
        }
      }
    }

    console.log(`[seed-leagues]   ✓ ${teamIds.length} times criados/vinculados para ${league.name}`);
    console.log(`[seed-leagues]   ✓ ~${teamIds.length * 18} jogadores criados para ${league.name}`);

    // Criar partidas (round-robin simplificado com 5 rodadas)
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
          where: {
            leagueId: league.id,
            homeTeamId,
            awayTeamId,
            scheduledAt,
          },
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

    console.log(`[seed-leagues]   ✓ ~${matchesPerRound * totalRounds} partidas criadas para ${league.name}\n`);
  }

  console.log('\n[seed-leagues] ========================================');
  console.log('[seed-leagues] Seed de ligas concluído!');
  console.log(`[seed-leagues] Total de ligas: ${LEAGUE_CONFIGS.length}`);
  console.log(`[seed-leagues] Total de times: ~${totalTeams}`);
  console.log(`[seed-leagues] Total de jogadores: ~${totalPlayers}`);
  console.log(`[seed-leagues] Total de partidas: ~${totalMatches}`);
  console.log('[seed-leagues] ========================================\n');
}

// ============================================================================
// END OF LEAGUES SEED
// ============================================================================

async function main() {
  // Ensure user exists (by email or firebaseUid)
  let user = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (!user) {
    const byUid = await prisma.user.findUnique({ where: { firebaseUid: SEED_FIREBASE_UID } });
    if (byUid) user = byUid;
  }

  if (!user) {
    user = await prisma.user.create({
      data: { email: SEED_EMAIL, firebaseUid: SEED_FIREBASE_UID, displayName: SEED_DISPLAY_NAME },
    });
    console.log('[seed] created user:', { id: user.id, email: user.email });
  } else {
    // keep email/displayName/firebaseUid fresh
    user = await prisma.user.update({
      where: { id: user.id },
      data: { email: SEED_EMAIL, displayName: SEED_DISPLAY_NAME, firebaseUid: SEED_FIREBASE_UID },
    });
    console.log('[seed] user exists/updated:', { id: user.id, email: user.email });
  }

  // Ensure ADMIN global access (teamId = null)
  const existingAdmin = await prisma.accessMembership.findFirst({
    where: { userId: user.id, teamId: null, role: 'ADMIN' },
  });
  if (!existingAdmin) {
    await prisma.accessMembership.create({ data: { userId: user.id, teamId: null, role: 'ADMIN' } });
    console.log('[seed] granted ADMIN (global)');
  } else {
    console.log('[seed] ADMIN already granted (global)');
  }

  // Ensure a default team exists
  let team = await prisma.team.findFirst({ where: { name: SEED_TEAM_NAME } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: SEED_TEAM_NAME, icon: SEED_TEAM_ICON, description: SEED_TEAM_DESCRIPTION },
    });
    console.log('[seed] created team:', { id: team.id, name: team.name });
  } else {
    // keep metadata fresh
    team = await prisma.team.update({
      where: { id: team.id },
      data: { icon: SEED_TEAM_ICON, description: SEED_TEAM_DESCRIPTION },
    });
    console.log('[seed] team exists/updated:', { id: team.id, name: team.name });
  }

  // Ensure MANAGER access for this team
  const existingTeamAccess = await prisma.accessMembership.findFirst({
    where: { userId: user.id, teamId: team.id },
  });
  if (!existingTeamAccess) {
    await prisma.accessMembership.create({
      data: { userId: user.id, teamId: team.id, role: 'MANAGER' },
    });
    console.log('[seed] granted MANAGER for team', { teamId: team.id });
  } else if (existingTeamAccess.role !== 'MANAGER') {
    await prisma.accessMembership.update({
      where: { id: existingTeamAccess.id },
      data: { role: 'MANAGER' },
    });
    console.log('[seed] updated role to MANAGER for team', { teamId: team.id });
  } else {
    console.log('[seed] MANAGER already granted for team', { teamId: team.id });
  }

  // Seed Positions
  const positions: Array<{ slug: string; name: string; description: string }> = [
    { slug: 'GK', name: 'Goalkeeper', description: 'Goleiro' },
    { slug: 'CB', name: 'Centre Back', description: 'Zagueiro central' },
    { slug: 'LCB', name: 'Left Centre Back', description: 'Zagueiro central esquerdo' },
    { slug: 'RCB', name: 'Right Centre Back', description: 'Zagueiro central direito' },
    { slug: 'LB', name: 'Left Back', description: 'Lateral-esquerdo' },
    { slug: 'RB', name: 'Right Back', description: 'Lateral-direito' },
    { slug: 'LWB', name: 'Left Wing Back', description: 'Ala-esquerdo / lateral-esquerdo ofensivo' },
    { slug: 'RWB', name: 'Right Wing Back', description: 'Ala-direito / lateral-direito ofensivo' },
    { slug: 'SW', name: 'Sweeper', description: 'Líbero (raro atualmente)' },
    { slug: 'CDM', name: 'Central Defensive Midfielder', description: 'Volante / meio-campista defensivo' },
    { slug: 'CM', name: 'Central Midfielder', description: 'Meio-campista central' },
    { slug: 'CAM', name: 'Central Attacking Midfielder', description: 'Meia ofensivo / armador' },
    { slug: 'LM', name: 'Left Midfielder', description: 'Meia-esquerda' },
    { slug: 'RM', name: 'Right Midfielder', description: 'Meia-direita' },
    { slug: 'CF', name: 'Centre Forward', description: 'Segundo atacante / centroavante recuado' },
    { slug: 'ST', name: 'Striker', description: 'Centroavante' },
    { slug: 'LW', name: 'Left Winger', description: 'Ponta-esquerda' },
    { slug: 'RW', name: 'Right Winger', description: 'Ponta-direita' },
    { slug: 'LF', name: 'Left Forward', description: 'Atacante pela esquerda' },
    { slug: 'RF', name: 'Right Forward', description: 'Atacante pela direita' },
  ];
  for (const p of positions) {
    await prisma.$executeRaw`INSERT INTO "Position" ("slug","name","description","createdAt","updatedAt")
      VALUES (${p.slug}, ${p.name}, ${p.description}, NOW(), NOW())
      ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "updatedAt" = NOW()`;
  }
  console.log('[seed] positions upserted:', positions.length);

  // Ensure Player profile for seeded user and link to default team
  let player = await prisma.player.findUnique({ where: { userId: user.id } });
  // use prisma.playersOnTeams directly (generated client)
  if (!player) {
    const playerName = user.displayName || user.email?.split('@')[0] || 'Seed Player';
    player = await prisma.player.create({
      data: { name: playerName, isActive: true, user: { connect: { id: user.id } } },
    });
    // explicit join
      try {
        await prisma.playersOnTeams.create({ data: { playerId: player.id, teamId: team!.id } });
      } catch {}
    console.log('[seed] created player for user:', { playerId: player.id, userId: user.id });
  } else {
    const existingLink = await prisma.playersOnTeams.findUnique({
      where: { playerId_teamId: { playerId: player.id, teamId: team.id } },
    });
    if (!existingLink) {
      await prisma.playersOnTeams.create({ data: { playerId: player.id, teamId: team.id } });
      console.log('[seed] linked existing player to team:', { playerId: player.id, teamId: team.id });
    }
  }

  // Ensure seeded user's PlayerSkill (André Pimentel) has a similar average to the other seeded players
  if (player) {
    await upsertLinePlayerSkill(player.id, {
      pace: 76,
      shooting: 78,
      passing: 80,
      dribbling: 79,
      defense: 74,
      physical: 75,
    });
    console.log('[seed] ensured PlayerSkill for seeded user (André Pimentel):', { playerId: player.id });
  }

  // === Custom players seed ===
  // Helper to upsert a player by name and link to the team; optionally set positionSlug
  async function upsertPlayer(opts: { name: string }) {
    const existing = await prisma.player.findFirst({ where: { name: opts.name } });
    let createdOrExisting = existing;
    if (!existing) {
      createdOrExisting = await prisma.player.create({
        data: { name: opts.name, isActive: true },
      });
      try {
        await prisma.playersOnTeams.create({ data: { playerId: createdOrExisting.id, teamId: team!.id } });
      } catch {}
      console.log('[seed] created player:', { id: createdOrExisting.id, name: opts.name });
    } else {
      const existingLink = await prisma.playersOnTeams.findUnique({
        where: { playerId_teamId: { playerId: existing.id, teamId: team!.id } },
      });
      if (!existingLink) {
        await prisma.playersOnTeams.create({ data: { playerId: existing.id, teamId: team!.id } });
      }
      console.log('[seed] ensured link/updated player:', { id: existing.id, name: opts.name });
    }
    return createdOrExisting ?? existing!;
  }

  // Helper to upsert PlayerSkill for a player (line players)
  async function upsertLinePlayerSkill(playerId: string, skill: {
    pace: number; shooting: number; passing: number; dribbling: number; defense: number; physical: number;
  }) {
    const existing = await prisma.playerSkill.findUnique({ where: { playerId } });
    if (!existing) {
      await prisma.playerSkill.create({
        data: {
          playerId,
          preferredFoot: 'RIGHT',
          pace: skill.pace,
          shooting: skill.shooting,
          passing: skill.passing,
          dribbling: skill.dribbling,
          defense: skill.defense,
          physical: skill.physical,
          // Keep other defaults; set ballControl as average of dribbling and passing (rounded)
          ballControl: Math.round((skill.dribbling + skill.passing) / 2),
          attack: Math.round((skill.shooting + skill.dribbling + skill.pace) / 3),
        },
      });
      console.log('[seed] created PlayerSkill for player:', { playerId });
    } else {
      await prisma.playerSkill.update({
        where: { id: existing.id },
        data: {
          pace: skill.pace,
          shooting: skill.shooting,
          passing: skill.passing,
          dribbling: skill.dribbling,
          defense: skill.defense,
          physical: skill.physical,
          ballControl: Math.round((skill.dribbling + skill.passing) / 2),
          attack: Math.round((skill.shooting + skill.dribbling + skill.pace) / 3),
        },
      });
      console.log('[seed] updated PlayerSkill for player:', { playerId });
    }
  }

  // Jogadores de linha
  const renan = await upsertPlayer({ name: 'Renan Martins Moreira' });
  await upsertLinePlayerSkill(renan.id, {
    pace: 78, // Ritmo (PAC)
    shooting: 81, // Chute (SHO)
    passing: 83, // Passe (PAS)
    dribbling: 86, // Drible (DRI)
    defense: 70, // Defesa (DEF)
    physical: 74, // Físico (PHY)
  });

  const bruno = await upsertPlayer({ name: 'Bruno Rholing Moreira' });
  await upsertLinePlayerSkill(bruno.id, {
    pace: 75,
    shooting: 83,
    passing: 83,
    dribbling: 78,
    defense: 85,
    physical: 73,
  });

  const laercio = await upsertPlayer({ name: 'Laercio' });
  await upsertLinePlayerSkill(laercio.id, {
    pace: 70,
    shooting: 78,
    passing: 80,
    dribbling: 77,
    defense: 85,
    physical: 78,
  });

  // Goleiro (mantemos PlayerSkill com defaults, posição definida como GK)
  const matheus = await upsertPlayer({ name: 'Matheus Amaral' });

  // === Evaluation forms & criteria (pesos) ===
  // evaluation form keys (kept for reference)
  // (intentionally not declared as types to avoid unused-type lint in seeds)

  async function upsertForm(
    params: {
      name: string;
      positionType: 'LINE' | 'GOALKEEPER';
      isActive: boolean;
      version?: number;
    },
    criteria: Array<{ key: string; name: string; weight: number; min?: number; max?: number }>,
  ) {
    const version = params.version ?? 1;
    // use prisma.evaluationForm and prisma.evaluationCriteria directly
    let form = await prisma.evaluationForm.findFirst({
      where: { name: params.name, positionType: params.positionType, version },
    });
    if (!form) {
      form = await prisma.evaluationForm.create({
        data: {
          name: params.name,
          positionType: params.positionType,
          version,
          isActive: params.isActive,
        },
      });
      console.log('[seed] created EvaluationForm:', { id: form.id, name: form.name });
    } else if (form.isActive !== params.isActive) {
      form = await prisma.evaluationForm.update({
        where: { id: form.id },
        data: { isActive: params.isActive },
      });
      console.log('[seed] updated EvaluationForm isActive:', { id: form.id, isActive: form.isActive });
    }

    // Replace criteria set to keep in sync with provided weights
    await prisma.evaluationCriteria.deleteMany({ where: { formId: form.id } });
    await prisma.evaluationCriteria.createMany({
      data: criteria.map((c) => ({
        formId: form!.id,
        key: c.key,
        name: c.name,
        weight: c.weight,
        minValue: c.min ?? 0,
        maxValue: c.max ?? 100,
      })),
    });
    console.log('[seed] criteria set for form:', { formId: form.id, count: criteria.length });
    return form;
  }

  // Atacante (ativo por padrão)
  await upsertForm(
    { name: 'Linha - Atacante', positionType: 'LINE', isActive: true },
    [
      { key: 'PAC', name: 'Ritmo (PAC)', weight: 0.25 },
      { key: 'SHO', name: 'Finalização (SHO)', weight: 0.4 },
      { key: 'PAS', name: 'Passe (PAS)', weight: 0.15 },
      { key: 'DRI', name: 'Drible (DRI)', weight: 0.2 },
      { key: 'DEF', name: 'Defesa (DEF)', weight: 0.0 },
      { key: 'PHY', name: 'Físico (PHY)', weight: 0.1 },
          { key: 'DIS', name: 'Disciplina (DIS)', weight: 0.1 },
    ],
  );

  // Meio campo (inativo por enquanto)
  await upsertForm(
    { name: 'Linha - Meio campo', positionType: 'LINE', isActive: false },
    [
      { key: 'PAC', name: 'Ritmo (PAC)', weight: 0.2 },
      { key: 'SHO', name: 'Finalização (SHO)', weight: 0.25 },
      { key: 'PAS', name: 'Passe (PAS)', weight: 0.3 },
      { key: 'DRI', name: 'Drible (DRI)', weight: 0.1 },
      { key: 'DEF', name: 'Defesa (DEF)', weight: 0.15 },
      { key: 'PHY', name: 'Físico (PHY)', weight: 0.0 },
      { key: 'DIS', name: 'Disciplina (DIS)', weight: 0.1 },
    ],
  );

  // Defesa (inativo por enquanto)
  await upsertForm(
    { name: 'Linha - Defesa', positionType: 'LINE', isActive: false },
    [
      { key: 'PAC', name: 'Ritmo (PAC)', weight: 0.1 },
      { key: 'SHO', name: 'Finalização (SHO)', weight: 0.05 },
      { key: 'PAS', name: 'Passe (PAS)', weight: 0.15 },
      { key: 'DRI', name: 'Drible (DRI)', weight: 0.0 },
      { key: 'DEF', name: 'Defesa (DEF)', weight: 0.4 },
      { key: 'PHY', name: 'Físico (PHY)', weight: 0.3 },
      { key: 'DIS', name: 'Disciplina (DIS)', weight: 0.1 },
    ],
  );

  // Goleiro (ativo)
  const formGoleiro = await upsertForm(
    { name: 'Goleiro', positionType: 'GOALKEEPER', isActive: true },
    [
      { key: 'REF', name: 'Reflexo (REF)', weight: 0.25 },
      { key: 'COL', name: 'Colocação (COL)', weight: 0.1 },
      { key: 'MAO', name: 'Mãos (MAO)', weight: 0.3 },
      { key: 'MER', name: 'Mergulho (MER)', weight: 0.15 },
      { key: 'JCP', name: 'Jogo com os pés (JCP)', weight: 0.2 },
      { key: 'PHY', name: 'Físico (PHY)', weight: 0.0 },
      { key: 'DIS', name: 'Disciplina (DIS)', weight: 0.1 },
    ],
  );

  // Agregado inicial para o goleiro (Overall 81)
  if (matheus && formGoleiro) {
    await prisma.playerEvaluationAggregate.upsert({
      where: { playerId_formId: { playerId: matheus.id, formId: formGoleiro.id } },
      create: { playerId: matheus.id, formId: formGoleiro.id, count: 1, weightedSum: 81, average: 81 },
      update: { count: { increment: 0 }, weightedSum: { increment: 0 }, average: 81 },
      select: { playerId: true },
    });
    console.log('[seed] initialized GK aggregate for Matheus Amaral with overall 81');
  }

  // === Match seeds ===
  if (!team) {
    console.log('[seed-matches] Default team not found, skipping match seeds.');
    return;
  }

  // Ensure a second team exists for matches
  let opponentTeam = await prisma.team.findFirst({ where: { name: 'Adversário FC' } });
  if (!opponentTeam) {
    opponentTeam = await prisma.team.create({
      data: { name: 'Adversário FC' },
    });
    console.log('[seed] created opponent team:', { id: opponentTeam.id, name: opponentTeam.name });
  }

  // Ensure a sample League / Championship and link both teams to it
  const leagueSlug = 'futi-cup';
  let league = await prisma.league.findFirst({ where: { slug: leagueSlug } });
  if (!league) {
    league = await prisma.league.create({
      data: {
        name: 'Futi Cup',
        slug: leagueSlug,
        description: 'Liga exemplo criada pelo seed',
        startAt: new Date(),
        isActive: true,
      },
    });
    console.log('[seed] created league:', { id: league.id, name: league.name });
  }

  // Link default team and opponent to the league if not linked
  const existingLinkA = await prisma.leagueTeam.findFirst({ where: { leagueId: league.id, teamId: team!.id } });
  if (!existingLinkA) {
    await prisma.leagueTeam.create({ data: { leagueId: league.id, teamId: team!.id, division: 'A' } });
    console.log('[seed] linked team to league:', { teamId: team!.id, leagueId: league.id });
  }
  const existingLinkB = await prisma.leagueTeam.findFirst({ where: { leagueId: league.id, teamId: opponentTeam.id } });
  if (!existingLinkB) {
    await prisma.leagueTeam.create({ data: { leagueId: league.id, teamId: opponentTeam.id, division: 'A' } });
    console.log('[seed] linked opponent team to league:', { teamId: opponentTeam.id, leagueId: league.id });
  }

  // Create matches relative to now so seeds are always meaningful when executed:
  // - one match 12 hours ago (with multiple events for registered players)
  // - one match 1 week ago
  // - one match 1 month ago
  // - one match 1 year ago

  const now = new Date();
  const match12hAgoDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const match1WeekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // For 1 month ago, adjust month to avoid issues with month lengths
  const match1MonthAgoDate = new Date(now);
  match1MonthAgoDate.setMonth(now.getMonth() - 1);
  const match1YearAgoDate = new Date(now);
  match1YearAgoDate.setFullYear(now.getFullYear() - 1);

  async function ensureFinishedMatchAt(date: Date, venue: string, homeScore = 0, awayScore = 0) {
    const existing = await prisma.match.findFirst({
      where: { homeTeamId: team!.id, awayTeamId: opponentTeam!.id, scheduledAt: date },
    });
    if (existing) {
      return await prisma.match.update({ where: { id: existing.id }, data: { status: 'FINISHED', homeScore, awayScore } });
    }
    return await prisma.match.create({
      data: {
        homeTeamId: team!.id,
        awayTeamId: opponentTeam!.id,
        scheduledAt: date,
        venue,
        status: 'FINISHED',
        homeScore,
        awayScore,
      },
    });
  }

  const match12h = await ensureFinishedMatchAt(match12hAgoDate, 'Estádio 12h Atrás', Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));
  const matchWeek = await ensureFinishedMatchAt(match1WeekAgoDate, 'Estádio Semana', Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));
  const matchMonth = await ensureFinishedMatchAt(match1MonthAgoDate, 'Estádio Mês', Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));
  const matchYear = await ensureFinishedMatchAt(match1YearAgoDate, 'Estádio Ano', Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));

  console.log('[seed] ensured historical matches:', {
    match12h: { id: match12h.id, at: match12h.scheduledAt.toISOString() },
    matchWeek: { id: matchWeek.id, at: matchWeek.scheduledAt.toISOString() },
    matchMonth: { id: matchMonth.id, at: matchMonth.scheduledAt.toISOString() },
    matchYear: { id: matchYear.id, at: matchYear.scheduledAt.toISOString() },
  });

  // Create events for the 12h-ago match using registered players on the team
  const teamPlayersLinks = await prisma.playersOnTeams.findMany({ where: { teamId: team!.id }, select: { playerId: true } });
  const teamPlayerIds = teamPlayersLinks.map((l: { playerId: string }) => l.playerId).filter(Boolean);

  // If we have players, create a variety of events spread across minutes
  if (teamPlayerIds.length > 0) {
  const eventTypes: MatchEventType[] = ['GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL'];
    let eventsCreated = 0;
    // For each player create 1-3 events (bounded) to populate the match
    for (let i = 0; i < teamPlayerIds.length; i++) {
      const playerId = teamPlayerIds[i];
      const eventsForPlayer = Math.floor(Math.random() * 3) + 1; // 1..3
      for (let e = 0; e < eventsForPlayer; e++) {
        const type = eventTypes[(i + e) % eventTypes.length];
        const minute = Math.floor(Math.random() * 90) + 1;
        await prisma.matchEvent.create({
          data: {
            matchId: match12h.id,
            teamId: team!.id,
            playerId,
            minute,
            type,
          },
        });
        eventsCreated += 1;
      }
    }
    console.log('[seed] created match events for 12h-ago match:', { matchId: match12h.id, count: eventsCreated });
  } else {
    console.log('[seed] no players found to create events for 12h-ago match');
  }

  // === Recent finished match (within last 24h) for evaluation banner/pending tests ===
  const recentFinishedDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h ago
  let recentFinishedMatch = await prisma.match.findFirst({
    where: {
      homeTeamId: team!.id,
      awayTeamId: opponentTeam!.id,
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
        homeTeamId: team!.id,
        awayTeamId: opponentTeam!.id,
        scheduledAt: recentFinishedDate,
        venue: 'Estádio Dinâmico',
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
      },
    });
  }
  console.log('[seed] ensured recent finished match:', { id: recentFinishedMatch.id, scheduledAt: recentFinishedMatch.scheduledAt.toISOString() });

  // Deterministic evaluation assignments for recent match
  // Reuse previously resolved teamPlayerIds from above (populated for the 12h-ago match)
  // Simple logic: each of first up to 3 players evaluates the next player cyclically
  const existingAssignments = await prisma.matchPlayerEvaluationAssignment.findMany({
    where: { matchId: recentFinishedMatch.id },
    select: { id: true, evaluatorPlayerId: true, targetPlayerId: true },
  });
  if (existingAssignments.length === 0 && teamPlayerIds.length >= 2) {
    const toCreate: Array<{ matchId: string; evaluatorPlayerId: string; targetPlayerId: string }> = [];
    const slice = teamPlayerIds.slice(0, Math.min(teamPlayerIds.length, 4));
    for (let i = 0; i < slice.length; i++) {
      const evaluator = slice[i];
      const target = slice[(i + 1) % slice.length];
      if (evaluator !== target) {
        toCreate.push({ matchId: recentFinishedMatch.id, evaluatorPlayerId: evaluator, targetPlayerId: target });
      }
    }
    for (const a of toCreate) {
      await prisma.matchPlayerEvaluationAssignment.create({ data: a });
    }
    console.log('[seed] created evaluation assignments for recent match:', { count: toCreate.length });
  } else {
    console.log('[seed] skipped creating assignments (already exist or insufficient players)');
  }

  // === Extra: Seed duas ligas com vários times, jogadores e calendário ===
  // Helpers locais
  function slugify(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async function ensureLeagueByName(name: string) {
    const slug = slugify(name);
    let league = await prisma.league.findFirst({ where: { slug } });
    if (!league) {
      league = await prisma.league.create({
        data: { name, slug, description: `${name} (seeded)`, startAt: new Date(), isActive: true },
      });
      console.log('[seed][league] created', { id: league.id, name: league.name, slug: league.slug });
    }
    return league;
  }

  async function ensureTeamByName(name: string) {
    let t = await prisma.team.findFirst({ where: { name } });
    if (!t) {
      t = await prisma.team.create({ data: { name, isActive: true } });
      console.log('[seed][team] created', { id: t.id, name: t.name });
    }
    return t;
  }

  async function linkTeamToLeague(leagueId: string, teamId: string, division: string = 'A') {
    const exists = await prisma.leagueTeam.findFirst({ where: { leagueId, teamId } });
    if (!exists) {
      await prisma.leagueTeam.create({ data: { leagueId, teamId, division } });
      console.log('[seed][leagueTeam] linked', { leagueId, teamId });
    }
  }

  async function ensurePlayersForTeam(teamId: string, desiredCount = 14) {
    // Conta quantos jogadores já estão vinculados
    const current = await prisma.playersOnTeams.findMany({ where: { teamId }, select: { playerId: true } });
    const have = current.length;
    const toCreate = Math.max(0, desiredCount - have);
    if (toCreate === 0) return;
    // Garante 1 goleiro se não houver
    const allPlayerIds = current.map((x) => x.playerId);
    let hasGK = false;
    if (allPlayerIds.length > 0) {
      const anyGK = await prisma.player.findFirst({
        where: { id: { in: allPlayerIds }, positionSlug: 'GK' },
        select: { id: true },
      });
      hasGK = Boolean(anyGK);
    }
    const positionPool = ['ST', 'CF', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LB', 'RB', 'CB'];
    let created = 0;
    if (!hasGK) {
      const name = `GK ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
      const p = await prisma.player.create({ data: { name, isActive: true, positionSlug: 'GK' } });
      try {
        await prisma.playersOnTeams.create({ data: { playerId: p.id, teamId } });
      } catch {}
      created += 1;
    }
    while (created < toCreate) {
      const pos = positionPool[created % positionPool.length];
      const name = `Player ${pos} ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const p = await prisma.player.create({ data: { name, isActive: true, positionSlug: pos } });
      try {
        await prisma.playersOnTeams.create({ data: { playerId: p.id, teamId } });
      } catch {}
      created += 1;
    }
    console.log('[seed][players] ensured for team', { teamId, added: toCreate });
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
      // rotate
      arr.splice(1, 0, arr.pop()!);
      rounds.push(pairs);
    }
    return rounds;
  }

  async function ensureLeagueCalendar(leagueName: string, teamNames: string[], startOffsetDays = 2) {
    const league = await ensureLeagueByName(leagueName);
    const teams = [] as Array<{ id: string; name: string }>;
    for (const name of teamNames) {
      const t = await ensureTeamByName(name);
      await linkTeamToLeague(league.id, t.id);
      await ensurePlayersForTeam(t.id, 14);
      teams.push(t);
    }
    const teamIds = teams.map((t) => t.id);
    const rounds = roundRobinPairs(teamIds);
    if (rounds.length === 0) return;
    const base = new Date();
    base.setDate(base.getDate() + startOffsetDays);
    // Cria partidas (sem scores) para o calendário futuro
    let createdCount = 0;
    for (let r = 0; r < rounds.length; r++) {
      const day = new Date(base);
      day.setDate(base.getDate() + r * 7); // semanal
      for (const [home, away] of rounds[r]) {
        const exists = await prisma.match.findFirst({
          where: { leagueId: league.id, homeTeamId: home, awayTeamId: away, scheduledAt: day },
          select: { id: true },
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
          createdCount += 1;
        }
      }
    }
    console.log('[seed][calendar] ensured for league', { name: league.name, rounds: rounds.length, matches: createdCount });
  }

  // Ligas solicitadas: "Refugio's Premiere" e "CTec League"
  await ensureLeagueCalendar("Refugio's Premiere", [
    'Refugio FC',
    'Premiere United',
    'Vale Verde',
    'Porto Azul',
    'Serra Negra',
    'Atlético Refúgio',
    'Estrela do Sul',
    'Montanha Real',
  ], 2);

  await ensureLeagueCalendar('CTec League', [
    'CTec Lions',
    'CTec Hackers',
    'CTec Wizards',
    'Tech Valley',
    'Code Warriors',
    'Binary United',
    'Pixel City',
    'Quantum FC',
  ], 3);

  // Seed de 10 ligas (3 públicas, 7 privadas) com times, jogadores e partidas
  const shouldSeedLeagues = process.env.SEED_LEAGUES !== 'false';
  if (shouldSeedLeagues) {
    await seedLeagues(prisma);
  } else {
    console.log('[seed] Pulando seed de ligas (SEED_LEAGUES=false)');
  }

  // Seed de formatos de campeonato (Copa do Brasil, Libertadores, etc.)
  const shouldSeedFormats = process.env.SEED_FORMATS !== 'false';
  if (shouldSeedFormats) {
    await seedLeagueFormats(prisma);
  } else {
    console.log('[seed] Pulando seed de formatos (SEED_FORMATS=false)');
  }
}

main()
  .catch((e) => {
    console.error('[seed-error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

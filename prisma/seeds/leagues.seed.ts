import type { PrismaClient } from '@prisma/client';

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
  // 3 LIGAS PÚBLICAS
  {
    name: 'Copa Brasil Amateur',
    slug: 'copa-brasil-amateur',
    description: 'Campeonato nacional aberto para times amadores de todo o país',
    isPublic: true,
    teamsCount: 16,
    startAt: new Date('2025-01-15'),
    endAt: new Date('2025-06-30'),
  },
  {
    name: 'Liga Estadual Aberta',
    slug: 'liga-estadual-aberta',
    description: 'Torneio estadual com participação livre mediante inscrição',
    isPublic: true,
    teamsCount: 12,
    startAt: new Date('2025-02-01'),
    endAt: new Date('2025-07-31'),
  },
  {
    name: 'Campeonato Regional Sul',
    slug: 'campeonato-regional-sul',
    description: 'Liga regional da zona sul com acesso aberto a times da região',
    isPublic: true,
    teamsCount: 10,
    startAt: new Date('2025-03-01'),
    endAt: new Date('2025-08-31'),
  },

  // 7 LIGAS PRIVADAS/FECHADAS
  {
    name: 'Liga Master Profissional',
    slug: 'liga-master-profissional',
    description: 'Liga fechada exclusiva para times profissionais convidados',
    isPublic: false,
    teamsCount: 20,
    startAt: new Date('2025-01-10'),
    endAt: new Date('2025-12-20'),
  },
  {
    name: 'Copa Elite Empresarial',
    slug: 'copa-elite-empresarial',
    description: 'Torneio corporativo fechado para empresas parceiras',
    isPublic: false,
    teamsCount: 8,
    startAt: new Date('2025-04-01'),
    endAt: new Date('2025-09-30'),
  },
  {
    name: 'Liga Universitária Privada',
    slug: 'liga-universitaria-privada',
    description: 'Campeonato exclusivo para universidades conveniadas',
    isPublic: false,
    teamsCount: 14,
    startAt: new Date('2025-02-15'),
    endAt: new Date('2025-11-30'),
  },
  {
    name: 'Torneio VIP Convidados',
    slug: 'torneio-vip-convidados',
    description: 'Competição fechada apenas por convite',
    isPublic: false,
    teamsCount: 6,
    startAt: new Date('2025-05-01'),
    endAt: new Date('2025-07-15'),
  },
  {
    name: 'Liga Premium Sócio-Torcedor',
    slug: 'liga-premium-socio-torcedor',
    description: 'Exclusiva para sócios-torcedores dos clubes parceiros',
    isPublic: false,
    teamsCount: 12,
    startAt: new Date('2025-06-01'),
    endAt: new Date('2025-12-31'),
  },
  {
    name: 'Copa Empresas Tech',
    slug: 'copa-empresas-tech',
    description: 'Torneio fechado para empresas do setor de tecnologia',
    isPublic: false,
    teamsCount: 8,
    startAt: new Date('2025-03-15'),
    endAt: new Date('2025-08-15'),
  },
  {
    name: 'Liga Clube dos Campeões',
    slug: 'liga-clube-dos-campeoes',
    description: 'Liga exclusiva para ex-campeões de outras competições',
    isPublic: false,
    teamsCount: 10,
    startAt: new Date('2025-07-01'),
    endAt: new Date('2025-12-15'),
  },
];

// Nomes reais de times de futebol brasileiro e internacional
const TEAM_NAMES = [
  // Times brasileiros clássicos
  'Flamengo FC', 'Corinthians SC', 'Palmeiras SE', 'São Paulo FC',
  'Santos FC', 'Grêmio FBPA', 'Internacional SC', 'Cruzeiro EC',
  'Atlético MG', 'Botafogo FR', 'Vasco da Gama', 'Fluminense FC',
  'Bahia EC', 'Sport Recife', 'Fortaleza EC', 'Ceará SC',
  'Atlético PR', 'Coritiba FC', 'Goiás EC', 'Vitória BA',
  
  // Times internacionais inspirados
  'Real Madrid CF', 'Barcelona FC', 'Manchester United', 'Liverpool FC',
  'Bayern Munich', 'Juventus FC', 'Paris SG', 'Chelsea FC',
  'Arsenal FC', 'AC Milan', 'Inter Milan', 'Borussia Dortmund',
  'Atletico Madrid', 'AS Roma', 'Napoli SC', 'Ajax Amsterdam',
  
  // Times amadores fictícios
  'Vila Nova EC', 'União Esportiva', 'Estrela do Sul', 'Dragão FC',
  'Leão do Norte', 'Tigres Unidos', 'Águias FC', 'Falcões SC',
  'Lobos EC', 'Tubarões FC', 'Raposas United', 'Gaviões SC',
  'Panteras FC', 'Condor EC', 'Falcons United', 'Phoenix FC',
  'Thunder SC', 'Lightning EC', 'Storm United', 'Tornado FC',
  
  // Times regionais
  'Atlântico FC', 'Pacífico SC', 'Norte United', 'Sul FC',
  'Leste EC', 'Oeste SC', 'Central FC', 'Metropolitan SC',
  'Capital United', 'Cidade FC', 'Municip EC', 'Regional SC',
  'Zona Norte FC', 'Zona Sul EC', 'Zona Leste SC', 'Zona Oeste FC',
  
  // Times temáticos
  'Tecnologia FC', 'Inovação SC', 'Digital United', 'Cyber FC',
  'Academia EC', 'Universidade FC', 'Campus SC', 'Estudantes United',
  'Corporativo FC', 'Empresarial EC', 'Business SC', 'Commerce United',
  'Guerreiros FC', 'Campeões EC', 'Vitoriosos SC', 'Invencíveis United',
];

// Nomes brasileiros comuns para jogadores
const FIRST_NAMES = [
  'Lucas', 'Gabriel', 'Rafael', 'Felipe', 'Pedro', 'Matheus', 'João', 'Bruno',
  'Thiago', 'Diego', 'Gustavo', 'Rodrigo', 'Fernando', 'Carlos', 'André', 'Paulo',
  'Vinícius', 'Leonardo', 'Marcelo', 'Fábio', 'Ricardo', 'Daniel', 'Renato', 'Leandro',
  'Cristiano', 'Alexandre', 'Marcos', 'Roberto', 'Anderson', 'Eduardo', 'William', 'Henrique',
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Almeida',
  'Nascimento', 'Fernandes', 'Soares', 'Mendes', 'Barbosa', 'Cardoso', 'Dias', 'Castro',
  'Freitas', 'Monteiro', 'Ramos', 'Nunes', 'Araújo', 'Correia', 'Pinto', 'Teixeira',
];

// Posições de jogadores (slugs válidos do banco)
const POSITION_SLUGS = [
  'goleiro', 'zagueiro', 'lateral-direito', 'lateral-esquerdo',
  'volante', 'meia', 'meia-atacante', 'ponta-direita', 'ponta-esquerda',
  'centroavante', 'segundo-atacante',
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
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

let usedTeamNames: string[] = [];

function getUniqueTeamName(): string {
  const availableNames = TEAM_NAMES.filter((name) => !usedTeamNames.includes(name));
  if (availableNames.length === 0) {
    // Fallback: gera nome aleatório
    const index = usedTeamNames.length + 1;
    return `Time ${index} FC`;
  }
  const name = availableNames[Math.floor(Math.random() * availableNames.length)];
  usedTeamNames.push(name);
  return name;
}

export async function seedLeagues(prisma: PrismaClient) {
  console.log('[leagues.seed] Iniciando seed de 10 ligas...');

  usedTeamNames = [];
  let totalTeams = 0;
  let totalPlayers = 0;
  let totalMatches = 0;

  for (const config of LEAGUE_CONFIGS) {
    console.log(`[leagues.seed] Criando liga: ${config.name} (${config.isPublic ? 'PÚBLICA' : 'PRIVADA'})`);

    // Cria a liga
    const league = await prisma.league.create({
      data: {
        name: config.name,
        slug: config.slug,
        description: config.description,
        isPublic: config.isPublic,
        isActive: true,
        startAt: config.startAt,
        endAt: config.endAt,
      },
    });

    // Cria times para a liga
    const teams: Array<{ id: string; name: string }> = [];
    for (let i = 0; i < config.teamsCount; i++) {
      const teamName = getUniqueTeamName();
      const team = await prisma.team.create({
        data: {
          name: teamName,
          description: `Time competidor da ${config.name}`,
        },
      });
      teams.push(team);

      // Associa o time à liga
      await prisma.leagueTeam.create({
        data: {
          leagueId: league.id,
          teamId: team.id,
        },
      });

      // Cria 11 jogadores titulares + 7 reservas = 18 jogadores por time
      const playersCount = 18;
      for (let j = 0; j < playersCount; j++) {
        await prisma.player.create({
          data: {
            name: generatePlayerName(),
            positionSlug: generateRandomPositionSlug(),
            number: j + 1,
            teams: {
              create: {
                teamId: team.id,
              },
            },
          },
        });
        totalPlayers++;
      }

      totalTeams++;
    }

    // Cria partidas (round-robin: cada time joga contra todos)
    // Para simplificar, vamos criar pelo menos 5 rodadas de jogos
    const matchesPerRound = Math.floor(config.teamsCount / 2);
    const roundsCount = Math.min(5, config.teamsCount - 1); // Round-robin simples

    for (let round = 0; round < roundsCount; round++) {
      for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
        const homeIndex = (round + matchIndex) % teams.length;
        const awayIndex = (round + teams.length - 1 - matchIndex) % teams.length;

        if (homeIndex !== awayIndex) {
          const matchDate = generateRandomDate(config.startAt, config.endAt);
          const statuses = ['SCHEDULED', 'FINISHED', 'IN_PROGRESS', 'CANCELED'] as const;
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

          await prisma.match.create({
            data: {
              leagueId: league.id,
              homeTeamId: teams[homeIndex].id,
              awayTeamId: teams[awayIndex].id,
              scheduledAt: matchDate,
              status: randomStatus,
            },
          });
          totalMatches++;
        }
      }
    }

    console.log(`[leagues.seed] ✓ Liga "${config.name}" criada com ${config.teamsCount} times`);
  }

  console.log('[leagues.seed] ========================================');
  console.log('[leagues.seed] Seed de ligas concluído!');
  console.log(`[leagues.seed] Total de ligas: ${LEAGUE_CONFIGS.length}`);
  console.log(`[leagues.seed] Total de times: ${totalTeams}`);
  console.log(`[leagues.seed] Total de jogadores: ${totalPlayers}`);
  console.log(`[leagues.seed] Total de partidas: ${totalMatches}`);
  console.log('[leagues.seed] ========================================');
}

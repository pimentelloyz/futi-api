import { PrismaClient, MatchEventType } from '@prisma/client';

// Prefer DIRECT_URL (5432) for seed to avoid PgBouncer issues on pooled port (6543)
const prisma = new PrismaClient({
  // Use pooled connection for Supabase to avoid direct 5432 host issues
  datasourceUrl: process.env.DATABASE_URL,
});

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
  const prismaAny = prisma as any;
  if (!player) {
    const playerName = user.displayName || user.email?.split('@')[0] || 'Seed Player';
    player = await prisma.player.create({
      data: { name: playerName, isActive: true, user: { connect: { id: user.id } } },
    });
    // explicit join
    try {
      await prismaAny.playersOnTeams.create({ data: { playerId: player.id, teamId: team.id } });
    } catch (e) {}
    console.log('[seed] created player for user:', { playerId: player.id, userId: user.id });
  } else {
    const existingLink = await prismaAny.playersOnTeams.findUnique({
      where: { playerId_teamId: { playerId: player.id, teamId: team.id } },
    });
    if (!existingLink) {
      await prismaAny.playersOnTeams.create({ data: { playerId: player.id, teamId: team.id } });
      console.log('[seed] linked existing player to team:', { playerId: player.id, teamId: team.id });
    }
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
        await prismaAny.playersOnTeams.create({ data: { playerId: createdOrExisting.id, teamId: team!.id } });
      } catch {}
      console.log('[seed] created player:', { id: createdOrExisting.id, name: opts.name });
    } else {
      const existingLink = await prismaAny.playersOnTeams.findUnique({
        where: { playerId_teamId: { playerId: existing.id, teamId: team!.id } },
      });
      if (!existingLink) {
        await prismaAny.playersOnTeams.create({ data: { playerId: existing.id, teamId: team!.id } });
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
  type LineKey = 'PAC' | 'SHO' | 'PAS' | 'DRI' | 'DEF' | 'PHY' | 'DIS';
  type GkKey = 'REF' | 'COL' | 'MAO' | 'MER' | 'JCP' | 'PHY' | 'DIS';

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
    const pAny = prisma as unknown as {
      evaluationForm: {
        findFirst: (args: { where: { name: string; positionType: string; version: number } }) => Promise<{ id: string; name: string; isActive: boolean } | null>;
        create: (args: { data: { name: string; positionType: string; version: number; isActive: boolean } }) => Promise<{ id: string; name: string; isActive: boolean }>;
        update: (args: { where: { id: string }; data: { isActive: boolean } }) => Promise<{ id: string; name: string; isActive: boolean }>
      };
      evaluationCriteria: {
        deleteMany: (args: { where: { formId: string } }) => Promise<unknown>;
        createMany: (args: { data: Array<{ formId: string; key: string; name: string; weight: number; minValue: number; maxValue: number }> }) => Promise<unknown>;
      };
    };
    let form = await pAny.evaluationForm.findFirst({
      where: { name: params.name, positionType: params.positionType, version },
    });
    if (!form) {
      form = await pAny.evaluationForm.create({
        data: {
          name: params.name,
          positionType: params.positionType,
          version,
          isActive: params.isActive,
        },
      });
      console.log('[seed] created EvaluationForm:', { id: form.id, name: form.name });
    } else if (form.isActive !== params.isActive) {
      form = await pAny.evaluationForm.update({
        where: { id: form.id },
        data: { isActive: params.isActive },
      });
      console.log('[seed] updated EvaluationForm isActive:', { id: form.id, isActive: form.isActive });
    }

    // Replace criteria set to keep in sync with provided weights
    await pAny.evaluationCriteria.deleteMany({ where: { formId: form.id } });
    await pAny.evaluationCriteria.createMany({
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
  const formAtacante = await upsertForm(
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
    const pAny2 = prisma as unknown as {
      playerEvaluationAggregate: {
        upsert: (args: { where: { playerId_formId: { playerId: string; formId: string } }; create: { playerId: string; formId: string; count: number; weightedSum: number; average: number }; update: { count: { increment: number }; weightedSum: { increment: number }; average: number }; select: { playerId: true } }) => Promise<{ playerId: string }>
      }
    };
    await pAny2.playerEvaluationAggregate.upsert({
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

  // 1. Match for tomorrow (Nov 14, 2025, 18:00)
  const tomorrow = new Date('2025-11-14T18:00:00');

  // Upsert to avoid duplicates on re-seed
  let scheduledMatch = await prisma.match.findFirst({
    where: { homeTeamId: team.id, awayTeamId: opponentTeam.id, scheduledAt: tomorrow },
  });
  if (scheduledMatch) {
    scheduledMatch = await prisma.match.update({
      where: { id: scheduledMatch.id },
      data: { status: 'SCHEDULED' },
    });
  } else {
    scheduledMatch = await prisma.match.create({
      data: {
        homeTeamId: team.id,
        awayTeamId: opponentTeam.id,
        scheduledAt: tomorrow,
        venue: 'Estádio Principal',
        status: 'SCHEDULED',
      },
    });
  }
  console.log('[seed] ensured scheduled match for tomorrow:', { id: scheduledMatch.id });

  // 2. Match from yesterday (Nov 12, 2025, 18:00) with events
  const yesterday = new Date('2025-11-12T18:00:00');
  let finishedMatch = await prisma.match.findFirst({
    where: { homeTeamId: team.id, awayTeamId: opponentTeam.id, scheduledAt: yesterday },
  });
  if (finishedMatch) {
    finishedMatch = await prisma.match.update({
      where: { id: finishedMatch.id },
      data: { status: 'FINISHED', homeScore: 1, awayScore: 0 },
    });
  } else {
    finishedMatch = await prisma.match.create({
      data: {
        homeTeamId: team.id,
        awayTeamId: opponentTeam.id,
        scheduledAt: yesterday,
        venue: 'Estádio Secundário',
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 0,
      },
    });
  }
  console.log('[seed] ensured finished match from yesterday:', { id: finishedMatch.id });

  // Create events for the finished match
  const playerForEvents = renan; // Use 'Renan Martins Moreira' for events
  if (playerForEvents) {
    const eventTypes: MatchEventType[] = ['GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL'];
    for (const type of eventTypes) {
      await prisma.matchEvent.create({
        data: {
          matchId: finishedMatch.id,
          teamId: team.id,
          playerId: playerForEvents.id,
          minute: Math.floor(Math.random() * 90) + 1, // random minute
          type: type,
        },
      });
    }
    console.log('[seed] created match events for finished match:', { matchId: finishedMatch.id, count: eventTypes.length });
  }

  // === Recent finished match (within last 24h) for evaluation banner/pending tests ===
  const recentFinishedDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h ago
  let recentFinishedMatch = await prisma.match.findFirst({
    where: {
      homeTeamId: team.id,
      awayTeamId: opponentTeam.id,
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
        homeTeamId: team.id,
        awayTeamId: opponentTeam.id,
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
  const pAnyPlayers = prisma as unknown as {
    playersOnTeams: {
      findMany: (args: { where: { teamId: string }; select: { playerId: true } }) => Promise<Array<{ playerId: string }>>;
    };
  };
  const teamPlayersLinks = await pAnyPlayers.playersOnTeams.findMany({
    where: { teamId: team.id },
    select: { playerId: true },
  });
  const teamPlayerIds = teamPlayersLinks.map((l: { playerId: string }) => l.playerId).filter(Boolean);
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
}

main()
  .catch((e) => {
    console.error('[seed-error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import type { Request, Response } from 'express';

import { prisma } from '../../infra/prisma/client.js';

// Prisma client is generated and includes league models

export async function createLeague(req: Request, res: Response) {
  const { name, slug, description, startAt, endAt, icon, banner } = req.body as {
    name?: string;
    slug?: string;
    description?: string | null;
    startAt?: string | Date | null;
    endAt?: string | Date | null;
    icon?: string | null;
    banner?: string | null;
  };
  if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
  const existing = await prisma.league.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ message: 'slug already exists' });
  const league = await prisma.league.create({
    data: {
      name,
      slug,
      description,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      // evitar erro de tipos do Prisma Client desatualizado
      ...(icon ? (JSON.parse(JSON.stringify({ icon })) as unknown as Record<string, unknown>) : {}),
      ...(banner
        ? (JSON.parse(JSON.stringify({ banner })) as unknown as Record<string, unknown>)
        : {}),
    },
  });
  return res.status(201).json({ id: league.id });
}

export async function listLeagues(req: Request, res: Response) {
  // Query params: q, name, slug, isActive, startAtFrom, startAtTo, endAtFrom, endAtTo, page, pageSize, orderBy, order
  const qp = req.query as Record<string, string | undefined>;
  const q = qp.q?.toString().trim();
  const name = qp.name?.toString().trim();
  const slug = qp.slug?.toString().trim();
  const isActiveParam = qp.isActive?.toString().toLowerCase();
  const startAtFrom = qp.startAtFrom ? new Date(qp.startAtFrom) : undefined;
  const startAtTo = qp.startAtTo ? new Date(qp.startAtTo) : undefined;
  const endAtFrom = qp.endAtFrom ? new Date(qp.endAtFrom) : undefined;
  const endAtTo = qp.endAtTo ? new Date(qp.endAtTo) : undefined;
  const page = Math.max(parseInt(qp.page ?? '1', 10) || 1, 1);
  const pageSizeRaw = Math.max(parseInt(qp.pageSize ?? '20', 10) || 20, 1);
  const pageSize = Math.min(pageSizeRaw, 20); // enforce max 20 per request
  const skip = (page - 1) * pageSize;
  const orderByField = (qp.orderBy as string) || 'createdAt';
  const order: 'asc' | 'desc' =
    qp.order === 'asc' || qp.order === 'desc'
      ? (qp.order as 'asc' | 'desc')
      : orderByField === 'name'
        ? 'asc'
        : 'desc';

  const where: Record<string, unknown> = {};
  const andClauses: Array<Record<string, unknown>> = [];
  if (q) {
    andClauses.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  if (name) andClauses.push({ name: { contains: name, mode: 'insensitive' } });
  if (slug) andClauses.push({ slug: { contains: slug, mode: 'insensitive' } });
  if (isActiveParam === 'true' || isActiveParam === 'false')
    andClauses.push({ isActive: isActiveParam === 'true' });
  if (startAtFrom || startAtTo) {
    const range: Record<string, Date> = {};
    if (startAtFrom && !isNaN(startAtFrom.getTime())) range.gte = startAtFrom;
    if (startAtTo && !isNaN(startAtTo.getTime())) range.lte = startAtTo;
    if (Object.keys(range).length) andClauses.push({ startAt: range });
  }
  if (endAtFrom || endAtTo) {
    const range: Record<string, Date> = {};
    if (endAtFrom && !isNaN(endAtFrom.getTime())) range.gte = endAtFrom;
    if (endAtTo && !isNaN(endAtTo.getTime())) range.lte = endAtTo;
    if (Object.keys(range).length) andClauses.push({ endAt: range });
  }
  if (andClauses.length) (where as Record<string, unknown>).AND = andClauses;

  const total = await prisma.league.count({ where: where as never });
  const items = await prisma.league.findMany({
    where: where as never,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      banner: true,
      startAt: true,
      endAt: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { [orderByField]: order } as never,
    skip,
    take: pageSize,
  });
  return res.json({ items, page, pageSize, total, hasNext: skip + items.length < total });
}

// List leagues linked to the logged-in user (via team memberships)
export async function listMyLeagues(req: Request, res: Response) {
  const meUser = req.user as { id: string } | undefined;
  if (!meUser) return res.status(401).json({ error: 'unauthorized' });
  // Team memberships via AccessMembership
  const access = await prisma.accessMembership.findMany({
    where: { userId: meUser.id, teamId: { not: null } },
    select: { teamId: true },
  });
  // Team memberships via Player -> PlayersOnTeams
  const mePlayer = await prisma.player.findUnique({
    where: { userId: meUser.id },
    select: { id: true },
  });
  let playerTeams: Array<{ teamId: string }> = [];
  if (mePlayer) {
    playerTeams = await prisma.playersOnTeams.findMany({
      where: { playerId: mePlayer.id },
      select: { teamId: true },
    });
  }
  const teamIds = Array.from(
    new Set([
      ...access.map((a) => a.teamId!).filter(Boolean),
      ...playerTeams.map((p) => p.teamId).filter(Boolean),
    ]),
  );
  if (teamIds.length === 0) return res.json([]);
  const leagues = await prisma.league.findMany({
    where: { teams: { some: { teamId: { in: teamIds } } } },
    select: { id: true, name: true, slug: true, description: true, isActive: true },
    orderBy: { name: 'asc' },
  });
  return res.json(leagues);
}

// Detailed league info for a league the current user belongs to
export async function getMyLeagueDetails(req: Request, res: Response) {
  const meUser = req.user as { id: string } | undefined;
  if (!meUser) return res.status(401).json({ error: 'unauthorized' });
  const { id } = req.params; // league id
  if (!id) return res.status(400).json({ error: 'invalid_league_id' });
  // Collect user's teamIds
  const access = await prisma.accessMembership.findMany({
    where: { userId: meUser.id, teamId: { not: null } },
    select: { teamId: true },
  });
  const mePlayer = await prisma.player.findUnique({
    where: { userId: meUser.id },
    select: { id: true },
  });
  let playerTeams: Array<{ teamId: string }> = [];
  if (mePlayer) {
    playerTeams = await prisma.playersOnTeams.findMany({
      where: { playerId: mePlayer.id },
      select: { teamId: true },
    });
  }
  const teamIds = Array.from(
    new Set([
      ...access.map((a) => a.teamId!).filter(Boolean),
      ...playerTeams.map((p) => p.teamId).filter(Boolean),
    ]),
  );
  if (teamIds.length === 0) return res.status(404).json({ error: 'league_not_found' });
  // Fetch league only if the user is associated via any team
  const league = await prisma.league.findFirst({
    where: { id, teams: { some: { teamId: { in: teamIds } } } },
    include: {
      teams: { include: { team: true } },
      groups: { include: { teams: { include: { team: true } } } },
    },
  });
  if (!league) return res.status(404).json({ error: 'league_not_found' });
  return res.json(league);
}

export async function getLeague(req: Request, res: Response) {
  const { id } = req.params;
  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      teams: { include: { team: true } },
      groups: { include: { teams: { include: { team: true } } } },
    },
  });
  if (!league) return res.status(404).json({ message: 'league not found' });
  return res.json(league);
}

function toDateOrNull(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function updateLeague(req: Request, res: Response) {
  const { id } = req.params;
  const { name, slug, description, startAt, endAt, isActive } = req.body as Partial<{
    name: string;
    slug: string;
    description: string | null;
    startAt: string | Date | null;
    endAt: string | Date | null;
    isActive: boolean;
  }>;
  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return res.status(404).json({ message: 'league not found' });
  if (slug && slug !== league.slug) {
    const exists = await prisma.league.findUnique({ where: { slug } });
    if (exists) return res.status(409).json({ message: 'slug already exists' });
  }
  const updated = await prisma.league.update({
    where: { id },
    data: {
      name: typeof name === 'string' ? name : undefined,
      slug: typeof slug === 'string' ? slug : undefined,
      description: description === undefined ? undefined : (description as string | null),
      startAt: toDateOrNull(startAt),
      endAt: toDateOrNull(endAt),
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    },
  });
  return res.json(updated);
}

export async function deleteLeague(req: Request, res: Response) {
  const { id } = req.params;
  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return res.status(404).json({ message: 'league not found' });
  // Soft delete to preserve relations
  await prisma.league.update({ where: { id }, data: { isActive: false } });
  return res.status(204).send();
}

export async function listLeagueTeams(req: Request, res: Response) {
  const { id } = req.params; // league id
  if (!id) return res.status(400).json({ message: 'invalid league id' });
  const exists = await prisma.league.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return res.status(404).json({ message: 'league not found' });
  const teams = await prisma.leagueTeam.findMany({
    where: { leagueId: id },
    include: { team: true },
    orderBy: { team: { name: 'asc' } },
  });
  return res.json(teams);
}

export async function addTeamToLeague(req: Request, res: Response) {
  const { id } = req.params; // league id
  const { teamId, division } = req.body;
  if (!teamId) return res.status(400).json({ message: 'teamId required' });
  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return res.status(404).json({ message: 'league not found' });
  try {
    const link = await prisma.leagueTeam.create({ data: { leagueId: id, teamId, division } });
    return res.status(201).json(link);
  } catch {
    return res.status(400).json({ message: 'could not link team (maybe already linked)' });
  }
}

export async function createGroup(req: Request, res: Response) {
  const { id } = req.params; // league id
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return res.status(404).json({ message: 'league not found' });
  const group = await prisma.leagueGroup.create({ data: { leagueId: id, name } });
  return res.status(201).json(group);
}

export async function addTeamToGroup(req: Request, res: Response) {
  const { id, groupId } = req.params; // league id, group id
  const { teamId } = req.body;
  if (!teamId) return res.status(400).json({ message: 'teamId required' });
  const group = await prisma.leagueGroup.findUnique({ where: { id: groupId } });
  if (!group || group.leagueId !== id)
    return res.status(404).json({ message: 'group not found for league' });
  try {
    const entry = await prisma.leagueGroupTeam.create({ data: { groupId, teamId } });
    return res.status(201).json(entry);
  } catch {
    return res.status(400).json({ message: 'could not add team to group (maybe already added)' });
  }
}

function roundRobinPairs(teams: string[]) {
  // returns array of rounds, each round is array of [home, away]
  const n = teams.length;
  if (n < 2) return [];
  const players = teams.slice();
  if (n % 2 === 1) players.push('__BYE__');
  const m = players.length;
  const rounds: Array<Array<[string, string]>> = [];
  for (let round = 0; round < m - 1; round++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < m / 2; i++) {
      const a = players[i];
      const b = players[m - 1 - i];
      if (a !== '__BYE__' && b !== '__BYE__') pairs.push([a, b]);
    }
    // rotate
    players.splice(1, 0, players.pop()!);
    rounds.push(pairs);
  }
  return rounds;
}

export async function generateFixturesForGroup(req: Request, res: Response) {
  const { id, groupId } = req.params; // league id, group id
  const group = await prisma.leagueGroup.findUnique({
    where: { id: groupId },
    include: { teams: true },
  });
  if (!group || group.leagueId !== id)
    return res.status(404).json({ message: 'group not found for league' });
  const teamIds = (group.teams as Array<{ teamId: string }>).map((t) => t.teamId);
  const rounds = roundRobinPairs(teamIds);
  // create matches starting tomorrow, spacing 7 days per round
  const matchesCreated: Array<Record<string, unknown>> = [];
  const start = new Date();
  start.setDate(start.getDate() + 1);
  for (let r = 0; r < rounds.length; r++) {
    const day = new Date(start);
    day.setDate(start.getDate() + r * 7);
    for (const [home, away] of rounds[r]) {
      const match = await prisma.match.create({
        data: { homeTeamId: home, awayTeamId: away, scheduledAt: day, leagueId: id, groupId },
      });
      matchesCreated.push(match);
    }
  }
  return res.status(201).json({ count: matchesCreated.length, matches: matchesCreated });
}

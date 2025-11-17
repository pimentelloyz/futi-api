import type { Request, Response } from 'express';

import { prisma } from '../../infra/prisma/client.js';
import { LeagueService } from '../../domain/services/league.service.js';

const leagueService = new LeagueService(prisma);

export async function createLeague(req: Request, res: Response) {
  try {
    const { name, slug, description, startAt, endAt, icon, banner, isPublic, isActive } =
      req.body as {
        name?: string;
        slug?: string;
        description?: string | null;
        startAt?: string | Date | null;
        endAt?: string | Date | null;
        icon?: string | null;
        banner?: string | null;
        isPublic?: boolean;
        isActive?: boolean;
      };

    const league = await leagueService.createLeague({
      name: name!,
      slug: slug!,
      description,
      icon,
      banner,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      isPublic,
      isActive,
    });

    return res.status(201).json({ id: league.id });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('required')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function listLeagues(req: Request, res: Response) {
  try {
    const qp = req.query as Record<string, string | undefined>;

    // Filtros
    const filters = {
      q: qp.q?.toString().trim(),
      name: qp.name?.toString().trim(),
      slug: qp.slug?.toString().trim(),
      isActive: qp.isActive === 'true' ? true : qp.isActive === 'false' ? false : undefined,
      isPublic: qp.isPublic === 'true' ? true : qp.isPublic === 'false' ? false : undefined,
      startAtFrom: qp.startAtFrom ? new Date(qp.startAtFrom) : undefined,
      startAtTo: qp.startAtTo ? new Date(qp.startAtTo) : undefined,
      endAtFrom: qp.endAtFrom ? new Date(qp.endAtFrom) : undefined,
      endAtTo: qp.endAtTo ? new Date(qp.endAtTo) : undefined,
    };

    // Paginação
    const pagination = {
      page: Math.max(parseInt(qp.page ?? '1', 10) || 1, 1),
      pageSize: Math.max(parseInt(qp.pageSize ?? '20', 10) || 20, 1),
      orderBy: (qp.orderBy as string) || 'createdAt',
      order: (qp.order === 'asc' || qp.order === 'desc' ? qp.order : undefined) as
        | 'asc'
        | 'desc'
        | undefined,
    };

    const result = await leagueService.listLeagues(filters, pagination);
    return res.json(result);
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// List leagues linked to the logged-in user (via team memberships)
export async function listMyLeagues(req: Request, res: Response) {
  try {
    const meUser = req.user as { id: string } | undefined;
    if (!meUser) return res.status(401).json({ error: 'unauthorized' });

    const leagues = await leagueService.listUserLeagues(meUser.id);
    return res.json(leagues);
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
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
  try {
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
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
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
  try {
    const { id } = req.params;
    const { name, slug, description, startAt, endAt, isActive, isPublic, icon, banner } =
      req.body as Partial<{
        name: string;
        slug: string;
        description: string | null;
        startAt: string | Date | null;
        endAt: string | Date | null;
        isActive: boolean;
        isPublic: boolean;
        icon: string | null;
        banner: string | null;
      }>;

    const updated = await leagueService.updateLeague(id, {
      name,
      slug,
      description,
      icon,
      banner,
      startAt: toDateOrNull(startAt) === null ? null : toDateOrNull(startAt),
      endAt: toDateOrNull(endAt) === null ? null : toDateOrNull(endAt),
      isActive,
      isPublic,
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteLeague(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await leagueService.deleteLeague(id);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
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

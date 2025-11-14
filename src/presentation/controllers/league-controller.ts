import type { Request, Response } from 'express';
import { prisma } from '../../infra/prisma/client.js';

// Prisma client is generated and includes league models

export async function createLeague(req: Request, res: Response) {
  const { name, slug, description, startAt, endAt } = req.body;
  if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
  const existing = await prisma.league.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ message: 'slug already exists' });
  const league = await prisma.league.create({ data: { name, slug, description, startAt: startAt ? new Date(startAt) : undefined, endAt: endAt ? new Date(endAt) : undefined } });
  return res.status(201).json(league);
}

export async function listLeagues(_req: Request, res: Response) {
  const leagues = await prisma.league.findMany({ include: { teams: { include: { team: true } }, groups: { include: { teams: { include: { team: true } } } } } });
  return res.json(leagues);
}

export async function getLeague(req: Request, res: Response) {
  const { id } = req.params;
  const league = await prisma.league.findUnique({ where: { id }, include: { teams: { include: { team: true } }, groups: { include: { teams: { include: { team: true } } } } } });
  if (!league) return res.status(404).json({ message: 'league not found' });
  return res.json(league);
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
  } catch (e) {
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
  if (!group || group.leagueId !== id) return res.status(404).json({ message: 'group not found for league' });
  try {
  const entry = await prisma.leagueGroupTeam.create({ data: { groupId, teamId } });
    return res.status(201).json(entry);
  } catch (e) {
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
  const group = await prisma.leagueGroup.findUnique({ where: { id: groupId }, include: { teams: true } });
  if (!group || group.leagueId !== id) return res.status(404).json({ message: 'group not found for league' });
  const teamIds = group.teams.map((t: any) => t.teamId);
  const rounds = roundRobinPairs(teamIds);
  // create matches starting tomorrow, spacing 7 days per round
  const matchesCreated = [] as any[];
  const start = new Date();
  start.setDate(start.getDate() + 1);
  for (let r = 0; r < rounds.length; r++) {
    const day = new Date(start);
    day.setDate(start.getDate() + r * 7);
    for (const [home, away] of rounds[r]) {
  const match = await prisma.match.create({ data: { homeTeamId: home, awayTeamId: away, scheduledAt: day, leagueId: id, groupId } });
      matchesCreated.push(match);
    }
  }
  return res.status(201).json({ count: matchesCreated.length, matches: matchesCreated });
}

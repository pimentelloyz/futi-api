import { prisma } from './client.js';

export async function listTeamIdsForPlayer(playerId: string): Promise<string[]> {
  const rows = await prisma.playersOnTeams.findMany({
    where: { playerId },
    select: { teamId: true },
  });
  return rows.map((r) => r.teamId).filter((id): id is string => Boolean(id));
}

export async function listPlayerIdsForTeam(teamId: string): Promise<string[]> {
  const rows = await prisma.playersOnTeams.findMany({
    where: { teamId },
    select: { playerId: true },
  });
  return rows.map((r) => r.playerId).filter((id): id is string => Boolean(id));
}

import { prisma } from './client.js';

// Typed helpers to avoid repetitive unsafe casts across controllers.
const prismaPlayersOnTeams = prisma as unknown as {
  playersOnTeams: {
    findMany: (args: {
      where: { playerId?: string; teamId?: string };
      select: { teamId?: true; playerId?: true };
    }) => Promise<Array<{ teamId?: string | null; playerId?: string | null }>>;
  };
};

export async function listTeamIdsForPlayer(playerId: string): Promise<string[]> {
  const rows = await prismaPlayersOnTeams.playersOnTeams.findMany({
    where: { playerId },
    select: { teamId: true },
  });
  return rows.map((r) => r.teamId).filter((id): id is string => Boolean(id));
}

export async function listPlayerIdsForTeam(teamId: string): Promise<string[]> {
  const rows = await prismaPlayersOnTeams.playersOnTeams.findMany({
    where: { teamId },
    select: { playerId: true },
  });
  return rows.map((r) => r.playerId).filter((id): id is string => Boolean(id));
}

import { prisma } from '../../infra/prisma/client.js';
import { PrismaMatchPlayerEvaluationRepository } from '../../infra/repositories/prisma-match-player-evaluation-repository.js';
import { listPlayerIdsForTeam } from '../../infra/prisma/players-on-teams-utils.js';

export class MatchEvaluationAssignmentService {
  private evalRepo = new PrismaMatchPlayerEvaluationRepository();

  async generateForFinishedMatch(matchId: string): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (!match) return;

    // Try lineup first
    const lineup = await prisma.matchLineupEntry.findMany({
      where: { matchId },
      select: { playerId: true, teamId: true },
    });
    const byTeam = new Map<string, string[]>();
    for (const entry of lineup) {
      const arr = byTeam.get(entry.teamId) ?? [];
      arr.push(entry.playerId);
      byTeam.set(entry.teamId, arr);
    }

    // Fallback: full roster of both teams
    if (byTeam.size === 0) {
      for (const tid of [match.homeTeamId, match.awayTeamId]) {
        const ids = await listPlayerIdsForTeam(tid);
        byTeam.set(tid, ids);
      }
    }

    const createdAll: Array<{ evaluatorPlayerId: string; targetPlayerId: string }> = [];
    for (const [, playerIds] of byTeam.entries()) {
      if (playerIds.length < 2) continue;
      const created = await this.evalRepo.generateAssignments({
        matchId,
        teamPlayerIds: playerIds,
        perPlayerTargets: 3,
      });
      createdAll.push(...created);
    }
    if (!createdAll.length) return;

    // Notifications (best-effort)
    try {
      const { sendNotification } = await import('../../infra/firebase/admin.js');
      const notified = new Set<string>();
      for (const a of createdAll) {
        if (notified.has(a.evaluatorPlayerId)) continue;
        notified.add(a.evaluatorPlayerId);
        sendNotification?.(
          a.evaluatorPlayerId,
          'Avaliações disponíveis',
          'Avalie seus colegas desta partida.',
        );
      }
    } catch (e) {
      console.error('[match_eval_notify_error]', (e as Error).message);
    }
  }
}

import { prisma } from '../prisma/client.js';

export interface EvaluationAssignmentGeneratorInput {
  matchId: string;
  teamPlayerIds: string[]; // all players across both teams
  perPlayerTargets: number; // usually 3
}

export class PrismaMatchPlayerEvaluationRepository {
  async generateAssignments({
    matchId,
    teamPlayerIds,
    perPlayerTargets,
  }: EvaluationAssignmentGeneratorInput) {
    // For cada jogador, escolher alvos aleatórios sem repetir o próprio e evitando repetição do último jogo.
    // Busca últimas avaliações (match anterior) para exclusão de repetidos imediatos.
    const previousAssignments = await prisma.matchPlayerEvaluationAssignment.findMany({
      where: { evaluatorPlayerId: { in: teamPlayerIds } },
      orderBy: { createdAt: 'desc' },
      take: teamPlayerIds.length * perPlayerTargets, // heurística suficiente
      select: { evaluatorPlayerId: true, targetPlayerId: true, matchId: true },
    });
    const byEvaluatorPrev = new Map<string, Set<string>>();
    for (const a of previousAssignments) {
      if (!byEvaluatorPrev.has(a.evaluatorPlayerId))
        byEvaluatorPrev.set(a.evaluatorPlayerId, new Set());
      byEvaluatorPrev.get(a.evaluatorPlayerId)!.add(a.targetPlayerId);
    }
    const created: Array<{ id: string; evaluatorPlayerId: string; targetPlayerId: string }> = [];
    for (const evaluator of teamPlayerIds) {
      const exclude = new Set<string>();
      exclude.add(evaluator); // não avalia a si mesmo
      const prev = byEvaluatorPrev.get(evaluator);
      if (prev) for (const t of prev) exclude.add(t);
      const candidates = teamPlayerIds.filter((p) => !exclude.has(p));
      // shuffle
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      const targets = candidates.slice(0, Math.min(perPlayerTargets, candidates.length));
      for (const target of targets) {
        const assignment = await prisma.matchPlayerEvaluationAssignment.create({
          data: { matchId, evaluatorPlayerId: evaluator, targetPlayerId: target },
          select: { id: true, evaluatorPlayerId: true, targetPlayerId: true },
        });
        created.push(assignment);
      }
    }
    return created;
  }

  async listPendingForPlayer(playerId: string) {
    return prisma.matchPlayerEvaluationAssignment.findMany({
      where: { evaluatorPlayerId: playerId, completedAt: null },
      select: { id: true, matchId: true, targetPlayerId: true, createdAt: true },
    });
  }

  async submitEvaluation(assignmentId: string, rating: number, comment?: string) {
    const assignment = await prisma.matchPlayerEvaluationAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        evaluatorPlayerId: true,
        targetPlayerId: true,
        matchId: true,
        completedAt: true,
      },
    });
    if (!assignment) throw new Error('assignment_not_found');
    if (assignment.completedAt) throw new Error('already_completed');
    await prisma.playerEvaluation.create({
      data: { assignmentId, rating, comment },
      select: { id: true },
    });
    await prisma.matchPlayerEvaluationAssignment.update({
      where: { id: assignmentId },
      data: { completedAt: new Date() },
      select: { id: true },
    });
    return { id: assignmentId };
  }
}

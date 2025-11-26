import { SubmitEvaluationInput, SubmitEvaluationOutput } from './submit-evaluation.dto.js';
import { PrismaMatchPlayerEvaluationRepository } from '../../../infra/repositories/prisma-match-player-evaluation-repository.js';
import { prisma } from '../../../infra/prisma/client.js';

export class PlayerNotFoundError extends Error {
  constructor() {
    super('Player not found for user');
    this.name = 'PlayerNotFoundError';
  }
}

export class AssignmentNotFoundError extends Error {
  constructor(assignmentId: string) {
    super(`Assignment with id ${assignmentId} not found`);
    this.name = 'AssignmentNotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Assignment does not belong to this player');
    this.name = 'ForbiddenError';
  }
}

export class AlreadyCompletedError extends Error {
  constructor() {
    super('Evaluation already completed');
    this.name = 'AlreadyCompletedError';
  }
}

export class SubmitEvaluationUseCase {
  private repository: PrismaMatchPlayerEvaluationRepository;

  constructor(repository?: PrismaMatchPlayerEvaluationRepository) {
    this.repository = repository || new PrismaMatchPlayerEvaluationRepository();
  }

  async execute(input: SubmitEvaluationInput): Promise<SubmitEvaluationOutput> {
    // 1. Buscar player do usuário
    const player = await prisma.player.findUnique({
      where: { userId: input.userId },
      select: { id: true },
    });

    if (!player) {
      throw new PlayerNotFoundError();
    }

    // 2. Buscar assignment e verificar ownership
    const assignment = await prisma.matchPlayerEvaluationAssignment.findUnique({
      where: { id: input.assignmentId },
      select: { evaluatorPlayerId: true },
    });

    if (!assignment) {
      throw new AssignmentNotFoundError(input.assignmentId);
    }

    if (assignment.evaluatorPlayerId !== player.id) {
      throw new ForbiddenError();
    }

    // 3. Submeter avaliação via repository
    try {
      await this.repository.submitEvaluation(
        input.assignmentId,
        input.rating,
        input.comment,
      );
    } catch (error) {
      const message = (error as Error).message;
      
      if (message === 'assignment_not_found') {
        throw new AssignmentNotFoundError(input.assignmentId);
      }
      
      if (message === 'already_completed') {
        throw new AlreadyCompletedError();
      }
      
      throw error;
    }

    // 4. Buscar avaliação criada
    const evaluation = await prisma.playerEvaluation.findFirst({
      where: { assignmentId: input.assignmentId },
      select: {
        id: true,
        assignmentId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!evaluation) {
      throw new Error('Failed to retrieve created evaluation');
    }

    return {
      id: evaluation.id,
      assignmentId: evaluation.assignmentId,
      rating: evaluation.rating,
      comment: evaluation.comment,
      createdAt: evaluation.createdAt,
    };
  }
}

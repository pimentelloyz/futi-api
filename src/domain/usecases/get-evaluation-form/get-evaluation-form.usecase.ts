import { PrismaClient } from '@prisma/client';
import { GetEvaluationFormInput, GetEvaluationFormOutput } from './get-evaluation-form.dto.js';

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

export class NoActiveFormError extends Error {
  constructor(positionType: string) {
    super(`No active evaluation form found for position type ${positionType}`);
    this.name = 'NoActiveFormError';
  }
}

export class GetEvaluationFormUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: GetEvaluationFormInput): Promise<GetEvaluationFormOutput> {
    // 1. Buscar player do usuário
    const mePlayer = await this.prisma.player.findUnique({
      where: { userId: input.userId },
      select: { id: true },
    });

    if (!mePlayer) {
      throw new PlayerNotFoundError();
    }

    // 2. Buscar assignment e verificar ownership
    const assignment = await this.prisma.matchPlayerEvaluationAssignment.findUnique({
      where: { id: input.assignmentId },
      select: { evaluatorPlayerId: true, targetPlayerId: true },
    });

    if (!assignment) {
      throw new AssignmentNotFoundError(input.assignmentId);
    }

    if (assignment.evaluatorPlayerId !== mePlayer.id) {
      throw new ForbiddenError();
    }

    // 3. Determinar tipo de posição do target player
    const target = await this.prisma.player.findUnique({
      where: { id: assignment.targetPlayerId },
      select: { positionSlug: true },
    });

    const positionType = target?.positionSlug === 'GK' ? 'GOALKEEPER' : 'LINE';

    // 4. Buscar formulário ativo para o tipo de posição
    const form = await this.prisma.evaluationForm.findFirst({
      where: { positionType, isActive: true },
      orderBy: { version: 'desc' },
      select: { id: true, name: true, positionType: true, version: true },
    });

    if (!form) {
      throw new NoActiveFormError(positionType);
    }

    // 5. Buscar critérios do formulário
    const criteria = await this.prisma.evaluationCriteria.findMany({
      where: { formId: form.id },
      select: { id: true, key: true, name: true, weight: true, minValue: true, maxValue: true },
      orderBy: { key: 'asc' },
    });

    return {
      assignmentId: input.assignmentId,
      form: {
        id: form.id,
        name: form.name,
        positionType: form.positionType,
        version: form.version,
        criteria: criteria.map((c) => ({
          id: c.id,
          key: c.key,
          name: c.name,
          weight: Number(c.weight),
          min: c.minValue,
          max: c.maxValue,
        })),
      },
    };
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetEvaluationFormUseCase, PlayerNotFoundError, AssignmentNotFoundError, ForbiddenError, NoActiveFormError } from './get-evaluation-form.usecase.js';
import { prisma } from '../../../infra/prisma/client.js';

vi.mock('../../../infra/prisma/client.js', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
    },
    matchPlayerEvaluationAssignment: {
      findUnique: vi.fn(),
    },
    evaluationForm: {
      findFirst: vi.fn(),
    },
    evaluationCriteria: {
      findMany: vi.fn(),
    },
  },
}));

describe('GetEvaluationFormUseCase', () => {
  let useCase: GetEvaluationFormUseCase;

  beforeEach(() => {
    useCase = new GetEvaluationFormUseCase(prisma as any);
    vi.clearAllMocks();
  });

  it('should return evaluation form with criteria for line player', async () => {
    // Arrange
    const userId = 'user-123';
    const assignmentId = 'assignment-456';

    vi.mocked(prisma.player.findUnique)
      .mockResolvedValueOnce({
        id: 'player-123',
      } as any)
      .mockResolvedValueOnce({
        positionSlug: 'CAM', // Line player
      } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
      targetPlayerId: 'target-player-456',
    } as any);

    vi.mocked(prisma.evaluationForm.findFirst).mockResolvedValue({
      id: 'form-123',
      name: 'Line Player Form',
      version: 1,
      positionType: 'LINE',
    } as any);

    vi.mocked(prisma.evaluationCriteria.findMany).mockResolvedValue([
      {
        id: 'criteria-1',
        key: 'finishing',
        name: 'Finalização',
        weight: 0.25,
        minValue: 0,
        maxValue: 10,
      },
      {
        id: 'criteria-2',
        key: 'passing',
        name: 'Passe',
        weight: 0.15,
        minValue: 0,
        maxValue: 10,
      },
    ] as any);

    // Act
    const result = await useCase.execute({ userId, assignmentId });

    // Assert
    expect(result).toEqual({
      assignmentId: 'assignment-456',
      form: {
        id: 'form-123',
        name: 'Line Player Form',
        version: 1,
        positionType: 'LINE',
        criteria: [
          {
            id: 'criteria-1',
            key: 'finishing',
            name: 'Finalização',
            weight: 0.25,
            min: 0,
            max: 10,
          },
          {
            id: 'criteria-2',
            key: 'passing',
            name: 'Passe',
            weight: 0.15,
            min: 0,
            max: 10,
          },
        ],
      },
    });
    expect(prisma.evaluationForm.findFirst).toHaveBeenCalledWith({
      where: { positionType: 'LINE', isActive: true },
      orderBy: { version: 'desc' },
      select: { id: true, name: true, version: true, positionType: true },
    });
  });

  it('should return evaluation form for goalkeeper', async () => {
    // Arrange
    const userId = 'user-123';
    const assignmentId = 'assignment-456';

    vi.mocked(prisma.player.findUnique)
      .mockResolvedValueOnce({
        id: 'player-123',
      } as any)
      .mockResolvedValueOnce({
        positionSlug: 'GK', // Goalkeeper
      } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
      targetPlayerId: 'target-gk-789',
    } as any);

    vi.mocked(prisma.evaluationForm.findFirst).mockResolvedValue({
      id: 'form-gk',
      name: 'Goalkeeper Form',
      version: 1,
      positionType: 'GOALKEEPER',
    } as any);

    vi.mocked(prisma.evaluationCriteria.findMany).mockResolvedValue([
      {
        id: 'criteria-gk',
        key: 'reflexes',
        name: 'Reflexos',
        weight: 0.3,
        minValue: 0,
        maxValue: 10,
      },
    ] as any);

    // Act
    const result = await useCase.execute({ userId, assignmentId });

    // Assert
    expect(result.form.positionType).toBe('GOALKEEPER');
    expect(prisma.evaluationForm.findFirst).toHaveBeenCalledWith({
      where: { positionType: 'GOALKEEPER', isActive: true },
      orderBy: { version: 'desc' },
      select: { id: true, name: true, version: true, positionType: true },
    });
  });

  it('should throw PlayerNotFoundError when user has no player', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique).mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({ userId: 'user-123', assignmentId: 'assignment-456' }),
    ).rejects.toThrow(PlayerNotFoundError);
  });

  it('should throw AssignmentNotFoundError when assignment does not exist', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: 'player-123',
    } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({ userId: 'user-123', assignmentId: 'assignment-456' }),
    ).rejects.toThrow(AssignmentNotFoundError);
  });

  it('should throw ForbiddenError when assignment does not belong to player', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique)
      .mockResolvedValueOnce({
        id: 'player-123',
      } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'other-player-999', // Different player
      targetPlayerId: 'target-player-456',
    } as any);

    // Act & Assert
    await expect(
      useCase.execute({ userId: 'user-123', assignmentId: 'assignment-456' }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw NoActiveFormError when no active form exists', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique)
      .mockResolvedValueOnce({
        id: 'player-123',
      } as any)
      .mockResolvedValueOnce({
        positionSlug: 'CAM',
      } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
      targetPlayerId: 'target-player-456',
    } as any);

    vi.mocked(prisma.evaluationForm.findFirst).mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({ userId: 'user-123', assignmentId: 'assignment-456' }),
    ).rejects.toThrow(NoActiveFormError);
  });

  it('should convert Decimal weights to numbers correctly', async () => {
    // Arrange
    const userId = 'user-123';
    const assignmentId = 'assignment-456';

    vi.mocked(prisma.player.findUnique)
      .mockResolvedValueOnce({
        id: 'player-123',
      } as any)
      .mockResolvedValueOnce({
        positionSlug: 'CAM',
      } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
      targetPlayerId: 'target-player-456',
    } as any);

    vi.mocked(prisma.evaluationForm.findFirst).mockResolvedValue({
      id: 'form-123',
      name: 'Test Form',
      version: 1,
      positionType: 'LINE',
    } as any);

    vi.mocked(prisma.evaluationCriteria.findMany).mockResolvedValue([
      {
        id: 'criteria-1',
        key: 'test',
        name: 'Test',
        weight: 0.123456789, // Direct number to test conversion
        minValue: 0,
        maxValue: 10,
      },
    ] as any);

    // Act
    const result = await useCase.execute({ userId, assignmentId });

    // Assert
    expect(typeof result.form.criteria[0].weight).toBe('number');
    expect(result.form.criteria[0].weight).toBe(0.123456789);
  });
});

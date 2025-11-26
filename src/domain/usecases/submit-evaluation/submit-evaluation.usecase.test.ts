import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitEvaluationUseCase, PlayerNotFoundError, AssignmentNotFoundError, ForbiddenError, AlreadyCompletedError } from './submit-evaluation.usecase.js';
import { PrismaMatchPlayerEvaluationRepository } from '../../../infra/repositories/prisma-match-player-evaluation-repository.js';
import { prisma } from '../../../infra/prisma/client.js';

vi.mock('../../../infra/prisma/client.js', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
    },
    matchPlayerEvaluationAssignment: {
      findUnique: vi.fn(),
    },
    playerEvaluation: {
      findFirst: vi.fn(),
    },
  },
}));

describe('SubmitEvaluationUseCase', () => {
  let useCase: SubmitEvaluationUseCase;
  let mockRepository: {
    submitEvaluation: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      submitEvaluation: vi.fn(),
    };
    useCase = new SubmitEvaluationUseCase(mockRepository as any);
    vi.clearAllMocks();
  });

  it('should submit evaluation successfully', async () => {
    // Arrange
    const input = {
      userId: 'user-123',
      assignmentId: 'assignment-456',
      rating: 8,
      comment: 'Great performance',
    };

    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: 'player-123',
    } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
    } as any);

    mockRepository.submitEvaluation.mockResolvedValue({
      id: 'assignment-456',
    });

    vi.mocked(prisma.playerEvaluation.findFirst).mockResolvedValue({
      id: 'eval-789',
      assignmentId: 'assignment-456',
      rating: 8,
      comment: 'Great performance',
      createdAt: new Date('2024-01-01'),
    } as any);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toEqual({
      id: 'eval-789',
      assignmentId: 'assignment-456',
      rating: 8,
      comment: 'Great performance',
      createdAt: new Date('2024-01-01'),
    });
    expect(mockRepository.submitEvaluation).toHaveBeenCalledWith(
      'assignment-456',
      8,
      'Great performance',
    );
  });

  it('should submit evaluation without comment', async () => {
    // Arrange
    const input = {
      userId: 'user-123',
      assignmentId: 'assignment-456',
      rating: 7,
    };

    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: 'player-123',
    } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
    } as any);

    mockRepository.submitEvaluation.mockResolvedValue({
      id: 'assignment-456',
    });

    vi.mocked(prisma.playerEvaluation.findFirst).mockResolvedValue({
      id: 'eval-789',
      assignmentId: 'assignment-456',
      rating: 7,
      comment: null,
      createdAt: new Date('2024-01-01'),
    } as any);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.comment).toBeNull();
    expect(mockRepository.submitEvaluation).toHaveBeenCalledWith(
      'assignment-456',
      7,
      undefined,
    );
  });

  it('should throw PlayerNotFoundError when user has no player', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique).mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({
        userId: 'user-123',
        assignmentId: 'assignment-456',
        rating: 8,
      }),
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
      useCase.execute({
        userId: 'user-123',
        assignmentId: 'assignment-456',
        rating: 8,
      }),
    ).rejects.toThrow(AssignmentNotFoundError);
  });

  it('should throw ForbiddenError when assignment does not belong to player', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: 'player-123',
    } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'other-player-999', // Different player
    } as any);

    // Act & Assert
    await expect(
      useCase.execute({
        userId: 'user-123',
        assignmentId: 'assignment-456',
        rating: 8,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw AlreadyCompletedError when evaluation already submitted', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: 'player-123',
    } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
    } as any);

    mockRepository.submitEvaluation.mockRejectedValue(new Error('already_completed'));

    // Act & Assert
    await expect(
      useCase.execute({
        userId: 'user-123',
        assignmentId: 'assignment-456',
        rating: 8,
      }),
    ).rejects.toThrow(AlreadyCompletedError);
  });

  it('should throw AssignmentNotFoundError from repository', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: 'player-123',
    } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
    } as any);

    mockRepository.submitEvaluation.mockRejectedValue(new Error('assignment_not_found'));

    // Act & Assert
    await expect(
      useCase.execute({
        userId: 'user-123',
        assignmentId: 'assignment-456',
        rating: 8,
      }),
    ).rejects.toThrow(AssignmentNotFoundError);
  });

  it('should propagate unknown repository errors', async () => {
    // Arrange
    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: 'player-123',
    } as any);

    vi.mocked(prisma.matchPlayerEvaluationAssignment.findUnique).mockResolvedValue({
      evaluatorPlayerId: 'player-123',
    } as any);

    const unknownError = new Error('Database connection failed');
    mockRepository.submitEvaluation.mockRejectedValue(unknownError);

    // Act & Assert
    await expect(
      useCase.execute({
        userId: 'user-123',
        assignmentId: 'assignment-456',
        rating: 8,
      }),
    ).rejects.toThrow('Database connection failed');
  });
});

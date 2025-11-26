import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  GetPendingEvaluationsUseCase,
  PlayerNotFoundError,
} from './get-pending-evaluations.usecase.js';

describe('GetPendingEvaluationsUseCase', () => {
  let mockPrisma: PrismaClient;
  let useCase: GetPendingEvaluationsUseCase;

  beforeEach(() => {
    mockPrisma = {
      player: {
        findUnique: vi.fn(),
      },
      matchPlayerEvaluationAssignment: {
        findMany: vi.fn(),
      },
    } as unknown as PrismaClient;

    useCase = new GetPendingEvaluationsUseCase(mockPrisma);
  });

  it('should return pending evaluations with target player names', async () => {
    const mockPlayer = { id: 'player-123' };
    const mockAssignments = [
      {
        id: 'assignment-1',
        matchId: 'match-1',
        targetPlayerId: 'target-1',
        target: { id: 'target-1', name: 'Player One' },
      },
      {
        id: 'assignment-2',
        matchId: 'match-2',
        targetPlayerId: 'target-2',
        target: { id: 'target-2', name: 'Player Two' },
      },
    ];

    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(mockPlayer as any);
    vi.mocked(mockPrisma.matchPlayerEvaluationAssignment.findMany).mockResolvedValue(
      mockAssignments as any,
    );

    const result = await useCase.execute({ userId: 'user-123' });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      id: 'assignment-1',
      matchId: 'match-1',
      targetPlayerId: 'target-1',
      targetName: 'Player One',
    });
    expect(result.items[1]).toEqual({
      id: 'assignment-2',
      matchId: 'match-2',
      targetPlayerId: 'target-2',
      targetName: 'Player Two',
    });
  });

  it('should return empty array when no pending evaluations', async () => {
    const mockPlayer = { id: 'player-123' };

    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(mockPlayer as any);
    vi.mocked(mockPrisma.matchPlayerEvaluationAssignment.findMany).mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-123' });

    expect(result.items).toEqual([]);
  });

  it('should throw PlayerNotFoundError when user has no player', async () => {
    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-456' })).rejects.toThrow(PlayerNotFoundError);
  });

  it('should call findMany with correct filters', async () => {
    const mockPlayer = { id: 'player-123' };

    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(mockPlayer as any);
    vi.mocked(mockPrisma.matchPlayerEvaluationAssignment.findMany).mockResolvedValue([]);

    await useCase.execute({ userId: 'user-123' });

    expect(mockPrisma.matchPlayerEvaluationAssignment.findMany).toHaveBeenCalledWith({
      where: {
        evaluatorPlayerId: 'player-123',
        completedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        matchId: true,
        targetPlayerId: true,
        target: {
          select: { id: true, name: true },
        },
      },
    });
  });

  it('should use optimized query with join (no N+1)', async () => {
    const mockPlayer = { id: 'player-123' };
    const mockAssignments = [
      {
        id: 'assignment-1',
        matchId: 'match-1',
        targetPlayerId: 'target-1',
        target: { id: 'target-1', name: 'Player One' },
      },
    ];

    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(mockPlayer as any);
    vi.mocked(mockPrisma.matchPlayerEvaluationAssignment.findMany).mockResolvedValue(
      mockAssignments as any,
    );

    await useCase.execute({ userId: 'user-123' });

    // Verifica que apenas 2 queries foram feitas (findUnique player + findMany assignments)
    expect(mockPrisma.player.findUnique).toHaveBeenCalledTimes(1);
    expect(mockPrisma.matchPlayerEvaluationAssignment.findMany).toHaveBeenCalledTimes(1);
    
    // Verifica que o select inclui a relação target (join otimizado)
    const callArgs = vi.mocked(mockPrisma.matchPlayerEvaluationAssignment.findMany).mock.calls[0][0];
    expect(callArgs.select).toHaveProperty('target');
  });
});

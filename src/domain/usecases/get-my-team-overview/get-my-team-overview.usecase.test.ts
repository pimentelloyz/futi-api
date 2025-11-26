import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  GetMyTeamOverviewUseCase,
  NoTeamFoundError,
  TeamNotFoundError,
} from './get-my-team-overview.usecase.js';

describe('GetMyTeamOverviewUseCase', () => {
  let mockPrisma: PrismaClient;
  let useCase: GetMyTeamOverviewUseCase;

  beforeEach(() => {
    mockPrisma = {
      accessMembership: {
        findMany: vi.fn(),
      },
      player: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      team: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      match: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      matchPlayerEvaluationAssignment: {
        count: vi.fn(),
      },
    } as unknown as PrismaClient;

    useCase = new GetMyTeamOverviewUseCase(mockPrisma);
  });

  it('should return team overview with all data', async () => {
    const mockMemberships = [
      {
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team Alpha' },
      },
    ];

    const mockTeam = {
      id: 'team-1',
      name: 'Team Alpha',
      icon: 'https://example.com/icon.png',
      description: 'Test team',
      isActive: true,
    };

    const mockPlayers = [
      {
        id: 'player-1',
        name: 'John Doe',
        photo: 'https://example.com/photo.jpg',
        positionSlug: 'atacante',
        number: 10,
        isActive: true,
      },
    ];

    const mockMatches = [
      {
        id: 'match-1',
        scheduledAt: new Date('2025-11-20'),
        status: 'FINISHED',
        venue: 'Stadium A',
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        homeScore: 2,
        awayScore: 1,
      },
    ];

    const mockNextMatch = {
      id: 'match-2',
      scheduledAt: new Date('2025-11-30'),
      venue: 'Stadium B',
      homeTeamId: 'team-1',
      awayTeamId: 'team-3',
    };

    vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue(mockMemberships as any);
    vi.mocked(mockPrisma.team.findUnique).mockResolvedValue(mockTeam as any);
    vi.mocked(mockPrisma.player.findMany).mockResolvedValue(mockPlayers as any);
    vi.mocked(mockPrisma.match.findMany).mockResolvedValue(mockMatches as any);
    vi.mocked(mockPrisma.match.findFirst).mockResolvedValue(mockNextMatch as any);
    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.team).toEqual(mockTeam);
    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBe('John Doe');
    expect(result.recentMatches).toHaveLength(1);
    expect(result.next_game).toEqual(mockNextMatch);
    expect(result.evaluationBanner).toBeNull();
  });

  it('should throw NoTeamFoundError when user has no teams', async () => {
    vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(NoTeamFoundError);
  });

  it('should throw TeamNotFoundError when team is inactive', async () => {
    const mockMemberships = [
      {
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team Alpha' },
      },
    ];

    const mockInactiveTeam = {
      id: 'team-1',
      name: 'Team Alpha',
      icon: null,
      description: null,
      isActive: false,
    };

    vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue(mockMemberships as any);
    vi.mocked(mockPrisma.team.findUnique).mockResolvedValue(mockInactiveTeam as any);

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(TeamNotFoundError);
  });

  it('should find teams via PlayersOnTeams when no membership exists', async () => {
    const mockPlayer = { id: 'player-1' };
    const mockTeams = [{ id: 'team-1', name: 'Team Alpha' }];
    const mockTeam = {
      id: 'team-1',
      name: 'Team Alpha',
      icon: null,
      description: null,
      isActive: true,
    };

    vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.player.findUnique).mockResolvedValueOnce(mockPlayer as any);
    vi.mocked(mockPrisma.team.findMany).mockResolvedValue(mockTeams as any);
    vi.mocked(mockPrisma.team.findUnique).mockResolvedValue(mockTeam as any);
    vi.mocked(mockPrisma.player.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.match.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.match.findFirst).mockResolvedValue(null);
    vi.mocked(mockPrisma.player.findUnique).mockResolvedValueOnce(null);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.team.id).toBe('team-1');
    expect(mockPrisma.team.findMany).toHaveBeenCalledWith({
      where: { players: { some: { playerId: 'player-1' } } },
      select: { id: true, name: true },
    });
  });

  it('should use provided teamId when specified', async () => {
    const mockMemberships = [
      { teamId: 'team-1', team: { id: 'team-1', name: 'Team Alpha' } },
      { teamId: 'team-2', team: { id: 'team-2', name: 'Team Beta' } },
    ];

    const mockTeam = {
      id: 'team-2',
      name: 'Team Beta',
      icon: null,
      description: null,
      isActive: true,
    };

    vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue(mockMemberships as any);
    vi.mocked(mockPrisma.team.findUnique).mockResolvedValue(mockTeam as any);
    vi.mocked(mockPrisma.player.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.match.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.match.findFirst).mockResolvedValue(null);
    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'user-1', teamId: 'team-2' });

    expect(result.team.id).toBe('team-2');
    expect(mockPrisma.team.findUnique).toHaveBeenCalledWith({
      where: { id: 'team-2' },
      select: { id: true, name: true, icon: true, description: true, isActive: true },
    });
  });

  it('should include evaluation banner when player has pending evaluations', async () => {
    const mockMemberships = [
      { teamId: 'team-1', team: { id: 'team-1', name: 'Team Alpha' } },
    ];

    const mockTeam = {
      id: 'team-1',
      name: 'Team Alpha',
      icon: null,
      description: null,
      isActive: true,
    };

    const mockPlayer = { id: 'player-1' };

    const recent24hMatch = {
      id: 'match-1',
      scheduledAt: new Date(),
      status: 'FINISHED',
      venue: 'Stadium A',
      homeTeamId: 'team-1',
      awayTeamId: 'team-2',
      homeScore: 2,
      awayScore: 1,
    };

    vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue(mockMemberships as any);
    vi.mocked(mockPrisma.team.findUnique).mockResolvedValue(mockTeam as any);
    vi.mocked(mockPrisma.player.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.match.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.match.findFirst)
      .mockResolvedValueOnce(null) // próxima partida
      .mockResolvedValueOnce(recent24hMatch as any); // partida recente
    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(mockPlayer as any);
    vi.mocked(mockPrisma.matchPlayerEvaluationAssignment.count).mockResolvedValue(2);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.evaluationBanner).not.toBeNull();
    expect(result.evaluationBanner?.match.id).toBe('match-1');
    expect(result.evaluationBanner?.expiresAt).toBeDefined();
  });

  it('should not include evaluation banner when no pending evaluations', async () => {
    const mockMemberships = [
      { teamId: 'team-1', team: { id: 'team-1', name: 'Team Alpha' } },
    ];

    const mockTeam = {
      id: 'team-1',
      name: 'Team Alpha',
      icon: null,
      description: null,
      isActive: true,
    };

    const mockPlayer = { id: 'player-1' };

    const recent24hMatch = {
      id: 'match-1',
      scheduledAt: new Date(),
      status: 'FINISHED',
      venue: 'Stadium A',
      homeTeamId: 'team-1',
      awayTeamId: 'team-2',
      homeScore: 2,
      awayScore: 1,
    };

    vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue(mockMemberships as any);
    vi.mocked(mockPrisma.team.findUnique).mockResolvedValue(mockTeam as any);
    vi.mocked(mockPrisma.player.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.match.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.match.findFirst)
      .mockResolvedValueOnce(null) // próxima partida
      .mockResolvedValueOnce(recent24hMatch as any); // partida recente
    vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(mockPlayer as any);
    vi.mocked(mockPrisma.matchPlayerEvaluationAssignment.count).mockResolvedValue(0);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.evaluationBanner).toBeNull();
  });
});
